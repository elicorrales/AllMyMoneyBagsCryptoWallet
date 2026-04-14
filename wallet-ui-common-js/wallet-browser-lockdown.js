// wallet-ui-common-js/wallet-browser-lockdown.js

const WalletBrowserLockDown = (function () {
  let _initialized = false;

function lockItDown() {
  //console.log('[LockDown] Initial history length:', history.length);
  //console.log('[LockDown] Current URL:', location.href);

  history.replaceState({ tag: 'wallet' }, '', location.href);
  history.pushState({ tag: 'wallet' }, '', location.href);

  //console.log('[LockDown] After push, history length:', history.length);

  window.addEventListener('popstate', (event) => {
    //console.log('[LockDown] popstate event fired:', event.state);
    //console.log('[LockDown] history length:', history.length);
    //console.log('[LockDown] URL after pop:', location.href);
    history.replaceState({ tag: 'wallet' }, '', location.href);
    history.pushState({ tag: 'wallet' }, '', location.href);
    //console.log('[LockDown] Forced history reset after popstate');
  });

  window.onpopstate = (event) => {
    //console.log('[LockDown] onpopstate triggered:', event.state);
  };
}

/*
  function lockItDown() {
    // Force this page as the only history entry
    history.replaceState(null, '', location.href);
    history.pushState(null, '', location.href);

    // Intercept all back/forward attempts
    function trapNav() {
      history.replaceState(null, '', location.href);
      history.pushState(null, '', location.href);
    }
    window.addEventListener('popstate', trapNav);
    window.onpopstate = trapNav;

    // Block common keyboard navigation shortcuts
    window.addEventListener('keydown', (e) => {
      const blocked =
        (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) ||
        (e.key === 'Backspace' && e.target === document.body);

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // Block middle-click and ctrl/meta-click opening links in new tabs
    window.addEventListener('click', (e) => {
      if (e.button === 1 || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }
*/

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
    lockItDown,
  };
})();

