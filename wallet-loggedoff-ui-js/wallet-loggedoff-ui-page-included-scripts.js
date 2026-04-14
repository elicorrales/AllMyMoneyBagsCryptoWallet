//wallet-loggedoff-ui-js/wallet-loggedoff-ui-page-included-scripts.js

const scriptList = [
  // External
  { src: "iancoleman/wordlist_english.js" },
  { src: "libs/argon2-bundled.min.js" },

  // Core wallet libs
  { src: "wallet-config/wallet-config.js" },
  { src: "wallet-libs/wallet-parent-iframe-comms.js" },
  { src: "wallet-libs/wallet-core.js" },
  { src: "wallet-libs/wallet-manager.js" },
  { src: "wallet-libs/wallet-persistence.js" },

  { src: "wallet-libs/wallet-app-state.js" },

  // Proxy config + init
  { src: "wallet-proxy-client/wallet-proxy-client-crypt.js" },
  { src: "wallet-proxy-client/wallet-proxy-client-rpc.js" },
  { src: "wallet-proxy-client/wallet-proxy-client.js" },

  { src: "wallet-ui-common-js/wallet-ui-panels.js" },
  { src: "wallet-ui-common-js/wallet-ui-info-modal-dialog.js" },
  { src: "wallet-ui-common-js/wallet-ui-busy-modal-dialog.js" },
  { src: "wallet-ui-common-js/wallet-ui-yes-or-no-action-modal.js" },
  { src: "wallet-ui-common-js/wallet-ui-provider-stats.js" },
  { src: "wallet-ui-common-js/wallet-ui-page-level-ui-maintenance-listeners.js" },
  { src: "wallet-ui-common-js/wallet-ui-page-level-ui-dapp-layout-shrinker.js" },
  { src: "wallet-ui-common-js/wallet-ui-page-level-ui-back-arrow.js" },
  { src: "wallet-ui-common-js/wallet-ui-page-level-ui-status-lines.js" },
  { src: "wallet-ui-common-js/wallet-ui-page-level-ui.js" },
  { src: "wallet-main-ui-js/wallet-main-ui-dapp-controller.js" },

  //================================================================
  // making sure these following scripts ONLY load, not execute.
  // execution will be handled by script named after page.
  //================================================================

  //-----------------------------------------------------------------
  // this insures that user can not use typical browser elements
  //-----------------------------------------------------------------
  { src: "wallet-ui-common-js/wallet-browser-lockdown.js" },

  //-----------------------------------------------------------------
  // this insures that webpage was launched by lifecycle manager
  // and not by user.
  // this off chance could pass if user adds query to url
  // and thus it remains in localstorage and other pages
  // will also pass
  //-----------------------------------------------------------------
  { src: "wallet-libs/wallet-launched-by-script-check.js" },

  //-----------------------------------------------------------------
  // load initial dynamic secret, only 1 time during a session
  // this should fail on any page except logged off page
  // but it is a good script to have on all page TO MAKE THEM FAIL.
  //-----------------------------------------------------------------
  { src: "wallet-libs/wallet-get-initial-secret.js" },

  //-----------------------------------------------------------------
  // things like ensure proxy session
  // load,unload page on close
  //-----------------------------------------------------------------
  { src: "wallet-ui-common-js/wallet-ui-pages-init.js" },

  //================================================================
  // this script should invoke the critical functions in above
  // important scripts.
  //================================================================
  { src: "SimpleWebPageCryptoWallet-loggedoff.js" }

];

async function loadScriptsSequentially(scripts) {
  for (let i = 0; i < scripts.length - 1; i++) {
    const { src, defer } = scripts[i];
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      if (defer) s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(s);
    });
  }
  console.log("Core scripts loaded.");

  // Load the final script last
  const lastScript = scripts[scripts.length - 1];
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = lastScript.src;
    if (lastScript.defer) s.defer = true;
    s.onload = () => {
      console.log(`Final script loaded: ${lastScript.src}`);
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load script: ${lastScript.src}`));
    document.body.appendChild(s);
  });

  //console.log("\n\nWalletLoggedOff Page - Completed Loading Scripts\n\n");
}

loadScriptsSequentially(scriptList).catch(console.error);


