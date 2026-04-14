// wallet-iframe/proxy-handler.js

// In-memory only (parent scope)
let proxyInitialSecret = null;
let proxyPort = null;
let proxySecret = null;
let proxyUrl = null;

// 1 — Listen for child sending proxy info
window.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'proxyInfoResponse') {
    const info = event.data.payload;

    proxyInitialSecret = info.proxyInitialSecret;
    proxyPort          = info.proxyPort;
    proxySecret        = info.proxySecret;
    proxyUrl           = info.proxyUrl;

    console.log('Parent received proxy info from iframe:', info);
  }
});

/*
// 2 — When user hits "x" in parent, fire and forget to proxy
window.addEventListener('beforeunload', () => {
  /
  try {
    WalletProxyClient.fireAndForgetAlert();
  } catch (e) {
    console.warn('Could not notify proxy of parent close:', e);
  }
  // No iframe messaging or beforeunload simulation needed
});
*/
