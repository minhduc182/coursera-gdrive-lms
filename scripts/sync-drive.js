const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.local.json');
const localConfig = fs.existsSync(CONFIG_PATH)
  ? JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
  : {};
const ROOT_FOLDER_ID = process.env.GDRIVE_ROOT_FOLDER_ID || localConfig.rootFolderId;
if (!ROOT_FOLDER_ID || ROOT_FOLDER_ID === 'YOUR_GOOGLE_DRIVE_FOLDER_ID') {
  console.error('Error: Missing rootFolderId. Please configure config.local.json (copy from config.example.json).');
  process.exit(1);
}
const DATA_DIR = path.join(__dirname, '..', 'data');
const TEXT_CACHE_DIR = path.join(DATA_DIR, 'cache', 'text');
const MEDIA_CACHE_DIR = path.join(DATA_DIR, 'cache', 'media');

fs.mkdirSync(TEXT_CACHE_DIR, { recursive: true });
fs.mkdirSync(MEDIA_CACHE_DIR, { recursive: true });

function runGdrive(args) {
  return new Promise((resolve, reject) => {
    execFile('gdrive', args, { maxBuffer: 20 * 1024 * 1024, shell: process.platform === 'win32' }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`gdrive ${args.join(' ')} failed: ${stderr || err.message}`));
      }
      resolve(stdout);
    });
  });
}

async function listFolder(folderId) {
  const out = await runGdrive(['readonly', 'ls', folderId, '--json']);
  const trimmed = out.trim();
  if (!trimmed || trimmed === 'null') return [];
  return JSON.parse(trimmed);
}

