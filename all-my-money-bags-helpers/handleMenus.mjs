import readline from 'readline';

import {
  PROXY_PID,
  BROWSER_PID,
  monitorInterval
} from './constants.mjs';

import { timestamp, ensureTmpDir, printBanner, isPidRunning, gracefulShutdown, cleanUpAll } from './commonFunctions.mjs';

import {
  spawnProxyAndVerify,
  spawnBrowserAndVerify,
  startNormalProxyAndBrowserOperation
} from './handleSpawn.mjs';

import {
  trackProxyProcessAndOrphans, trackBrowserProcessesAndOrphans
} from './handleTracking.mjs';


import {
  terminateManagedProxyAndWait,
  terminateOrphanedProxiesAndWait,
  terminateManagedBrowsersAndWait,
  terminateOrphanBrowsersAndWait,
  stopNormalProxyAndBrowserOperation
} from './handleTermination.mjs';

import { deleteSecretFilesForced } from './handleSecrecy.mjs';

// === NEW IMPORT FOR SYMLINK CLEANUP ===
import { removeWalletConfigSymlink } from './handleConfigSymlink.mjs';

export const monitoringPaused = { value: true }; // Start in paused state

let rl;

export async function quitScript() {
  printBanner('[❌]', 'Quitting script...');
  stopMonitorLoop(); // Stop monitoring before quitting
  // Ensure the readline interface is closed
  if (rl) {
      rl.close();
      rl = null;
  }

  console.log('[DEBUG] Calling cleanUpAll() before exit');
  await cleanUpAll();

  // === NEW: remove symlink safely at the very end ===
  removeWalletConfigSymlink();

  gracefulShutdown(0);
}

export async function handleCommand(cmd) {
  const key = cmd.trim().toLowerCase();

  try {
    switch (key) {
      case '0':
        console.log('\n[🟢] Starting Proxy...\n');
        PROXY_PID.value = await spawnProxyAndVerify();
        break;
      case '1':
        console.log('\n[🟢] Starting Browser...\n');
        await spawnBrowserAndVerify();
        break;
      case '2':
        console.log('\n[📡] Tracking proxy processes...\n');
        await trackProxyProcessAndOrphans();
        break;
      case '3':
        console.log('\n[📡] Tracking browser processes...\n');
        await trackBrowserProcessesAndOrphans();
        break;
      case '4':
        console.log('\n[🛑] Stopping proxy processes...\n');
        await terminateOrphanedProxiesAndWait();
        await terminateManagedProxyAndWait();
        break;
      case '5':
        console.log('\n[🔥] Killing browser processes...\n');
        await terminateOrphanBrowsersAndWait();
        await terminateManagedBrowsersAndWait();
        break;
      case '6':
        console.log('\n[🔥] Start Normal Proxy & Browser Operation...\n');
        await startNormalProxyAndBrowserOperation();
        break;
      case '7':
        console.log('\n[🛑] Stop Normal Proxy & Browser Operation...\n');
        await stopNormalProxyAndBrowserOperation();
        break;
      case 'r':
        console.log('\n[▶️ ] Start Or Resume Monitoring\n');
        monitoringPaused.value = false;
        startMonitorLoop();
        // Hide the menu and disable the prompt
        rl.setPrompt('');
        rl.prompt();
        break;
      case 'q':
        console.log('\n[❌] Quitting script...\n');
        await quitScript();
        break;
      default:
        console.log('[⚠️] Unknown command, press r to resume, q to quit.');
        break;
    }
  } catch (err) {
    if (err.message.includes('Refusing')) {
      printBanner('[❌]', err);
    } else {
      printBanner('[❌]', err.stack);
    }
  }
}

