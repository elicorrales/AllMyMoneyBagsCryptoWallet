// wallet-intro-ui-page-included-scripts.js

const scriptList = [
  // External
  { src: "libs/xrpl-latest-min-4.3.0.js" },
  { src: "libs/zxcvbn.js" },
  { src: "libs/zip.min.js" },
  { src: "libs/ethers.umd.min.js" },
  { src: "libs/stellar-sdk.min.js" },
  { src: "libs/argon2-bundled.min.js" },
  { src: "iancoleman/wordlist_english.js" },


  // Core wallet libs
  { src: "wallet-config/wallet-config.js" },
  { src: "wallet-libs/wallet-parent-iframe-comms.js" },
  { src: "wallet-libs/wallet-manager.js" },
  { src: "wallet-libs/wallet-persistence.js" },
  { src: "wallet-libs/wallet-app-state.js" },
  { src: "iancoleman/sjcl-bip39.js" },
  { src: "wallet-libs/wallet-bip39-wrapper.js" },
  { src: "iancoleman/bip39-libs.js" },
  { src: "wallet-libs/wallet-bip39.js" },
  { src: "wallet-libs/wallet-mnemonic-handler.js" },
  { src: "wallet-libs/wallet-sha256.js" },
  { src: "wallet-libs/wallet-core.js" },
  { src: "wallet-libs/wallet-json-utils.js" },

  // Coin-specific libs
  { src: "wallet-libs/wallet-btc-lib.js" },
  { src: "wallet-libs/wallet-eth-lib.js" },
  { src: "wallet-libs/wallet-xrp-lib.js" },
  { src: "wallet-libs/wallet-xlm-lib.js" },
  { src: "wallet-config/wallet-crypto-specifics.js" },
  { src: "wallet-config/wallet-default-token-possibilities.js" },
  { src: "wallet-config/wallet-default-btc-asset-providers.js" },
  { src: "wallet-config/wallet-default-bsc-asset-providers.js" },
  { src: "wallet-config/wallet-default-xlm-asset-providers.js" },
  { src: "wallet-config/wallet-default-eth-asset-providers.js" },
  { src: "wallet-config/wallet-default-xrp-asset-providers.js" },
  { src: "wallet-config/wallet-default-pol-asset-providers.js" },
  { src: "wallet-config/wallet-default-asset-providers.js" },
  { src: "wallet-network-utils/wallet-token-possibilities.js" },
  { src: "wallet-network-utils/wallet-asset-providers.js" },

  // Proxy config + init
  { src: "wallet-proxy-client/wallet-proxy-client-crypt.js" },
  { src: "wallet-proxy-client/wallet-proxy-client-rpc.js" },
  { src: "wallet-proxy-client/wallet-proxy-client.js" },

  // Network utils
  { src: "wallet-network-utils/wallet-erc20-network-utils.js" },
  { src: "wallet-network-utils/wallet-eth-network-utils.js" },
  { src: "wallet-network-utils/wallet-bsc-network-utils.js" },
  { src: "wallet-network-utils/wallet-polygon-network-utils.js" },
  { src: "wallet-network-utils/wallet-solana-network-utils.js" },
  { src: "wallet-network-utils/wallet-polkadot-network-utils.js" },
  { src: "wallet-network-utils/wallet-btc-network-utils.js" },
  { src: "wallet-network-utils/wallet-cardano-network-utils.js" },
  { src: "wallet-network-utils/wallet-electroneum-network-utils.js" },
  { src: "wallet-network-utils/wallet-xrp-network-utils.js" },
  { src: "wallet-network-utils/wallet-xlm-network-utils.js" },
  { src: "wallet-network-utils/wallet-multi-token-utils.js" },
  { src: "wallet-network-utils/wallet-multi-network-utils-send-helper.js" },
  { src: "wallet-network-utils/wallet-multi-network-utils-dapp-helper.js" },
  { src: "wallet-network-utils/wallet-multi-network-utils.js" },


  // Other UI
  { src: "wallet-ui-common-js/wallet-ui-reset.js" },
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

  // UI + App
  { src: "wallet-intro-ui-js/wallet-ui-disclaimer-panel.js" },
  { src: "wallet-intro-ui-js/wallet-ui-new-password-panel.js" },
  { src: "wallet-intro-ui-js/wallet-ui-wallet-choice-panel.js" },
  { src: "wallet-intro-ui-js/wallet-ui-verify-panel.js" },
  { src: "wallet-intro-ui-js/wallet-ui-post-backup-panel.js" },
  { src: "wallet-main-ui-js/wallet-main-ui-dapp-controller.js" },
  { src: "wallet-main-ui-js/wallet-main-ui-dapp-msg-handler-helper.js" },
  { src: "wallet-main-ui-js/wallet-main-ui-dapp-msg-handler.js" },
  { src: "wallet-main-ui-js/wallet-main-ui-password-panel.js" },
  { src: "wallet-main-ui-js/wallet-main-ui-stablecoin-detail.js" },
  { src: "wallet-main-ui-js/wallet-main-ui-token-detail.js" },
  { src: "wallet-main-ui-js/wallet-main-ui-crypto-detail.js" },
  //{ src: "wallet-main-ui-js/wallet-main-ui-dapp-handling-panel.js" },
  { src: "wallet-new-select-ui-js/wallet-new-select-ui-password-panel.js" },

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
  { src: "SimpleWebPageCryptoWallet-intro.js"}

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

  //console.log("\n\nWallet Intro Page - Completed Loading Scripts\n\n");
}

loadScriptsSequentially(scriptList).catch(console.error);


