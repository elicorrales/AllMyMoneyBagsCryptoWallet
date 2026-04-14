//all-my-money-bags-helpers/handleSpawn.mjs
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import net from 'net';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const findProcess = require('find-process').default;

import {
  PROXY_COMMAND,
  PROXY_LOCKFILE_PATH,
  BROWSER_COMMAND,
  BROWSER_HTML_PATH,
  BROWSER_PROFILE_DIR,
  PROXY_PID,
  BROWSER_PID,
  TMP_DIR,
  WALLET_BROWSER_EXTENSION_PATH,
} from './constants.mjs';

import { quitScript } from './handleMenus.mjs';
import { printBanner, ensureTmpDir, getBrowserLockfilePath } from './commonFunctions.mjs';
import { trackBrowserProcessesAndOrphans, trackProxyProcessAndOrphans } from './handleTracking.mjs';
import { createSecretFilesIfNeeded, deleteSecretFilesMaybe, deleteSecretFilesForced } from './handleSecrecy.mjs';

let PROXY_PORT = null;

function isPortOpen(port) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    socket
      .once('connect', () => {
        socket.destroy();
        resolve(true);
      })
      .once('error', () => resolve(false))
      .connect(port, '127.0.0.1');
  });
}

async function exists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function spawnProxyAndVerify() {
  await ensureTmpDir();

  const tracking = await trackProxyProcessAndOrphans();

  if (tracking.managedPid || tracking.orphanedPids.length > 0) {
    printBanner('[⚠️ ]', 'Proxy not started: existing proxy process detected.');
    await deleteSecretFilesMaybe();
    throw new Error('Refusing to spawn proxy while any proxies are running.');
  }

  let stdoutConfirmed = false;
  let lockfileConfirmed = false;
  let stillRunningConfirmed = false;

  console.log('[🟢] Starting Proxy....');

  await createSecretFilesIfNeeded();

  const child = spawn('node', [PROXY_COMMAND], {
    detached: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(`[proxy stdout] ${data}`);
    const msg = data.toString();
    const portMatch = msg.match(/Proxy server running on port (\d+)/);
    if (portMatch) {
      PROXY_PORT = parseInt(portMatch[1]);
      stdoutConfirmed = true;
    }
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(`[proxy stderr] ${data}`);
  });

  const proxyPid = child.pid;

  return new Promise((resolve, reject) => {
    child.on('error', (err) => {
      deleteSecretFilesForced().finally(() => {
        reject(new Error(`[❌] Proxy failed to spawn: ${err.message}`));
      });
    });

    // 3. short timeout to allow startup
    setTimeout(() => {
      (async () => {
        try {
          if (await exists(PROXY_LOCKFILE_PATH)) {
            const pidStr = (await fs.readFile(PROXY_LOCKFILE_PATH)).toString().trim();
            const pidInLock = parseInt(pidStr);
            if (!isNaN(pidInLock) && pidInLock === proxyPid) {
              lockfileConfirmed = true;
            }
          }

          let portConfirmed = false;
          if (PROXY_PORT) {
            portConfirmed = await isPortOpen(PROXY_PORT);
          }

          // 4. process check
          try {
            process.kill(proxyPid, 0);
            stillRunningConfirmed = true;
          } catch {
            stillRunningConfirmed = false;
          }

          const allPassed = stdoutConfirmed && lockfileConfirmed && portConfirmed && stillRunningConfirmed;

          if (allPassed) {
            console.log(`[✅] Proxy verified running on port ${PROXY_PORT}`);
            await deleteSecretFilesMaybe();
            resolve(proxyPid);
          } else {
            console.log('[❌] Proxy verification failed');
            await deleteSecretFilesForced();
            reject(new Error('Proxy failed verification'));
          }
        } catch (err) {
          await deleteSecretFilesForced();
          reject(err);
        }
      })();
    }, 1500);
  });
}

async function clearCrashRecoveryFiles(profileDir) {
  const filesToDelete = [
    'Current Session',
    'Current Tabs',
    'Last Session',
    'Last Tabs',
    'Preferences',
    'Visited Links',
  ];

  const pathsToDelete = [
    ...filesToDelete.map(f => path.join(profileDir, 'Default', f)),
    path.join(profileDir, 'Default', 'Sessions'), // folder
    path.join(profileDir, 'Sessions'),            // rare legacy
  ];

  for (const target of pathsToDelete) {
    try {
      const stat = await fs.stat(target);
      if (stat.isDirectory()) {
        await fs.rm(target, { recursive: true, force: true });
      } else {
        await fs.unlink(target);
      }
    } catch {
      // ignore errors (e.g., file doesn't exist)
    }
  }
}

