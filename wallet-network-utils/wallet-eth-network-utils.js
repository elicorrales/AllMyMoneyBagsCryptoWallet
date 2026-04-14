// wallet-eth-network-utils.js
// Utility functions for ethers integration WITHOUT ethers lib

const WalletEthersUtils = (function () {
  let _initialized = false;


  const derivePath = "m/44'/60'/0'/0/0";

  async function deriveAddressFromSeedHex(seedHex, provider) {
    if (typeof WalletEthLib?.getAddressFromSeedHex !== "function") {
      throw new Error("WalletEthLib.getAddressFromSeedHex() is not available. Did you forget to load the script?");
    }

    if (provider.assetName?.toLowerCase() !== 'ethereum') {
      throw new Error('Error deriving address: Wrong asset passed for Ethereum: ' + JSON.stringify(provider, null, 2));
    }

    return await WalletEthLib.getAddressFromSeedHex(seedHex, derivePath);
  }

  function doesResponseHaveErrors(res, rpcUrl = 'NO URL') {

    console.debug('[WalletEthersUtils] RPC raw response from', rpcUrl, res);

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
/*
    if (typeof res.result !== 'string') {
      return [ true, `❌ Invalid/missing result field from RPC proxy - ${rpcUrl}` ];
    }
*/
    // --- NEW dual check for result ---
    let resultPresent = false;

    // Test 1: string
    if (typeof res.result === 'string') {
      resultPresent = true;
    }

    // Test 2: object (non-null, not array)
    if (!resultPresent && typeof res.result === 'object' && res.result !== null) {
      resultPresent = true;
    }

    if (!resultPresent) {
      return [true, `❌ Invalid/missing result field from RPC proxy - ${rpcUrl}`];
    }

    return [ false, '' ];
  }

  async function testProvider(provider) {
    if (!provider?.rpcUrl) {
      throw new Error("RPC URL missing in provider");
    }

    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_blockNumber",
      params: []
    };

    let thrownError = false;

    try {
      const res = await WalletProxyClient.sendRpcViaProxy({
        method: "POST",
        rpcUrl: provider.rpcUrl,
        payload
      });

      const [isError, message] = doesResponseHaveErrors(res, provider.rpcUrl);
      if (isError) {
        thrownError = true;
        throw new Error(message);
      }

      // must be valid hex block number
      if (!res?.result || typeof res.result !== "string") {
        throw new Error("Invalid blockNumber result");
      }

      return {
        ok: true,
        blockNumber: BigInt(res.result).toString()
      };

    } catch (err) {
      if (thrownError) throw err;
      throw new Error("❌ Proxy/network fetch error (testProvider): " + err.message);
    }
  }


  async function getBalance(provider, address) {
    if (!provider) throw new Error("Provider for ETH is required");
    const { rpcUrl, rpcMethods } = provider;
    if (!rpcUrl) throw new Error("RPC URL required for ETH balance");
    if (!rpcMethods || !rpcMethods.getBalance) throw new Error(`RPC Methods required for ${provider.symbol} balance`);
    if (!address) throw new Error("Address required for ETH balance");

    const addrStr = typeof address === 'object' && address.address ? address.address : address;
    const headers = {};

    const method    = rpcMethods.getBalance.method;
    const getOrPost = rpcMethods.getBalance.getOrPost;

    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: method,
      params: [addrStr, "latest"]
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

      return WalletEthLib.formatEther(BigInt(res.result));

    } catch (err) {
      if (thrownError) throw err; // errors from doesResponseHaveErrors already thrown
      console.error('[WalletEthersUtils] getBalance fetch/proxy error:', err);
      // All other errors are network/fetch related (proxy down)
      throw new Error("❌ Proxy/network fetch error (getBalance): " + err.message);
    }
  }

  async function estimateFee(transaction, assetName = null) {
    if (!transaction) throw new Error("Transaction required");
    const provider = transaction.provider;
    if (!provider) throw new Error("Provider missing in transaction");
    const { rpcUrl, rpcMethods } = provider;
    if (!rpcUrl) throw new Error("RPC URL required for fee estimate");
    if (!rpcMethods || !rpcMethods.getFee) throw new Error("RPC Methods required for estimate fee");
    const fromAddress = transaction.fromAddress;
    const toAddress = transaction.toAddress;
    const amount = transaction.amount;

    if (assetName === null) {
      if (provider.assetName?.toLowerCase() !== 'ethereum') {
        throw new Error('Error estimating gas fee: Wrong asset passed for Ethereum: ' + JSON.stringify(provider, null, 2));
      }
    } else { // assetName is NOT null

      if (assetName.toLowerCase() !== 'binance coin') {
        throw new Error('Error estimating gas fee: Wrong asset passed for Binance Coin: ' + JSON.stringify(provider, null, 2));
      }
    }

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
        to: toAddress,
        value: `0x${BigInt(Math.floor(amount * 1e18)).toString(16)}`
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

      const nonce = await fetchPendingNonce({ provider, address: fromAddress });

      const totalFeeWei = gasPrice * gasEstimate;

      transaction.gasLimit = gasEstimate;
      transaction.gasFee = WalletEthLib.formatEther(totalFeeWei);
      transaction.fee = transaction.gasFee;
      transaction.gasPrice = gasPrice;
      transaction.chainId = transaction.assetKey;
      transaction.nonce = nonce;

    } catch (err) {
      if (thrownError) throw err; // errors from doesResponseHaveErrors already thrown
      throw new Error("❌ Proxy/network fetch error (estimateFee): " + err.message);
    }
  }

  async function fetchWhichNonce({ provider, address, whichNonce }) {
    const { rpcUrl, rpcMethods } = provider;
    if (!rpcMethods || !rpcMethods.getNonce) throw new Error("RPC Methods required for get nonce");
    if (!rpcUrl) throw new Error("RPC URL missing in provider");
    if (!address) throw new Error("Address required to fetch nonce");
    if (whichNonce !== "latest" && whichNonce !== "pending") {
      throw new Error('Invalid "whichNonce" value: must be "latest" or "pending"');
    }

    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getTransactionCount",
      params: [address, whichNonce]
    };

    let thrownError = false;
    try {
      const res = await WalletProxyClient.sendRpcViaProxy({
        method: rpcMethods.getNonce.getOrPost,
        rpcUrl: provider.rpcUrl,
        payload: payload
      });

      const [ isError, message ] = doesResponseHaveErrors(res, rpcUrl);
      if (isError) {
        thrownError = true;
        throw new Error(message);
      }

      return BigInt(res.result);
    } catch (err) {
      if (thrownError) throw err; // errors from doesResponseHaveErrors already thrown
      console.error('[WalletEthersUtils] getBalance fetch/proxy error:', err);
      // All other errors are network/fetch related (proxy down)
      throw new Error("❌ Proxy/network fetch error (fetchNonce): " + err.message);
    }

  }

  async function fetchLatestNonce({ provider, address }) {
    return await fetchWhichNonce({ provider, address, whichNonce: "latest" });
  }

  async function fetchPendingNonce({ provider, address }) {
    return await fetchWhichNonce({ provider, address, whichNonce: "pending" });
  }

  async function sendTransaction(transaction) {
    const provider = transaction.provider;

    if (!provider || !transaction.fromAddress || !transaction.toAddress || !transaction.amount) {
      throw new Error("❌ Incomplete transaction object");
    }
    const { rpcUrl, rpcMethods, providerApiKey } = provider;
    if (!rpcMethods || !rpcMethods.sendTransaction) throw new Error("RPC Methods required to send transaction");
    if (!rpcUrl) throw new Error("RPC URL missing in provider");

    const balanceStr = await getBalance(provider, transaction.fromAddress);
    const balanceWei = WalletEthLib.parseEther(balanceStr);
    const amountWei = WalletEthLib.parseEther(transaction.amount.toString());
    const gasCostWei = transaction.gasPrice * transaction.gasLimit;
    const totalRequiredWei = amountWei + gasCostWei;

    if (balanceWei < totalRequiredWei) {
      throw new Error(`❌ Insufficient funds: need ${WalletEthLib.formatEther(totalRequiredWei)}, have ${balanceStr}`);
    }

    transaction.amountWei = amountWei;
    transaction.gasCostWei = gasCostWei;
    transaction.balanceWei = balanceWei;
    transaction.balance = balanceWei.toString();

    let seedHex;
    try {
      seedHex = await WalletMnemonicHandler.getSeedHexFromStoredEncryptedMnemonic(WalletAppState.password);
    } catch (err) {
      throw new Error("Could not derive wallet seed: " + err.message);
    }

    transaction.seedHex = seedHex;
    transaction.derivePath = derivePath;

    const signedTx = await WalletEthLib.signTransaction(transaction);

    const sendPayload = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_sendRawTransaction",
      params: [signedTx]
    };

    const headers = {};
    const contentType = rpcMethods.sendTransaction.contentType;
    if (contentType) headers["Content-Type"] = contentType;
    if (providerApiKey) headers["x-api-key"] = providerApiKey;

    let thrownError = false;
    try {
      const res = await WalletProxyClient.sendRpcViaProxy({
        method: rpcMethods.sendTransaction.getOrPost,
        rpcUrl: rpcUrl,
        payload: sendPayload,
        extraHeaders: headers
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
      if (thrownError) throw err; // errors from doesResponseHaveErrors already thrown
      console.error('[WalletEthersUtils] getBalance fetch/proxy error:', err);
      // All other errors are network/fetch related (proxy down)
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
    if (!rpcUrl || !rpcMethods?.determineDoesDestAddressExist) {
      throw new Error("RPC config incomplete for determineDoesDestAddressExist");
    }

    const method = rpcMethods.determineDoesDestAddressExist.method;
    const getOrPost = rpcMethods.determineDoesDestAddressExist.getOrPost;
    const contentType = rpcMethods.determineDoesDestAddressExist.contentType;
    const payloadFormat = rpcMethods.determineDoesDestAddressExist.payloadFormat;

    const headers = { "Content-Type": contentType };
    if (providerApiKey) headers['x-api-key'] = providerApiKey;

    const payload = {
      jsonrpc: "2.0",
      method,
      params: [toAddress, "latest"],
      id: 1
    };

    let thrownError = false;
    try {
      let res = await WalletProxyClient.sendRpcViaProxy({
        method: getOrPost,
        rpcUrl,
        payload,
        extraHeaders: headers
      });

      const [ isError, message ] = doesResponseHaveErrors(res, rpcUrl);
      if (isError) {
        thrownError = true;
        throw new Error(message);
      }

      const balanceHex = res.result;
      const balance = parseInt(balanceHex, 16);
      transaction.destAddressExists = balance > 0;

    } catch (err) {
      if (thrownError) throw err; // errors from doesResponseHaveErrors already thrown
      console.error('[WalletEthersUtils] getBalance fetch/proxy error:', err);
      // All other errors are network/fetch related (proxy down)
      throw new Error("❌ Proxy/network fetch error (determineDoesDestAddressExist): " + err.message);
    }
  }

  async function queryBlockchainState(transaction) {
    const provider = transaction.provider;

    // The raw params from the dApp (usually [ {to, data}, "latest" ])
    // Allow for empty params (like eth_gasPrice) if not provided
    const params = transaction.params || [];

    if (!provider) throw new Error("Provider required for queryBlockchainState");
    const { rpcUrl, rpcMethods, providerApiKey } = provider;

    if (!rpcMethods || !rpcMethods.queryState) {
      throw new Error(`❌ RPC config 'queryState' missing for: ${provider.providerName || provider.network}`);
    }

    // We use queryState as our 'transport template' (POST, JSON, etc.)
    const methodConfig = rpcMethods.queryState;
    const headers = { "Content-Type": methodConfig.contentType };
    if (providerApiKey) headers['x-api-key'] = providerApiKey;

    // --- THE GENERIC FIX ---
    // If the transaction object has a .method (e.g. 'eth_gasPrice'), use it.
    // Otherwise, fall back to the default in the config (usually 'eth_call').
    const rpcMethodToUse = transaction.method || methodConfig.method;

    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: rpcMethodToUse,
      params: params
    };

    // --- LOGGING ---------
    console.log('[WalletEthersUtils] Preparing to send RPC via proxy:');
    console.log(' - URL:', rpcUrl);
    console.log(' - Method (requested):', rpcMethodToUse);
    console.log(' - Payload:', JSON.stringify(payload, null, 2));
    // ---------------------

    let thrownError = false;
    try {
      const res = await WalletProxyClient.sendRpcViaProxy({
        method: methodConfig.getOrPost,
        rpcUrl: rpcUrl,
        payload: payload,
        extraHeaders: headers
      });

      // --- ADDED LOGGING ---
      console.log('[WalletEthersUtils] Proxy response received:', JSON.stringify(res, null, 2));
      // ---------------------

      // Use your existing error checker
      const [isError, message] = doesResponseHaveErrors(res, rpcUrl);
      if (isError) {
        thrownError = true;
        throw new Error(message);
      }

      // Return raw result (hex string) for dApp/Ethers to decode
      return res.result;

    } catch (err) {
      if (thrownError) throw err;
      console.error('[WalletEthersUtils] queryBlockchainState error:', err);
      throw new Error(`❌ Proxy/network fetch error (${rpcMethodToUse}): ` + err.message);
    }
  }

  async function personalSign(transaction) {
    // dApp params for personal_sign are usually [address, message] or [message, address]
    // We need to extract the actual message string/hex
    const params = transaction.params || [];
    if (params.length < 2) throw new Error("Invalid params for personal_sign");

    // Identify the message (the param that isn't the account address)
    let message = params.find(p => p.toLowerCase() !== transaction.fromAddress.toLowerCase()) || params[0];

    // FIX: If the message is a hex string, convert it to bytes so ethers signs the data, not the string "0x..."
    if (typeof message === 'string' && message.startsWith('0x')) {
      try {
        // Using the Buffer global available via your IanBip39Lib/EthLib context
        const BufferLib = window.IanBip39Lib?.Buffer || window.Buffer;
        if (BufferLib) {
          message = BufferLib.from(message.slice(2), 'hex');
        }
      } catch (e) {
        console.warn("[WalletEthersUtils] Failed to parse message hex, signing as literal string instead.");
      }
    }

    let seedHex;
    try {
      seedHex = await WalletMnemonicHandler.getSeedHexFromStoredEncryptedMnemonic(WalletAppState.password);
    } catch (err) {
      throw new Error("Could not derive wallet seed: " + err.message);
    }

    // 2. Prepare the payload for WalletEthLib
    const signPayload = {
      seedHex,
      derivePath, // "m/44'/60'/0'/0/0" defined at top of file
      message
    };

    // 3. Sign locally and return the hex signature directly
    // This calls the new method we discussed adding to WalletEthLib
    const signature = await WalletEthLib.signMessage(signPayload);
    
    return signature;
  }

  async function signTypedDataV4(transaction) {
    // EIP-712 params are [address, typedData]
    const params = transaction.params || [];
    if (params.length < 2) throw new Error("Invalid params for eth_signTypedData_v4");

    // The second parameter is the structured data (the first is the user address)
    let typedData = params[1];

    // If the dApp sent a JSON string, parse it
    if (typeof typedData === 'string') {
      try {
        typedData = JSON.parse(typedData);
      } catch (e) {
        throw new Error("Failed to parse eth_signTypedData_v4 JSON string");
      }
    }

    let seedHex;
    try {
      seedHex = await WalletMnemonicHandler.getSeedHexFromStoredEncryptedMnemonic(WalletAppState.password);
    } catch (err) {
      throw new Error("Could not derive wallet seed: " + err.message);
    }

    // Prepare the payload for your crypto library
    const signPayload = {
      seedHex,
      derivePath, 
      typedData // Passing the structured object
    };

    // Call the new method in your library (we'll define this next)
    const signature = await WalletEthLib.signTypedData(signPayload);
  
    return signature;
  }


  async function dappSendTransaction(transaction) {
    const provider = transaction.provider;
    const dappTx = transaction.params[0];
    const { rpcUrl, rpcMethods, providerApiKey } = provider;

    // --- sanity: dapp "from" must match wallet ---
    if (dappTx.from && dappTx.from.toLowerCase() !== transaction.fromAddress.toLowerCase()) {
      throw new Error("❌ dApp 'from' does not match active wallet");
    }

    // 1. Get seed
    let seedHex;
    try {
      seedHex = await WalletMnemonicHandler.getSeedHexFromStoredEncryptedMnemonic(WalletAppState.password);
    } catch (err) {
      throw new Error("Could not derive wallet seed: " + err.message);
    }

    // 2. Fetch Nonce 
    const nonce = await fetchPendingNonce({ provider, address: transaction.fromAddress });

      // --- normalize gas field (gas OR gasLimit) ---
      let gasHex = dappTx.gas || dappTx.gasLimit;

    // 3. Ensure we have Gas/Price
    if (!dappTx.gasPrice || !gasHex) {
      const tempTx = { 
        provider, 
        fromAddress: transaction.fromAddress, 
        toAddress: dappTx.to, 
        amount: dappTx.value ? WalletEthLib.formatEther(BigInt(dappTx.value)) : "0"
      };

      await estimateFee(tempTx);

      dappTx.gasPrice = dappTx.gasPrice || `0x${tempTx.gasPrice.toString(16)}`;
      gasHex = gasHex || `0x${tempTx.gasLimit.toString(16)}`;
    }

    if (!gasHex) throw new Error("❌ Missing gas field");

    // 4. Prepare for signing
    const txToSign = {
      toAddress: dappTx.to,
      fromAddress: transaction.fromAddress,
      amountWei: dappTx.value ? BigInt(dappTx.value) : 0n, // safer
      data: dappTx.data || "0x",
      gasLimit: BigInt(gasHex),
      gasPrice: BigInt(dappTx.gasPrice),
      nonce: nonce,
      chainId: provider.chainId,
      provider,
      seedHex,
      derivePath
    };

    // 5. Sign
    const signedTx = await WalletEthLib.signTransaction(txToSign);

    // 6. Broadcast
    const sendConfig = rpcMethods.sendTransaction;
    const sendPayload = {
      jsonrpc: "2.0",
      id: 1,
      method: sendConfig.method,
      params: [signedTx]
    };

    const headers = { "Content-Type": sendConfig.contentType };
    if (providerApiKey) headers["x-api-key"] = providerApiKey;

    const res = await WalletProxyClient.sendRpcViaProxy({
      method: sendConfig.getOrPost,
      rpcUrl: rpcUrl,
      payload: sendPayload,
      extraHeaders: headers
    });

    const [isError, message] = doesResponseHaveErrors(res, rpcUrl);
    if (isError) throw new Error(message);

    return res.result; 
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
    doesResponseHaveErrors,
    testProvider,
    getBalance,
    estimateFee,
    fetchWhichNonce,
    fetchLatestNonce,
    fetchPendingNonce,
    sendTransaction,
    derivePath,
    determineDoesDestAddressExist,
    queryBlockchainState,
    personalSign,
    signTypedDataV4,
    dappSendTransaction,
  };
})();

