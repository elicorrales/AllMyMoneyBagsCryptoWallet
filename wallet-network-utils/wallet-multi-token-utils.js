// wallet-multi-token-utils.js
// Wallet multi-token utilities encapsulated in WalletMultiTokenUtils object

const WalletMultiTokenUtils = (function () {
  let _initialized = false;

  const tokenChainUtilsMap = {
    ethereum: WalletErc20Utils,
    "binance coin": WalletErc20Utils,
  };

  async function deriveAllWalletTokens(wallet) {
    const possibilities = await WalletTokenPossibilities.loadMergeUpdateTokenPossibilities();
    if (!possibilities) return [];

    if (!wallet.derivedTokens) wallet.derivedTokens = {};
    if (!wallet.derivedStableCoins) wallet.derivedStableCoins = {};

    const updatedTokens = { ...wallet.derivedTokens };
    const updatedStable = { ...wallet.derivedStableCoins };
    const statusLines = [];

    // Track tokens that actually got matched
    const matchedTokenKeys = new Set();
    const partialMatchReasons = {}; // Track why a token failed (e.g., network mismatch)

    for (const [addressKey, derived] of Object.entries(wallet.derivedAddresses || {})) {
      const network = derived.network?.toLowerCase();
      const networkType = derived.networkType?.toLowerCase();
      const symbol = derived.symbol?.toUpperCase();

      // Filter token possibilities that match this derived address AND chain
      const matchingTokens = Object.values(possibilities).filter(possibility => {
        const pNetwork = possibility.network?.toLowerCase();
        const pType = possibility.networkType?.toLowerCase();
        const pSymbol = possibility.assetSymbol?.toUpperCase();

        const isFullMatch = pNetwork === network && pType === networkType && pSymbol === symbol;

        // Diagnostic: If it's not a full match, check if it's a "Network Mismatch"
        if (!isFullMatch && pSymbol === symbol) {
          const tokenID = possibility.contractAddress.toLowerCase();
          if (!partialMatchReasons[tokenID]) partialMatchReasons[tokenID] = [];
          partialMatchReasons[tokenID].push(`Expected ${pNetwork}, but provider is ${network}`);
        }

        return isFullMatch;
      });

      // All matching tokens are added
      for (const token of matchingTokens) {
        const key = composeWalletTokenKey(addressKey, token);
        matchedTokenKeys.add(token.contractAddress.toLowerCase());
        const target = token.isStableCoin ? updatedStable : updatedTokens;
        if (target[key]) continue; // already exists
        target[key] = {
          ...token,
          balance: null,
          lastChecked: null,
          lastCheckedRpcUrl: null,
          error: null,
          address: derived.address,
          ...(derived.chainId !== undefined && { chainId: derived.chainId }),

        };
      }
    }

    // At the end, warn for tokens that never matched any derived address
    Object.values(possibilities).forEach(tok => {
      const tokID = tok.contractAddress.toLowerCase();
      if (!matchedTokenKeys.has(tokID)) {
        const reasons = partialMatchReasons[tokID];
        let detail = "No matching native asset provider found";
        
        if (reasons && reasons.length > 0) {
          // Join unique reasons to avoid redundancy
          detail = `Network mismatch: ${[...new Set(reasons)].join(", ")}`;
        }

        // Push as single-line string for clean display
        statusLines.push(`⚠️ Token "${tok.tokenName}" (${tok.tokenSymbol}) could not be derived: ${detail}`);
      }
    });

    wallet.derivedTokens = updatedTokens;
    wallet.derivedStableCoins = updatedStable;

    // Return as single string with newlines for direct UI display
    return {
      isStatusLines: true,
      statusLines
    };
  }

  // this key is to uniquely save a token into a wallet.
  // not token metadata, but actual token values such
  // as balance, last time checked, which provider or url,
  // any errors, etc.
  function composeWalletTokenKey(walletAddress, tokenPossibility) {
    if (
      !walletAddress ||
      !tokenPossibility.contractAddress ||
      !tokenPossibility.network ||
      !tokenPossibility.networkType ||
      !tokenPossibility.assetSymbol
    ) {
      throw new Error("Missing required field(s) for token key: " + JSON.stringify(tokenPossibility));
    }

    return [
      walletAddress.toLowerCase(),
      tokenPossibility.contractAddress.toLowerCase(),
      tokenPossibility.network.toLowerCase(),
      tokenPossibility.networkType.toLowerCase(),
      tokenPossibility.assetSymbol.toUpperCase(),
      tokenPossibility.isStableCoin ? "stable" : "token",
    ].join("::");
  }

  async function getAllTokenAssetBalances(wallet, tokenOrStableCoin = 'tokens') {
    let derivedTokens;
    if (tokenOrStableCoin === 'tokens') {
      derivedTokens = wallet.derivedTokens || {};
    } else if (tokenOrStableCoin === 'stablecoins') {
      derivedTokens = wallet.derivedStableCoins || {};
    } else {
      throw new Error(`❌ getAllTokenAssetBalances():Unknown type token ${tokenOrStableCoin}`);
    }

    const providers = WalletPersistence.assetProviders || {};

    const updatedTokens = { ...derivedTokens };
    const statusLines = [];
    let providerKeyBeingUsed = null;

    await WalletInfoModal.showAndBlock({
      message:"🛑 Hit ESC at any time...",
      details: "..to interrupt getting balance.",
    });

    WalletPageLevelUI.initializeUserEscKey();

    for (const [tokenKey, token] of Object.entries(derivedTokens)) {
      if (WalletPageLevelUI.didUserHitEscKey()) {break;}

      // Find providers that match the token's network, type, and native asset symbol
      const matchingProviders = Object.entries(providers).filter(([provKey, provider]) =>
        provider.symbol === token.assetSymbol &&
        provider.network?.toLowerCase() === token.network?.toLowerCase() &&
        provider.networkType?.toLowerCase() === token.networkType?.toLowerCase()
      );

      if (matchingProviders.length === 0) {
        updatedTokens[tokenKey] = {
          ...token,
          error: 'No providers found for this token',
          lastChecked: Date.now(),
        };
        statusLines.push(`⚠️ ${token.tokenName} (${token.tokenSymbol}) [${token.network}]: No providers found`);
        continue;
      }

      // Sort providers to try ones with fewer RPC attempts first
      matchingProviders.sort((a, b) => ((a[1].numRpcTries ?? 0) - (b[1].numRpcTries ?? 0)));

      let balance = null;
      let lastError = null;

      for (const [provKey, provider] of matchingProviders) {
        providerKeyBeingUsed = provKey;
        if (WalletPageLevelUI.didUserHitEscKey()) {break;}

        const utils = tokenChainUtilsMap[provider.assetName.toLowerCase()];
        if (!utils || typeof utils.getBalance !== 'function') {
          const message = `${token.tokenSymbol}: Missing balance fetcher for ${provider.providerName} ${provider.assetName}`;
          lastError = message;
          statusLines.push(`⚠️  ${message}`);
          continue;
        }

        try {
          await WalletBusyModal.show(`🔄 ${token.tokenSymbol} - Fetching balance\nvia ${provider.providerName || provider.network}...`, 200);
          provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
          provider.lastTimeTried = Date.now();
          WalletPersistence.updateAssetProvider(
            providerKeyBeingUsed, 
            {
              numRpcTries: provider.numRpcTries,
              lastTimeTried: provider.lastTimeTried
            });

          const walletAddress = token.address;

          balance = await utils.getBalance(provider, walletAddress, token);

          WalletBusyModal.hide();

          updatedTokens[tokenKey] = {
            ...token,
            balance,
            error: null,
            lastChecked: Date.now(),
            lastCheckedRpcUrl: provider.rpcUrl || null,
          };

          statusLines.push(`✅ ${token.tokenName} (${token.tokenSymbol}) [${token.network}] via ${provider.providerName || provider.network}: ${balance}`);
          lastError = null;
          break; // stop after first successful provider
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
          statusLines.push(`⚠️ ${token.tokenName} (${token.tokenSymbol}) [${token.network}] via ${provider.providerName || provider.network}: ${lastError}`);

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
        updatedTokens[tokenKey] = {
          ...token,
          error: lastError,
          lastChecked: Date.now(),
        };
      }
      // Only push here if no provider-level status was added
      if (!statusLines.some(l => l.includes(token.tokenName) && l.includes(token.tokenSymbol) && l.includes(token.network))) {
        statusLines.push(`⚠️ ${token.tokenName} (${token.tokenSymbol}) [${token.network}]: ${lastError}`);
      }
    }

    if (tokenOrStableCoin === 'tokens') {
      wallet.derivedTokens = updatedTokens;
    } else if (tokenOrStableCoin === 'stablecoins') {
      wallet.derivedStableCoins = updatedTokens;
    } else {
      throw new Error(`❌ getAllTokenAssetBalances():Unknown type token ${tokenOrStableCoin}`);
    }

    return statusLines;
  }

  async function getBalanceForTokenAsset(transaction) {
    const token = transaction.asset || {};
    const key = transaction.assetKey;

    if (!key) throw new Error(`Key not found: ${key}`);

    const providers = WalletPersistence.assetProviders || {};
    const matchingProviders = Object.entries(providers).filter(([provKey,provider]) =>
      provider.symbol === token.assetSymbol &&
      provider.network?.toLowerCase() === token.network?.toLowerCase() &&
      provider.networkType?.toLowerCase() === token.networkType?.toLowerCase()
    );

    if (matchingProviders.length === 0) throw new Error(`No providers found for asset key: ${key}`);

    let balance = null;
    let lastError = null;
    const statusLines = [];
    let providerKeyBeingUsed = null;

    transaction.fromAddress = token.address;

    WalletPageLevelUI.initializeUserEscKey();

    // Try previously successful provider first
    const lastRpcUrl = token.lastCheckedRpcUrl;
    if (lastRpcUrl) {
      const preferredProviderEntry = matchingProviders.find(([key, prov]) => prov.rpcUrl === lastRpcUrl);
      const preferredProvider = preferredProviderEntry ? preferredProviderEntry[1] : undefined;
      if (preferredProvider) {
        // FIX: Set the tracker variable here
        providerKeyBeingUsed = preferredProviderEntry[0];

        const utils = tokenChainUtilsMap[preferredProvider.assetName.toLowerCase()];
        if (utils && typeof utils.getBalance === 'function') {
          try {
            await WalletBusyModal.show(`🔄 Fetching balance for ${transaction.asset.tokenName}\n via ${preferredProvider.name || preferredProvider.network}...`);
            transaction.provKey = providerKeyBeingUsed;
            preferredProvider.numRpcTries = (preferredProvider.numRpcTries ?? 0) + 1;
            WalletPersistence.updateAssetProvider(
              providerKeyBeingUsed,
              {
                numRpcTries: preferredProvider.numRpcTries,
                lastTimeTried: Date.now()
            });
            balance = await utils.getBalance(preferredProvider, transaction.fromAddress, token);
            WalletBusyModal.hide();

            Object.assign(token, {
              balance,
              error: null,
              lastChecked: Date.now(),
              lastCheckedRpcUrl: preferredProvider.rpcUrl || null,
            });

            statusLines.push(`✅ ${preferredProvider.assetName} (${preferredProvider.symbol}) [${preferredProvider.network}] via ${preferredProvider.name || preferredProvider.network}: ${balance}`);
            transaction.provider = preferredProvider;
            transaction.asset = token;
            return { token, statusLines };
          } catch (err) {
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

            provider.lastErrorDetails = JSON.stringify({
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

    // Fall back to iterating all providers
    for (const [provKey, provider] of matchingProviders) {
      providerKeyBeingUsed = provKey;

      if (WalletPageLevelUI.didUserHitEscKey()) {break;}

      const utils = tokenChainUtilsMap[provider.assetName.toLowerCase()];
      if (!utils || typeof utils.getBalance !== 'function') {
        lastError = 'Missing balance fetcher';
        statusLines.push(`⚠️ Missing balance fetcher for provider: ${provider.providerName || provider.network}`);
        continue;
      }

      try {
        await new Promise(r => setTimeout(r, 200)); // optional delay
        await WalletBusyModal.show(`🔄 ${provider.symbol} - Fetching balance\nvia ${provider.providerName || provider.network}...`);

        provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
        WalletPersistence.updateAssetProvider(
          providerKeyBeingUsed,
          {
            numRpcTries: provider.numRpcTries,
            lastTimeTried: Date.now()
        });
        balance = await utils.getBalance(provider, transaction.fromAddress, token);
        WalletBusyModal.hide();

        Object.assign(token, {
          balance,
          error: null,
          lastChecked: Date.now(),
          lastCheckedRpcUrl: provider.rpcUrl || null,
        });

        statusLines.push(`✅ ${provider.assetName} (${provider.symbol}) [${provider.network}] via ${provider.providerName || provider.network}: ${balance}`);
        lastError = null;
        transaction.provider = provider; // lock in this provider
        transaction.provKey = provKey;
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

    if (lastError) {
      token.error = lastError;
      if (balance === null) {
        throw { message: `Failed to fetch balance: ${lastError}`, statusLines };
      }
    }

    // Return status lines for UI or logs
    return { token, statusLines };
  }

  async function determineDoesDestAddressExist(transaction) {
    const statusLines = [];
    let lastError = null;
    let providerKeyBeingUsed = null;

    if (!transaction) throw new Error("Transaction required");
    const provider = transaction.provider;
    if (!provider) throw new Error("Provider missing in transaction");

    const utils = tokenChainUtilsMap[provider.assetName?.toLowerCase()];
    if (!utils || typeof utils.determineDoesDestAddressExist !== 'function') {
      throw new Error(`Network utils missing determineDoesDestAddressExist for: ${provider.assetName}`);
    }

    try {
      if (transaction.provKey) {
        providerKeyBeingUsed = transaction.provKey;
        provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
          numRpcTries: provider.numRpcTries,
          lastTimeTried: Date.now()
        });
      }
      await utils.determineDoesDestAddressExist(transaction);

    } catch (err) {
      if (transaction.provKey) {
        if (err?.error && err.error === 'TIMEOUT') {
          provider.numRpcTimeoutErrors = (provider.numRpcTimeoutErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTimeoutErrors: provider.numRpcTimeoutErrors });
        } else { // some other error
          provider.numRpcGeneralErrors = (provider.numRpcGeneralErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcGeneralErrors: provider.numRpcGeneralErrors });
        }
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

  async function getFeeEstimateForTokenAsset(transaction) {
    const statusLines = [];
    let lastError = null;
    let providerKeyBeingUsed = null;

    if (!transaction.provider) {
      throw new Error("Provider not set on transaction for fee estimate");
    }

    const provider = transaction.provider;
    const utils = tokenChainUtilsMap[provider.assetName.toLowerCase()];

    if (!utils || typeof utils.estimateFee !== 'function') {
      throw new Error(`Estimate fee not supported for provider: ${provider.assetName}`);
    }

    transaction.fromAddress = transaction.asset.address;

    try {
      if (transaction.provKey) {
        providerKeyBeingUsed = transaction.provKey;
        provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
          numRpcTries: provider.numRpcTries,
          lastTimeTried: Date.now()
        });
      }
      await utils.estimateFee(transaction);
    } catch (err) {
      console.error(err);
      lastError = err?.message || 'Failed to estimate fee';
      if (transaction.provKey) {
        if (err?.error && err.error === 'TIMEOUT') {
          provider.numRpcTimeoutErrors = (provider.numRpcTimeoutErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTimeoutErrors: provider.numRpcTimeoutErrors });
        } else { // some other error
          provider.numRpcGeneralErrors = (provider.numRpcGeneralErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcGeneralErrors: provider.numRpcGeneralErrors });
        }
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

  async function sendTransactionForTokenAsset(transaction) {
    const statusLines = [];
    let providerKeyBeingUsed = null;
    let lastError = null;
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

    const utils = tokenChainUtilsMap[provider.assetName?.toLowerCase()];
    if (!utils || typeof utils.sendTransaction !== 'function') {
      throw new Error(`❌ Network not supported for sending: ${provider.assetName}`);
    }

    try {
      if (transaction.provKey) {
        providerKeyBeingUsed = transaction.provKey;
        provider.numRpcTries = (provider.numRpcTries ?? 0) + 1;
        WalletPersistence.updateAssetProvider(providerKeyBeingUsed, {
          numRpcTries: provider.numRpcTries,
          lastTimeTried: Date.now()
        });
      }
      // 🚀 Proceed
      await utils.sendTransaction(transaction);
      
    } catch (err) {
      const fullMessage = err?.message || 'Failed to send transaction';

      if (transaction.provKey) {
        if (err?.error === 'TIMEOUT') {
          provider.numRpcTimeoutErrors = (provider.numRpcTimeoutErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcTimeoutErrors: provider.numRpcTimeoutErrors });
        } else { // some other error
          provider.numRpcGeneralErrors = (provider.numRpcGeneralErrors ?? 0) + 1;
          WalletPersistence.updateAssetProvider(providerKeyBeingUsed, { numRpcGeneralErrors: provider.numRpcGeneralErrors });
        }
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
    deriveAllWalletTokens,
    getAllTokenAssetBalances,
    getBalanceForTokenAsset,
    determineDoesDestAddressExist,
    getFeeEstimateForTokenAsset,
    sendTransactionForTokenAsset,
  };
})();

