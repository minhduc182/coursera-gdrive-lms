const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { URL } = require('url');

const PORT = process.env.PORT || 3456;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const TEXT_CACHE_DIR = path.join(DATA_DIR, 'cache', 'text');
const MEDIA_CACHE_DIR = path.join(DATA_DIR, 'cache', 'media');
const CATALOG_PATH = path.join(DATA_DIR, 'catalog.json');
const STATE_PATH = path.join(DATA_DIR, 'user-state.json');

fs.mkdirSync(TEXT_CACHE_DIR, { recursive: true });
fs.mkdirSync(MEDIA_CACHE_DIR, { recursive: true });

// Keep track of ongoing downloads so concurrent Range requests wait on the same download
const inFlightDownloads = new Map();
let searchIndexCache = null;
let isSyncing = false;

function runGdrive(args) {
  return new Promise((resolve, reject) => {
    execFile('gdrive', args, { maxBuffer: 25 * 1024 * 1024, shell: process.platform === 'win32' }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`gdrive ${args.join(' ')} failed: ${stderr || err.message}`));
      }
      resolve(stdout);
    });
  });
}

function loadCatalog() {
  if (!fs.existsSync(CATALOG_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  } catch (e) {
    return null;
  }
}

function loadUserState() {
  const defaultState = {
    progress: {},
    notes: [],
    bookmarks: [],
    lastVisited: null,
    preferences: {
      playerMode: 'html5', // 'html5' | 'iframe'
      playbackRate: 1,
      subtitleLang: 'en', // 'en' | 'vi' | 'dual' | 'off'
      autoAdvance: false
    }
  };
  if (!fs.existsSync(STATE_PATH)) {
    fs.writeFileSync(STATE_PATH, JSON.stringify(defaultState, null, 2), 'utf8');
    return defaultState;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    return {
      ...defaultState,
      ...raw,
      preferences: { ...defaultState.preferences, ...(raw.preferences || {}) }
    };
  } catch (e) {
    return defaultState;
  }
}

function saveUserState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function findLessonById(catalog, lessonId) {
  if (!catalog || !catalog.courses) return null;
  for (const course of catalog.courses) {
    for (const mod of course.modules) {
      for (const sec of mod.sections) {
        for (const les of sec.lessons) {
          if (les.id === lessonId) {
            return { course, module: mod, section: sec, lesson: les };
          }
        }
      }
    }
  }
  return null;
}

function findFileInCatalog(catalog, fileId) {
  if (!catalog || !catalog.courses) return null;
  for (const course of catalog.courses) {
    for (const mod of course.modules) {
      for (const sec of mod.sections) {
        for (const les of sec.lessons) {
          if (les.video && les.video.id === fileId) return { file: les.video, ext: '.mp4', mimeType: 'video/mp4', lesson: les };
          if (les.instructions && les.instructions.id === fileId) return { file: les.instructions, ext: '.html', mimeType: 'text/html; charset=utf-8', lesson: les };
          if (les.subtitles?.en && les.subtitles.en.id === fileId) return { file: les.subtitles.en, ext: '.srt', mimeType: 'text/plain; charset=utf-8', lesson: les };
          if (les.subtitles?.vi && les.subtitles.vi.id === fileId) return { file: les.subtitles.vi, ext: '.srt', mimeType: 'text/plain; charset=utf-8', lesson: les };
          for (const pdf of les.pdfs || []) {
            if (pdf.id === fileId) return { file: pdf, ext: '.pdf', mimeType: 'application/pdf', lesson: les };
          }
          for (const other of les.otherFiles || []) {
            if (other.id === fileId) return { file: other, ext: path.extname(other.name) || '.bin', mimeType: other.mimeType || 'application/octet-stream', lesson: les };
          }
        }
      }
    }
  }
  return null;
}

async function ensureTextFile(fileId) {
  const cachePath = path.join(TEXT_CACHE_DIR, `${fileId}.txt`);
  if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 0) {
    return fs.readFileSync(cachePath, 'utf8');
  }
  if (inFlightDownloads.has(fileId)) {
    await inFlightDownloads.get(fileId);
    return fs.readFileSync(cachePath, 'utf8');
  }
  const promise = (async () => {
    const tmpPath = `${cachePath}.tmp.${Date.now()}`;
    await runGdrive(['readonly', 'download', fileId, '--out', tmpPath]);
    fs.renameSync(tmpPath, cachePath);
  })();
  inFlightDownloads.set(fileId, promise);
  try {
    await promise;
    return fs.readFileSync(cachePath, 'utf8');
  } finally {
    inFlightDownloads.delete(fileId);
  }
}

