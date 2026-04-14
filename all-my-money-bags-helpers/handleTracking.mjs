import fs from 'fs/promises';
import path from 'path';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const findProcess = require('find-process').default;

import { BROWSER_LOCKFILE_PREFIX, PROXY_PID, PROXY_COMMAND, PROXY_LOCKFILE_PATH, BROWSER_PID, BROWSER_PROFILE_DIR, TMP_DIR } from './constants.mjs';
import { printBanner, ensureTmpDir, isPidRunning } from './commonFunctions.mjs';


export async function trackProxyProcessAndOrphans() {

  await ensureTmpDir();

  let allProcesses = [];
  try {
    allProcesses = await findProcess('name', '');
    console.log(`[DEBUG] Found ${allProcesses.length} total processes`);
  } catch (err) {
    console.error(`\n[❌] Error getting all running processes: ${err}\n`);
    return { managedPid: null, orphanedPids: [] };
  }

  const allRunningProxies = allProcesses.filter(p => (p.cmd || '').includes(PROXY_COMMAND));
  console.log(`[DEBUG] Found ${allRunningProxies.length} proxy processes running`);
  const allRunningProxyPids = new Set(allRunningProxies.map(p => p.pid));

  let managedPid = null;
  let lockfilePid = null;

  // --- Step 1: Check and validate the lockfile ---
  try {
    console.log(`[DEBUG] Reading proxy lockfile at ${PROXY_LOCKFILE_PATH}`);
    const content = await fs.readFile(PROXY_LOCKFILE_PATH, 'utf8');
    const pid = parseInt(content.trim(), 10);
    console.log(`[DEBUG] Lockfile contains PID: ${pid}`);

    if (!isNaN(pid)) {
      if (allRunningProxyPids.has(pid)) {
        // Lockfile PID is valid and corresponds to a running process
        lockfilePid = pid;
        console.log(`[DEBUG] Lockfile PID ${pid} is valid and running`);
      } else {
        // Lockfile is stale, remove it
        console.log(`[💀] Removing stale lockfile for PID ${pid}`);
        await fs.unlink(PROXY_LOCKFILE_PATH);
      }
    }
  } catch (e) {
    // This catch block handles the case where the lockfile doesn't exist
    // or is corrupt, which is a valid state. No action needed other than logging.
    console.log('[DEBUG] No valid proxy lockfile found or error reading it.');
  }

  // --- Step 2: Determine the definitive managed PID ---
  console.log(`[DEBUG] In-memory PROXY_PID.value: ${PROXY_PID.value}, lockfilePid: ${lockfilePid}`);

  if (PROXY_PID.value && allRunningProxyPids.has(PROXY_PID.value)) {
    // Highest priority: in-memory PID is valid and running.
    if (PROXY_PID.value !== lockfilePid) {
      console.warn(`[⚠️] In-memory PID (${PROXY_PID.value}) does not match lockfile PID (${lockfilePid}). Prioritizing in-memory.`);
    }
    managedPid = PROXY_PID.value;
  } else if (lockfilePid) {
    // Second priority: The lockfile is valid and running.
    managedPid = lockfilePid;
  }

  // --- Step 3: Categorize all other running proxies as orphans ---
  const orphanedPids = allRunningProxies
    .filter(p => p.pid !== managedPid)
    .map(p => p.pid);

  // --- Step 4: Log and return the results ---
  if (managedPid) {
    printBanner('[🌳]', `Managed proxy process PID ${managedPid} found`);
  } else {
    printBanner('[⚠️ ]', 'No managed proxy PID available.');
  }

  printBanner('[🧟]', 'Checking for orphaned proxy processes');
  if (orphanedPids.length > 0) {
    console.log(`[⚠️ ] Found ${orphanedPids.length} orphaned proxy process(es):`);
    allRunningProxies
      .filter(p => orphanedPids.includes(p.pid))
      .forEach(p => {
        console.log(`  PID: ${p.pid}, CMD: ${p.cmd}`);
      });
  } else {
    printBanner('[✔️ ]', 'No orphaned proxy processes found.');
  }

  return {
    managedPid,
    orphanedPids,
  };
}