export async function spawnBrowserAndVerify() {
  await ensureTmpDir();

  if (!(await exists(BROWSER_PROFILE_DIR))) {
    await fs.mkdir(BROWSER_PROFILE_DIR, { recursive: true });
  }

  const tracking = await trackBrowserProcessesAndOrphans();

  if (tracking.managedPids.length > 0 || tracking.orphanedPids.length > 0) {
    printBanner('[⚠️ ]', 'Browser not started: existing browser process detected.');
    await deleteSecretFilesForced();
    throw new Error('Refusing to spawn browser while any browsers are running.');
  }

  const htmlPath = BROWSER_HTML_PATH;
  clearCrashRecoveryFiles(BROWSER_PROFILE_DIR);

  await createSecretFilesIfNeeded();

  return new Promise((resolve, reject) => {
    const args = [
      '--new-window',
      '--restore-last-session=false',
      '--disable-session-crashed-bubble',
      '--disable-features=SessionRestore,AutofillServerCommunication',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      `--user-data-dir=${BROWSER_PROFILE_DIR}`,
      `--load-extension=${WALLET_BROWSER_EXTENSION_PATH}`,
      `--disable-extensions-except=${WALLET_BROWSER_EXTENSION_PATH}`,
      '--disable-component-update',  // Prevents background updates from delaying startup
      `file://${htmlPath}?launchedByScript=1`,
    ];

    console.log('[🟢] Starting Browser...');

    let child;
    try {
      child = spawn(BROWSER_COMMAND.value, args, {
        detached: true,
        stdio: 'ignore',
      });
    } catch (err) {
      deleteSecretFilesForced().finally(() => {
        reject(new Error(`Failed to spawn browser process synchronously: ${err.message}`));
      });
      return;
    }

    child.on('error', (err) => {
      deleteSecretFilesForced().finally(() => {
        reject(new Error(`Failed to spawn browser process (async): ${err.message}`));
      });
    });

    const browserPid = child.pid;
    if (!browserPid) {
      deleteSecretFilesForced().finally(() => {
        reject(new Error('Browser spawn did not return a PID'));
      });
      return;
    }

    setTimeout(() => {
      (async () => {
        try {
          const lockfilePath = getBrowserLockfilePath(browserPid.toString());

          const lockfileExists = await exists(lockfilePath);
          const lockfileConfirmed = lockfileExists &&
            parseInt((await fs.readFile(lockfilePath)).toString().trim()) === browserPid;

          let stillRunningConfirmed = false;
          try {
            process.kill(browserPid, 0);
            stillRunningConfirmed = true;
          } catch {}

          let processList;
          try {
            console.log('\n\nGoing to get managed proxy PID....');
            processList = await findProcess('name', '');
          } catch (err) {
            throw new Error(`Error getting managed proxy PID: ${err.message}`);
          }

          const matching = processList.find(p =>
            p.pid === browserPid &&
            p.cmd.toLowerCase().includes('brave') &&
            p.cmd.includes('--new-window') &&
            p.cmd.includes('file://') &&
            p.cmd.includes('SimpleWebPageCryptoWallet')
          );

          const allConfirmed = stillRunningConfirmed && matching;

          if (allConfirmed) {
            // Get all related processes by BROWSER_PROFILE_DIR
            const relatedByProfileDir = processList.filter(p => p.cmd.includes(BROWSER_PROFILE_DIR));
            const relatedPids = relatedByProfileDir.map(p => p.pid);

            // Write all related PIDs to lockfile (JSON array)
            try {
              await fs.writeFile(lockfilePath, JSON.stringify(relatedPids));
            } catch (err) {
              throw new Error(`Failed to write related PIDs to browser lockfile: ${err.message}`);
            }

            console.log(`[✅] Browser verified running with PID ${browserPid} and related PIDs: ${relatedPids.join(', ')}`);

            BROWSER_PID.value = browserPid;
            await deleteSecretFilesMaybe();
            resolve(browserPid);
          } else {
            throw new Error('Browser failed verification');
          }
        } catch (err) {
          await deleteSecretFilesForced();
          reject(err);
        }
      })();
    }, 1500);
  });
}


export async function startNormalProxyAndBrowserOperation(isMenuDebugMode = false) {

  //Start Proxy
  try {
    printBanner('[📡]', 'Starting RPC Proxy Server...');
    PROXY_PID.value = await spawnProxyAndVerify();
    console.log('\n\n[DEBUG] Set PROXY_PID.value =', PROXY_PID.value);

    // Start Browser
    try {
      printBanner('[🌐]', 'Starting Browser...');
      BROWSER_PID.value = await spawnBrowserAndVerify();
      console.log('\n\n[DEBUG] Set BROWSER_PID.value =', BROWSER_PID.value);
    } catch (e) {
      if (isMenuDebugMode) {
        printBanner('[❌]', `Browser failed to start: ${e}`);
      } else {
        printBanner('[🛑]', 'Main script exiting after browser failure');
        await quitScript();
      }
    }

  } catch (err) {
    if (isMenuDebugMode) {
      printBanner('[❌]', `Proxy failed to start: ${err}`);
    } else {
      printBanner('[🛑]', 'Main script exiting after browser failure');
      await quitScript();
    }
  }

}