async function ensureMediaFile(fileId, ext = '.bin') {
  const cachePath = path.join(MEDIA_CACHE_DIR, `${fileId}${ext}`);
  if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 0) {
    return cachePath;
  }
  if (inFlightDownloads.has(fileId)) {
    return await inFlightDownloads.get(fileId);
  }
  const promise = (async () => {
    const tmpPath = `${cachePath}.tmp.${Date.now()}`;
    await runGdrive(['readonly', 'download', fileId, '--out', tmpPath]);
    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
    fs.renameSync(tmpPath, cachePath);
    return cachePath;
  })();
  inFlightDownloads.set(fileId, promise);
  try {
    return await promise;
  } finally {
    inFlightDownloads.delete(fileId);
  }
}

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function parseSrtCues(srtContent) {
  if (!srtContent) return [];
  const blocks = srtContent.replace(/\r\n/g, '\n').trim().split(/\n\n+/);
  const cues = [];
  let idx = 1;

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    const timeLineIdx = lines[0].includes('-->') ? 0 : 1;
    const timeLine = lines[timeLineIdx];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const match = timeLine.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
    if (!match) continue;

    const start = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 1000;
    const end = parseInt(match[5]) * 3600 + parseInt(match[6]) * 60 + parseInt(match[7]) + parseInt(match[8]) / 1000;
    const text = lines.slice(timeLineIdx + 1).join(' ').replace(/<[^>]+>/g, '').trim();
    if (text) {
      cues.push({
        index: idx++,
        start: Math.round(start * 100) / 100,
        end: Math.round(end * 100) / 100,
        timeStr: formatTime(start),
        text
      });
    }
  }
  return cues;
}

function srtToVtt(srtContent) {
  if (!srtContent) return 'WEBVTT\n\n';
  const normalized = srtContent
    .replace(/\r\n/g, '\n')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  return `WEBVTT\n\n${normalized}\n`;
}

function cleanReadingHtml(rawHtml, lesson) {
  if (!rawHtml) return '';
  const match = rawHtml.match(/<co-content>([\s\S]*?)<\/co-content>/i);
  let inner = match ? match[1].trim() : rawHtml.replace(/<style[\s\S]*?<\/style>/gi, '').trim();

  // Remove the broken UdemyManager placeholder card ("Không tìm thấy file trong thư mục")
  // because we render a real interactive PDF attachment card & embedded viewer right below!
  if (lesson && lesson.pdfs && lesson.pdfs.length > 0) {
    inner = inner.replace(/<div class="asset-card asset-card--pdf">[\s\S]*?<\/div>\s*<\/div>/gi, '');
  }
  return inner.trim();
}

