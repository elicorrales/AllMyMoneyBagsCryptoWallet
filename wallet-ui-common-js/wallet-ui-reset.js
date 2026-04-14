const WalletUiReset = (function () {
  let _initialized = false;

  // Shared modal setup helper (re-uses the same resetOverlayModal)
  function setupResetModal({ message, details, onConfirm }) {
    const overlay = document.getElementById('resetOverlayModal');
    const cancelBtn = document.getElementById('resetCancelBtn');
    const resetConfirmBtn = document.getElementById('resetConfirmBtn');
    const titleEl = overlay.querySelector('h3');
    const detailsEl = overlay.querySelector('p');
    const itemsList = document.getElementById('resetItemsList');

    if (!overlay || !cancelBtn || !resetConfirmBtn) return;

    // Update modal text for the current scenario
    if (titleEl) titleEl.textContent = message || 'Confirm Reset?';
    if (detailsEl) detailsEl.textContent = details || '';

    cancelBtn.onclick = () => {
      overlay.classList.add('hidden');
    };

    resetConfirmBtn.onclick = async () => {
      overlay.classList.add('hidden');
      try {
        await WalletBusyModal.show("Resetting... Please wait...");
        await onConfirm();
        await WalletBusyModal.hide();
        WalletPageLevelUiStatusLines.clearStatus();
      } catch (err) {
        await WalletBusyModal.hide();
        let details = err.message || String(err);
        WalletInfoModal.show({
          message: `❌ Error ${message}`,
          details
        });
        if (err?.result?.isStatusLines) {
          WalletPageLevelUiStatusLines.updateStatus(err.result.statusLines);
        } else {
          // Full error in status for debugging
          WalletPageLevelUiStatusLines.updateStatus([`❌ ${err}`]);
        }
      }
    };

    // Ensure list can be cleared/overwritten per usage
    if (itemsList) itemsList.innerHTML = '';

    overlay.classList.remove('hidden');
  }

  async function resetWalletState() {
    const tempInitKey = WalletPersistence.proxyInitialSecret;
    const tempPort = WalletPersistence.proxyPort;
    const tempSecret = WalletPersistence.proxySecret;

    WalletAppState.clearAll();
    WalletPersistence.clearAll();

    await new Promise(resolve => setTimeout(resolve, 500));

    const verify = WalletPersistence.getState();
    console.debug("Post-clear WalletPersistence state:", verify);

    // Send same close-all message as big X
    window.parent.postMessage({
      from: 'wallet-to-background',
      type: 'WALLET_CLOSE_ALL'
    }, '*');

/*
    try {
      await WalletProxyClient.shutdownProxy(tempPort, tempSecret, tempInitKey);
    } catch (err) {
      console.warn("Proxy shutdown failed:", err);
    }
*/

    WalletUiPanel.show('SimpleWebPageCryptoWallet-app-closed.html');
  }

  function renderResetItemsList() {
    console.trace('renderResetItemsList called');
    const state = window.getAppState();
    const defaults = {
      password: null,
      passwordVisible: false,
      lastPasswordScore: 0,
      generatedSeed: null,
      userProvidedSeed: null,
      networks: window.defaultNetworks,
      derivedAddresses: {},
      proxyPort: null,
      proxySecret: null
    };

    const stateItems = Object.keys(state)
      .filter(k => {
        const val = state[k];
        const def = defaults[k];
        if (typeof val === 'object' && typeof def === 'object') {
          return JSON.stringify(val) !== JSON.stringify(def);
        }
        return val !== def;
      });

    const storageItems = WalletPersistence.keys().filter(key => {
      const v = WalletPersistence.get(key);
      return v !== null && v !== 'null';
    });

    // Compose combined list
    const combined = [];
    if (stateItems.length) {
      combined.push(...stateItems.map(k => `Memory: ${k}`));
    }
    if (storageItems.length) {
      combined.push(...storageItems.map(k => `Storage: ${k}`));
    }
    if (combined.length === 0) {
      combined.push('Nothing — no data to clear.');
    }

    // Render into the modal
    const ul = document.createElement('ul');
    combined.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      ul.appendChild(li);
    });

    const itemsList = document.getElementById('resetItemsList');
    if (itemsList) {
      itemsList.innerHTML = '';
      itemsList.appendChild(ul);
    }

    // Setup modal wiring for the wallet reset
    setupResetModal({
      message: 'Reset Wallet?',
      details: 'This will erase all data stored in your browser. Are you sure?',
      onConfirm: resetWalletState
    });
  }

  function deleteAllAssetProviders() {

    // Setup modal wiring for deleting asset providers
    setupResetModal({
      message: 'Delete Asset Providers?',
      details: 'This will remove all saved asset providers. Continue?',
      onConfirm: async () => {
        WalletPersistence.assetProviders = {};
        console.debug('deleteAllAssetProviders confirmed');
      }
    });
  }

  function deleteAllDerivedAddresses() {

    // Setup modal wiring for deleting derived addresses
    setupResetModal({
      message: 'Delete Addresses?',
      details: 'This will remove all saved addresses. Continue?',
      onConfirm: async () => {
        WalletPersistence.walletManager.activeWallet.derivedAddresses = {};
        console.debug('deleteAllDerivedAddresses confirmed');
      }
    });
  }

  function deleteAllDerivedTokens() {

    // Setup modal wiring for deleting derived tokens
    setupResetModal({
      message: 'Delete Tokens?',
      details: 'This will remove all saved tokens. Continue?',
      onConfirm: async () => {
        WalletPersistence.walletManager.activeWallet.derivedTokens = {};
        WalletPersistence.tokenPossibilities = {};
        console.debug('deleteAllDerivedTokens confirmed');
      }
    });
  }


  function updateAllProvidersAssetsTokensStable() {

    setupResetModal({
      message: 'Update Provs,Assets,Tokens,Stable?',
      details: 'This will update all. Continue?',
      onConfirm: async () => {
        console.debug('updateAllProvidersNativeAssetsTokensStableCoins confirmed');
        const wallet = WalletPersistence.walletManager.activeWallet;
        await WalletMultiNetworkUtils.updateAllAddressesTokensStableCoinsAssetProviders(wallet);
      }
    });
  }



  function onDomReady(cb) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", cb);
    } else {
      cb();
    }
  }

  onDomReady(() => {
    if (_initialized) return;
    _initialized = true;
    // No other wiring needed at DOM ready
  });

  return {
    renderResetItemsList,
    deleteAllAssetProviders,
    deleteAllDerivedAddresses,
    deleteAllDerivedTokens,
    updateAllProvidersAssetsTokensStable,
  };
})();

