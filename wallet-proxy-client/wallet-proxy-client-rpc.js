// wallet-proxy-client-rpc.js

;(function () {
  let _initialized = false;

  async function sendRpcViaProxy({ method, rpcUrl, payload, extraHeaders, rawBody = null, contentType = null }) {
    const proxyUrl = WalletPersistence.proxyUrl;
    const proxySecret = WalletPersistence.proxySecret;

    // Normalize 'Content-Type' key in extraHeaders (case-insensitive)
    const normalizedExtraHeaders = {};
    for (const key in extraHeaders) {
      if (key.toLowerCase() === 'content-type') {
        normalizedExtraHeaders['Content-Type'] = extraHeaders[key];
      } else {
        normalizedExtraHeaders[key] = extraHeaders[key];
      }
    }

    // Use rawBody if provided, otherwise fallback to payload
    const rpcBody = {
      rpcUrl,
      contentType: contentType || normalizedExtraHeaders['Content-Type'],
      'x-secret-key': proxySecret,
      'x-wallet-origin': 'file://wallet',
      extraHeaders: Object.fromEntries(
        Object.entries(normalizedExtraHeaders).filter(([k]) => k.toLowerCase() !== 'content-type')
      ),
      body: rawBody !== null ? rawBody : payload,
    };

    const headers = { 'Content-Type': 'application/json' };

    try {
      const encryptedBody = await WalletClientCrypt.encryptBody(
        rpcBody,
        WalletPersistence.proxyInitialSecret
      );

      const res = await fetch(`${proxyUrl}/rpc/${method}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ encrypted: encryptedBody }),
      });

      const text = await res.text();

      // try JSON parse, fallback to raw text if plain response (e.g. BTC tx hash)
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        if (res.ok && text.trim().length > 0) {
          console.log('[wallet proxy client - sendViaProxy] non-JSON response, returning raw text');
          return text.trim();
        }
        // include rawText in thrown error
        const err = new Error(text?.trim() || 'Invalid JSON and empty response');
        err.rawText = text;
        throw err;
      }

      if (!res.ok) {
        const structuredError = {
          status: res.status,
          message:
            parsed?.error?.message ||
            (typeof parsed?.error === 'string' ? parsed.error : res.statusText),
          code: parsed?.error?.code,
          raw: parsed,
          rawText: text,            // <-- added raw response here
          __enqueueRpcCallError: true,
        };
        console.error(`Proxy error ${res.status}:`, structuredError);
        return structuredError;
      }

      return parsed;
    } catch (err) {
      // wrap native JS errors with rawText if available
      if (!err.rawText) err.rawText = err.message || '';
      err.__enqueueRpcCallError = true;
      console.error('sendRpcViaProxy failed:', err);
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

  if (!window._internalWalletProxyHelpers) window._internalWalletProxyHelpers = {};
  window._internalWalletProxyHelpers.sendRpcViaProxy = (...args) =>
    window._internalWalletProxyHelpers.enqueueRpcCall(() => sendRpcViaProxy(...args));
})();
