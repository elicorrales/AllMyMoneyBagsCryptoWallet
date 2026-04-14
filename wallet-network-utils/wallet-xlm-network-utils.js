// wallet-xlm-network-utils.js
// Utility functions for Stellar (XLM) integration

const WalletXlmUtils = (function () {
  let _initialized = false;

  const derivePath = "m/44'/148'/0'";

  async function deriveAddressFromSeedHex(seedHex, provider) {
    if (typeof WalletXlmLib?.getAddressFromSeedHex !== "function") {
      throw new Error("WalletXlmLib.getAddressFromSeedHex() is not available. Did you forget to load the script?");
    }

    if (provider.assetName?.toLowerCase() !== 'stellar') {
      throw new Error('Error deriving address: Wrong asset passed for Stellar: ' + JSON.stringify(provider, null, 2));
    }

    return await WalletXlmLib.getAddressFromSeedHex(seedHex, derivePath);
  }

  function doesResponseHaveErrors(res, rpcUrl = 'NO URL') {

    console.debug('[WalletXlmUtils] RPC raw response from', rpcUrl, res);


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

    // have to make a special exception here for a valid XLM address that is unactivated
    if (res?.status === 404 && res?.title?.toLowerCase() === 'resource missing') {
      return [ false, '' ];
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

    if (res?.result !== undefined && typeof res.result !== 'string') {
      return [ true, `❌ Invalid/missing result field from RPC proxy - ${rpcUrl}` ];
    }

    return [ false, '' ];
  }

  async function testProvider(provider) {
    if (!provider?.rpcUrl) {
      throw new Error("RPC URL missing in provider");
    }

    const headers = {};
    if (provider.providerApiKey) {
      headers['x-api-key'] = provider.providerApiKey;
    }

    const url = `${provider.rpcUrl}/ledgers?limit=1`;

    let thrownError = false;

    try {
      const res = await WalletProxyClient.sendRpcViaProxy({
        method: "GET",
        rpcUrl: url,
        payload: {},
        extraHeaders: headers
      });

      const [isError, message] = doesResponseHaveErrors(res, url);
      if (isError) {
        thrownError = true;
        throw new Error(message);
      }

     if (!res?._embedded?.records?.length) {
        throw new Error("Invalid ledger response from provider");
      }

      return {
        ok: true,
        latestLedger: res._embedded.records[0].sequence
      };

    } catch (err) {
      if (thrownError) throw err;
      throw new Error("❌ Proxy/network fetch error (testProvider): " + err.message);
    }
  }

  async function getBalance(provider, address) {
    if (!provider) throw new Error("Provider is required");
    const { rpcUrl, providerApiKey, rpcMethods } = provider;
    if (!rpcUrl) throw new Error("RPC URL required for balance");
    if (!rpcMethods || !rpcMethods.getBalance) throw new Error("RPC Methods required for balance");
    if (!address) throw new Error("Address required for balance");

    const headers = {};
    const payload = {};

    if (providerApiKey) headers['x-api-key'] = providerApiKey;

    const method    = rpcMethods.getBalance.method;
    const getOrPost = rpcMethods.getBalance.getOrPost;
    const url = `${rpcUrl}/${method}/${address}`;

    const contentType = rpcMethods.getBalance.contentType;
    if (contentType) headers['Content-Type'] = contentType;

    let thrownError = false;
    try {
      const res = await WalletProxyClient.sendRpcViaProxy({
        method: getOrPost,
        rpcUrl: url,
        payload: payload,
        extraHeaders: headers
      });

      const [ isError, message ] = doesResponseHaveErrors(res, rpcUrl);
      if (isError) {
        thrownError = true;
        throw new Error(message);
      }

      if (res?.error) {
        thrownError = true;
        if (res.error === 'TIMEOUT') throw res;
      }

      if (!res.balances || !Array.isArray(res.balances)) {
        throw new Error("No balance data found");
      }

      const native = res.balances.find(b => b.asset_type === 'native');
      return native?.balance || "0";
    } catch (err) {
      if (thrownError) throw err;
      console.error('[WalletXlmUtils] getBalance fetch/proxy error:', err);
      throw new Error("❌ Proxy/network fetch error (getBalance): " + err.message);
    }
  }

  async function estimateFee(transaction) {
    if (!transaction) throw new Error("Transaction required");
    const provider = transaction.provider;
    if (!provider) throw new Error("Provider missing in transaction");
    const { rpcUrl, rpcMethods } = provider;
    if (!rpcUrl) throw new Error("RPC URL required for fee estimate");
    if (!rpcMethods || !rpcMethods.getFee) throw new Error("RPC Methods required for estimate fee");

    const getOrPost = rpcMethods.getFee.getOrPost;
    const getFeeMethod = rpcMethods.getFee.method;
    const url = `${rpcUrl}/${getFeeMethod}`;

    const headers = {};
    const payload = {};

    const contentType = rpcMethods.getFee.contentType;
    if (contentType) headers['Content-Type'] = contentType;

    let thrownError = false;
    try {
      let resRaw = await WalletProxyClient.sendRpcViaProxy({
        method: getOrPost,
        rpcUrl: url,
        payload,
        extraHeaders: headers
      });

      let res = resRaw;
      if (typeof resRaw === 'string') {
        try { res = JSON.parse(resRaw); } catch {}
      }

      const [ isError, message ] = doesResponseHaveErrors(res, url);
      if (isError) {
        thrownError = true;
        throw new Error("Failed to fetch fee: " + message);
      }

      if (!res?.fee_charged?.mode) {
        thrownError = true;
        throw new Error("Invalid fee response");
      }

      const fee = res.fee_charged.mode; // stroops
      transaction.fee = (parseInt(fee) / 1e7).toString(); // in XLM
    } catch (err) {
      if (thrownError) throw err;
      console.error('[WalletXlmUtils] estimateFee fetch/proxy error:', err);
      throw new Error("❌ Proxy/network fetch error (estimateFee): " + err.message);
    }
  }

  async function sendTransaction(transaction) {
    if (!transaction) throw new Error("Transaction is required");

    const { fromAddress, provider } = transaction;
    if (!fromAddress) throw new Error("fromAddress is required in transaction");
    if (!provider) throw new Error("Provider missing in transaction");

    const { rpcUrl, rpcMethods, providerApiKey } = provider;
    if (!rpcUrl) throw new Error("RPC URL required for sendTransaction");
    if (!rpcMethods || !rpcMethods.sendTransaction || !rpcMethods.getBalance)
      throw new Error("RPC Methods required for send transaction");

    const sendTxMethod = rpcMethods.sendTransaction;
    const balanceMethod = rpcMethods.getBalance;

    if (!sendTxMethod.method || !sendTxMethod.getOrPost || !sendTxMethod.contentType || !sendTxMethod.payloadFormat)
      throw new Error("sendTransaction config must include method, getOrPost, contentType, and payloadFormat");

    if (!balanceMethod.method || !balanceMethod.getOrPost || !balanceMethod.contentType)
      throw new Error("getBalance config must include method, getOrPost, and contentType");

    let seedHex;
    try {
      seedHex = await WalletMnemonicHandler.getSeedHexFromStoredEncryptedMnemonic(WalletAppState.password);
    } catch (err) {
      throw new Error("Could not derive wallet seed: " + err.message);
    }

    transaction.seedHex = seedHex;
    transaction.derivePath = derivePath;

    const accountUrl = `${rpcUrl}/${balanceMethod.method}/${fromAddress}`;
    const balanceHeaders = {};
    if (balanceMethod.contentType) balanceHeaders['Content-Type'] = balanceMethod.contentType;
    if (providerApiKey) balanceHeaders['x-api-key'] = providerApiKey;

    let thrownError = false;
    try {
      const accountData = await WalletProxyClient.sendRpcViaProxy({
        method: balanceMethod.getOrPost,
        rpcUrl: accountUrl,
        payload: {},
        extraHeaders: balanceHeaders
      });

      if (!accountData?.sequence) {
        thrownError = true;
        throw new Error("Missing sequence number in account data");
      }
      transaction.sequence = accountData.sequence;

      const signedXdr = await WalletXlmLib.signTransaction(transaction);

      let sendPayload;
      if (sendTxMethod.payloadFormat === "urlencoded") {
        const params = new URLSearchParams();
        params.append("tx", signedXdr);
        sendPayload = params.toString();
      } else if (sendTxMethod.payloadFormat === "json") {
        sendPayload = { tx: signedXdr };
      } else {
        thrownError = true;
        throw new Error(`Unsupported payload format: ${sendTxMethod.payloadFormat}`);
      }

      const sendHeaders = {};
      if (sendTxMethod.contentType) sendHeaders['Content-Type'] = sendTxMethod.contentType;
      if (providerApiKey) sendHeaders['x-api-key'] = providerApiKey;

      const response = await WalletProxyClient.sendRpcViaProxy({
        method: sendTxMethod.getOrPost,
        rpcUrl: `${rpcUrl}/${sendTxMethod.method}`,
        payload: sendPayload,
        extraHeaders: sendHeaders
      });

      const [ isError, message ] = doesResponseHaveErrors(response, rpcUrl);
      if (isError) {
        thrownError = true;
        throw new Error("Failed to send transaction: " + message);
      }

      if (!response?.hash) {
        thrownError = true;
        throw new Error("Transaction submission failed");
      }

      transaction.txHash = response.hash;

    } catch (err) {
      if (thrownError) throw err;
      console.error('[WalletXlmUtils] sendTransaction fetch/proxy error:', err);
      throw new Error("❌ Proxy/network fetch error (sendTransaction): " + err.message);
    }
  }

  async function determineDoesDestAddressExist(transaction) {
    if (!transaction) throw new Error("Transaction required");
    const provider = transaction.provider;
    if (!provider) throw new Error("Provider missing in transaction");
    const toAddress = transaction.toAddress;
    if (!toAddress) throw new Error("toAddress missing in transaction");

    const { rpcUrl, rpcMethods, providerApiKey } = provider;
    if (!rpcUrl) throw new Error("RPC URL required to check address existence");
    if (!rpcMethods || !rpcMethods.determineDoesDestAddressExist) throw new Error("RPC Methods must include determineDoesDestAddressExist");

    const method = rpcMethods.determineDoesDestAddressExist.method;
    const getOrPost = rpcMethods.determineDoesDestAddressExist.getOrPost;
    const url = `${rpcUrl}/${method}/${toAddress}`;

    const headers = {};
    const contentType = rpcMethods.determineDoesDestAddressExist.contentType;
    if (contentType) headers['Content-Type'] = contentType;
    if (providerApiKey) headers['x-api-key'] = providerApiKey;

    let thrownError = false;
    try {
      let res = await WalletProxyClient.sendRpcViaProxy({
        method: getOrPost,
        rpcUrl: url,
        payload: {},
        extraHeaders: headers
      });

      if (typeof res === 'string') {
        try { res = JSON.parse(res); } catch {}
      }

      const [ isError, message ] = doesResponseHaveErrors(res, url);
      if (isError) {
        thrownError = true;
        throw new Error(message);
      }

      if (res._error) {
        thrownError = true;
        throw new Error(res.body || 'Unknown proxy error');
      }

      transaction.destAddressExists = !!(res.balances && Array.isArray(res.balances));

    } catch (err) {
      if (thrownError) throw err;
      if (err.message && (err.message.includes("Resource Missing") || err.message.includes("404"))) {
        transaction.destAddressExists = false;
      } else {
        console.error('[WalletXlmUtils] determineDoesDestAddressExist fetch/proxy error:', err);
        throw new Error("❌ Proxy/network fetch error (determineDoesDestAddressExist): " + err.message);
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
    derivePath,
    deriveAddressFromSeedHex,
    testProvider,
    getBalance,
    estimateFee,
    sendTransaction,
    determineDoesDestAddressExist
  };
})();

