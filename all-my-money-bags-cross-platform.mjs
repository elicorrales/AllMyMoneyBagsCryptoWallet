// all-my-money-bags-cross-platform.mjs
import { checkNodeVersionOrExit } from './all-my-money-bags-helpers/handleFindSuitableNodeJs.mjs';
import { findSuitableBrowser } from './all-my-money-bags-helpers/handleFindSuitableBrowser.mjs';

import { timestamp, ensureTmpDir, gracefulShutdown, cleanUpAll } from './all-my-money-bags-helpers/commonFunctions.mjs';
import {
  setupKeyListener,
  monitoringPaused,
  startMonitorLoop
} from './all-my-money-bags-helpers/handleMenus.mjs';
import { startNormalProxyAndBrowserOperation } from './all-my-money-bags-helpers/handleSpawn.mjs';
import { deleteSecretFilesForced } from './all-my-money-bags-helpers/handleSecrecy.mjs';

// === SYMLINK HANDLER IMPORT ===
import { ensureWalletConfigSymlink, removeWalletConfigSymlink }
  from './all-my-money-bags-helpers/handleConfigSymlink.mjs';

await checkNodeVersionOrExit();
await findSuitableBrowser();
await cleanUpAll();


///////////////////////////////////////////////////////////
// with no cmdline '--debug' param, we are in normal mode.
// NO key listener, no Menu, goes right into starting up
// proxy and browser and monitoring.
///////////////////////////////////////////////////////////
let isMenuDebugMode = false;
monitoringPaused.value = false;


///////////////////////////////////////////////////////////
// Check for the '--debug' command-line parameter
// In debug mode, there is a menu, and it does NOT do
// anything on its own - everything is controlled by
// the menu
///////////////////////////////////////////////////////////
if (process.argv.includes('--debug')) {
  monitoringPaused.value = true;
  isMenuDebugMode = true;
  console.log(`${timestamp()} [⚙️ ] Script is running in menu debug mode.`);
}


///////////////////////////////////////////////////////////
//the Node.js key handling code also has its own SIGINT handler
//but that will not be set up if this script is running normally
//(not isMenuDebugMode). So we will leave this handler set.
///////////////////////////////////////////////////////////
process.on('SIGINT', () => {
  console.log(`\n\n${timestamp()} [🔌] SIGINT ignored.`);
  console.log(`${timestamp()} [🔌] To quit, if shown Menu, select to 'q'<ENTER>.`);
  console.log(`${timestamp()} [🔌] Or, if Browser running, just close Browser window(click the [x]).`);
});

process.on('SIGTERM', () => {
  console.log(`${timestamp()} [🔌] SIGTERM received.`);
  gracefulShutdown(143);
});


async function main() {

  // remove old symlink first, in case previous run didn't clean up
  removeWalletConfigSymlink();

  if (isMenuDebugMode) {
    setupKeyListener();
  } else {

    //this is normal script-operation. no menu. just runs the wallet app.
    //(proxy + browser)
    try {
      // create symlink so background.js can read wallet-extension-config.json
      ensureWalletConfigSymlink();

      // === NORMAL OPERATION ===
      await startNormalProxyAndBrowserOperation();
      // in debug mode, if one or more children stop,
      // the monitor won't stop and won't quit script,
      // but in normal mode, it will stop all children and quit script.
      await startMonitorLoop(isMenuDebugMode);


    } catch (err) {
      console.log(`${timestamp()} [❌] Error attempting to start normal operation while monitoring:${err}.`);
    }
  }
}

main();

