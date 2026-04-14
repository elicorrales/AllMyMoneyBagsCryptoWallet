// wallet-xrp-network-utils.js
// Utility functions for XRP integration

const WalletXrpUtils = (function () {

  let _initialized = false;

  const derivePath = "m/44'/144'/0'/0/0";

  async function deriveAddressFromSeedHex(seedHex, provider) {
    if (typeof WalletXrpLib?.getAddressFromSeedHex !== "function") {
      throw new Error("WalletXrpLib.getAddressFromSeedHex() is not available. Did you forget to load the script?");
    }
    if (provider.assetName?.toLowerCase() !== 'xrp') {
      throw new Error('Error deriving address: Wrong asset passed for XRP: ' + JSON.stringify(provider, null, 2));
    }
    return await WalletXrpLib.getAddressFromSeedHex(seedHex, derivePath);
  }

  function doesResponseHaveErrors(res, rpcUrl = 'NO URL') {

    console.debug('[WalletXrpUtils] RPC raw response from', rpcUrl, res);


    if (typeof res === 'string') {
      const trimmed = res.trim();
      if (
        trimmed.startsWith('<!DOCTYPE html') ||
        trimmed.startsWith('<html') ||
        /<meta\s+http-equiv=["']?refresh["']?/i.test(trimmed)
      ) {
        // Limit length to avoid huge messages, e.g., first 1000 chars
        const snippet = trimmed.length > 1000 ? trimmed.slice(0, 1000) + '…[truncated]' : trimmed;
        return [true, `❌ HTML response detected (likely redirect/page) - ${rpcUrl}\nHTML received:\n${snippet}`];
      }
    }

    if (!res) {
      return [ true, `❌ Empty response from proxy: ${rpcUrl}` ];
    }

    const searchForFields = "execution reverted|not allowed|err|error*code|status|msg|message|err*message|err*msg|detail|reason";
    const matches = WalletJsonUtils.findFieldsInJsonBlob(res, searchForFields);
    const searchForValues = "execution reverted|not allowed|err|acc|not|found|denied|forbidden|perm|api|key|unsup|timeout|too many|rate|limit";
    if (WalletJsonUtils.isValuesInMatches(matches, searchForValues)) {
      const msg = WalletJsonUtils.matchesToString(matches);
      return [ true, `❌ RPC Error (detected fields): ${msg} - ${rpcUrl}` ];
    }

    if (res?.error) {
      const code = res.error.code || res.code || 'NO CODE';
      const msg  = res.error.message || res.message || res.error || 'No Message';
      return [ true, `❌ RPC Error: ${code} - ${msg} - ${rpcUrl}` ];
    }

    if (res._enqueueRpcCallError) {
      return [ true, `❌ Proxy enqueue error (likely proxy overload) - ${rpcUrl}` ];
    }

    if (typeof res.result === 'undefined') {
      return [ true, `❌ Missing result field from RPC proxy - ${rpcUrl}` ];
    }

    return [ false, '' ];
  }


  async function testProvider(provider) {
    if (!provider?.rpcUrl || !provider?.rpcMethods?.getLedger) {
      throw new Error("RPC URL or getLedger method missing");
    }

    const { rpcUrl, rpcMethods, providerApiKey } = provider;
    const headers = {};
    if (providerApiKey) headers['x-api-key'] = providerApiKey;

    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: rpcMethods.getLedger.method,
      params: [{}]
    };

    try {
      let res = await WalletProxyClient.sendRpcViaProxy({
        method: rpcMethods.getLedger.getOrPost,
        rpcUrl,
        payload,
        extraHeaders: headers
      });

      if (typeof res === 'string') {
        try { res = JSON.parse(res); } catch {}
      }

      const [isError, message] = doesResponseHaveErrors(res, rpcUrl);
      if (isError) throw new Error(message);

      // Confirm a valid ledger index exists
      const ledgerIndex =
        res?.result?.ledger_current_index ||
        res?.result?.open?.ledger?.ledger_index;

      if (typeof ledgerIndex === 'undefined') {
        throw new Error("Invalid response from getLedger");
      }

      return { ok: true, ledgerIndex };

    } catch (err) {
      throw new Error(`❌ Proxy/network fetch error (testProvider): ${err.message}`);
    }
  }

  async function getBalance(provider, address) {
    if (!provider) throw new Error("Provider is required");
    const { rpcUrl, rpcMethods, apiType, providerApiKey } = provider;
    if (!rpcUrl) throw new Error("RPC URL required for balance");
    if (!rpcMethods?.getBalance) throw new Error("RPC Methods required for balance");
    if (!address) throw new Error("Address required for balance");
    if (!apiType) throw new Error("API type required for XRP balance");

    const addrStr = typeof address === 'object' && address.address ? address.address : address;
    const methodObj = rpcMethods.getBalance;
    const method = methodObj.method;
    const getOrPost = methodObj.getOrPost;
    const contentType = methodObj.contentType;
    const payloadFormat = methodObj.payloadFormat;

    const headers = {};
    if (contentType) headers['Content-Type'] = contentType;
    if (providerApiKey) headers['x-api-key'] = providerApiKey;

    let thrownError = false;
    try {
      let res;
      switch (apiType) {
        case 'rippled': {
          const payload = {
            jsonrpc: "2.0",
            id: 1,
            method: method,
            params: [{ account: addrStr, ledger_index: "current" }]
          };
          res = await WalletProxyClient.sendRpcViaProxy({
            method: getOrPost,
            rpcUrl,
            payload,
            extraHeaders: headers
          });
          break;
        }
        case 'xrpl-data-api': {
          const url = `${rpcUrl}/${method}/${addrStr}`;
          res = await WalletProxyClient.sendRpcViaProxy({
            method: getOrPost,
            rpcUrl: url,
            payload: {},
            extraHeaders: headers
          });
          break;
        }
        default:
          thrownError = true;
          throw new Error(`Unsupported XRP apiType: ${apiType}`);
      }

      const [ isError, message ] = doesResponseHaveErrors(res, rpcUrl);
      if (isError) {
        thrownError = true;
        throw new Error(message);
      }

      if (res?.statusCode === 403) {
        const error = res?.errorCode || 'Unknown Error';
        const message = res?.message || 'No Message';
        thrownError = true;
        throw new Error(`RPC Error: ${res.statusCode} - ${error} - ${message} - ${rpcUrl}`);
      }

      if (res._error || res?.__enqueueRpcCallError) throw new Error(res.body || 'Unknown proxy error');

      if (apiType === 'rippled') {
        if (!res?.result || res.result.error === 'actNotFound') return "0";
        const balanceDrops = res.result.account_data?.Balance;
        if (typeof balanceDrops === 'undefined') throw new Error("No balance found in XRP account_data");
        return WalletXrpLib.formatXrp(balanceDrops);
      }

      if (apiType === 'xrpl-data-api') {
        if (!res?.balances || !Array.isArray(res.balances)) throw new Error("Missing or malformed balances");
        const xrpBalanceObj = res.balances.find(b => b.currency === 'XRP');
        return xrpBalanceObj?.value || "0";
      }

      throw new Error("Unhandled XRP API type");
    } catch (err) {
      if (thrownError) throw err;
      console.error('[WalletXrpUtils] getBalance fetch/proxy error:', err);
      const msg = err?.message?.toLowerCase() || "";
      if (msg.includes("timeout")) {
        throw new Error("⏱️ RPC Timeout (getBalance): " + err.message);
      }
      throw new Error("❌ Proxy/network fetch error (getBalance): " + err.message);
    }
  }

  async function determineDoesDestAddressExist(transaction) {
    if (!transaction) throw new Error("Transaction required");
    const provider = transaction.provider;
    if (!provider) throw new Error("Provider missing in transaction");
    const toAddress = transaction.toAddress;
    if (!toAddress) throw new Error("toAddress missing in transaction");

    const { rpcUrl, rpcMethods, providerApiKey, apiType } = provider;
    if (!rpcUrl) throw new Error("RPC URL required");
    if (!rpcMethods?.determineDoesDestAddressExist) throw new Error("RPC method config missing");
    if (!apiType) throw new Error("API type required");

    const methodObj = rpcMethods.determineDoesDestAddressExist;
    const method = methodObj.method;
    const getOrPost = methodObj.getOrPost;
    const contentType = methodObj.contentType;

    const headers = {};
    if (contentType) headers['Content-Type'] = contentType;
    if (providerApiKey) headers['x-api-key'] = providerApiKey;

    let thrownError = false;
    try {
      let res;

      if (apiType === 'rippled') {
        const payload = {
          jsonrpc: "2.0",
          id: 1,
          method,
          params: [{ account: toAddress, ledger_index: "current" }]
        };

        res = await WalletProxyClient.sendRpcViaProxy({
          method: getOrPost,
          rpcUrl,
          payload,
          extraHeaders: headers
        });

        if (typeof res === 'string') {
          try { res = JSON.parse(res); } catch {}
        }

        if (res._error) {
          console.warn("Proxy error:", res._error);
          transaction.destAddressExists = false;
          return;
        }

        if (res.result?.error === 'actNotFound') {
          console.log("XRP address not found:", toAddress);
          transaction.destAddressExists = false;
        } else if (res.result.error === 'actMalformed') {
          throw new Error("Wrong XRP address format: " + toAddress);
        } else if (res.result?.account_data) {
          transaction.destAddressExists = true;
        } else {
          console.warn("Unexpected response format", res);
          transaction.destAddressExists = false;
        }
        return;

      } else if (apiType === 'xrpl-data-api') {
        const url = `${rpcUrl}/${method}/${toAddress}`;

        res = await WalletProxyClient.sendRpcViaProxy({
          method: getOrPost,
          rpcUrl: url,
          payload: {},
          extraHeaders: headers
        });

        if (typeof res === 'string') {
          try { res = JSON.parse(res); } catch {}
        }

        if (res._error) {
          console.warn("Proxy error:", res._error);
          transaction.destAddressExists = false;
          return;
        }

        if (res.balances && Array.isArray(res.balances)) {
          transaction.destAddressExists = true;
        } else {
          transaction.destAddressExists = false;
        }
        return;

      } else {
        thrownError = true;
        throw new Error("Unsupported XRP apiType");
      }

    } catch (err) {
      if (thrownError) throw err;
      console.error("Error checking XRP address existence:", err);
      throw new Error("Failed to determine if XRP address exists: " + err.message);
    }
  }

  async function estimateFee(transaction) {
    if (!transaction) throw new Error("Transaction required");
    const provider = transaction.provider;
    if (!provider) throw new Error("Provider missing in transaction");
    const { rpcUrl, rpcMethods, providerApiKey, apiType } = provider;
    if (!rpcUrl) throw new Error("RPC URL required for fee estimate");
    if (!rpcMethods?.getFee) throw new Error("RPC Methods required for estimate fee");
    if (!apiType) throw new Error("API type required");

    const methodObj = rpcMethods.getFee;
    const method = methodObj.method;
    const getOrPost = methodObj.getOrPost;
    const contentType = methodObj.contentType;

    const headers = {};
    if (contentType) headers['Content-Type'] = contentType;
    if (providerApiKey) headers['x-api-key'] = providerApiKey;

    let thrownError = false;
    try {
      let res;

      if (apiType === 'rippled') {
        const payload = {
          jsonrpc: "2.0",
          id: 1,
          method,
          params: []
        };

        res = await WalletProxyClient.sendRpcViaProxy({
          method: getOrPost,
          rpcUrl,
          payload,
          extraHeaders: headers
        });

        if (typeof res === 'string') {
          try { res = JSON.parse(res); } catch {}
        }

        if (res._error) {
          thrownError = true;
          throw new Error("Proxy error: " + res._error);
        }

        if (!res.result || !res.result.drops || !res.result.drops.open_ledger_fee) {
          thrownError = true;
          throw new Error("Unexpected fee response format");
        }

        const feeXRP = parseInt(res.result.drops.open_ledger_fee, 10) / 1_000_000;
        transaction.fee = feeXRP.toString();

      } else {
        thrownError = true;
        throw new Error("Unsupported XRP apiType for fee estimation");
      }
    } catch (err) {
      if (thrownError) throw err;
      console.error("Failed to estimate XRP fee:", err);
      throw new Error("Failed to estimate XRP fee: " + err.message);
    }
  }

  async function getCurrentLedgerIndex(provider) {
    if (!provider?.rpcUrl || !provider?.rpcMethods?.getLedger) {
      throw new Error("RPC URL or getLedger method missing");
    }
    const { rpcUrl, rpcMethods, providerApiKey } = provider;
    const methodObj = rpcMethods.getLedger;
    const headers = {};
    if (methodObj.contentType) headers['Content-Type'] = methodObj.contentType;
    if (providerApiKey) headers['x-api-key'] = providerApiKey;

    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: methodObj.method,
      params: [{}]
    };

    let thrownError = false;
    try {
      let res = await WalletProxyClient.sendRpcViaProxy({
        method: methodObj.getOrPost,
        rpcUrl,
        payload,
        extraHeaders: headers
      });

      if (typeof res === "string") {
        try { res = JSON.parse(res); } catch {}
      }

      if (res.result?.ledger_current_index) {
        return res.result.ledger_current_index;
      }
      if (res.result?.open?.ledger?.ledger_index) {
        return parseInt(res.result.open.ledger.ledger_index, 10);
      }

      thrownError = true;
      throw new Error("Failed to fetch current ledger index");

    } catch (err) {
      if (thrownError) throw err;
      console.error("Error fetching current ledger index:", err);
      throw new Error("Failed to fetch current ledger index: " + err.message);
    }
  }

  async function sendTransaction(transaction) {
    if (!transaction) throw new Error("Transaction is required");

    const { fromAddress, provider } = transaction;
    if (!fromAddress) throw new Error("fromAddress is required in transaction");
    if (!provider) throw new Error("Provider missing in transaction");

    const { rpcUrl, rpcMethods, providerApiKey } = provider;
    if (!rpcUrl) throw new Error("RPC URL required for sendTransaction");
    if (!rpcMethods?.sendTransaction || !rpcMethods.getBalance)
      throw new Error("RPC Methods required for sendTransaction");

    const sendTxMethod = rpcMethods.sendTransaction;
    const balanceMethod = rpcMethods.getBalance;

    if (!sendTxMethod.method || !sendTxMethod.getOrPost || !sendTxMethod.contentType)
      throw new Error("sendTransaction config must include method, getOrPost, contentType");

    if (!balanceMethod.method || !balanceMethod.getOrPost || !balanceMethod.contentType)
      throw new Error("getBalance config must include method, getOrPost, contentType");

    let seedHex;
    try {
      seedHex = await WalletMnemonicHandler.getSeedHexFromStoredEncryptedMnemonic(WalletAppState.password);
    } catch (err) {
      throw new Error("Could not derive wallet seed: " + err.message);
    }

    transaction.seedHex = seedHex;
    transaction.derivePath = derivePath;

    const accountUrl = `${rpcUrl}/${balanceMethod.method}`;
    const balanceHeaders = {};
    if (balanceMethod.contentType) balanceHeaders['Content-Type'] = balanceMethod.contentType;
    if (providerApiKey) balanceHeaders['x-api-key'] = providerApiKey;

    let thrownError = false;
    try {
      const balancePayload = {
        jsonrpc: "2.0",
        id: 1,
        method: balanceMethod.method,
        params: [{ account: fromAddress }]
      };

      const accountData = await WalletProxyClient.sendRpcViaProxy({
        method: balanceMethod.getOrPost,
        rpcUrl: accountUrl,
        payload: balancePayload,
        extraHeaders: balanceHeaders
      });

      const sequence = accountData?.result?.account_data?.Sequence;
      if (!sequence) throw new Error("Missing sequence number in XRP account data");
      transaction.sequence = sequence;

      const currentLedgerIndex = await getCurrentLedgerIndex(provider);
      transaction.lastLedgerSequence = currentLedgerIndex + 5;

      const signedTx = await WalletXrpLib.signTransaction(transaction);
      if (!signedTx) throw new Error("Failed to sign XRP transaction");

      const sendPayload = {
        jsonrpc: "2.0",
        id: 1,
        method: sendTxMethod.method,
        params: [{ tx_blob: signedTx }]
      };

      const sendHeaders = {};
      if (sendTxMethod.contentType) sendHeaders['Content-Type'] = sendTxMethod.contentType;
      if (providerApiKey) sendHeaders['x-api-key'] = providerApiKey;

      const response = await WalletProxyClient.sendRpcViaProxy({
        method: sendTxMethod.getOrPost,
        rpcUrl: `${rpcUrl}/${sendTxMethod.method}`,
        payload: sendPayload,
        extraHeaders: sendHeaders
      });

      if (response?.result?.hash) {
        transaction.txHash = response.result.hash;
        return transaction.txHash;
      }

      const hashSignedTx = xrpl.hashes.hashSignedTx(signedTx);
      transaction.txHash = hashSignedTx;
      return transaction.txHash;
    } catch (err) {
      if (thrownError) throw err;
      console.error("[WalletXrpUtils] sendTransaction error:", err);
      throw new Error("❌ Proxy/network fetch error (sendTransaction): " + err.message);
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
    derivePath,
    deriveAddressFromSeedHex,
    doesResponseHaveErrors,
    testProvider,
    getBalance,
    determineDoesDestAddressExist,
    estimateFee,
    getCurrentLedgerIndex,
    sendTransaction
  };
})();


