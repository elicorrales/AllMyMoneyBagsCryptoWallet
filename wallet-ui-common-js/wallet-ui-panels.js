// wallet-ui-common-js/wallet-ui-panels.js

const WalletUiPanel = (function () {
  let _initialized = false;
  let _isShowNewPage = false;
  let _currentPanelId = null;


  async function show(show) {
    if (typeof WalletPersistence !== 'undefined') {
      WalletPersistence.lastTimeUserInteractedWithWallet = Math.floor(Date.now() / 1000);
    }

    if (!show) return;

    if (show.endsWith('.html')) {
      const currentPage = window.location.pathname.split('/').pop();
      WalletPersistence.cameFromThisPage = currentPage;
      WalletPersistence.isShowNewPage = true;

      if (window.parent !== window) {
        // Inside iframe: send password first, then navigation
        await WalletParentComms.sendPasswordToParentAndSwitch(show);
      } else {
        // Normal mode: direct navigation
        window.location.href = show;
      }
      return;
    }

    // hide only top-level panels (direct children of body)
    document.querySelectorAll('body > .panel').forEach((panel) => {
      panel.style.display = 'none';
    });

    const normalizedId = /panel$/i.test(show) ? show : show + 'Panel';
    const el = document.getElementById(normalizedId);
    if (el) {
      el.style.display = 'block';
      _currentPanelId = normalizedId; // <--- remember currently showing panel

    }
  }

// Add inside the returned object
  function hide(panelId) {
    if (!panelId) return;
    const el = document.getElementById(panelId);
    if (el) {
      el.style.display = 'none';
    }
  }

  function initOnceDomReady() {
    if (_initialized) return;
    _initialized = true;
  }

  function onDomReady(cb) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', cb);
    } else {
      cb();
    }
  }

  function isShowNewPage() {
    if (WalletPersistence.isShowNewPage === null) {
      WalletPersistence.isShowNewPage = false;
    }
    return WalletPersistence.isShowNewPage;
  }

  function clearIsShowNewPage() {
    WalletPersistence.isShowNewPage = false;
  }

  // add to returned object
  function getCurrentPanelId() {
    return _currentPanelId;
  }

  onDomReady(initOnceDomReady);

  return {
    show,
    hide,
    isShowNewPage,
    clearIsShowNewPage,
    getCurrentPanelId,
  };
})();