function formatTitle(slug) {
  // Remove leading number prefix like "01_"
  const clean = slug.replace(/^\d+_/, '');
  const acronyms = new Set(['ba', 'babok', 'cbap', 'swot', 'kpi', 'kpis', 'nfr', 'nfrs', 'bi', 'it', 'bpm', 'ii', 'iii', 'iv', 'jira', 'iiba']);
  return clean
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (acronyms.has(lower)) return lower.toUpperCase();
      if (idx > 0 && ['a', 'an', 'the', 'to', 'for', 'of', 'in', 'on', 'and', 'or', 'with'].includes(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function parseSrtDurationAndText(srtContent) {
  const blocks = srtContent.replace(/\r\n/g, '\n').trim().split(/\n\n+/);
  const cues = [];
  let maxEndSec = 0;

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    const timeLineIdx = lines[0].includes('-->') ? 0 : 1;
    const timeLine = lines[timeLineIdx];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const match = timeLine.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
    if (!match) continue;

    const startSec = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 1000;
    const endSec = parseInt(match[5]) * 3600 + parseInt(match[6]) * 60 + parseInt(match[7]) + parseInt(match[8]) / 1000;
    if (endSec > maxEndSec) maxEndSec = endSec;

    const text = lines.slice(timeLineIdx + 1).join(' ').replace(/<[^>]+>/g, '').trim();
    if (text) {
      cues.push({
        start: Math.round(startSec * 100) / 100,
        end: Math.round(endSec * 100) / 100,
        text
      });
    }
  }

  return { durationSec: Math.round(maxEndSec), cues };
}

function extractCleanHtml(rawHtml) {
  const match = rawHtml.match(/<co-content>([\s\S]*?)<\/co-content>/i);
  const inner = match ? match[1].trim() : rawHtml.replace(/<style[\s\S]*?<\/style>/gi, '').trim();
  const plainText = inner
    .replace(/<div class="asset-card[\s\S]*?<\/div>\s*<\/div>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { innerHtml: inner, plainText };
}

async function ensureTextFile(fileId) {
  const cachePath = path.join(TEXT_CACHE_DIR, `${fileId}.txt`);
  if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 0) {
    return fs.readFileSync(cachePath, 'utf8');
  }
  await runGdrive(['readonly', 'download', fileId, '--out', cachePath]);
  return fs.readFileSync(cachePath, 'utf8');
}

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await fn(items[current], current);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

const COURSE_METADATA = {
  'coursera-learn-business-analysis-mastery': {
    order: 1,
    code: 'CBAP-1',
    title: 'Business Analysis Mastery: Foundation & Strategy Analysis',
    shortTitle: '1. BA Mastery & Strategy Analysis',
    description: 'Nền tảng Phân tích Nghiệp vụ (BABOK), mô hình khái niệm cốt lõi (BACCM) và Phân tích Chiến lược (SWOT, BMC, KPIs, Balanced Scorecard, Quản trị rủi ro).'
  },
  'coursera-learn-advanced-business-analysis-elicitation-analysis': {
    order: 2,
    code: 'CBAP-2',
    title: 'Advanced Business Analysis: Elicitation & Requirements Analysis',
    shortTitle: '2. Elicitation & Requirements Analysis',
    description: 'Kỹ thuật Khơi gợi yêu cầu (Interviews, Focus Groups, Workshops, Mindmapping) & Phân tích Thiết kế Yêu cầu (User Stories, Use Cases, Process/Data/State Modelling, NFRs).'
  },
  'coursera-learn-advanced-requirements-management-solution-evaluation': {
    order: 3,
    code: 'CBAP-3',
    title: 'Advanced Requirements Lifecycle Management & Solution Evaluation',
    shortTitle: '3. Lifecycle Mgmt & Solution Evaluation',
    description: 'Quản lý vòng đời yêu cầu (Tracing, Prioritisation, Backlog Management với Jira) và Đánh giá Giải pháp (Root Cause Analysis, Data Mining, Lessons Learned).'
  },
  'coursera-learn-business-analysis-mastery-planning-skills-and-perspective': {
    order: 4,
    code: 'CBAP-4',
    title: 'Business Analysis Planning, Soft Skills & Perspectives',
    shortTitle: '4. BA Planning, Skills & Perspectives',
    description: 'Lập kế hoạch & Giám sát BA, Kỹ năng mềm (Design Sprint), và 5 góc nhìn chuyên sâu (Agile, Business Intelligence, IT, Business Architecture, BPM).'
  }
};

async function main() {
  console.log('1. Listing root specialization folder...');
  const courseFolders = await listFolder(ROOT_FOLDER_ID);
  courseFolders.sort((a, b) => {
    const oa = COURSE_METADATA[a.name]?.order || 99;
    const ob = COURSE_METADATA[b.name]?.order || 99;
    return oa - ob;
  });

  const courses = [];
  const textDownloadTasks = [];

  for (const cFolder of courseFolders) {
    if (cFolder.mimeType !== 'application/vnd.google-apps.folder') continue;
    const meta = COURSE_METADATA[cFolder.name] || {
      order: 99,
      code: 'CBAP',
      title: formatTitle(cFolder.name),
      shortTitle: formatTitle(cFolder.name),
      description: ''
    };

    console.log(`Scanning Course: ${cFolder.name} (${cFolder.id})...`);
    const moduleFolders = await listFolder(cFolder.id);
    moduleFolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    const modules = [];

    for (const mFolder of moduleFolders) {
      if (mFolder.mimeType !== 'application/vnd.google-apps.folder') continue;
      const sectionFolders = await listFolder(mFolder.id);
      sectionFolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      const sections = [];

      for (const sFolder of sectionFolders) {
        if (sFolder.mimeType !== 'application/vnd.google-apps.folder') continue;
        const files = await listFolder(sFolder.id);
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        // Group files into lessons by prefix number (e.g. "01_", "02_")
        const lessonGroups = new Map();

        for (const f of files) {
          if (f.mimeType === 'application/vnd.google-apps.folder') continue;
          const prefixMatch = f.name.match(/^(\d+)_(.+)$/);
          const prefixNum = prefixMatch ? prefixMatch[1] : '00';
          const restName = prefixMatch ? prefixMatch[2] : f.name;

          if (!lessonGroups.has(prefixNum)) {
            lessonGroups.set(prefixNum, {
              prefixNum,
              rawSlug: '',
              files: []
            });
          }
          const group = lessonGroups.get(prefixNum);
          group.files.push({
            id: f.id,
            name: f.name,
            restName,
            mimeType: f.mimeType,
            size: parseInt(f.size || '0', 10),
            modifiedTime: f.modifiedTime,
            viewUrl: `https://drive.google.com/file/d/${f.id}/view`,
            previewUrl: `https://drive.google.com/file/d/${f.id}/preview`
          });
        }

        const lessons = [];
        const sortedPrefixes = Array.from(lessonGroups.keys()).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

        for (const prefixNum of sortedPrefixes) {
          const group = lessonGroups.get(prefixNum);
          let videoFile = null;
          let enSrtFile = null;
          let viSrtFile = null;
          let htmlFile = null;
          const pdfFiles = [];
          const otherFiles = [];

          for (const file of group.files) {
            const lower = file.name.toLowerCase();
            if (lower.endsWith('.mp4')) {
              videoFile = file;
            } else if (lower.endsWith('.en.srt')) {
              enSrtFile = file;
            } else if (lower.endsWith('.vi.srt')) {
              viSrtFile = file;
            } else if (lower.endsWith('_instructions.html') || lower.endsWith('.html')) {
              htmlFile = file;
            } else if (lower.endsWith('.pdf')) {
              pdfFiles.push(file);
            } else {
              otherFiles.push(file);
            }
          }

          // Determine base slug for title
          let baseSlug = '';
          if (videoFile) {
            baseSlug = videoFile.restName.replace(/\.mp4$/i, '');
          } else if (htmlFile) {
            baseSlug = htmlFile.restName.replace(/_instructions\.html$/i, '').replace(/\.html$/i, '');
          } else if (pdfFiles.length > 0) {
            baseSlug = pdfFiles[0].restName.replace(/\.pdf$/i, '');
          } else if (group.files.length > 0) {
            baseSlug = group.files[0].restName.replace(/\.[^.]+$/, '');
          }

          const lessonId = `${cFolder.id}_${sFolder.id}_${prefixNum}`;
          const type = videoFile ? 'video' : 'reading';

          const lessonObj = {
            id: lessonId,
            courseId: cFolder.id,
            moduleId: mFolder.id,
            sectionId: sFolder.id,
            folderId: sFolder.id,
            folderUrl: `https://drive.google.com/drive/folders/${sFolder.id}`,
            index: parseInt(prefixNum, 10),
            prefix: prefixNum,
            slug: baseSlug,
            title: formatTitle(baseSlug),
            type, // 'video' | 'reading'
            durationSec: 0,
            video: videoFile,
            subtitles: {
              en: enSrtFile,
              vi: viSrtFile
            },
            instructions: htmlFile,
            pdfs: pdfFiles,
            otherFiles
          };

          lessons.push(lessonObj);

          if (htmlFile) {
            textDownloadTasks.push({ type: 'html', fileId: htmlFile.id, lessonObj });
          }
          if (enSrtFile) {
            textDownloadTasks.push({ type: 'srt_en', fileId: enSrtFile.id, lessonObj });
          }
          if (viSrtFile) {
            textDownloadTasks.push({ type: 'srt_vi', fileId: viSrtFile.id, lessonObj });
          }
        }

        sections.push({
          id: sFolder.id,
          name: sFolder.name,
          title: formatTitle(sFolder.name),
          folderUrl: `https://drive.google.com/drive/folders/${sFolder.id}`,
          lessons
        });
      }

      modules.push({
        id: mFolder.id,
        name: mFolder.name,
        index: parseInt(mFolder.name.match(/^(\d+)/)?.[1] || '1', 10),
        title: formatTitle(mFolder.name),
        folderUrl: `https://drive.google.com/drive/folders/${mFolder.id}`,
        sections
      });
    }

    courses.push({
      id: cFolder.id,
      slug: cFolder.name,
      order: meta.order,
      code: meta.code,
      title: meta.title,
      shortTitle: meta.shortTitle,
      description: meta.description,
      folderUrl: `https://drive.google.com/drive/folders/${cFolder.id}`,
      modules
    });
  }

  console.log(`Found ${courses.length} courses. Downloading ${textDownloadTasks.length} text/subtitle files for search & duration indexing...`);
  let done = 0;
  await mapPool(textDownloadTasks, 6, async (task) => {
    try {
      const content = await ensureTextFile(task.fileId);
      if (task.type === 'srt_en') {
        const { durationSec } = parseSrtDurationAndText(content);
        if (durationSec > 0) {
          task.lessonObj.durationSec = durationSec;
        }
      } else if (task.type === 'html') {
        const { plainText } = extractCleanHtml(content);
        const wordCount = plainText.split(/\s+/).filter(Boolean).length;
        // Estimate reading time: ~200 words/min + 3 mins per PDF attachment
        const pdfMinutes = (task.lessonObj.pdfs?.length || 0) * 5;
        const readMinutes = Math.max(2, Math.ceil(wordCount / 180) + pdfMinutes);
        task.lessonObj.durationSec = readMinutes * 60;
      }
    } catch (err) {
      console.error(`Warning: failed to download ${task.fileId}:`, err.message);
    }
    done++;
    if (done % 25 === 0 || done === textDownloadTasks.length) {
      console.log(`Progress: ${done}/${textDownloadTasks.length} text files cached`);
    }
  });

  // Compute totals per course & module
  let totalLessons = 0;
  let totalVideos = 0;
  let totalReadings = 0;
  let totalDurationSec = 0;

  for (const course of courses) {
    let cLessons = 0;
    let cVideos = 0;
    let cReadings = 0;
    let cDuration = 0;

    for (const mod of course.modules) {
      let mLessons = 0;
      let mDuration = 0;
      for (const sec of mod.sections) {
        for (const les of sec.lessons) {
          mLessons++;
          cLessons++;
          totalLessons++;
          if (les.type === 'video') {
            cVideos++;
            totalVideos++;
          } else {
            cReadings++;
            totalReadings++;
          }
          mDuration += les.durationSec || 0;
          cDuration += les.durationSec || 0;
          totalDurationSec += les.durationSec || 0;
        }
      }
      mod.totalLessons = mLessons;
      mod.totalDurationSec = mDuration;
    }

    course.totalLessons = cLessons;
    course.totalVideos = cVideos;
    course.totalReadings = cReadings;
    course.totalDurationSec = cDuration;
  }

  const catalog = {
    specialization: {
      id: ROOT_FOLDER_ID,
      title: 'Certified Business Analysis Professional (CBAP) Specialization',
      folderUrl: `https://drive.google.com/drive/folders/${ROOT_FOLDER_ID}`,
      syncedAt: new Date().toISOString(),
      totalCourses: courses.length,
      totalLessons,
      totalVideos,
      totalReadings,
      totalDurationSec
    },
    courses
  };

  const catalogPath = path.join(DATA_DIR, 'catalog.json');
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`Saved catalog to ${catalogPath} (${totalLessons} lessons: ${totalVideos} videos, ${totalReadings} readings).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