function buildSearchIndex(catalog) {
  if (!catalog || !catalog.courses) return [];
  const entries = [];

  for (const course of catalog.courses) {
    for (const mod of course.modules) {
      for (const sec of mod.sections) {
        for (const les of sec.lessons) {
          const entry = {
            lessonId: les.id,
            courseId: course.id,
            courseShortTitle: course.shortTitle,
            moduleTitle: mod.title,
            sectionTitle: sec.title,
            lessonTitle: les.title,
            type: les.type,
            durationSec: les.durationSec,
            htmlText: '',
            cuesEn: [],
            cuesVi: []
          };

          if (les.instructions?.id) {
            const p = path.join(TEXT_CACHE_DIR, `${les.instructions.id}.txt`);
            if (fs.existsSync(p)) {
              const raw = fs.readFileSync(p, 'utf8');
              const cleaned = cleanReadingHtml(raw, les);
              entry.htmlText = cleaned.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            }
          }
          if (les.subtitles?.en?.id) {
            const p = path.join(TEXT_CACHE_DIR, `${les.subtitles.en.id}.txt`);
            if (fs.existsSync(p)) {
              entry.cuesEn = parseSrtCues(fs.readFileSync(p, 'utf8'));
            }
          }
          if (les.subtitles?.vi?.id) {
            const p = path.join(TEXT_CACHE_DIR, `${les.subtitles.vi.id}.txt`);
            if (fs.existsSync(p)) {
              entry.cuesVi = parseSrtCues(fs.readFileSync(p, 'utf8'));
            }
          }

          entries.push(entry);
        }
      }
    }
  }
  return entries;
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // 1. GET /api/catalog
    if (req.method === 'GET' && pathname === '/api/catalog') {
      const catalog = loadCatalog();
      if (!catalog) {
        return sendJson(res, 200, { syncing: true, catalog: null });
      }
      return sendJson(res, 200, { syncing: isSyncing, catalog });
    }

    // 2. GET /api/state
    if (req.method === 'GET' && pathname === '/api/state') {
      const state = loadUserState();
      return sendJson(res, 200, state);
    }

    // 3. POST /api/progress
    if (req.method === 'POST' && pathname === '/api/progress') {
      const body = await readJsonBody(req);
      const { lessonId, courseId, status, currentTime, duration } = body;
      if (!lessonId) return sendJson(res, 400, { error: 'lessonId required' });

      const state = loadUserState();
      const prev = state.progress[lessonId] || { status: 'not_started', currentTime: 0 };

      const nextStatus = status || prev.status || 'in_progress';
      state.progress[lessonId] = {
        status: nextStatus,
        currentTime: typeof currentTime === 'number' ? Math.round(currentTime) : (prev.currentTime || 0),
        duration: typeof duration === 'number' ? Math.round(duration) : (prev.duration || 0),
        completedAt: nextStatus === 'completed' ? (prev.completedAt || new Date().toISOString()) : null,
        updatedAt: new Date().toISOString()
      };

      if (courseId) {
        state.lastVisited = {
          courseId,
          lessonId,
          updatedAt: new Date().toISOString()
        };
      }

      saveUserState(state);
      return sendJson(res, 200, { ok: true, progress: state.progress[lessonId], lastVisited: state.lastVisited });
    }

    // 4. POST /api/last-visited
    if (req.method === 'POST' && pathname === '/api/last-visited') {
      const body = await readJsonBody(req);
      const state = loadUserState();
      state.lastVisited = {
        courseId: body.courseId,
        lessonId: body.lessonId,
        updatedAt: new Date().toISOString()
      };
      saveUserState(state);
      return sendJson(res, 200, { ok: true, lastVisited: state.lastVisited });
    }

    // 5. POST /api/preferences
    if (req.method === 'POST' && pathname === '/api/preferences') {
      const body = await readJsonBody(req);
      const state = loadUserState();
      state.preferences = { ...state.preferences, ...body };
      saveUserState(state);
      return sendJson(res, 200, { ok: true, preferences: state.preferences });
    }

    // 6. POST /api/bookmarks/toggle
    if (req.method === 'POST' && pathname === '/api/bookmarks/toggle') {
      const body = await readJsonBody(req);
      const { lessonId } = body;
      const state = loadUserState();
      const idx = state.bookmarks.indexOf(lessonId);
      if (idx >= 0) {
        state.bookmarks.splice(idx, 1);
      } else {
        state.bookmarks.push(lessonId);
      }
      saveUserState(state);
      return sendJson(res, 200, { ok: true, bookmarks: state.bookmarks });
    }

    // 7. POST /api/notes & DELETE /api/notes/:id
    if (req.method === 'POST' && pathname === '/api/notes') {
      const body = await readJsonBody(req);
      const { lessonId, courseId, timestampSec, content } = body;
      if (!lessonId || !content || !content.trim()) {
        return sendJson(res, 400, { error: 'lessonId and content required' });
      }
      const state = loadUserState();
      const note = {
        id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        lessonId,
        courseId,
        timestampSec: typeof timestampSec === 'number' ? Math.round(timestampSec) : null,
        content: content.trim(),
        createdAt: new Date().toISOString()
      };
      state.notes.unshift(note);
      saveUserState(state);
      return sendJson(res, 200, { ok: true, note, notes: state.notes });
    }

    if (req.method === 'DELETE' && pathname.startsWith('/api/notes/')) {
      const noteId = pathname.replace('/api/notes/', '');
      const state = loadUserState();
      state.notes = state.notes.filter(n => n.id !== noteId);
      saveUserState(state);
      return sendJson(res, 200, { ok: true, notes: state.notes });
    }

    // 8. GET /api/lesson/:lessonId/content
    if (req.method === 'GET' && pathname.startsWith('/api/lesson/') && pathname.endsWith('/content')) {
      const lessonId = pathname.slice('/api/lesson/'.length, -'/content'.length);
      const catalog = loadCatalog();
      const found = findLessonById(catalog, lessonId);
      if (!found) return sendJson(res, 404, { error: 'Lesson not found' });

      const { lesson } = found;
      let htmlContent = '';
      let cuesEn = [];
      let cuesVi = [];

      if (lesson.instructions?.id) {
        const rawHtml = await ensureTextFile(lesson.instructions.id);
        htmlContent = cleanReadingHtml(rawHtml, lesson);
      }
      if (lesson.subtitles?.en?.id) {
        const rawSrt = await ensureTextFile(lesson.subtitles.en.id);
        cuesEn = parseSrtCues(rawSrt);
      }
      if (lesson.subtitles?.vi?.id) {
        const rawSrt = await ensureTextFile(lesson.subtitles.vi.id);
        cuesVi = parseSrtCues(rawSrt);
      }

      let videoCached = false;
      if (lesson.video?.id) {
        const vp = path.join(MEDIA_CACHE_DIR, `${lesson.video.id}.mp4`);
        videoCached = fs.existsSync(vp) && fs.statSync(vp).size > 0;
      }

      return sendJson(res, 200, {
        lessonId: lesson.id,
        htmlContent,
        cuesEn,
        cuesVi,
        videoCached
      });
    }

    // 9. GET /api/drive/vtt/:fileId
    if (req.method === 'GET' && pathname.startsWith('/api/drive/vtt/')) {
      const fileId = pathname.replace('/api/drive/vtt/', '');
      const rawSrt = await ensureTextFile(fileId);
      const vtt = srtToVtt(rawSrt);
      res.writeHead(200, {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      });
      return res.end(vtt);
    }

    // 10. POST /api/drive/prefetch/:fileId
    if (req.method === 'POST' && pathname.startsWith('/api/drive/prefetch/')) {
      const fileId = pathname.replace('/api/drive/prefetch/', '');
      const catalog = loadCatalog();
      const info = findFileInCatalog(catalog, fileId);
      const ext = info ? info.ext : '.bin';
      const cachePath = await ensureMediaFile(fileId, ext);
      const stat = fs.statSync(cachePath);
      return sendJson(res, 200, { ok: true, fileId, cached: true, size: stat.size });
    }

    // 11. GET /api/drive/media/:fileId (Streams Video / PDF from Drive with HTTP Range support)
    if (req.method === 'GET' && pathname.startsWith('/api/drive/media/')) {
      const fileId = pathname.replace('/api/drive/media/', '');
      const catalog = loadCatalog();
      const info = findFileInCatalog(catalog, fileId);
      const ext = info ? info.ext : '.mp4';
      const mimeType = info ? info.mimeType : 'video/mp4';

      const cachePath = await ensureMediaFile(fileId, ext);
      const stat = fs.statSync(cachePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        if (start >= fileSize || end >= fileSize) {
          res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
          return res.end();
        }
        const chunkSize = end - start + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeType
        });
        const stream = fs.createReadStream(cachePath, { start, end });
        return stream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Accept-Ranges': 'bytes',
          'Content-Type': mimeType
        });
        const stream = fs.createReadStream(cachePath);
        return stream.pipe(res);
      }
    }

    // 12. GET /api/search?q=...
    if (req.method === 'GET' && pathname === '/api/search') {
      const q = (parsedUrl.searchParams.get('q') || '').trim().toLowerCase();
      const filterCourseId = parsedUrl.searchParams.get('courseId') || '';
      if (!q || q.length < 2) {
        return sendJson(res, 200, { results: [] });
      }

      const catalog = loadCatalog();
      if (!searchIndexCache && catalog) {
        searchIndexCache = buildSearchIndex(catalog);
      }
      const index = searchIndexCache || [];
      const results = [];

      for (const item of index) {
        if (filterCourseId && item.courseId !== filterCourseId) continue;

        const titleMatch = item.lessonTitle.toLowerCase().includes(q) || item.moduleTitle.toLowerCase().includes(q);
        const matches = [];

        if (item.htmlText && item.htmlText.toLowerCase().includes(q)) {
          const pos = item.htmlText.toLowerCase().indexOf(q);
          const start = Math.max(0, pos - 60);
          const end = Math.min(item.htmlText.length, pos + q.length + 90);
          matches.push({
            source: 'reading',
            snippet: (start > 0 ? '...' : '') + item.htmlText.slice(start, end) + (end < item.htmlText.length ? '...' : ''),
            timestampSec: null
          });
        }

        for (const cue of item.cuesEn) {
          if (cue.text.toLowerCase().includes(q)) {
            matches.push({
              source: 'transcript_en',
              snippet: cue.text,
              timestampSec: cue.start,
              timeStr: cue.timeStr
            });
            if (matches.length >= 4) break;
          }
        }

        if (matches.length < 4) {
          for (const cue of item.cuesVi) {
            if (cue.text.toLowerCase().includes(q)) {
              matches.push({
                source: 'transcript_vi',
                snippet: cue.text,
                timestampSec: cue.start,
                timeStr: cue.timeStr
              });
              if (matches.length >= 4) break;
            }
          }
        }

        if (titleMatch || matches.length > 0) {
          results.push({
            lessonId: item.lessonId,
            courseId: item.courseId,
            courseShortTitle: item.courseShortTitle,
            moduleTitle: item.moduleTitle,
            sectionTitle: item.sectionTitle,
            lessonTitle: item.lessonTitle,
            type: item.type,
            durationSec: item.durationSec,
            titleMatch,
            matches
          });
        }
        if (results.length >= 50) break;
      }

      return sendJson(res, 200, { query: q, count: results.length, results });
    }

    // 13. POST /api/sync
    if (req.method === 'POST' && pathname === '/api/sync') {
      if (isSyncing) {
        return sendJson(res, 200, { ok: true, syncing: true, message: 'Đang đồng bộ...' });
      }
      isSyncing = true;
      execFile('node', [path.join(__dirname, 'scripts', 'sync-drive.js')], (err) => {
        isSyncing = false;
        searchIndexCache = null;
        if (err) console.error('Sync failed:', err);
      });
      return sendJson(res, 200, { ok: true, syncing: true });
    }

    // Static files from public/
    let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      return fs.createReadStream(filePath).pipe(res);
    }

    res.writeHead(404);
    res.end('Not found');
  } catch (err) {
    console.error('Server error:', err);
    sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`Coursera CBAP Learning Portal running at http://localhost:${PORT}`);
});
