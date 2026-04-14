//wallet-token-possibilities.js
///////////////////////////////////////////////////////////////////////
// this is related wallet-default-token-possibilities.js (WalletDefaultTokenPossibilities)
// and future WalletUserManagedTokenPossibilities.
///////////////////////////////////////////////////////////////////////

const WalletTokenPossibilities = (function () {
  let _initialized = false;

  async function loadMergeUpdateTokenPossibilities() {
    const defaults = WalletDefaultTokenPossibilities?.tokenPossibilities;
    if (!defaults || typeof defaults !== "object") {
      throw new Error("No default Token Possibilities available");
    }

    _assertNoDuplicates(defaults);

    let persisted = WalletPersistence?.tokenPossibilities;

    if (!persisted || typeof persisted !== "object") {
      const keyed = await _buildKeyedMap(defaults);
      WalletPersistence.tokenPossibilities = keyed;
      return keyed;
    }

    const updated = { ...persisted };
    for (const possibility of Object.values(defaults)) {
      const key = await _composeKey(possibility);
      if (!(key in updated)) {
        updated[key] = possibility;
      }
    }

    WalletPersistence.tokenPossibilities = updated;
    return updated;
  }

  async function _composeKey(possibility) {
    const contractAddr = possibility.contractAddress;
    const normalizedAddress = await WalletEthLib.normalizeEthereumAddress(contractAddr);
    if (!await WalletEthLib.isValidChecksummedEthereumAddress(normalizedAddress)) {
      throw new Error("Invalid contract address: checksum failed -> " + contractAddr);
    }
    return [
      normalizedAddress,
      possibility.network?.toLowerCase(),
      possibility.networkType || "",
    ].join("::");
  }

  async function _assertNoDuplicates(possibilitiesMap) {
    const seen = new Map();
    for (const [_, possibility] of Object.entries(possibilitiesMap)) {
      const key = await _composeKey(possibility);
      if (seen.has(key)) {
        const existing = seen.get(key);
        throw new Error("Duplicate token detected:\n" +
          JSON.stringify(existing, null, 2) + "\nAND\n" +
          JSON.stringify(possibility, null, 2));
      }
      seen.set(key, possibility);
    }
  }

  async function _buildKeyedMap(possibilitiesMap) {
    const result = {};
    for (const possibility of Object.values(possibilitiesMap)) {
      result[await _composeKey(possibility)] = possibility;
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
    loadMergeUpdateTokenPossibilities,
  };
})();
