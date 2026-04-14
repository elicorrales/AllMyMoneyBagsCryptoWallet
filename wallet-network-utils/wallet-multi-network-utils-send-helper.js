// wallet-multi-network-utils-send-helper.js
const WalletMultiNetworkUtilsSendHelper = (function () {
  let _initialized = false;


  function _persistAssetUpdate(asset, transaction) {
    const wm = WalletPersistence.walletManager;
    const key = transaction.assetKey;

    if (wm?.activeWallet && key) {
        // 1. Get a copy of the current addresses map
        const updatedMap = { ...wm.activeWallet.derivedAddresses };
        
        // 2. Insert our updated asset (the one with the new balance and RPC URL)
        updatedMap[key] = asset;
        
        // 3. TRIGGER THE SETTER: This calls saveAllWallets() internally
        wm.activeWallet.derivedAddresses = updatedMap;
    }
  }

  async function getBalanceForNativeAsset(transaction, utilsMap, getKeyFn) {

    let lastProviderTriedIfTheyAllFailed = null;

    const asset = transaction.asset || {};
    const key = transaction.assetKey;

    if (!key) throw new Error(`Key not found: ${key}`);

    const providers = WalletPersistence.assetProviders || {};
    const matchingProviders = Object.entries(providers).filter(([provKey, provider]) => {
      try { 
        // New Check: skip if explicitly disabled
        if (provider.enabled === false) return false; 
        return getKeyFn(provider) === key; 
      } catch { 
        return false; 
      }
    });

    if (matchingProviders.length === 0) throw new Error(`No providers found for asset key: ${key}`);

    let balance = null;
    let lastError = null;
    const statusLines = [];
    let providerKeyBeingUsed = null;

    transaction.fromAddress = asset.address;
    WalletPageLevelUI.initializeUserEscKey();

    // Try previously successful provider first
    const lastRpcUrl = asset.lastCheckedRpcUrl;
    if (lastRpcUrl) {
      const preferredProviderEntry = matchingProviders.find(([key, prov]) => prov.rpcUrl === lastRpcUrl);
      const preferredProvider = preferredProviderEntry ? preferredProviderEntry[1] : undefined;

      // Preferred Path: Only attempt if preferred exists AND its most recent use wasn't an error
      if (preferredProvider) {
        const prefLastTried = preferredProvider.lastTimeTried || 0;
        const prefLastError = preferredProvider.lastTimeWhenError || 0;
        const prefIsError = prefLastError > prefLastTried;

        if (!prefIsError) {
          // FIX: Set the tracker variable here
          providerKeyBeingUsed = preferredProviderEntry[0];

          const utils = utilsMap[preferredProvider.assetName.toLowerCase()];
          if (utils && typeof utils.getBalance === 'function') {
            try {
              await WalletBusyModal.show(`🔄 Fetching balance for ${transaction.asset.assetName}\n via ${preferredProvider.name || preferredProvider.network}...`, 200);
              transaction.provKey = providerKeyBeingUsed;

              balance = await utils.getBalance(preferredProvider, transaction.fromAddress);

              // if SUCCESS
              preferredProvider.numRpcTries = (preferredProvider.numRpcTries ?? 0) + 1;
              WalletPersistence.updateAssetProvider(
                providerKeyBeingUsed,
                {
                  numRpcTries: preferredProvider.numRpcTries,
                  lastTimeTried: Date.now()
              });

              WalletBusyModal.hide();

              Object.assign(asset, { balance, error: null, lastChecked: Date.now(), lastCheckedRpcUrl: preferredProvider.rpcUrl });

              _persistAssetUpdate(asset, transaction);

              statusLines.push(`✅ ${preferredProvider.assetName} (${preferredProvider.symbol}) [${preferredProvider.network}] via ${preferredProvider.name || preferredProvider.network}: ${balance}`);
              transaction.provider = preferredProvider;
              transaction.asset = asset;
              //return { balance, statusLines };
              return { balance, statusLines, provider: preferredProvider }; // <--- ADD THIS
            } catch (err) {
              lastProviderTriedIfTheyAllFailed = preferredProvider; // <--- add this

              preferredProvider.numRpcTries = (preferredProvider.numRpcTries ?? 0) + 1;
              WalletPersistence.updateAssetProvider(
                providerKeyBeingUsed,
                {
                  numRpcTries: preferredProvider.numRpcTries,
                  lastTimeTried: Date.now()
              });
              if (err?.error && err.error === 'TIMEOUT') {
                preferredProvider.numRpcTimeoutErrors = (preferredProvider.numRpcTimeoutErrors ?? 0) + 1;
                WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTimeoutErrors: preferredProvider.numRpcTimeoutErrors });
              } else { // some other error
                preferredProvider.numRpcGeneralErrors = (preferredProvider.numRpcGeneralErrors ?? 0) + 1;
                WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcGeneralErrors: preferredProvider.numRpcGeneralErrors });
              }
              WalletBusyModal.hide();
              lastError = err.message || 'Failed to fetch balance';
              statusLines.push(`⚠️ Preferred provider failed: ${preferredProvider.assetName} (${preferredProvider.symbol}) [${preferredProvider.network}] via ${preferredProvider.name || preferredProvider.network}: ${lastError}`);

              preferredProvider.lastErrorDetails = JSON.stringify({
                message: `${err.rawText || err.message || "Failed"}${err.code ? ` [${err.code}]` : ""}`
              });
              preferredProvider.lastTimeWhenError = Date.now();

              WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
                lastErrorDetails: preferredProvider.lastErrorDetails,
                lastTimeWhenError: preferredProvider.lastTimeWhenError
              });
            }
          }
        }
      }
    }

    // Failover Path: Sort remaining by least tried (Round Robin effect)
    matchingProviders.sort((a, b) => (a[1].numRpcTries ?? 0) - (b[1].numRpcTries ?? 0));

    // Fall back to iterating all providers
    for (const [provKey, provider] of matchingProviders) {
      // Update the tracker variable with the current key
      providerKeyBeingUsed = provKey;

      if (WalletPageLevelUI.didUserHitEscKey()) {break;}

      // Skip the provider we just tried in the Preferred Path if it's currently in error state
      // (This avoids double-trying a failing preferred provider in the same call)
      if (provider.rpcUrl === lastRpcUrl && (provider.lastTimeWhenError > provider.lastTimeTried)) continue;

      const utils = utilsMap[provider.assetName.toLowerCase()];
      if (!utils || typeof utils.getBalance !== 'function') {
        lastError = 'Missing balance fetcher';
        statusLines.push(`⚠️ Missing balance fetcher for provider: ${provider.providerName || provider.network}`);
        continue;
      }

      try {
        await new Promise(r => setTimeout(r, 300)); // optional delay
        await WalletBusyModal.show(`🔄 ${provider.symbol} - Fetching balance\nvia ${provider.providerName || provider.network}...`, 200);

        balance = await utils.getBalance(provider, transaction.fromAddress);

        provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
        WalletPersistence.updateAssetProvider(
          providerKeyBeingUsed,
          {
            numRpcTries: provider.numRpcTries,
            lastTimeTried: Date.now()
        });

        WalletBusyModal.hide();

        Object.assign(asset, {
          balance,
          error: null,
          lastChecked: Date.now(),
          lastCheckedRpcUrl: provider.rpcUrl,
        });

        _persistAssetUpdate(asset, transaction);

        statusLines.push(`✅ ${provider.assetName} (${provider.symbol}) [${provider.network}] via ${provider.providerName || provider.network}: ${balance}`);
        lastError = null;
        transaction.provider = provider; // lock in this provider
        transaction.provKey = provKey;
        break; // stop after first success
      } catch (err) {

        lastProviderTriedIfTheyAllFailed = provider;

        provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
        WalletPersistence.updateAssetProvider(
          providerKeyBeingUsed,
          {
            numRpcTries: provider.numRpcTries,
            lastTimeTried: Date.now()
        });
        if (err?.error && err.error === 'TIMEOUT') {
          provider.numRpcTimeoutErrors = (provider.numRpcTimeoutErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTimeoutErrors: provider.numRpcTimeoutErrors });
        } else { // some other error
          provider.numRpcGeneralErrors = (provider.numRpcGeneralErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcGeneralErrors: provider.numRpcGeneralErrors });
        }
        WalletBusyModal.hide();
        lastError = err.message || 'Failed to fetch balance';
        statusLines.push(`⚠️ ${provider.assetName} (${provider.symbol}) [${provider.network}] via ${provider.providerName || provider.network}: ${lastError}`);

        provider.lastErrorDetails = JSON.stringify({
          message: `${err.rawText || err.message || "Failed"}${err.code ? ` [${err.code}]` : ""}`
        });

        provider.lastTimeWhenError = Date.now();

        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
          lastErrorDetails: provider.lastErrorDetails,
          lastTimeWhenError: provider.lastTimeWhenError
        });
      }


    }

    if (lastError) {
      asset.error = lastError;
      if (balance === null) {
        Object.assign(asset, {
          error: lastError,
          lastChecked: Date.now(),
          lastCheckedRpcUrl: lastProviderTriedIfTheyAllFailed?.rpcUrl || null
        });
        _persistAssetUpdate(asset, transaction);
        throw { message: `Failed to fetch balance: ${lastError}`, statusLines };
      }
    }

    // Return status lines for UI or logs
    //return { asset, statusLines };
    return { asset, statusLines, balance, provider: transaction.provider }; // <--- AND THIS
  }


  async function determineDoesDestAddressExist(transaction, utilsMap) {
    const statusLines = [];
    let lastError = null;
    let providerKeyBeingUsed = null;

    if (!transaction) throw new Error("Transaction required");
    const provider = transaction.provider;
    if (!provider) throw new Error("Provider missing in transaction");

    const utils = utilsMap[provider.assetName?.toLowerCase()];
    if (!utils || typeof utils.determineDoesDestAddressExist !== 'function') {
      throw new Error(`Network utils missing determineDoesDestAddressExist for: ${provider.assetName}`);
    }

    try {
      providerKeyBeingUsed = transaction?.provKey || provider?.provKey;
      if (!providerKeyBeingUsed) {
        throw new Error(`ProvKey missing determineDoesDestAddressExist for: ${provider.assetName}`);
      }

      await utils.determineDoesDestAddressExist(transaction);

      provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
      WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
        numRpcTries: provider.numRpcTries,
        lastTimeTried: Date.now()
      });
    } catch (err) {

      WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
        numRpcTries: provider.numRpcTries,
        lastTimeTried: Date.now()
      });

      if (err?.error && err.error === 'TIMEOUT') {
        provider.numRpcTimeoutErrors = (provider.numRpcTimeoutErrors ?? 0) + 1;
        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTimeoutErrors: provider.numRpcTimeoutErrors });
      } else { // some other error
        provider.numRpcGeneralErrors = (provider.numRpcGeneralErrors ?? 0) + 1;
        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcGeneralErrors: provider.numRpcGeneralErrors });
      }
      
      WalletBusyModal.hide();
      lastError = err.message || 'Failed to determine if address exists';
      statusLines.push(`⚠️ ${provider.assetName} (${provider.symbol}) [${provider.network}] via ${provider.providerName || provider.network}: ${lastError}`);

      provider.lastErrorDetails = JSON.stringify({
        message: `${err.rawText || err.message || "Failed"}${err.code ? ` [${err.code}]` : ""}`
      });

      provider.lastTimeWhenError = Date.now();

      WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
        lastErrorDetails: provider.lastErrorDetails,
        lastTimeWhenError: provider.lastTimeWhenError
      });

      throw { message: lastError, statusLines };
    }
  }

  async function getFeeEstimateForNativeAsset(transaction, utilsMap) {
    const statusLines = [];
    let lastError = null;
    let providerKeyBeingUsed = null;

    if (!transaction.provider) {
      throw new Error("Provider not set on transaction for fee estimate");
    }

    const provider = transaction.provider;
    const utils = utilsMap[provider.assetName.toLowerCase()];

    if (!utils || typeof utils.estimateFee !== 'function') {
      throw new Error(`Estimate fee not supported for provider: ${provider.assetName}`);
    }

    transaction.fromAddress = transaction.asset.address;

    try {
      providerKeyBeingUsed = transaction?.provKey || provider?.provKey;
      if (!providerKeyBeingUsed) {
        throw new Error(`ProvKey missing determineDoesDestAddressExist for: ${provider.assetName}`);
      }

      await utils.estimateFee(transaction);

      provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
      WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
        numRpcTries: provider.numRpcTries,
        lastTimeTried: Date.now()
      });

    } catch (err) {
      provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
      WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
        numRpcTries: provider.numRpcTries,
        lastTimeTried: Date.now()
      });
      console.error(err);
      lastError = err?.message || 'Failed to estimate fee';

      if (err?.error && err.error === 'TIMEOUT') {
        provider.numRpcTimeoutErrors = (provider.numRpcTimeoutErrors ?? 0) + 1;
        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTimeoutErrors: provider.numRpcTimeoutErrors });
      } else { // some other error
        provider.numRpcGeneralErrors = (provider.numRpcGeneralErrors ?? 0) + 1;
        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcGeneralErrors: provider.numRpcGeneralErrors });
      }

      statusLines.push(`⚠️ ${provider.assetName} (${provider.symbol}) [${provider.network}] via ${provider.providerName || provider.network}: ${lastError}`);

      provider.lastErrorDetails = JSON.stringify({
        message: `${err.rawText || err.message || "Failed"}${err.code ? ` [${err.code}]` : ""}`
      });

      provider.lastTimeWhenError = Date.now();

      WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
        lastErrorDetails: provider.lastErrorDetails,
        lastTimeWhenError: provider.lastTimeWhenError
      });

      throw { message: lastError, statusLines };
    }
  }

  async function sendTransactionForNativeAsset(transaction, utilsMap) {
    const statusLines = [];
    let providerKeyBeingUsed = null;
    if (
      !transaction ||
      typeof transaction !== 'object' ||
      !transaction.provider ||
      !transaction.toAddress ||
      !transaction.amount ||
      !transaction.fromAddress
    ) {
      throw new Error("❌ Incomplete transaction data");
    }

    const provider = transaction.provider;
    const utils = utilsMap[provider.assetName?.toLowerCase()];
    if (!utils || typeof utils.sendTransaction !== 'function') {
      throw new Error(`❌ Network not supported for sending: ${provider.assetName}`);
    }

    try {

      providerKeyBeingUsed = transaction?.provKey || provider?.provKey;
      if (!providerKeyBeingUsed) {
        throw new Error(`ProvKey missing determineDoesDestAddressExist for: ${provider.assetName}`);
      }

      // 🚀 Proceed
      await utils.sendTransaction(transaction);

      provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
      WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
        numRpcTries: provider.numRpcTries,
        lastTimeTried: Date.now()
      });

    } catch (err) {
      WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
        numRpcTries: provider.numRpcTries,
        lastTimeTried: Date.now()
      });

      const fullMessage = err?.message || 'Failed to send transaction';


      if (err?.error === 'TIMEOUT') {
        provider.numRpcTimeoutErrors = (provider.numRpcTimeoutErrors ?? 0) + 1;
        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTimeoutErrors: provider.numRpcTimeoutErrors });
      } else { // some other error
        provider.numRpcGeneralErrors = (provider.numRpcGeneralErrors ?? 0) + 1;
        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcGeneralErrors: provider.numRpcGeneralErrors });
      }


      const statusLine = `⚠️ ${provider.assetName} (${provider.symbol}) [${provider.network}] via ${provider.providerName || provider.network}: ${fullMessage}`;
      statusLines.push(statusLine);

      console.log('[WalletMultiTokenUtils] error before throwing to UI:', {
        message: fullMessage,
        statusLines,
        raw: err?.raw || err,
        stack: err?.stack,
      });


      provider.lastErrorDetails = JSON.stringify({
        message: `${err.rawText || err.message || "Failed"}${err.code ? ` [${err.code}]` : ""}`
      });

      provider.lastTimeWhenError = Date.now();

      WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
        lastErrorDetails: provider.lastErrorDetails,
        lastTimeWhenError: provider.lastTimeWhenError
      });

      // preserve raw and stack if available
      throw {
        message: fullMessage,
        statusLines,
        raw: err?.raw || err,
        stack: err?.stack,
      };
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
    getBalanceForNativeAsset,
    determineDoesDestAddressExist,
    getFeeEstimateForNativeAsset,
    sendTransactionForNativeAsset,
  };
})();
