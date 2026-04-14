// wallet-multi-network-utils.js
// Wallet multi-network utilities encapsulated in WalletMultiNetworkUtils object

const WalletMultiNetworkUtils = (function () {
  let _initialized = false;

  const nativeAssetChainUtilsMap = {
    ethereum: WalletEthersUtils,
    "binance coin": WalletBscUtils,
    polygon: WalletPolygonUtils,
    solana: WalletSolanaUtils,
    polkadot: WalletPolkadotUtils,
    bitcoin: WalletBtcUtils,
    cardano: WalletCardanoUtils,
    electroneum: WalletElectroneumUtils,
    xrp: WalletXrpUtils,
    stellar: WalletXlmUtils,
  };


  function getAssetNetworkKey(assetProvider) {
    const missing = [];

    if (!assetProvider.chainId) {
      if (!assetProvider.assetName) missing.push("assetName");
      if (!assetProvider.symbol) missing.push("symbol");
      if (!assetProvider.network) missing.push("network");
    }

    if (missing.length > 0) {
      throw new Error(
        `Provider: ${assetProvider.providerName || "Unnamed provider"}\n` +
        `Asset provider misconfigured.\nMissing required field(s): ${missing.join(", ")}`
      );
    }

    if (assetProvider.chainId)
      return `chainId-${assetProvider.chainId}`;

    if (assetProvider.assetName && assetProvider.network)
      return `${assetProvider.assetName.toLowerCase()}-${assetProvider.network.toLowerCase()}`;

    if (assetProvider.symbol && assetProvider.network)
      return `${assetProvider.symbol.toLowerCase()}-${assetProvider.network.toLowerCase()}`;
  }

  async function deriveAllWalletNativeAssetsFromSeedHexAndAssetProviders(seedHex, wallet) {
    WalletAssetProviders.loadMergeUpdateProviders();
    const providerMap = WalletPersistence.assetProviders;
    const providers = Object.values(providerMap);
    if (providers.length === 0) {
      throw new Error("No asset providers are configured. At least one is required to derive addresses.");
    }

    const existing = wallet.derivedAddresses || {};
    const updated = { ...existing };
    for (const provider of providers) {
      const key = getAssetNetworkKey(provider);
      if (updated[key]) continue;

      // Derive address from the crypto-specific child module
      const childUtil = nativeAssetChainUtilsMap[provider.assetName.toLowerCase()];
      //console.log('childUtil:', childUtil);
      if (!childUtil || typeof childUtil.deriveAddressFromSeedHex !== 'function') {
        throw new Error(`No utils (OR NOT LOADED?)  for asset: ${provider.assetName}`);
      }
      let address = null;
      try {
        address = await childUtil.deriveAddressFromSeedHex(seedHex, provider);
      } catch (err) {
        console.error('Address derivation failed:', err);
        throw err;
      }

      if (!provider.networkType) {
        throw new Error(
          `Token/address derivation failed: provider "${provider.providerName || "Unnamed"}" is missing networkType`
        );
      }

      updated[key] = {
        address,
        network: provider.network,          // required
        symbol: provider.symbol,            // required
        assetName: provider.assetName,      // required
        networkType: provider.networkType,  // required
        balance: null,
        error: null,
        lastChecked: null,
        lastCheckedRpcUrl: null,
        ...(provider.chainId !== undefined && { chainId: provider.chainId })
      };
    }

    wallet.derivedAddresses = updated;
  }


  async function testAllAssetProviders(params) {
    const resultsFilter = params?.resultsFilter || 'All';

    WalletAssetProviders.loadMergeUpdateProviders();

    const providers = WalletPersistence.assetProviders || {};
    const statusLines = [];
    let providersTested = 0;
    let providersPassed = 0;
    let providersFailed = 0;
    let providerCount = 0;
    let providerKeyBeingUsed = null;

    await WalletInfoModal.showAndBlock({
      message: "🛑 Hit ESC at any time...",
      details: "..to interrupt provider testing.",
    });

    WalletPageLevelUI.initializeUserEscKey();

    const sortedProviders = Object.entries(providers).sort(
     (a, b) => (a[1].numRpcTries ?? 0) - (b[1].numRpcTries ?? 0)
    );

    for (const [provKey, provider] of sortedProviders) {

      providerKeyBeingUsed = provKey;

      if (WalletPageLevelUI.didUserHitEscKey()) break;

      providersTested++;

      const assetName = provider.assetName?.toLowerCase();
      const utils = nativeAssetChainUtilsMap[assetName];

      await WalletBusyModal.show(
        `Tested:${providersTested}, Passed:${providersPassed}, Failed:${providersFailed}\n🔎 Testing ${provider.symbol || provider.assetName}\nvia ${provider.providerName || provider.network}...`,
        200
      );

      if (!utils || typeof utils.testProvider !== "function") {
        WalletBusyModal.hide();
        providersFailed++;
        statusLines.push(
          `[${++providerCount}] ⚠️ ${provider.assetName} (${provider.symbol}) [${provider.network}] via ${provider.providerName || provider.network}: No testProvider() for asset type`
        );
        continue;
      }

      try {
        const res = await utils.testProvider(provider);

        WalletBusyModal.hide();

        providersPassed++;
        provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
        provider.lastTimeTried = Date.now();
        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
          numRpcTries: provider.numRpcTries,
          lastTimeTried: provider.lastTimeTried
        });

        if (resultsFilter === 'All') {
          statusLines.push(
            `[${++providerCount}] ✅ ${provider.rpcUrl} : ${provider.assetName} (${provider.symbol}) [${provider.network}] via ${provider.providerName||provider.network}:${res?.rawText?res.rawText:JSON.stringify(res)}`);
        }
      } catch (err) {
        WalletBusyModal.hide();
        providersFailed++;
        provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
        provider.lastTimeTried = Date.now();

        if (err?.error === 'TIMEOUT') {
          provider.numRpcTimeoutErrors = (provider.numRpcTimeoutErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
            numRpcTimeoutErrors: provider.numRpcTimeoutErrors,
            numRpcTries: provider.numRpcTries,
            lastTimeTried: provider.lastTimeTried
          });
        } else { // general RPC error
          provider.numRpcGeneralErrors = (provider.numRpcGeneralErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
            numRpcGeneralErrors: provider.numRpcGeneralErrors,
            numRpcTries: provider.numRpcTries,
            lastTimeTried: provider.lastTimeTried
          });
        }

        if (resultsFilter === 'Errors' || resultsFilter === 'All') {
          statusLines.push(
            `[${++providerCount}] ⚠️ ${provider.rpcUrl || 'NO URL'} : ${provider.assetName} (${provider.symbol})[${provider.network}] via ${provider.providerName||provider.network}:${err.rawText||err.message||"Failed"}${err.code ?` [${err.code}]`:""}`
          );
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
    }

    WalletBusyModal.hide();
    return {
      total: providersTested,
      passed: providersPassed,
      failed: providersFailed,
      statusLines
    };
  }


  async function getAllNativeAssetBalances(wallet) {
    const derived = wallet.derivedAddresses || {};
    const providers = WalletPersistence.assetProviders || {};
    const updated = { ...derived };
    const statusLines = [];
    let providerKeyBeingUsed = null;

    await WalletInfoModal.showAndBlock({
      message:"🛑 Hit ESC at any time...",
      details: "..to interrupt getting balance.",
    });

    WalletPageLevelUI.initializeUserEscKey();

    for (const [key, entry] of Object.entries(derived)) {
      if (WalletPageLevelUI.didUserHitEscKey()) break;

      // Get all providers matching this asset key AND that are enabled
      const matchingProviders = Object.entries(providers).filter(([provKey, provider]) => {
        try {
          // New Check: skip if explicitly set to false
          if (provider.enabled === false) return false;
          return getAssetNetworkKey(provider) === key;
        } catch {
          return false;
        }
      });

      if (matchingProviders.length === 0) {
        updated[key] = { ...entry, error: 'No providers found for this asset', lastChecked: Date.now() };
        statusLines.push(`⚠️ ${entry.assetName} (${entry.symbol}) [${entry.network}]: No providers found`);
        continue;
      }

      let balance = null;
      let lastError = null;

      //our first sort: FIRST try those that have never been tried
      matchingProviders.sort((a, b) => ((a[1].numRpcTries ?? 0) - (b[1].numRpcTries ?? 0)));

      for (const [provKey, provider] of matchingProviders) {
        providerKeyBeingUsed = provKey;
        if (WalletPageLevelUI.didUserHitEscKey()) break;

        const utils = nativeAssetChainUtilsMap[provider.assetName.toLowerCase()];
        if (!utils || typeof utils.getBalance !== 'function') {
          const message = `Missing balance fetcher for ${provider.providerName} ${provider.assetName}`;
          lastError = message;
          statusLines.push(`⚠️  ${message}`);
          continue;
        }

        try {
          await WalletBusyModal.show(`🔄 ${provider.symbol} - Fetching balance\nvia ${provider.providerName || provider.network}...`, 200);
          provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
          provider.lastTimeTried = Date.now();
          WalletPersistence.updateAssetProvider(
            providerKeyBeingUsed,
            {
              numRpcTries: provider.numRpcTries,
              lastTimeTried: provider.lastTimeTried
            });
          balance = await utils.getBalance(provider, entry.address);
          WalletBusyModal.hide();

          updated[key] = { ...entry, balance, error: null, lastChecked: Date.now(), lastCheckedRpcUrl: provider.rpcUrl || null };
          statusLines.push(`✅ ${provider.assetName} (${provider.symbol}) [${provider.network}] via ${provider.providerName || provider.network}: ${balance}`);
          lastError = null;
          break; // stop after first success
        } catch (err) {
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

      if (lastError && balance === null) {
        updated[key] = { ...entry, error: lastError, lastChecked: Date.now() };
      }
      // Only push here if no provider-level status was added
      if (!statusLines.some(l => l.includes(entry.assetName) && l.includes(entry.symbol) && l.includes(entry.network))) {
        statusLines.push(`⚠️ ${entry.assetName} (${entry.symbol}) [${entry.network}]: ${lastError}`);
      }
    }

    wallet.derivedAddresses = updated;
    return statusLines;
  }


  async function getBalanceForNativeAsset(transaction) {
    return await WalletMultiNetworkUtilsSendHelper.getBalanceForNativeAsset(
      transaction,
      nativeAssetChainUtilsMap,
      getAssetNetworkKey
    );
  }


  async function determineDoesDestAddressExist(transaction) {
    return await WalletMultiNetworkUtilsSendHelper.determineDoesDestAddressExist(transaction, nativeAssetChainUtilsMap);
  }

  async function getFeeEstimateForNativeAsset(transaction) {
    return await WalletMultiNetworkUtilsSendHelper.getFeeEstimateForNativeAsset(transaction, nativeAssetChainUtilsMap);
  }


  async function sendTransactionForNativeAsset(transaction) {
    return await WalletMultiNetworkUtilsSendHelper.sendTransactionForNativeAsset(transaction, nativeAssetChainUtilsMap);
  }


  async function updateAllAddressesTokensStableCoinsAssetProviders(wallet) {
    const password = WalletAppState.password;
    const encrypted = wallet.encryptedMnemonic;
    const mnemonicString = await WalletCore.decryptMnemonic(encrypted, password);
    const seedHex = WalletMnemonicHandler.getSeedHexFromWords(mnemonicString);
    await deriveAllWalletNativeAssetsFromSeedHexAndAssetProviders(seedHex, wallet);
    const result = await WalletMultiTokenUtils.deriveAllWalletTokens(wallet);
    if (result.isStatusLines && result.statusLines.length > 0) {
      throw { message: "Some tokens could not be derived", result };
    }
  }

  async function queryBlockchainState(transaction) {
    return await WalletMultiNetworkUtilsDappHelper.queryBlockchainState(transaction, nativeAssetChainUtilsMap);
  }

  async function personalSign(transaction) {
    return await WalletMultiNetworkUtilsDappHelper.personalSign(transaction, nativeAssetChainUtilsMap);
  }

  async function signTypedDataV4(transaction) {
    return await WalletMultiNetworkUtilsDappHelper.signTypedDataV4(transaction, nativeAssetChainUtilsMap);
  }

  async function dappSendTransaction(transaction) {
    return await WalletMultiNetworkUtilsDappHelper.dappSendTransaction(transaction, nativeAssetChainUtilsMap);
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
    //chainUtilsMap,
    getAssetNetworkKey,
    deriveAllWalletNativeAssetsFromSeedHexAndAssetProviders,
    testAllAssetProviders,
    getAllNativeAssetBalances,
    getBalanceForNativeAsset,
    getFeeEstimateForNativeAsset,
    sendTransactionForNativeAsset,
    updateAllAddressesTokensStableCoinsAssetProviders,
    determineDoesDestAddressExist,
    queryBlockchainState,
    personalSign,
    signTypedDataV4,
    dappSendTransaction,
  };
})();

