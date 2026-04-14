import fs from 'fs/promises';
import path from 'path';

import { timestamp,ensureTmpDir,  printBanner, isPidRunning, getBrowserLockfilePath } from './commonFunctions.mjs';
import { trackBrowserProcessesAndOrphans, trackProxyProcessAndOrphans } from './handleTracking.mjs';

import {
  TMP_DIR,
  PROXY_PID,
  BROWSER_PID,
  BROWSER_LOCKFILE_PREFIX,
  PROXY_LOCKFILE_PATH,
} from './constants.mjs';

export async function terminateManagedProxyAndWait() {

  await ensureTmpDir();

  const { managedPid } = await trackProxyProcessAndOrphans();

  try {
    if (managedPid) {
      try {
        process.kill(managedPid, 'SIGTERM');
      } catch (e) {
        console.warn(`[⚠️] Failed to send SIGTERM to proxy PID ${managedPid}: ${e.message}`);
      }

      const maxWait = 3000;
      const pollInterval = 100;
      const start = Date.now();

      while (isPidRunning(managedPid)) {
        if (Date.now() - start > maxWait) {
          printBanner('[❌]', `Timed out waiting for proxy PID ${managedPid} to shut down.`);
          break;
        }
        await new Promise(res => setTimeout(res, pollInterval));
      }
    }

    await fs.rm(PROXY_LOCKFILE_PATH, { force: true });
  } catch {}

  printBanner('[🧼]', 'Proxy clean shutdown confirmed.');
}

export async function terminateOrphanedProxiesAndWait() {

  await ensureTmpDir();

  const { orphanedPids } = await trackProxyProcessAndOrphans();
  if (orphanedPids.length === 0) {
    printBanner('[✔️ ]', 'No orphaned proxy processes to terminate.');
    return;
  }

  printBanner('[🧹]', `Attempting to terminate ${orphanedPids.length} orphaned proxy process${orphanedPids.length > 1 ? 'es' : ''}...`);

  const pollInterval = 100;
  const timeout = 3000;

  for (const pid of orphanedPids) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch (e) {
      console.warn(`[⚠️] Failed to send SIGTERM to PID ${pid}: ${e.message}`);
    }
  }

  const start = Date.now();
  while (orphanedPids.some(pid => isPidRunning(pid))) {
    if (Date.now() - start > timeout) {
      const stillRunning = orphanedPids.filter(pid => isPidRunning(pid));
      printBanner('[❌]', `Timed out waiting for orphaned proxies to shut down: ${stillRunning.join(', ')}`);
      return;
    }
    await new Promise(res => setTimeout(res, pollInterval));
  }

  printBanner('[🧼]', 'All orphaned proxy processes terminated successfully.');
}

async function removeAllBrowserLockfiles() {
  await ensureTmpDir();

  try {
    const files = await fs.readdir(TMP_DIR);
    const lockfiles = files.filter(f => f.startsWith(BROWSER_LOCKFILE_PREFIX));

    if (lockfiles.length === 0) {
      printBanner('[✔️ ]', 'No browser lockfiles found for removal.');
      return;
    }

    printBanner('[🧹]', `Found ${lockfiles.length} browser lockfile(s) for removal...`);

    for (const file of lockfiles) {
      const fullPath = path.resolve(TMP_DIR, file);
      console.log(`[DEBUG] Attempting to delete: ${fullPath}`);
      try {
        await fs.rm(fullPath, { force: true });
        console.log(`[🧼] Removed lockfile: ${file}`);
      } catch (err) {
        console.warn(`[⚠️] Failed to remove lockfile ${file}: ${err.message}`);
      }
    }

    printBanner('[🧼]', 'Browser lockfile cleanup complete.');
  } catch (err) {
    console.warn(`[⚠️] Error reading TMP_DIR: ${err.message}`);
  }
}


export async function terminateManagedBrowsersAndWait() {

  await ensureTmpDir();

  const { managedPids } = await trackBrowserProcessesAndOrphans();
  if (managedPids.length === 0) {
    printBanner('[✔️ ]', 'No managed browser processes to terminate.');
  } else {
    printBanner('[🧹]', `Attempting to terminate ${managedPids.length} managed browser process${managedPids.length > 1 ? 'es' : ''}...`);

    const pollInterval = 100;
    const timeout = 3000;

    for (const pid of managedPids) {
      try {
        process.kill(pid, 'SIGTERM');
      } catch (e) {
        console.warn(`[⚠️] Failed to send SIGTERM to PID ${pid}: ${e.message}`);
      }
    }

    const start = Date.now();
    while (managedPids.some(pid => isPidRunning(pid))) {
      if (Date.now() - start > timeout) {
        const stillRunning = managedPids.filter(pid => isPidRunning(pid));
        printBanner('[❌]', `Timed out waiting for managed PIDs to shut down: ${stillRunning.join(', ')}`);
        break;
      }
      await new Promise(res => setTimeout(res, pollInterval));
    }

    // Confirm clean shutdown if none are running
    const stillRunningAfter = managedPids.filter(pid => isPidRunning(pid));
    if (stillRunningAfter.length === 0) {
      console.log('[🧼] Browser clean shutdown confirmed.');
    }
  }

  // 🔥 Always remove all browser lockfiles
  await removeAllBrowserLockfiles();

  console.log('[🧼] Browser clean shutdown confirmed.');
}

export async function terminateOrphanBrowsersAndWait() {

  await ensureTmpDir();

  const { orphanedPids } = await trackBrowserProcessesAndOrphans();
  if (orphanedPids.length === 0) {
    printBanner('[✔️ ]', 'No orphaned browser processes to terminate.');
  } else {
    printBanner('[🧹]', `Attempting to terminate ${orphanedPids.length} orphaned browser process${orphanedPids.length > 1 ? 'es' : ''}...`);

    const pollInterval = 100;
    const timeout = 3000;

    for (const pid of orphanedPids) {
      try {
        process.kill(pid, 'SIGTERM');
      } catch (e) {
        console.warn(`[⚠️ ] Failed to send SIGTERM to PID ${pid}: ${e.message}`);
      }
    }

    const start = Date.now();
    while (orphanedPids.some(pid => isPidRunning(pid))) {
      if (Date.now() - start > timeout) {
        const stillRunning = orphanedPids.filter(pid => isPidRunning(pid));
        printBanner('[❌]', `Timed out waiting for orphaned PIDs to shut down: ${stillRunning.join(', ')}`);
        break;
      }
      await new Promise(res => setTimeout(res, pollInterval));
    }
  }

  // 🔥 Always remove all browser lockfiles
  await removeAllBrowserLockfiles();


  printBanner('[🧼]', 'Orphaned browser cleanup complete.');
}

export async function stopNormalProxyAndBrowserOperation() {
  printBanner('[🛑]', 'Stopping Normal Operation:...');
  await terminateManagedProxyAndWait();
  await terminateOrphanedProxiesAndWait();
  await terminateManagedBrowsersAndWait();
  await terminateOrphanBrowsersAndWait();
}
