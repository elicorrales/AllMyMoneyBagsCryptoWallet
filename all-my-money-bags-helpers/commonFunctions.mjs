// all-my-money-bags-helpers/commonFunctions.mjs
import fs from 'fs/promises';

import { TMP_DIR, BROWSER_LOCKFILE_PATH } from './constants.mjs';

import {
  terminateManagedProxyAndWait,
  terminateOrphanedProxiesAndWait,
  terminateManagedBrowsersAndWait,
  terminateOrphanBrowsersAndWait,
  stopNormalProxyAndBrowserOperation
} from './handleTermination.mjs';

import { deleteSecretFilesForced } from './handleSecrecy.mjs';

export async function ensureTmpDir() {
  console.warn(`\n\n⚠️ Creating if needed TMP_DIR: ${TMP_DIR}\n\n`);
  try {
    console.log(`[DEBUG] About to mkdir ${TMP_DIR}`);
    await fs.mkdir(TMP_DIR, { recursive: true });
    console.log(`[DEBUG] mkdir succeeded for ${TMP_DIR}`);
  } catch (err) {
    console.warn(`⚠️ Could not ensure TMP_DIR: ${TMP_DIR}`);
    console.error(`[DEBUG] mkdir error:`, err);
  }
}



export function timestamp() {
  return `[${new Date().toISOString().replace('T', ' ').substring(0, 19)}]`;
}

export function printBanner(icon, message, color = '\x1b[36m') {
  const borderColor = '\x1b[96m';
  const textColor = '\x1b[97m';
  const reset = '\x1b[0m';
  const padded = `  ${message}  `;
  const line = '═'.repeat(padded.length);
  console.log(`\n${timestamp()} ${icon} ${color}╔${line}╗${reset}`);
  console.log(`${timestamp()} ${icon} ${color}║${textColor}${padded}${color}║${reset}`);
  console.log(`${timestamp()} ${icon} ${color}╚${line}╝${reset}\n`);
}

export function gracefulShutdown(code = 1) {
  console.log(`\n${timestamp()} [🧼] Cleaning up...`);
  process.exit(code);
}

export function isPidRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function getBrowserLockfilePath(pid) {
  return `${BROWSER_LOCKFILE_PATH}${pid}`;
}

export async function cleanUpAll() {
  try {
    await terminateManagedProxyAndWait();
    await terminateOrphanedProxiesAndWait();
    await terminateManagedBrowsersAndWait();
    await terminateOrphanBrowsersAndWait();
    await deleteSecretFilesForced();
  } catch (err) {
    printBanner('[❌]', `Error during cleanUpAll:${err}`);
  }
}
