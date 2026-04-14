import fs from 'fs/promises';
import path from 'path';
import { timestamp } from './originsAndCorsHeaders.mjs';
import { TMP_DIR } from '../all-my-money-bags-helpers/constants.mjs';

const LOCKFILE_PATH = path.join(TMP_DIR, 'all-my-money-bags-proxy.lock');
let cleanupDone = false;

async function cleanup() {
  if (cleanupDone) return;
  cleanupDone = true;

  try {
    const content = (await fs.readFile(LOCKFILE_PATH, 'utf8')).trim();
    if (content === `${process.pid}`) {
      await fs.unlink(LOCKFILE_PATH);
      console.log(`Lockfile removed by PID ${process.pid}`);
    }
  } catch {
    // ignore if file doesn't exist or can't be read
  }
}

export async function shutdown() {
  await cleanup();
  console.log('Proxy shutting down now.');
  process.exit(0);
}

export async function checkAndSetProxyLock() {
  try {
    const content = (await fs.readFile(LOCKFILE_PATH, 'utf8')).trim();
    try {
      process.kill(parseInt(content), 0);
      console.error(`Another proxy instance is already running (PID ${content}). Exiting.`);
      await shutdown();
    } catch {
      await fs.unlink(LOCKFILE_PATH); // stale
    }
  } catch {
    // lockfile doesn't exist or can't be read
  }

  await fs.writeFile(LOCKFILE_PATH, `${process.pid}`);
}

export async function verifyContinuedOwnershipOfProxyLock() {
  try {
    const content = (await fs.readFile(LOCKFILE_PATH, 'utf8')).trim();
    if (content !== `${process.pid}`) {
      console.error(`Lockfile PID mismatch: expected ${process.pid}, found ${content}. Exiting.`);
      await shutdown();
    }
  } catch {
    console.error('Proxy lockfile is missing or unreadable. Exiting.');
    await shutdown();
  }
}

