// wallet-proxy-client.js
// Utility functions for interacting with the local RPC proxy server

const WalletProxyClient = (function () {
  let _initialized = false;

  const DEFAULT_PORTS = [18545, 18546, 18547, 18548, 18549];
  const RECONNECT_RETRIES = 10;
  const RECONNECT_DELAY_MS = 500;
  const BASE_PROXY_URL = 'http://127.0.0.1';

  async function findAvailableProxy() {
    for (const port of DEFAULT_PORTS) {
      const url = `${BASE_PROXY_URL}:${port}`;
      try {
        console.log(`Trying proxy at ${url}...`);
        const encryptedBody = await WalletClientCrypt.encryptBody({
          origin: 'file://wallet',
          secret: WalletPersistence.proxyInitialSecret
        }, WalletPersistence.proxyInitialSecret);

        const res = await fetch(url + '/status', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ encrypted: encryptedBody })
        });

        if (res.ok) {
          console.log(`Found proxy at ${url}`);
          return { url, port };
        }

        const authHeader = res.headers.get('x-wallet-auth');
        if (res.status === 403 && authHeader === 'NEEDS_WALLET_AUTH') {
          console.log(`Proxy found at ${url}, requires wallet auth`);
          return { url, port, needsAuth: true };
        }

        console.warn(`Proxy at ${url} responded with status ${res.status}`);
      } catch (err) {
        console.warn(`Error connecting to proxy at ${url}:`, err.message || err);
      }
    }

    console.error('No available proxy found on default ports.');
    return null;
  }

  async function fetchProxySecret(proxyUrl) {
    const initSecret = WalletPersistence.proxyInitialSecret;

    const encryptedBody = await WalletClientCrypt.encryptBody(
      { initSecret, walletOrigin: 'file://wallet' },
      initSecret
    );

    const res = await fetch(proxyUrl + '/secret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encrypted: encryptedBody })
    });

    if (!res.ok) throw new Error('Failed to get proxy secret');

    const data = await res.json();

    // decrypt the response
    const decrypted = await WalletClientCrypt.decryptBody(data.encrypted, initSecret);
    return decrypted;
  }

  async function verifyProxySecret(proxyUrl, secret) {
    const body = {
      'x-secret-key': secret,
      walletOrigin: 'file://wallet'
    };

    const encryptedBody = await WalletClientCrypt.encryptBody(
      body,
      WalletPersistence.proxyInitialSecret
    );

    const res = await fetch(proxyUrl + '/verify-secret', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ encrypted: encryptedBody })
    });

    if (res.status === 200) {
      const data = await res.json();
      return data.valid === true;
    } else if (res.status === 401) {
      return false;
    } else if (res.status === 403) {
      throw new Error('Too many incorrect secret verification attempts, proxy shutting down');
    } else {
      throw new Error('Unexpected response verifying secret');
    }
  }

  async function ensureProxySession() {
    if (typeof WalletPersistence.proxyInitialSecret !== 'string') {
      throw new Error('Client Proxy Init Secret Missing!');
    }

    const initSecret = WalletPersistence.proxyInitialSecret;
    const port = WalletPersistence.proxyPort;
    const secret = WalletPersistence.proxySecret;
    const found = port ? { url: `${BASE_PROXY_URL}:${port}`, port: port } : await findAvailableProxy();

    if (!found) throw new Error('No proxy available');

    const { url: proxyUrl, port: proxyPort } = found;

    try {
      const valid = await verifyProxySecret(proxyUrl, secret);
      if (valid) {
        const port = proxyUrl.split(':').pop();
        WalletPersistence.proxyPort = port;
        WalletPersistence.proxySecret = secret;
        return { proxyUrl, proxyPort, proxySecret: secret };
      }
    } catch (err) {
      console.warn('Secret verification failed:', err.message);
    }

    const { secret: newSecret } = await fetchProxySecret(proxyUrl, initSecret);
    const newPort = proxyUrl.split(':').pop();
    WalletPersistence.proxyPort = newPort;
    WalletPersistence.proxySecret = newSecret;
    return { proxyUrl, proxyPort, proxySecret: newSecret };
  }

  async function shutdownProxy(portParam = null, secretParam = null, initialSecret = null) {
    let port = WalletPersistence.proxyPort || portParam;
    let secret = WalletPersistence.proxySecret || secretParam;
    let encryptionKey = WalletPersistence.proxyInitialSecret || initialSecret;

    if (encryptionKey === null || encryptionKey === '') {
      throw new Error("Cannot shutdown: missing encryption key");
    }

    //they either both are passed null OR as a value EACH.
    if ((port === null && secret !== null) ||
        (port !== null && secret === null)) {
      throw new Error("Cannot shutdown: missing proxy port Param or secret Param");
    }


    if (!port || !secret) {
      throw new Error("Cannot shutdown: missing proxy port or secret");
    }

    const proxyUrl = `${BASE_PROXY_URL}:${port}`;

    const encryptedBody = await WalletClientCrypt.encryptBody(
      {
        'x-secret-key': secret,
        'x-wallet-origin': 'file://wallet'
      },
      encryptionKey
    );

    try {
      const res = await fetch(proxyUrl + '/shutdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encrypted: encryptedBody })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Shutdown request failed: ${res.status} ${errorText}`);
      }

      console.log("Proxy shutdown command sent.");
    } catch (err) {
      console.error("Proxy shutdown failed:", err);
      throw err;
    }
  }

  function fireAndForgetAlert() {
    try {
      navigator.sendBeacon(
        `${WalletPersistence.proxyUrl}/alert`,
        JSON.stringify({ encrypted: WalletClientCrypt.getPrecomputed() })
      );
    } catch (e) {
      console.warn('Could not notify proxy of unload:', e);
    }
  }


  let rpcCallChain = Promise.resolve();

  function enqueueRpcCall(fn) {
    rpcCallChain = rpcCallChain
      .then(() => {
        const rtn = fn();
        //console.log('[enqueueRpcCall] then rtn fn():', rtn);
        return rtn;
      })
      .catch((err) => {
        //console.log('[enqueueRpcCall] then rtn fn() catch:', err);
        return Promise.resolve({ __enqueueRpcCallError: true, error: err });
      })
      .then((result) => {
        //console.log('[enqueueRpcCall] then empty?', result);
        return result;
      });

    //console.log('[enqueueRpcCall] final return (rpcCallChain):', rpcCallChain);
    return rpcCallChain;
  }

  // expose enqueueRpcCall internally only, inside the IIFE scope where it's defined
  if (!window._internalWalletProxyHelpers) window._internalWalletProxyHelpers = {};
  window._internalWalletProxyHelpers.enqueueRpcCall = enqueueRpcCall;

  function sendRpcViaProxy(...args) {
    if (
      window._internalWalletProxyHelpers &&
      typeof window._internalWalletProxyHelpers.sendRpcViaProxy === 'function'
    ) {
      return window._internalWalletProxyHelpers.sendRpcViaProxy(...args);
    } else {
      throw new Error('sendRpcViaProxy helper not available');
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
    findAvailableProxy,
    fetchProxySecret,
    verifyProxySecret,
    ensureProxySession,
    sendRpcViaProxy,
    shutdownProxy,
    fireAndForgetAlert,
  };
})();

window.WalletProxyClient = WalletProxyClient;

