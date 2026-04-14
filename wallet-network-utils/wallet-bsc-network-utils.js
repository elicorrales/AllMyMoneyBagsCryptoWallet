// wallet-bsc-network-utils.js

const WalletBscUtils = (function () {
  let _initialized = false;

  const derivePath = "m/44'/60'/0'/0/0";

  async function deriveAddressFromSeedHex(seedHex, provider) {
    if (typeof WalletEthLib?.getAddressFromSeedHex !== "function") {
      throw new Error("WalletEthLib.getAddressFromSeedHex() is not available. Did you forget to load the script?");
    }

    if (provider.assetName?.toLowerCase() !== 'binance coin') {
      throw new Error('Error deriving address: Wrong asset passed for BSC: ' + JSON.stringify(provider, null, 2));
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

    if (typeof res.result !== 'string') {
      return [ true, `❌ Invalid/missing result field from RPC proxy - ${rpcUrl}` ];
    }

    return [ false, '' ];
  }

  async function testProvider(provider) {
    return await WalletEthersUtils.testProvider(provider);
  }

  async function getBalance(provider, address) {
    return await WalletEthersUtils.getBalance(provider, address);
  }

  async function estimateFee(transaction) {
    return await WalletEthersUtils.estimateFee(transaction, 'binance coin');
  }

  async function fetchWhichNonce({ provider, address, whichNonce }) {
    return await WalletEthersUtils.fetchWhichNonce({ provider, address, whichNonce });
  }

  async function fetchLatestNonce({ provider, address }) {
    return await WalletEthersUtils.fetchLatestNonce({ provider, address });
  }

  async function fetchPendingNonce({ provider, address }) {
    return await WalletEthersUtils.fetchWhichNonce({ provider, address, whichNonce: "pending" });
  }

  async function sendTransaction(transaction) {
    return await WalletEthersUtils.sendTransaction(transaction);
  }

  async function determineDoesDestAddressExist(transaction) {
    return await WalletEthersUtils.determineDoesDestAddressExist(transaction);
  }

  async function queryBlockchainState(provider, params) {
    return await WalletEthersUtils.queryBlockchainState(provider, params);
  }

  async function personalSign(provider, params) {
    return await WalletEthersUtils.personalSign(provider, params);
  }

  async function signTypedDataV4(provider, params) {
    return await WalletEthersUtils.signTypedDataV4(provider, params);
  }

  async function dappSendTransaction(transaction) {
    return await WalletEthersUtils.dappSendTransaction(transaction);
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

