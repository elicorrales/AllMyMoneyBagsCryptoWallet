// wallet-btc-network-utils.js
// Utility functions for Bitcoin (BTC) integration

const WalletBtcUtils = (function () {
  let _initialized = false;

  const derivePathMainnet = "m/44'/0'/0'/0/0";
  const derivePathTestnet = "m/44'/1'/0'/0/0";

  async function deriveAddressFromSeedHex(seedHex, provider) {
    if (typeof WalletBtcLib?.getAddressFromSeedHex !== "function") {
      throw new Error("WalletBtcLib.getAddressFromSeedHex() is not available. Did you forget to load the script?");
    }

    if (provider.assetName?.toLowerCase() !== 'bitcoin') {
      throw new Error('Error deriving address: Wrong asset passed for Bitcoin: ' + JSON.stringify(provider, null, 2));
    }

    let derivePath = null;
    let networkStr = null;
    if (provider.network === 'testnet') {
      derivePath = derivePathTestnet;
      networkStr = 'testnet';
    } else {
      derivePath = derivePathMainnet;
      networkStr = 'mainnet';
    }

    return await WalletBtcLib.getAddressFromSeedHex(seedHex, derivePath, networkStr);

  }

  function doesResponseHaveErrors(res, rpcUrl = 'NO URL') {
    console.debug('[WalletBitcoinUtils] RPC raw response from', rpcUrl, res);


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

    if (!res) return [true, `❌ Empty response from proxy: ${rpcUrl}`];

    // --- catch plain-text or malformed responses ---
    if (typeof res === 'string') {
      const lower = res.toLowerCase();
      if (lower.includes('error') || lower.includes('fail') || lower.includes('invalid') || lower.includes('bad request')) {
        return [true, `❌ RPC error (raw): ${res}`];
      }
      return [true, `❌ Unexpected non-JSON response: ${res.substring(0,120)}...`];
    }

    // --- include parse errors coming from proxy ---
    if (res.parseError || (res.message && res.message.includes('Unexpected token'))) {
      const msg = res.message || res.parseError || 'Malformed JSON response';
      const snippet = res.raw ? res.raw.substring(0,120) : '';
      return [true, `❌ Proxy JSON parse error: ${msg}${snippet ? ' | ' + snippet : ''}`];
    }

    // --- handle HTTP-like structure ---
    if (res.status && Number(res.status) >= 400) {
      const msg = res.raw || res.message || res.statusText || 'HTTP error';
      return [true, `❌ HTTP ${res.status}: ${msg}`];
    }

    if (res.raw && typeof res.raw === 'string' && res.raw.match(/error|fail|invalid|bad request/i)) {
      return [true, `❌ RPC raw error: ${res.raw}`];
    }

    const searchForFields = "execution reverted|not allowed|err|error*code|status|msg|message|err*message|err*msg|detail|reason";
    const matches = WalletJsonUtils.findFieldsInJsonBlob(res, searchForFields);
    const searchForValues = "execution reverted|not allowed|err|acc|not|found|denied|forbidden|perm|api|key|unsup|timeout|too many|rate|limit|decode";
    if (WalletJsonUtils.isValuesInMatches(matches, searchForValues)) {
      const msg = WalletJsonUtils.matchesToString(matches);
      return [true, `❌ RPC Error (detected fields): ${msg}`];
    }

    if (res?.error) {
      const code = res.error.code || res.code || 'NO CODE';
      const msg  = res.error.message || res.message || res.error || 'No Message';
      return [true, `❌ RPC Error: ${code} - ${msg}`];
    }

    if (res._enqueueRpcCallError) {
      const msg = res.raw || res.message || 'Proxy enqueue error (likely overload)';
      return [true, `❌ Proxy error: ${msg}`];
    }

    if (res?.result !== undefined && typeof res.result !== 'string') {
      return [true, `❌ Invalid/missing result field from RPC proxy`];
    }

    return [false, ''];
  }

  async function testProvider(provider) {
    if (!provider?.rpcUrl) {
      throw new Error("RPC URL missing in provider");
    }

    const headers = {};
    if (provider.providerApiKey) {
      headers[provider.providerApiKeyHeader || 'x-api-key'] = provider.providerApiKey;
    }

    let thrownError = false;

    try {
      let res;

      if (provider.apiType === "jsonrpc") {
        const payload = {
          jsonrpc: "2.0",
          id: 1,
          method: "getblockcount",  // generic call to test BTC node
          params: []
        };

        res = await WalletProxyClient.sendRpcViaProxy({
          method: provider.rpcMethods.testProvider?.getOrPost || "POST",
          rpcUrl: provider.rpcUrl,
          payload,
          extraHeaders: headers
        });

        const [isError, message] = doesResponseHaveErrors(res, provider.rpcUrl);
        if (isError) {
          thrownError = true;
          throw new Error(message);
        }

        if (typeof res.result !== "number") {
          throw new Error("Invalid block count returned from provider");
        }

        return { ok: true, blockCount: res.result };

      } else if (provider.apiType === "blockstream" || provider.apiType === "blockcypher") {
        // REST / address-based call for testing connectivity
        let testUrl = provider.rpcUrl;
        if (provider.apiType === "blockstream") testUrl += "/blocks/tip/height";
        else if (provider.apiType === "blockcypher") testUrl += "/"; // simplest call possible

        res = await WalletProxyClient.sendRpcViaProxy({
          method: provider.rpcMethods.testProvider?.getOrPost || "GET",
          rpcUrl: testUrl,
          payload: {},
          extraHeaders: headers
        });

        const [isError, message] = doesResponseHaveErrors(res, testUrl);
        if (isError) {
          thrownError = true;
          throw new Error(message);
        }

        return { ok: true, response: res };

      } else {
        thrownError = true;
        throw new Error("Unsupported BTC apiType");
      }
    } catch (err) {
      if (thrownError) throw err;
      throw new Error("❌ Proxy/network fetch error (testProvider): " + err.message);
    }
  }

  async function getBalance(provider, address) {
    if (!provider) throw new Error("Provider is required");
    const { rpcUrl, providerApiKey, rpcMethods, apiType } = provider;
    if (!rpcUrl) throw new Error("RPC URL required for balance");
    if (!rpcMethods || !rpcMethods.getBalance) throw new Error("RPC Methods required for balance");
    if (!address) throw new Error("Address required for balance");

    const headers = {};
    if (providerApiKey) {
      const headerName = provider.providerApiKeyHeader || 'x-api-key';
      headers[headerName] = providerApiKey;
    }

    let methodPath = rpcMethods.getBalance.method || "";
    let url;
    if (methodPath.includes("<address>")) {
      url = `${rpcUrl}/${methodPath.replace("<address>", address)}`;
    } else {
      url = `${rpcUrl}/${methodPath}/${address}`;
    }

    let thrownError = false;
    try {
      // ---------------- JSONRPC style (e.g. Nownodes) ----------------
      if (apiType === "jsonrpc") {
        const payload = {
          jsonrpc: "2.0",
          id: 1,
          method: rpcMethods.getBalance.method,
          params: [{ addresses: [address] }]
        };

        const res = await WalletProxyClient.sendRpcViaProxy({
          method: rpcMethods.getBalance.getOrPost,
          rpcUrl: rpcUrl,
          payload,
          extraHeaders: headers
        });

        const [isError, message] = doesResponseHaveErrors(res, rpcUrl);
        if (isError) {
          thrownError = true;
          throw new Error(message);
        }

        if (!res?.result || typeof res.result.balance === "undefined") {
          throw new Error("No balance data in JSONRPC response");
        }

        const satoshis = res.result.balance;
        return (satoshis / 1e8).toString();
      }

      // ---------------- Existing REST-style providers ----------------
      const res = await WalletProxyClient.sendRpcViaProxy({
        method: rpcMethods.getBalance.getOrPost,
        rpcUrl: url,
        payload: {},
        extraHeaders: headers
      });

      const [isError, message] = doesResponseHaveErrors(res, url);
      if (isError) {
        thrownError = true;
        throw new Error(message);
      }

      let satoshis = null;

      if (res.balance !== undefined) {
        satoshis = res.balance;
      } else if (res.chain_stats?.funded_txo_sum !== undefined && res.chain_stats?.spent_txo_sum !== undefined) {
        satoshis = res.chain_stats.funded_txo_sum - res.chain_stats.spent_txo_sum;
      } else {
        thrownError = true;
        throw new Error("No balance data found in response");
      }

      // Convert to BTC string
      return (satoshis / 1e8).toString();
    } catch (err) {
      if (thrownError) throw err;
      console.error('[WalletBitcoinUtils] getBalance fetch/proxy error:', err);
      throw new Error("❌ Proxy/network fetch error (getBalance): " + err.message);
    }
  }

  async function estimateFee(transaction) {
    if (!transaction) throw new Error("Transaction required");
    const provider = transaction.provider;
    if (!provider) throw new Error("Provider missing in transaction");
    const { rpcUrl, rpcMethods, providerApiKey, apiType } = provider;
    if (!rpcUrl) throw new Error("RPC URL required for fee estimate");
    if (!rpcMethods || !rpcMethods.getFee) throw new Error("RPC Methods required for estimate fee");

    const headers = {};
    const payload = {};
    if (rpcMethods.getFee.contentType) headers['Content-Type'] = rpcMethods.getFee.contentType;
    if (providerApiKey) {
      const headerName = provider.providerApiKeyHeader || 'x-api-key';
      headers[headerName] = providerApiKey;
    }

    let thrownError = false;
    try {
      const url = `${rpcUrl}/${rpcMethods.getFee.method}`;
      console.log(`[estimateFee] → provider: ${provider.providerName}`);
      console.log(`[estimateFee] → fetching fee from: ${url}`);

      const res = await WalletProxyClient.sendRpcViaProxy({
        method: rpcMethods.getFee.getOrPost,
        rpcUrl: url,
        payload: payload,
        extraHeaders: headers
      });

      console.log('[estimateFee] raw response:', res);

      const [isError, message] = doesResponseHaveErrors(res, url);
      if (isError) {
        thrownError = true;
        throw new Error(message);
      }

      let fee;
      const minRelay = provider.minRelayFeeSatsPerVByte || 1;
      const defaultFee = provider.defaultFeeSatsPerVByte || 5;

      if (apiType === 'blockstream') {
        const numericValues = Object.values(res)
          .map(v => Number(v))
          .filter(v => !isNaN(v) && v > 0 && Number.isFinite(v));
        console.log('[estimateFee] blockstream fee candidates (filtered):', numericValues);
        fee = numericValues.length ? Math.min(...numericValues) : defaultFee;
      } else {
        const feeOptions = [];
        if (res.fastestFee !== undefined) feeOptions.push(res.fastestFee);
        if (res.hourFee !== undefined) feeOptions.push(res.hourFee);
        console.log('[estimateFee] blockcypher fee candidates:', feeOptions);
        if (feeOptions.length > 0) fee = Math.min(...feeOptions);
      }

      fee = isNaN(fee) ? defaultFee : Math.max(fee, minRelay);

      transaction.fee = (fee / 1e8).toFixed(8); // convert satoshis → BTC
      console.log(`[estimateFee] selected fee (sats/vB): ${fee}`);
      console.log(`[estimateFee] transaction.fee (BTC): ${transaction.fee}`);
    } catch (err) {
      if (thrownError) throw err;
      console.error('[WalletBitcoinUtils] estimateFee fetch/proxy error:', err);
      throw new Error("❌ Proxy/network fetch error (estimateFee): " + err.message);
    }
  }

  async function sendTransaction(transaction) {
    if (!transaction) throw new Error("Transaction required");
    const provider = transaction.provider;
    const providerApiKey = provider.providerApiKey;
    if (!provider) throw new Error("Provider missing in transaction");
    if (!transaction.fromAddress || !transaction.toAddress || !transaction.amount) throw new Error("Incomplete transaction object");

    let thrownError = false;
    let seedHex;
    try {
      seedHex = await WalletMnemonicHandler.getSeedHexFromStoredEncryptedMnemonic(WalletAppState.password);
    } catch (err) {
      throw new Error("Could not derive wallet seed: " + err.message);
    }

    // Pick path based on provider network
    transaction.derivePath = provider.network === 'testnet' ? derivePathTestnet : derivePathMainnet;
    transaction.seedHex = seedHex;

    try {
      // --- BEGIN: fetch UTXOs if missing ---
      if (!transaction.inputs || transaction.inputs.length === 0) {
        let utxos = [];
        const utxoUrl = provider.apiType === 'blockstream'
          ? `${provider.rpcUrl}/address/${transaction.fromAddress}/utxo`
          : `${provider.rpcUrl}/addrs/${transaction.fromAddress}?unspentOnly=true`;

        const utxoRes = await WalletProxyClient.sendRpcViaProxy({
          method: 'GET',
          rpcUrl: utxoUrl
        });

        const [utxoError, utxoMsg] = doesResponseHaveErrors(utxoRes, utxoUrl);
        if (utxoError) throw new Error(utxoMsg);

        if (provider.apiType === 'blockstream') {
          utxos = Array.isArray(utxoRes) ? utxoRes.map(u => ({
            txid: u.txid,
            vout: u.vout,
            value: u.value,
            scriptPubKey: u.scriptpubkey
          })) : [];
        } else if (provider.apiType === 'blockcypher') {
          utxos = utxoRes?.txrefs?.map(u => ({
            txid: u.tx_hash,
            vout: u.tx_output_n,
            value: u.value,
            scriptPubKey: u.script
          })) || [];
        }

        if (!utxos || utxos.length === 0) throw new Error("No UTXOs available for transaction");
        transaction.inputs = utxos;
      }
      // --- END: fetch UTXOs ---

      // --- BEGIN: ensure outputs exist ---
      if (!transaction.outputs || transaction.outputs.length === 0) {
        const sendAmountSats = Math.round(parseFloat(transaction.amount) * 1e8);
        const feeSats = Math.round(parseFloat(transaction.fee || 0) * 1e8);
        const totalInput = transaction.inputs.reduce((sum, i) => sum + Number(i.value || 0), 0);
        const change = totalInput - sendAmountSats - feeSats;

        transaction.outputs = [];
        transaction.outputs.push({ address: transaction.toAddress, amount: sendAmountSats });
        if (change > 0) {
          transaction.outputs.push({ address: transaction.fromAddress, amount: change });
        }
      }
      // --- END: ensure outputs exist ---

      const signedTx = await WalletBtcLib.signTransaction(transaction);

      const txHex = signedTx.trim();
      const url = `${provider.rpcUrl}/${provider.rpcMethods.sendTransaction.method}`;

      const headers = {};
      if (providerApiKey) {
        const headerName = provider.providerApiKeyHeader || 'x-api-key';
        headers[headerName] = providerApiKey;
      }

      const res = await WalletProxyClient.sendRpcViaProxy({
        method: provider.rpcMethods.sendTransaction.getOrPost,
        rpcUrl: url,
        rawBody: txHex,      // plain hex, not JSON
        contentType: "text/plain",
        extraHeaders: headers
      });

      // --- BEGIN: handle Blockstream raw TX hex response ---
      if (typeof res === 'string' && /^[a-fA-F0-9]{64,}$/.test(res.trim())) {
        transaction.txHash = res.trim();
        return transaction.txHash;
      }
      // --- END ---

      const [isError, message] = doesResponseHaveErrors(res, url);
      if (isError) {
        thrownError = true;
        throw new Error(message);
      }

      if (res.result || res.txid || res.id) {
        transaction.txHash = res.result || res.txid || res.id;
        return transaction.txHash;
      }

      thrownError = true;
      throw new Error("No tx hash returned from provider");
    } catch (err) {
      if (thrownError) throw err;
      console.error('[WalletBitcoinUtils] sendTransaction fetch/proxy error:', err);

      // DEBUG: log full error before passing up
      console.log('[WalletBitcoinUtils] throwing error to upper layer:', {
        message: err.message,
        raw: err.raw || err,
        stack: err.stack,
      });

      throw {
        message: `❌ Proxy/network fetch error (sendTransaction): ${err.message}`,
        raw: err.raw || err,
        stack: err.stack,
      };
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
    if (!rpcMethods?.determineDoesDestAddressExist && !rpcMethods.getBalance) {
      throw new Error("RPC method config missing for destination check");
    }

    const headers = {};
    if (providerApiKey) headers[provider.providerApiKeyHeader || 'x-api-key'] = providerApiKey;

    let thrownError = false;
    try {
      let res;

      if (apiType === "jsonrpc") {
        // JSON-RPC style (e.g., NOWNodes / OnFinality)
        const payload = {
          jsonrpc: "2.0",
          id: 1,
          method: rpcMethods.getBalance.method,
          params: [{ addresses: [toAddress] }]
        };

        res = await WalletProxyClient.sendRpcViaProxy({
          method: rpcMethods.getBalance.getOrPost,
          rpcUrl,
          payload,
          extraHeaders: headers
        });

        if (typeof res === "string") {
          try { res = JSON.parse(res); } catch {}
        }

        const [isError, message] = doesResponseHaveErrors(res, rpcUrl);
        if (isError) {
          transaction.destAddressExists = false;
          return;
        }

        transaction.destAddressExists = !!(res?.result?.balance !== undefined);

      } else if (apiType === "blockstream" || apiType === "blockcypher") {
        // REST / address-based style
        let methodPath = rpcMethods.getBalance.method || rpcMethods.getBalance.path;
        if (!methodPath) throw new Error("No getBalance path/method configured");

        let url = methodPath.includes("<address>")
          ? `${rpcUrl}/${methodPath.replace("<address>", toAddress)}`
          : `${rpcUrl}/${methodPath}/${toAddress}`;

        res = await WalletProxyClient.sendRpcViaProxy({
          method: rpcMethods.getBalance.getOrPost || "GET",
          rpcUrl: url,
          payload: {},
          extraHeaders: headers
        });

        if (typeof res === "string") {
          try { res = JSON.parse(res); } catch {}
        }

        const [isError, message] = doesResponseHaveErrors(res, url);
        if (isError) {
          transaction.destAddressExists = false;
          return;
        }

        if (apiType === "blockstream") {
          // Check if balance fields exist
          const funded = res.chain_stats?.funded_txo_sum;
          const spent  = res.chain_stats?.spent_txo_sum;
          transaction.destAddressExists = typeof funded !== "undefined" && typeof spent !== "undefined";
        } else if (apiType === "blockcypher") {
          transaction.destAddressExists = typeof res.final_balance !== "undefined";
        } else {
          transaction.destAddressExists = false;
        }

      } else {
        thrownError = true;
        throw new Error("Unsupported BTC apiType");
      }

    } catch (err) {
      if (thrownError) throw err;
        console.error("Error checking BTC destination address existence:", err);
        throw new Error("Failed to determine if BTC address exists: " + err.message);
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
    //derivePath,
    deriveAddressFromSeedHex,
    testProvider,
    getBalance,
    estimateFee,
    sendTransaction,
    determineDoesDestAddressExist
  };
})();

