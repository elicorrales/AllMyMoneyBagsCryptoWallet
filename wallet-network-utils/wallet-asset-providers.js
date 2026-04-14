//wallet-asset-providers.js
///////////////////////////////////////////////////////////////////////
// this is related wallet-default-asset-providers.js (WalletDefaultAssetProviders)
// and future WalletUserManagedAssetProviders.
///////////////////////////////////////////////////////////////////////

const WalletAssetProviders = (function () {
  let _initialized = false;

  function loadMergeUpdateProviders() {
    const defaultProviders = WalletDefaultAssetProviders?.providers;
    if (!defaultProviders || typeof defaultProviders !== "object") {
      throw new Error("No default asset providers available");
    }

    _assertNoDuplicates(defaultProviders);

    let persisted = WalletPersistence?.assetProviders;

    if (!persisted || typeof persisted !== "object") {
      const keyed = _buildKeyedMap(defaultProviders);
      WalletPersistence.assetProviders = keyed;
      return keyed;
    }

    const updated = { ...persisted };
    for (const provider of Object.values(defaultProviders)) {
      const key = _composeKey(provider);
      provider.provKey = key;
      provider.enabled = true;
      if (!(key in updated)) {
        updated[key] = provider;
      }
    }

    WalletPersistence.assetProviders = updated;
    return updated;
  }

  function _composeKey(provider) {
    try {
      const url = new URL(provider.rpcUrl); // throws if malformed
      const originPlusPath = url.origin + url.pathname; // include path
      return [
        originPlusPath,
        provider.network || "",
        provider.symbol || "",
        provider.apiType || "",
      ].join("::");
    } catch (error) {
      console.error("Error composing key for provider:", provider, error);
      error.provider = provider; // <— attach provider info
      throw error;
    }
  }

  function _assertNoDuplicates(providerMap) {
    const seen = new Map();
    for (const [_, provider] of Object.entries(providerMap)) {
      const key = _composeKey(provider);
      if (seen.has(key)) {
        const existing = seen.get(key);
        throw new Error("Duplicate asset provider detected:\n" +
          JSON.stringify(existing, null, 2) + "\nAND\n" +
          JSON.stringify(provider, null, 2));
      }
      seen.set(key, provider);
    }
  }

  function _buildKeyedMap(providerMap) {
    const result = {};
    for (const provider of Object.values(providerMap)) {
      const key = _composeKey(provider);
      provider.provKey = key;  // assign here
      provider.enabled = true;
      result[key] = provider;
    }
    return result;
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
    loadMergeUpdateProviders,
  };
})();

