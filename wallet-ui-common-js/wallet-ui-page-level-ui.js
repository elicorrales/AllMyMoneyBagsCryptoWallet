// wallet-main-ui-page-level-ui.js

const WalletPageLevelUI = (function () {

  const MISSING_EXTENSION_TIME = 60000;//60 sec
  let _initialized = false;
  let _userHitEscKey = false;
  let _missingExtensionTimer = null;

  function startPossibleMissingExtensionTimer() {
    clearPossibleMissingExtensionTimer(); // just in case
    _missingExtensionTimer = setTimeout(() => {
      WalletInfoModal.show({
        message: '⚠️ No Wallet Extension Detected!',
        details: 'Extension is required if doing anything DeFi.'
      });
    }, MISSING_EXTENSION_TIME);
  }

  function clearPossibleMissingExtensionTimer() {
    if (_missingExtensionTimer) {
      clearTimeout(_missingExtensionTimer);
      _missingExtensionTimer = null;
    }
  }


  function toggleHamburgerVisibility(show) {
    const hamburgerWrapper = document.getElementById('hamburgerMenuWrapper');
    if (hamburgerWrapper) {
      hamburgerWrapper.style.display = show ? 'block' : 'none';
    }
  }

  function updatePageLevelUI(isLoggedIn) {
    const walletStatusBox = document.getElementById('walletStatus')?.parentElement;
    const hamburgerMenu = document.getElementById('hamburgerMenuWrapper');
    const dappStatusWrapper = document.getElementById('dappStatusWrapper');

    // Normal block toggles
    [walletStatusBox, hamburgerMenu].forEach(el => {
      if (el) el.style.display = isLoggedIn ? 'block' : 'none';
    });

    // Flex toggle specifically for dappStatusWrapper
    if (dappStatusWrapper) {
      dappStatusWrapper.style.display = isLoggedIn ? 'flex' : 'none';
    }
  }

  async function shutdownProxy() {
    const tempInitKey = WalletPersistence.proxyInitialSecret;
    const tempPort = WalletPersistence.proxyPort;
    const tempSecret = WalletPersistence.proxySecret;

    try {
      await WalletProxyClient.shutdownProxy(tempPort, tempSecret, tempInitKey);
      WalletUiPanel.show('SimpleWebPageCryptoWallet-app-closed.html');
    } catch (err) {
      console.warn("Proxy shutdown failed:", err);
      WalletInfoModal.show({
        message: `Proxy shutdown error: ${err}`,
        redirectTo: 'SimpleWebPageCryptoWallet-app-closed.html'
      });
    }
  }


  function initOnceDomReady() {
    if (_initialized) return;
    _initialized = true;

    const hamburgerMenuBtn = document.getElementById('hamburgerMenuBtn');
    const menu = document.getElementById('networkMenu');


    if (hamburgerMenuBtn && menu) {
      // Toggle menu visibility
      hamburgerMenuBtn.addEventListener('click', () => {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
      });

      // Hide menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!hamburgerMenuBtn.contains(e.target) && !menu.contains(e.target)) {
          menu.style.display = 'none';
        }
      });
    }

    const closeAppBtn = document.getElementById('closeAppButton');
    closeAppBtn.addEventListener('click', () => {
    //console.log('\n\nClose App button clicked, showing modal...\n\n');

      //we need to change this feature into closing the browser window
      // but also alerting the local running proxy
      //but we want to show a YesOrNoActionModal and link those functions to the YES button click

      WalletYesOrNoAction.showModal({
        message: "Are you sure You want to Close?",
        details: "",
        negative: "Cancel",
        positive: "Yes",
        onNegative: () => {
          console.log("CloseAppButton: User canceled");
        },
        onPositive: async () => {
          console.log("CloseAppButton: User confirmed");

          //extension(background)(service worker) might have fallen asleep, so the close message
          const lastTimeReceivedMessage = WalletUiDappController.getLastTimeReceivedMessage();
          // will be missed.  we need to make sure it wakes up first.
          if (Date.now() - lastTimeReceivedMessage > 3000) {
            await WalletBusyModal.show('Please Wait...');
            window.parent.postMessage({
              from: 'wallet-to-background',
              type: 'WALLET_CLOSE_ALL'
            }, '*');

            // wait 500ms before continuing
            await new Promise(resolve => setTimeout(resolve, 500));
            WalletBusyModal.hide();
          }

          //if we got to here, service worker missed the first close app request,
          // hopefully service worker is awake and ready for close message.
          window.parent.postMessage({
            from: 'wallet-to-background',
            type: 'WALLET_CLOSE_ALL'
          }, '*');
        }
      });
    });

    WalletPageLevelUiDappLayoutShrinker.refresh();

  }

  function initializeUserEscKey() {
    _userHitEscKey = false;
    function escHandler(e) {
      if (e.key === "Escape") {
        _userHitEscKey = true;
        document.removeEventListener('keydown', escHandler);
      }
    }
    document.addEventListener('keydown', escHandler);
  }

  function didUserHitEscKey() {
    return _userHitEscKey;
  }

  function onDomReady(cb) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', cb);
    } else {
      cb();
    }
  }

  onDomReady(initOnceDomReady);

  return {
    startPossibleMissingExtensionTimer,
    clearPossibleMissingExtensionTimer,
    toggleHamburgerVisibility,
    updatePageLevelUI,
    shutdownProxy,
    initializeUserEscKey,
    didUserHitEscKey,
    refreshShrinkState: WalletPageLevelUiDappLayoutShrinker.refresh,
  };
})();

