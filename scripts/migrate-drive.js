const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  PROJECT_ROOT,
  resolveGdriveBinary,
  getProjectConfig,
  saveProjectConfig
} = require('../lib/gdrive');

const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const CATALOG_PATH = path.join(DATA_DIR, 'catalog.json');
const TEXT_CACHE_DIR = path.join(DATA_DIR, 'cache', 'text');
const MEDIA_CACHE_DIR = path.join(DATA_DIR, 'cache', 'media');

const SOURCE_HOME = path.join(PROJECT_ROOT, '.gdrive-source-home');
const TARGET_HOME = path.join(PROJECT_ROOT, '.gdrive-home');

function setupHomeWithToken(homeDir, tokenSrcPath) {
  const pluginDir = path.join(homeDir, '.gemini', 'antigravity', 'plugin_data', 'gdrive');
  fs.mkdirSync(pluginDir, { recursive: true });
  const dstToken = path.join(pluginDir, 'token.json');
  if (fs.existsSync(tokenSrcPath)) {
    fs.copyFileSync(tokenSrcPath, dstToken);
  }
  return homeDir;
}

function runGdriveWithHome(homeDir, args) {
  return new Promise((resolve, reject) => {
    const { bin, useShell } = resolveGdriveBinary();
    const env = { ...process.env, USERPROFILE: homeDir, HOME: homeDir };
    execFile(bin, args, { maxBuffer: 25 * 1024 * 1024, shell: useShell, env }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`gdrive ${args.join(' ')} failed: ${stderr || err.message}`));
      }
      resolve(stdout || stderr);
    });
  });
}

async function listFolder(homeDir, folderId) {
  const out = await runGdriveWithHome(homeDir, ['readonly', 'ls', folderId, '--json']);
  const trimmed = out.trim();
  if (!trimmed || trimmed === 'null') return [];
  return JSON.parse(trimmed);
}

async function ensureFolder(homeDir, parentId, folderName, existingItems = null) {
  const items = existingItems || await listFolder(homeDir, parentId);
  const found = items.find(i => i.name === folderName && i.mimeType === 'application/vnd.google-apps.folder');
  if (found) return found.id;

  const out = await runGdriveWithHome(homeDir, ['mutate', 'mkdir', folderName, '--parent', parentId]);
  const idMatch = out.match(/\(ID:\s*([^)]+)\)/i);
  if (idMatch) return idMatch[1].trim();

  const refreshed = await listFolder(homeDir, parentId);
  const after = refreshed.find(i => i.name === folderName && i.mimeType === 'application/vnd.google-apps.folder');
  if (!after) throw new Error(`Failed to create folder ${folderName} under ${parentId}: ${out}`);
  return after.id;
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

