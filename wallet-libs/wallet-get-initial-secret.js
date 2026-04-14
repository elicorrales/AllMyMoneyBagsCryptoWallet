// wallet-libs/wallet-get-initial-secret.js

const WalletGetInitialSecret = (function () {
  let _initialized = false;


  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(s);
    });
  }

  async function getInitialSecret() {

    //-----------------------------------------------------
    // either have to be at correct page, OR
    // the initial secret has already been retrieved
    //-----------------------------------------------------
    if (!window.location.pathname.includes('SimpleWebPageCryptoWallet-loggedoff.html')) {
      if (WalletPersistence.proxyInitialSecret === null ||
        WalletPersistence.proxyInitialSecret === '') {
          throw new Error('This page not allowed.');

      } else {
        //Wrong page but we got the secret so it's all good
        return;
      }
    }

    try {
      // 1. Load the config script
      await loadScript('./.wallet-temp/wallet-proxy-config.js');

      const secretFilename = globalThis.WALLET_INITIAL_FILE;
      if (!secretFilename || typeof secretFilename !== 'string') {
        throw new Error('Missing or invalid WALLET_INITIAL_FILE');
      }

      // 2. Load the actual secret script
      await loadScript(`./.wallet-temp/${secretFilename}`);

      const secret = globalThis.WALLET_CLIENT_PROXY_INIT_SECRET;
      if (!secret || typeof secret !== 'string') {
        throw new Error('Secret not found in loaded JS');
      }

      WalletPersistence.proxyInitialSecret = secret;

    } catch (err) {
      console.error('getInitialSecret() failed:', err);
      throw err;
    }
  }

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
    getInitialSecret,
  };
})();

