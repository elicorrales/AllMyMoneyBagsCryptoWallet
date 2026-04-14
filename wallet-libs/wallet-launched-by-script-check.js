// wallet-libs/wallet-launched-by-script-check.js
const WalletLaunchCheck = (function () {
  let _initialized = false;

  const REQUIRED_PAGE = 'SimpleWebPageCryptoWallet-loggedoff.html';
  const PARAM_KEY = 'launchedByScript';
  const PARAM_VAL = '1';

  async function checkIfOfficialLaunch() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    const urlParams = new URLSearchParams(window.location.search);

    //on starting page?
    if (currentPage === REQUIRED_PAGE) {
      if (urlParams.get(PARAM_KEY) === PARAM_VAL) {
        localStorage.setItem(PARAM_KEY, PARAM_VAL);
      } else {
        throw new Error('Not Allowed To Load Page');
      }
    //not on starting page so check storage
    } else {
      const stored = localStorage.getItem(PARAM_KEY);
      if (stored !== PARAM_VAL) {
        throw new Error('Not Allowed To Load Page');
      }
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
    checkIfOfficialLaunch,
  };
})();

