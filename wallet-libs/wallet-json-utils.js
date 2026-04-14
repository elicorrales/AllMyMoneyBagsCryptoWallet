//wallet-libs/wallet-json.js
const WalletJsonUtils = (function () {
  let _initialized = false;

  function findFieldsInJsonBlob(obj, partialKey) {
    const matches = {};
    try {
      if (!obj || typeof obj !== "object") return matches; // not JSON-like

      // Convert search terms into regex patterns (case-insensitive)
      const patterns = partialKey
        .split("|")
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => {
          const regexStr = "^" + s.replace(/\*/g, ".*"); // * -> .*
          return new RegExp(regexStr, "i"); // i = case-insensitive
        });

      function search(o, path = []) {
        if (o && typeof o === "object") {
          for (let k in o) {
            for (const regex of patterns) {
              if (regex.test(k)) {
                matches[k] = o[k]; // store by actual field name
              }
            }
            search(o[k], [...path, k]);
          }
        }
      }

      search(obj);
    } catch (e) {
      // ignore errors
    }
    return matches;
  }

  function isValuesInMatches(matches, partialValues) {
    if (!matches || typeof matches !== "object") return false;

    const values = Object.values(matches).map(v => String(v).toLowerCase());
    const checks = partialValues.split("|").map(s => s.trim().toLowerCase());

    for (const val of values) {
      for (const check of checks) {
        if (val.includes(check)) {
          return true;
        }
      }
    }
    return false;
  }

  function matchesToString(matches) {
    return Object.values(matches)
      .map(v => `[${typeof v === "string" ? v : JSON.stringify(v)}]`)
      .join(" ");
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
    findFieldsInJsonBlob,
    isValuesInMatches,
    matchesToString,
  };
})();