function justTheActualMenu() {
  // This function remains the same
  const borderColor = '\x1b[96m';
  const textColor = '\x1b[97m';
  const reset = '\x1b[0m';
  console.log(`\n\n`);
  console.log(`${timestamp()}⏸️ ${borderColor}╔════════════════════════════════════════╗${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║${textColor}          Welcome to the Wallet! ${borderColor}       ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║${textColor}  Press <ESC> anytime for this menu${borderColor}     ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}╠════════════════════════════════════════╣${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║${textColor} Commands you can use:                 ${borderColor} ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║                                        ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║${textColor}  0 - Start Proxy                      ${borderColor} ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║${textColor}  1 - Start Browser                    ${borderColor} ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║                                        ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║${textColor}  2 - Track proxy  processes           ${borderColor} ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║${textColor}  3 - Track browser processes          ${borderColor} ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║                                        ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║${textColor}  4 - Stop  proxy  processes           ${borderColor} ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║${textColor}  5 - Kill  browser processes          ${borderColor} ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║                                        ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║${textColor}  6 - Start Normal Proxy & Browser Oper${borderColor} ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║${textColor}  7 - Stop  Normal Proxy & Browser Oper${borderColor} ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║                                        ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║${textColor}  r - Start Or Resume Monitor (live)   ${borderColor} ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║                                        ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║${textColor}  q - Quit script                      ${borderColor} ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║                                        ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}║${textColor} Monitoring is paused until you resume.${borderColor} ║${reset}`);
  console.log(`${timestamp()}⏸️ ${borderColor}╚════════════════════════════════════════╝${reset}`);
}

function showMenu() {
  justTheActualMenu();
  if (rl) {
    rl.setPrompt('> ');
    rl.prompt();
  }
}

function stopMonitorLoop() {
  monitoringPaused.value = true;
  if (monitorInterval.value) {
    clearInterval(monitorInterval.value);
    monitorInterval.value = null;
  }
}

export function setupKeyListener() {
  // Use a single readline interface
  if (rl) {
    // Clean up existing interface if it was already created
    rl.close();
  }

  // Set up the readline interface for line-based input
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });

  // Handle SIGINT from the readline interface
  rl.on('SIGINT', () => {
    // This code will run when Ctrl+C is pressed
    console.log(`\n\n${timestamp()} [🔌] SIGINT ignored.`);
    console.log(`${timestamp()} [🔌] To quit, select to 'q'<ENTER>.\n\n`);
    // You can choose to re-display the menu, prompt again, or do nothing.
    // For now, let's just re-prompt without the 'close' event firing.
    if (monitoringPaused.value) {
      rl.prompt();
    } else {
      // In monitoring mode, you might want to pause and show the menu
      printBanner('[⏸️]', 'Monitoring paused. Displaying menu...');
      monitoringPaused.value = true;
      stopMonitorLoop();
      showMenu();
    }
  });

  // Handle line-based commands
  rl.on('line', async (line) => {
    // If monitoring is active, ignore line input
    if (!monitoringPaused.value) {
      return;
    }

    const key = line.trim().toLowerCase();

    if (key === 'r') {
      await handleCommand(key);
    } else if (key === 'q') {
      await quitScript();
    } else {
      await handleCommand(key);
      showMenu();
    }
  });

  rl.on('close', () => {
    console.log('Readline interface closed.');
  });

  // Set up keypress events for Ctrl+M and ESC
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.on('keypress', (_, key) => {
    // Check if the readline interface is still active
    if (!rl || rl.closed) return;

    // Pause monitoring and show menu on Ctrl+M or ESC
    if (key && !monitoringPaused.value && key.name === 'escape') {
      printBanner('[⏸️]', 'Monitoring paused. Displaying menu...');
      monitoringPaused.value = true;
      stopMonitorLoop();
      showMenu();
    }
  });

  // Start with the menu
  showMenu();
}

export async function startMonitorLoop(isDebugMenuMode = true) {
  if (monitorInterval.value) return;

  monitorInterval.value = setInterval(async () => {
    if (monitoringPaused.value) return;

    const proxyAlive = isPidRunning(PROXY_PID.value);
    if (!proxyAlive) console.error(`[🛑] Proxy PID ${PROXY_PID.value} stopped.`);
    const browserAlive = isPidRunning(BROWSER_PID.value);
    if (!browserAlive) console.error(`[🛑] Browser PID ${BROWSER_PID.value} stopped.`);

    if (!proxyAlive || !browserAlive) {

      if (isDebugMenuMode) {

        stopMonitorLoop();
        printBanner('[💥]', 'Processes not running or died. Monitoring paused.');
        showMenu();

      } else {

        //we are in normal operation; no menu, just cleanup and quit.
        console.log(`${timestamp()} [💥] One or both processes not running or died.`);
        printBanner('[💥]', 'Processes not running or died.');
        quitScript();
      }
    }
  }, 1000);
}


