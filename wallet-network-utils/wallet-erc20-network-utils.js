// wallet-erc20-network-utils.js
// network utilities for ERC-20 token on Ethereum

const WalletErc20Utils = (function () {
  let _initialized = false;
  const DERIVE_PATH = "m/44'/60'/0'/0/0";

  function zpad32(hexNoPrefix) { return hexNoPrefix.padStart(64, '0'); }
  function strip0x(x) { return x.startsWith('0x') ? x.slice(2) : x; }
  function encodeUint256(amountWei) { return zpad32(strip0x(BigInt(amountWei).toString(16))); }
  function encodeAddress(addr) { return zpad32(strip0x(addr).toLowerCase().padStart(40, '0')); }

  function encodeTransferData(to, amountBaseUnits) {
    return '0xa9059cbb' + encodeAddress(to) + encodeUint256(amountBaseUnits);
  }

  function encodeBalanceOfData(owner) {
    return '0x70a08231' + encodeAddress(owner);
  }

  function doesResponseHaveErrors(res, rpcUrl = 'NO URL') {
    console.debug('[WalletErc20Utils] RPC raw response from', rpcUrl, res);


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

    if (typeof res.result !== 'string') {
      return [ true, `❌ Invalid/missing result field from RPC proxy - ${rpcUrl}` ];
    }

    return [ false, '' ];
  }

  async function fetchGasPrice(provider) {
    return await WalletEthersUtils.fetchGasPrice(provider);
  }

  async function fetchLatestNonce({ provider, address }) {
    return await fetchWhichNonce({ provider, address, whichNonce: "latest" });
  }

  async function fetchPendingNonce({ provider, address }) {
    return await fetchWhichNonce({ provider, address, whichNonce: "pending" });
  }

  async function fetchWhichNonce({ provider, address, whichNonce }) {
    return await WalletEthersUtils.fetchWhichNonce({ provider, address, whichNonce });
  }

  async function deriveAddressFromSeedHex(seedHex, provider) {
    if (typeof WalletEthLib?.getAddressFromSeedHex !== "function") {
      throw new Error("WalletEthLib.getAddressFromSeedHex() not loaded");
    }
    return await WalletEthLib.getAddressFromSeedHex(seedHex, DERIVE_PATH);
  }

  async function getBalance(provider, walletAddress, token) {
    if (!provider) throw new Error("Provider is required");
    const { rpcUrl, rpcMethods } = provider;
    if (!rpcUrl) throw new Error("RPC URL required for balance");
    if (!rpcMethods || !rpcMethods.getBalance) throw new Error("RPC Methods required for balance");
    if (!walletAddress) throw new Error("walletAddress required for balance");
    if (!token) throw new Error("token required for balance");
    const headers = {};

    const method    = rpcMethods.getBalance.method;
    const getOrPost = rpcMethods.getBalance.getOrPost;

    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{
        to: token.contractAddress,
        data: encodeBalanceOfData(walletAddress)
      }, "latest"]
    };

    let thrownError = false;
    try {
      const res = await WalletProxyClient.sendRpcViaProxy({
        method: getOrPost,
        rpcUrl: rpcUrl,
        payload: payload,
        extraHeaders: headers
      });

      const [ isError, message ] = doesResponseHaveErrors(res, rpcUrl);
      if (isError) {
        thrownError = true;
        throw new Error(message);
      }

      return WalletEthLib.formatUnits(BigInt(res.result), token.decimals);

    } catch (err) {
      if (thrownError) throw err;
      console.error('[WalletErc20Utils] getBalance fetch/proxy error:', err);
      const msg = err?.message?.toLowerCase() || "";
      if (msg.includes("timeout")) {
        throw new Error("⏱️ RPC Timeout (getBalance): " + err.message);
      }
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

    const feeMethods = Array.isArray(rpcMethods.getFee) ? rpcMethods.getFee : [rpcMethods.getFee];
    const gasPriceMethod = feeMethods[0];
    const gasLimitMethod = feeMethods[1];

    const gasPriceRpcPayload = {
      jsonrpc: "2.0",
      id: 1,
      method: gasPriceMethod.method,
      params: []
    };

    const estimateGasRpcPayload = {
      jsonrpc: "2.0",
      id: 1,
      method: gasLimitMethod.method,
      params: [{
        from: transaction.fromAddress,
        to: transaction.asset.contractAddress,
        value: "0x0",
        data: encodeTransferData(
          transaction.toAddress,
          // ✅ fix: normalize before parseUnits to avoid "Cannot convert 1e-11 to BigInt"
          WalletEthLib.parseUnits(
            Number(transaction.amount).toLocaleString('fullwide', { useGrouping: false }),
            transaction.asset.decimals
          )
        )
      }]
    };

    let thrownError = false;
    try {
      const gasPriceResp = await WalletProxyClient.sendRpcViaProxy({
        method: gasPriceMethod.getOrPost,
        rpcUrl: provider.rpcUrl,
        payload: gasPriceRpcPayload,
        extraHeaders: {
          'Content-Type': gasPriceMethod.contentType
        }
      });

      const [ isError1, message1 ] = doesResponseHaveErrors(gasPriceResp, rpcUrl);
      if (isError1) {
        thrownError = true;
        throw new Error(`Failed to fetch gas price: ${message1}`);
      }

      const gasPrice = BigInt(gasPriceResp.result);

      const gasEstimateResp = await WalletProxyClient.sendRpcViaProxy({
        method: gasLimitMethod.getOrPost,
        rpcUrl: provider.rpcUrl,
        payload: estimateGasRpcPayload,
        extraHeaders: {
          'Content-Type': gasLimitMethod.contentType
        }
      });

      const [ isError2, message2 ] = doesResponseHaveErrors(gasEstimateResp, rpcUrl);
      if (isError2) {
        thrownError = true;
        throw new Error(`Failed to estimate gas: ${message2}`);
      }

      const gasEstimate = BigInt(gasEstimateResp.result);

      const nonce = await fetchPendingNonce({ provider, address: transaction.fromAddress });

      const totalFeeWei = gasPrice * gasEstimate;

      transaction.gasLimit = gasEstimate;
      transaction.gasFee = WalletEthLib.formatEther(totalFeeWei);
      transaction.fee = transaction.gasFee;
      transaction.gasPrice = gasPrice;
      transaction.chainId = transaction.assetKey;
      transaction.nonce = nonce;

    } catch (err) {
      if (thrownError) throw err;
      throw new Error("❌ Proxy/network fetch error (estimateFee): " + err.message);
    }
  }

  async function sendTransaction(transaction) {
    if (!transaction) throw new Error("Transaction required");
    const provider = transaction.provider;
    if (!provider) throw new Error("Provider missing in transaction");
    const { rpcUrl, rpcMethods } = provider;
    if (!rpcUrl) throw new Error("RPC URL required for send transaction");
    if (!rpcMethods) throw new Error("RPC Methods required for send transaction");

    const token = transaction.asset;
    const amountBaseUnits = WalletEthLib.parseUnits(transaction.amount.toString(), token.decimals);

    let seedHex;
    try {
      seedHex = await WalletMnemonicHandler.getSeedHexFromStoredEncryptedMnemonic(WalletAppState.password);
    } catch (err) {
      throw new Error("Could not derive wallet seed: " + err.message);
    }

    transaction.seedHex = seedHex;
    transaction.derivePath = DERIVE_PATH;
    transaction.amountWei = "0x0"; // no ETH value transferred
    const recipientAddress = transaction.toAddress; // keep the real recipient
    transaction.toAddress = token.contractAddress; // contract is the "to"
    transaction.data = encodeTransferData(recipientAddress, amountBaseUnits);

    const signedTx = await WalletEthLib.signTransaction(transaction);

    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_sendRawTransaction",
      params: [signedTx]
    };

    let thrownError = false;
    try {
      const res = await WalletProxyClient.sendRpcViaProxy({
        method: rpcMethods.sendTransaction.getOrPost,
        rpcUrl: rpcUrl,
        payload
      });

      const [ isError, message ] = doesResponseHaveErrors(res, rpcUrl);
      if (isError) {
        thrownError = true;
        throw new Error(message);
      }

      if (!res?.result) throw new Error("Failed to send transaction");
      transaction.txHash = res.result;
      return res.result;
    } catch (err) {
      if (thrownError) throw err;
      throw new Error("❌ Proxy/network fetch error (sendTransaction): " + err.message);
    }
  }

  async function determineDoesDestAddressExist(transaction) {
    // Just delegate to ETH util for existence check
    return await WalletEthersUtils.determineDoesDestAddressExist(transaction);
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
    deriveAddressFromSeedHex,
    getBalance,
    estimateFee,
    sendTransaction,
    determineDoesDestAddressExist,
    fetchWhichNonce,
    fetchPendingNonce,
    fetchLatestNonce,
    fetchGasPrice
  };
})();

