const { execFile, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'config.local.json');
const DEFAULT_TOKEN_REL_PATH = './gdrive-auth/token.json';
const ISOLATED_HOME = path.join(PROJECT_ROOT, '.gdrive-home');
const ISOLATED_PLUGIN_DIR = path.join(ISOLATED_HOME, '.gemini', 'antigravity', 'plugin_data', 'gdrive');
const ISOLATED_TOKEN_PATH = path.join(ISOLATED_PLUGIN_DIR, 'token.json');

function getProjectConfig() {
  let raw = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) {
      console.error('Warning: Failed to parse config.local.json:', e.message);
    }
  }

  const drive = raw.drive || {};
  const rootFolderId = process.env.GDRIVE_ROOT_FOLDER_ID || drive.storageRootFolderId || raw.rootFolderId || '';
  const rootFolderUrl = drive.storageRootFolderUrl || raw.rootFolderUrl || (rootFolderId ? `https://drive.google.com/drive/folders/${rootFolderId}` : '');
  const account = process.env.GDRIVE_ACCOUNT || drive.account || 'duc.to.dev@gmail.com';
  const tokenPath = process.env.GDRIVE_TOKEN_PATH || drive.tokenPath || DEFAULT_TOKEN_REL_PATH;

  return {
    port: raw.port || 3456,
    drive: {
      account,
      tokenPath,
      storageRootFolderId: rootFolderId,
      storageRootFolderUrl: rootFolderUrl
    },
    rootFolderId,
    rootFolderUrl
  };
}

function saveProjectConfig(partial) {
  const current = getProjectConfig();
  const nextDrive = {
    ...current.drive,
    ...(partial.drive || {})
  };
  if (partial.rootFolderId) {
    nextDrive.storageRootFolderId = partial.rootFolderId;
    nextDrive.storageRootFolderUrl = partial.rootFolderUrl || `https://drive.google.com/drive/folders/${partial.rootFolderId}`;
  }
  const updated = {
    port: partial.port || current.port || 3456,
    drive: nextDrive,
    rootFolderId: nextDrive.storageRootFolderId,
    rootFolderUrl: nextDrive.storageRootFolderUrl
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf8');
  return updated;
}

function resolveGdriveBinary() {
  if (process.env.GDRIVE_BIN && fs.existsSync(process.env.GDRIVE_BIN)) {
    return { bin: process.env.GDRIVE_BIN, useShell: false };
  }
  if (process.platform === 'win32') {
    const realHome = process.env.USERPROFILE || os.homedir();
    const binDir = path.join(realHome, '.gemini', 'antigravity', 'plugin_data', 'gdrive', 'bin');
    if (fs.existsSync(binDir)) {
      const exes = fs.readdirSync(binDir).filter(f => f.startsWith('gdrive') && f.endsWith('.exe'));
      if (exes.length > 0) {
        return { bin: path.join(binDir, exes[0]), useShell: false };
      }
    }
    return { bin: 'gdrive', useShell: true };
  }
  return { bin: 'gdrive', useShell: false };
}

function prepareIsolatedHome() {
  const cfg = getProjectConfig();
  const absTokenPath = path.resolve(PROJECT_ROOT, cfg.drive.tokenPath || DEFAULT_TOKEN_REL_PATH);
  fs.mkdirSync(path.dirname(absTokenPath), { recursive: true });
  fs.mkdirSync(ISOLATED_PLUGIN_DIR, { recursive: true });

  // Sync project tokenPath -> isolated home token.json if newer or missing
  if (fs.existsSync(absTokenPath)) {
    const srcStat = fs.statSync(absTokenPath);
    const dstExists = fs.existsSync(ISOLATED_TOKEN_PATH);
    if (!dstExists || srcStat.mtimeMs > fs.statSync(ISOLATED_TOKEN_PATH).mtimeMs) {
      fs.copyFileSync(absTokenPath, ISOLATED_TOKEN_PATH);
    }
  }

  return { absTokenPath, env: { ...process.env, USERPROFILE: ISOLATED_HOME, HOME: ISOLATED_HOME } };
}

function syncTokenBack(absTokenPath) {
  try {
    if (fs.existsSync(ISOLATED_TOKEN_PATH)) {
      fs.mkdirSync(path.dirname(absTokenPath), { recursive: true });
      fs.copyFileSync(ISOLATED_TOKEN_PATH, absTokenPath);
    }
  } catch (e) {
    // Ignore read-only volume errors if mounted ro
  }
}

function runGdrive(args) {
  return new Promise((resolve, reject) => {
    const { bin, useShell } = resolveGdriveBinary();
    const { absTokenPath, env } = prepareIsolatedHome();

    execFile(bin, args, { maxBuffer: 25 * 1024 * 1024, shell: useShell, env }, (err, stdout, stderr) => {
      syncTokenBack(absTokenPath);
      if (err) {
        return reject(new Error(`gdrive ${args.join(' ')} failed: ${stderr || err.message}`));
      }
      resolve(stdout || stderr);
    });
  });
}

async function getDriveAuthStatus() {
  try {
    const out = await runGdrive(['auth', 'status']);
    const loggedIn = /Authentication Status:\s*Logged in/i.test(out);
    const accountMatch = out.match(/Account:\s*([^\r\n]+)/i);
    const expiryMatch = out.match(/Token expiry:\s*([^\r\n]+)/i);
    return {
      loggedIn,
      account: accountMatch ? accountMatch[1].trim() : null,
      expiry: expiryMatch ? expiryMatch[1].trim() : null,
      raw: out
    };
  } catch (err) {
    return {
      loggedIn: false,
      account: null,
      error: err.message
    };
  }
}

module.exports = {
  PROJECT_ROOT,
  CONFIG_PATH,
  ISOLATED_HOME,
  ISOLATED_TOKEN_PATH,
  getProjectConfig,
  saveProjectConfig,
  resolveGdriveBinary,
  prepareIsolatedHome,
  syncTokenBack,
  runGdrive,
  getDriveAuthStatus
};
