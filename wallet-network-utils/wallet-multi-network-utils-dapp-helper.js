// wallet-multi-network-utils-dapp-helper.js
const WalletMultiNetworkUtilsDappHelper = (function () {

  async function queryBlockchainState(transaction, utilsMap) {
    const provider = transaction.provider;
    let providerKeyBeingUsed = null;

    if (!provider) throw new Error("Provider missing in transaction");

    const utils = utilsMap[provider.assetName?.toLowerCase()];
    if (!utils || typeof utils.queryBlockchainState !== 'function') {
      throw new Error(`Query not supported for: ${provider.assetName}`);
    }

    try {
      await WalletBusyModal.show(`🔍 Querying ${provider.assetName} state...`, 200);

      if (transaction.provKey) {
        providerKeyBeingUsed = transaction.provKey;
        provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTries: provider.numRpcTries });
      }

      const result = await utils.queryBlockchainState(transaction);
       WalletBusyModal.hide();
      return result;

    } catch (err) {
      WalletBusyModal.hide();
      // Persistence error tracking
      if (providerKeyBeingUsed) {
        if (err?.error === 'TIMEOUT') {
          provider.numRpcTimeoutErrors = (provider.numRpcTimeoutErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTimeoutErrors: provider.numRpcTimeoutErrors });
        } else {
          provider.numRpcGeneralErrors = (provider.numRpcGeneralErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcGeneralErrors: provider.numRpcGeneralErrors });
        }
        provider.lastErrorDetails = JSON.stringify({
          message: `${err.rawText || err.message || "Failed"}${err.code ? ` [${err.code}]` : ""}`
        });
        provider.lastTimeWhenError = Date.now();

        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
          lastErrorDetails: provider.lastErrorDetails,
          lastTimeWhenError: provider.lastTimeWhenError
        });
      }
      throw err;
    }
  }


  async function personalSign(transaction, utilsMap) {
    const provider = transaction.provider;
    let providerKeyBeingUsed = null;

    if (!provider) throw new Error("Provider missing in transaction");

    const utils = utilsMap[provider.assetName?.toLowerCase()];
    if (!utils || typeof utils.queryBlockchainState !== 'function') {
      throw new Error(`Query not supported for: ${provider.assetName}`);
    }

    try {
      await WalletBusyModal.show(`🔍 Querying ${provider.assetName} state...`, 200);

      if (transaction.provKey) {
        providerKeyBeingUsed = transaction.provKey;
        provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTries: provider.numRpcTries });
      }

      const result = await utils.personalSign(transaction);
       WalletBusyModal.hide();
      return result;

    } catch (err) {
      WalletBusyModal.hide();
      // Persistence error tracking
      if (providerKeyBeingUsed) {
        if (err?.error === 'TIMEOUT') {
          provider.numRpcTimeoutErrors = (provider.numRpcTimeoutErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTimeoutErrors: provider.numRpcTimeoutErrors });
        } else {
          provider.numRpcGeneralErrors = (provider.numRpcGeneralErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcGeneralErrors: provider.numRpcGeneralErrors });
        }
        provider.lastErrorDetails = JSON.stringify({
          message: `${err.rawText || err.message || "Failed"}${err.code ? ` [${err.code}]` : ""}`
        });
        provider.lastTimeWhenError = Date.now();

        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
          lastErrorDetails: provider.lastErrorDetails,
          lastTimeWhenError: provider.lastTimeWhenError
        });
      }
      throw err;
    }
  }

  async function signTypedDataV4(transaction, utilsMap) {
    const provider = transaction.provider;
    let providerKeyBeingUsed = null;

    if (!provider) throw new Error("Provider missing in transaction");

    const utils = utilsMap[provider.assetName?.toLowerCase()];
    if (!utils || typeof utils.queryBlockchainState !== 'function') {
      throw new Error(`Query not supported for: ${provider.assetName}`);
    }

    try {
      await WalletBusyModal.show(`🔍 Querying ${provider.assetName} state...`, 200);

      if (transaction.provKey) {
        providerKeyBeingUsed = transaction.provKey;
        provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTries: provider.numRpcTries });
      }

      const result = await utils.signTypedDataV4(transaction);
       WalletBusyModal.hide();
      return result;

    } catch (err) {
      WalletBusyModal.hide();
      // Persistence error tracking
      if (providerKeyBeingUsed) {
        if (err?.error === 'TIMEOUT') {
          provider.numRpcTimeoutErrors = (provider.numRpcTimeoutErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTimeoutErrors: provider.numRpcTimeoutErrors });
        } else {
          provider.numRpcGeneralErrors = (provider.numRpcGeneralErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcGeneralErrors: provider.numRpcGeneralErrors });
        }
        provider.lastErrorDetails = JSON.stringify({
          message: `${err.rawText || err.message || "Failed"}${err.code ? ` [${err.code}]` : ""}`
        });
        provider.lastTimeWhenError = Date.now();

        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
          lastErrorDetails: provider.lastErrorDetails,
          lastTimeWhenError: provider.lastTimeWhenError
        });
      }
      throw err;
    }
  }

  async function dappSendTransaction(transaction, utilsMap) {
    const provider = transaction.provider;
    let providerKeyBeingUsed = null;

    if (!provider) throw new Error("Provider missing in transaction");

    const utils = utilsMap[provider.assetName?.toLowerCase()];
    if (!utils || typeof utils.queryBlockchainState !== 'function') {
      throw new Error(`Query not supported for: ${provider.assetName}`);
    }

    try {
      await WalletBusyModal.show(`🔍 Querying ${provider.assetName} state...`, 200);

      if (transaction.provKey) {
        providerKeyBeingUsed = transaction.provKey;
        provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTries: provider.numRpcTries });
      }

      const result = await utils.dappSendTransaction(transaction);
       WalletBusyModal.hide();
      return result;

    } catch (err) {
      WalletBusyModal.hide();
      // Persistence error tracking
      if (providerKeyBeingUsed) {
        if (err?.error === 'TIMEOUT') {
          provider.numRpcTimeoutErrors = (provider.numRpcTimeoutErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTimeoutErrors: provider.numRpcTimeoutErrors });
        } else {
          provider.numRpcGeneralErrors = (provider.numRpcGeneralErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcGeneralErrors: provider.numRpcGeneralErrors });
        }
        provider.lastErrorDetails = JSON.stringify({
          message: `${err.rawText || err.message || "Failed"}${err.code ? ` [${err.code}]` : ""}`
        });
        provider.lastTimeWhenError = Date.now();

        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
          lastErrorDetails: provider.lastErrorDetails,
          lastTimeWhenError: provider.lastTimeWhenError
        });
      }
      throw err;
    }
  }


  return {
    queryBlockchainState,
    personalSign,
    signTypedDataV4,
    dappSendTransaction,
  };
})();