export async function trackBrowserProcessesAndOrphans() {

  await ensureTmpDir();

    let allProcesses = [];
    try {
        allProcesses = await findProcess('name', '');
    } catch (err) {
        console.error(`Error getting all running processes: ${err}`);
        return { managedPids: [], orphanedPids: [] };
    }

    // --- Step 1: Find all browser processes currently running according to psList ---
    const allRunningBrowserProcesses = allProcesses.filter(p =>
        (p.cmd || '').includes(BROWSER_PROFILE_DIR) && p.pid !== process.pid
    );
    const allRunningBrowserPids = new Set(allRunningBrowserProcesses.map(p => p.pid));

    // --- Step 2: Validate lockfiles against actual running processes and collect stale ones ---
    let managedPidFromLockfile = null;
    let managedPidsFromLockfile = [];
    let staleLockfiles = [];

    const lockfiles = (await fs.readdir(TMP_DIR))
        .filter(f => f.startsWith(BROWSER_LOCKFILE_PREFIX));

    for (const file of lockfiles) {
        const fullPath = path.join(TMP_DIR, file);
        try {
            const content = await fs.readFile(fullPath, 'utf8');
            const pidsInLockfile = JSON.parse(content.trim());

            // Check if ANY of the PIDs from the lockfile are actually running
            if (pidsInLockfile.some(pid => isPidRunning(pid))) {
                // This is a valid lockfile pointing to a running process
                if (!managedPidFromLockfile) {
                    // We can only track one managed lockfile at a time
                    managedPidFromLockfile = pidsInLockfile[0];
                    managedPidsFromLockfile = pidsInLockfile;
                }
            } else {
                // This lockfile is stale because none of its PIDs are running
                staleLockfiles.push(fullPath);
            }
        } catch {
            // Unreadable or corrupt lockfile is considered stale
            staleLockfiles.push(fullPath);
        }
    }

    // --- Step 3: Establish the definitive managed PID from a single source of truth ---
    let definitiveManagedPid = null;

    if (BROWSER_PID.value && isPidRunning(BROWSER_PID.value)) {
        definitiveManagedPid = BROWSER_PID.value;
    } else if (managedPidFromLockfile) {
        // Fallback to a PID found in a valid lockfile
        definitiveManagedPid = managedPidFromLockfile;
    }

    // --- Step 4: Categorize all running browser processes from psList ---
    const managedProcesses = [];
    const orphanedProcesses = [];

    if (definitiveManagedPid && managedPidsFromLockfile.length > 0) {
        const managedPidSet = new Set(managedPidsFromLockfile);
        managedProcesses.push(...allRunningBrowserProcesses.filter(p => managedPidSet.has(p.pid)));
        orphanedProcesses.push(...allRunningBrowserProcesses.filter(p => !managedPidSet.has(p.pid)));
    } else {
        // No managed PID was found, so all running browser processes are orphans
        orphanedProcesses.push(...allRunningBrowserProcesses);
    }

    // --- Step 5: Log results, cleanup, and return categorized PIDs ---
    const managedPids = new Set(managedProcesses.map(p => p.pid));
    const orphanedPids = new Set(orphanedProcesses.map(p => p.pid));

    if (managedPids.size > 0) {
        printBanner('[🌳]', `Found ${managedPids.size} managed browser process(es)`);
        console.log(`PIDs: ${Array.from(managedPids).join(', ')}`);
    } else {
        printBanner('[⚠️ ]', 'No managed browser processes found.');
    }

    if (orphanedPids.size > 0) {
        printBanner('[🧟]', `Found ${orphanedPids.size} orphaned browser process(es)`);
        console.log(`PIDs: ${Array.from(orphanedPids).join(', ')}`);
    } else {
        printBanner('[✔️ ]', 'No orphaned browser processes found.');
    }

    if (staleLockfiles.length > 0) {
        console.log(`\n\n[💀] Cleaning up ${staleLockfiles.length} stale lockfile(s)...`);
        for (const file of staleLockfiles) {
            console.log(`- Removing ${file}`);
            try {
                await fs.unlink(file);
            } catch (e) {
                console.error(`Error removing stale lockfile ${file}: ${e}`);
            }
        }
    }

    return {
        managedPids: Array.from(managedPids),
        orphanedPids: Array.from(orphanedPids),
    };
}