async function main() {
  const sourceTokenPath = path.resolve(PROJECT_ROOT, process.env.SOURCE_TOKEN_PATH || './gdrive-auth/source-token.json');
  const targetTokenPath = path.resolve(PROJECT_ROOT, process.env.TARGET_TOKEN_PATH || './gdrive-auth/token.json');

  if (!fs.existsSync(sourceTokenPath)) {
    throw new Error(`Missing source token at ${sourceTokenPath}`);
  }
  if (!fs.existsSync(targetTokenPath)) {
    throw new Error(`Missing target token at ${targetTokenPath}`);
  }
  if (!fs.existsSync(CATALOG_PATH)) {
    throw new Error(`Missing catalog.json at ${CATALOG_PATH}`);
  }

  setupHomeWithToken(SOURCE_HOME, sourceTokenPath);
  setupHomeWithToken(TARGET_HOME, targetTokenPath);

  const srcStatus = await runGdriveWithHome(SOURCE_HOME, ['auth', 'status']);
  const dstStatus = await runGdriveWithHome(TARGET_HOME, ['auth', 'status']);
  console.log('=== Source Account ===\n' + srcStatus.trim());
  console.log('=== Target Account ===\n' + dstStatus.trim());

  const cfg = getProjectConfig();
  const libraryFolderId = process.env.LIBRARY_FOLDER_ID || '1CxXiyYsBp5Qvr4IKAFLxIld37AuBe4qM';
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

  const specFolderName = 'coursera-spec-certified-business-analysis-professional-cbap';
  console.log(`\nEnsuring specialization folder "${specFolderName}" inside target folder ${libraryFolderId}...`);
  const targetSpecFolderId = await ensureFolder(TARGET_HOME, libraryFolderId, specFolderName);
  console.log(`Target Specialization Folder ID: ${targetSpecFolderId}`);

  const tmpRoot = path.join(os.tmpdir(), 'coursera-gdrive-migrate');
  fs.mkdirSync(tmpRoot, { recursive: true });

  const uploadTasks = [];
  const specChildren = await listFolder(TARGET_HOME, targetSpecFolderId);

  for (const course of catalog.courses) {
    const targetCourseId = await ensureFolder(TARGET_HOME, targetSpecFolderId, course.slug, specChildren);
    console.log(`Course folder ready: ${course.slug} -> ${targetCourseId}`);
    const courseChildren = await listFolder(TARGET_HOME, targetCourseId);

    for (const mod of course.modules) {
      const targetModId = await ensureFolder(TARGET_HOME, targetCourseId, mod.name, courseChildren);
      const modChildren = await listFolder(TARGET_HOME, targetModId);

      for (const sec of mod.sections) {
        const targetSecId = await ensureFolder(TARGET_HOME, targetModId, sec.name, modChildren);
        const secChildren = await listFolder(TARGET_HOME, targetSecId);
        const existingNames = new Set(secChildren.map(f => f.name));

        for (const les of sec.lessons) {
          const files = [
            les.video,
            les.instructions,
            les.subtitles?.en,
            les.subtitles?.vi,
            ...(les.pdfs || []),
            ...(les.otherFiles || [])
          ].filter(Boolean);

          for (const f of files) {
            uploadTasks.push({
              file: f,
              targetSecId,
              alreadyExists: existingNames.has(f.name),
              courseSlug: course.slug,
              secName: sec.name
            });
          }
        }
      }
    }
  }

  const pending = uploadTasks.filter(t => !t.alreadyExists);
  console.log(`\nTotal files: ${uploadTasks.length} (${uploadTasks.length - pending.length} already on target, ${pending.length} to transfer).`);

  let completed = 0;
  await mapPool(pending, 4, async (task, idx) => {
    const { file, targetSecId } = task;
    const jobDir = path.join(tmpRoot, `${idx}_${Date.now()}`);
    fs.mkdirSync(jobDir, { recursive: true });
    const tmpFilePath = path.join(jobDir, file.name);

    try {
      const cachedTextPath = path.join(TEXT_CACHE_DIR, `${file.id}.txt`);
      const cachedMp4Path = path.join(MEDIA_CACHE_DIR, `${file.id}.mp4`);
      const cachedPdfPath = path.join(MEDIA_CACHE_DIR, `${file.id}.pdf`);

      if (fs.existsSync(cachedTextPath) && fs.statSync(cachedTextPath).size > 0) {
        fs.copyFileSync(cachedTextPath, tmpFilePath);
      } else if (fs.existsSync(cachedMp4Path) && fs.statSync(cachedMp4Path).size > 0) {
        fs.copyFileSync(cachedMp4Path, tmpFilePath);
      } else if (fs.existsSync(cachedPdfPath) && fs.statSync(cachedPdfPath).size > 0) {
        fs.copyFileSync(cachedPdfPath, tmpFilePath);
      } else {
        await runGdriveWithHome(SOURCE_HOME, ['readonly', 'download', file.id, '--out', tmpFilePath]);
      }

      const upOut = await runGdriveWithHome(TARGET_HOME, ['mutate', 'upload', tmpFilePath, '--parent', targetSecId]);
      const idMatch = upOut.match(/\(ID:\s*([^)]+)\)/i);
      if (idMatch && fs.existsSync(cachedTextPath)) {
        const newFileId = idMatch[1].trim();
        const newCachePath = path.join(TEXT_CACHE_DIR, `${newFileId}.txt`);
        if (!fs.existsSync(newCachePath)) {
          fs.copyFileSync(cachedTextPath, newCachePath);
        }
      }

      completed++;
      if (completed % 10 === 0 || completed === pending.length) {
        console.log(`[${completed}/${pending.length}] Transferred: ${file.name}`);
      }
    } finally {
      try {
        if (fs.existsSync(tmpFilePath)) fs.unlinkSync(tmpFilePath);
        if (fs.existsSync(jobDir)) fs.rmdirSync(jobDir);
      } catch (e) {}
    }
  });

  // Update config.local.json to point to the new specialization folder on duc.to.dev
  const nextConfig = saveProjectConfig({
    drive: {
      ...cfg.drive,
      account: 'duc.to.dev@gmail.com',
      libraryFolderId,
      libraryFolderUrl: `https://drive.google.com/drive/folders/${libraryFolderId}`,
      storageRootFolderId: targetSpecFolderId,
      storageRootFolderUrl: `https://drive.google.com/drive/folders/${targetSpecFolderId}`
    },
    rootFolderId: targetSpecFolderId,
    rootFolderUrl: `https://drive.google.com/drive/folders/${targetSpecFolderId}`
  });

  console.log('\nUpdated config.local.json with new storageRootFolderId:', nextConfig.rootFolderId);
  console.log('Migration complete! Now running sync-drive.js to rebuild catalog.json from duc.to.dev Drive...');
}

main().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
