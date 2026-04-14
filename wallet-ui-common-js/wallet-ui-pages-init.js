// wallet-ui-pages-init.js
// —————————————————————————————————————————————————————————————————————————————
const WalletUiPagesInit = (function () {

  //////////////////////////////////////////////////////////////////
  //a lot of these functions are what force browser to work
  // with a proxy AND also with the life-cycle manager node script
  // and prevent launching by user in normal browser.
  //////////////////////////////////////////////////////////////////
  async function initializeWebPage() {

    if (globalThis.RUN_PROXYLESS_FOR_DEBUG === true) return; // do nothing with proxy

    WalletBrowserLockDown.lockItDown();

    await WalletUiPagesInit.pageLoadAndUnloadEventListener();

    await WalletLaunchCheck.checkIfOfficialLaunch();

    await WalletGetInitialSecret.getInitialSecret();

    if (!await WalletUiPagesInit.initProxySession()) return;

    const fireAndForgetBody = {
        from: 'wallet',
        secret: WalletPersistence.proxySecret
    };

    await WalletClientCrypt.precompute(fireAndForgetBody, WalletPersistence.proxyInitialSecret);

    sendProxyInfoToParent();


    //if (!SimpleWebPageCryptoWalletNewOrSelect.checkSessionTimeout()) return;
  }

  function whatPageOrPanelToShow() {
    if (WalletPersistence.cameFromThisPage === 'SimpleWebPageCryptoWallet-loggedoff.html') {
      WalletUiPanel.show('SimpleWebPageCryptoWallet-new-or-select.html');
    }

    if (window.location.pathname.includes('SimpleWebPageCryptoWallet-new-or-select.html')) {
      //console.log('Already on new-or-select-page — waiting on user.');
      return;
    }
  }

  async function initProxySession() {
    try {
      const { proxyUrl, proxyPort, proxySecret } = await WalletProxyClient.ensureProxySession();
      //console.log('Using proxy session:', proxyUrl, ':', proxyPort);
      WalletPersistence.proxyUrl = proxyUrl;
      WalletPersistence.proxyPort = proxyPort;
      WalletPersistence.proxySecret = proxySecret;
      return true;
    } catch (e) {
      console.warn('Proxy init failed:', e);
      const message = 'Unable to connect to local wallet crypto network server.\nRefresh page. If problem persists,\nsee support';
      const details = `Technical details: ${e.message}`;
      WalletInfoModal.show({
        message,
        details,
        onClose: () => WalletUiPanel.show('SimpleWebPageCryptoWallet-app-closed.html')
      });
      return false;
    }
  }

  function pageLoadAndUnloadEventListener() {
    // —————————————————————————————————————————————————————————————
    // Attempt to alert to a shutdown local proxy session
    // If we execute this event, the page IS closing, no matter
    // what else happens.
    // This event can fire either because user hit "x" to close,
    // Or because WalletUiPanel.show() is setting a new page, and
    // the old page is closing.
    // 1 - if user hits "x", we want to send the fire n forget to proxy
    // 2 - it it was due to page change, we DONT want to stop proxy
    // —————————————————————————————————————————————————————————————
    window.addEventListener('beforeunload', () => {
      //CASE 1 - User hits "x" to close
      if (!WalletUiPanel.isShowNewPage()) {
        try {
          //WalletProxyClient.fireAndForgetAlert();
          //we need to set this because otherwise
          WalletUiPanel.setIsShowNewPage();
        } catch (e) {
          console.warn('Could not notify proxy of unload:', e);
        }
      }

      //CASE 2 - a new page was shown, no need to stop proxy
      // but we have to clear the flag so that for next page,
      // if user DOES close it it stops the proxy (CASE 1 above)
      WalletUiPanel.clearIsShowNewPage();
    });
  }



  function sendProxyInfoToParent() {
    if (!window.parent || window.parent === window) return; // no parent

    const info = {
      proxyInitialSecret: WalletPersistence.proxyInitialSecret,
      proxyPort:          WalletPersistence.proxyPort,
      proxySecret:        WalletPersistence.proxySecret,
      proxyUrl:           WalletPersistence.proxyUrl
    };

    window.parent.postMessage({ type: 'proxyInfoResponse', payload: info }, '*');
  }


  let _initialized = false;
  function initOnceDomReady() {
    if (_initialized) return;
    _initialized = true;
  }

  function onDomReady(cb) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", cb);
    } else {
      cb();
    }
  }

  onDomReady(initOnceDomReady);

  return {
    initializeWebPage,
    initProxySession,
    pageLoadAndUnloadEventListener,
    sendProxyInfoToParent,
    initOnceDomReady
  };
})();

