const { spawn } = require('child_process');
const {
  getProjectConfig,
  saveProjectConfig,
  resolveGdriveBinary,
  prepareIsolatedHome,
  syncTokenBack,
  getDriveAuthStatus
} = require('../lib/gdrive');

async function main() {
  const cfg = getProjectConfig();
  const { bin, useShell } = resolveGdriveBinary();
  const { absTokenPath, env } = prepareIsolatedHome();

  console.log(`Target Drive account in config: ${cfg.drive.account}`);
  console.log(`Token file location: ${absTokenPath}`);
  console.log('Starting Google Drive OAuth2 login flow...\n');

  const child = spawn(bin, ['auth', 'login'], {
    stdio: 'inherit',
    shell: useShell,
    env
  });

  child.on('exit', async (code) => {
    syncTokenBack(absTokenPath);
    if (code === 0) {
      const status = await getDriveAuthStatus();
      console.log('\n--- Drive Auth Status ---');
      console.log(status.raw || status);
      if (status.account) {
        saveProjectConfig({
          drive: {
            ...cfg.drive,
            account: status.account
          }
        });
        console.log(`Updated config.local.json drive.account -> ${status.account}`);
      }
    } else {
      console.error(`gdrive auth login exited with code ${code}`);
      process.exit(code || 1);
    }
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
