// wallet-main-ui-js/wallet-main-ui-dapp-msg-handler-helper.js
window.WalletDappMsgHandlerHelper = (function () {

  const dappSession = WalletUiDappController.dappSession;

  function toLower(addr) { return (addr || "").toLowerCase(); }

  function prepareTransaction(message) {
    const networkLabel = document.getElementById("dappCurrentNetwork");
    const assetKeyVal = networkLabel?.dataset.assetKey || null;
    const derived = WalletPersistence.walletManager.activeWallet.derivedAddresses?.[assetKeyVal];

    dappSession.transaction.assetKey = assetKeyVal;
    dappSession.transaction.asset = derived;
    dappSession.transaction.method = message.type;
    dappSession.transaction.params = message.params || message.payload || null;
    dappSession.transaction.provider = dappSession.assetProviderInUse;
    dappSession.transaction.provKey = dappSession.assetProviderInUse.provKey;

    if (!dappSession.transaction.provider) throw new Error("Provider missing");
  }


  function postDappResponse(message, result) {
    const typeResponse = `wallet_origin_${message.type}_response`;
    const msg = {
      from: 'wallet',
      to: 'dapp',
      type: typeResponse,
      result,
      networkType: 'EVM',
      payload: { result, originalMessage: message }
    };
    window.parent.postMessage(msg, '*');
  }

  function getTokensForChain(wallet, assetKeyVal) {
    if (!wallet.derivedTokens) return [];

    const targetChainId = assetKeyVal?.toLowerCase().replace('chainId-', '').replace('chainid-', '');

    return Object.entries(wallet.derivedTokens)
      .map(([key, entry]) => ({ key, ...entry }))
      .filter(entry => {
        const keyChainId = entry.key.split('::')[0].toLowerCase().replace('chainid-', '');
        return keyChainId === targetChainId;
      });
  }

  function getStableCoinsForChain(wallet, assetKeyVal) {
    if (!wallet.derivedStableCoins) return [];

    const targetChainId = assetKeyVal?.toLowerCase().replace('chainId-', '').replace('chainid-', '');

    return Object.entries(wallet.derivedStableCoins)
      .map(([key, entry]) => ({ key, ...entry }))
      .filter(entry => {
        const keyChainId = entry.key.split('::')[0].toLowerCase().replace('chainid-', '');
        return keyChainId === targetChainId;
      });
  }


  async function verifyTransactionToSign(message) {
    const type = message?.type;
    if (!type || ![ 'eth_sendTransaction', 'wallet_sendTransaction' ].includes(type))
        throw new Error("Transaction To Sign is Incorrect.");

    const params = message?.params;
    if (!params) throw new Error("Transaction To Sign is Missing Params.");

    const networkLabel = document.getElementById("dappCurrentNetwork");
    const assetKeyVal = networkLabel?.dataset.assetKey || null;
    const wallet = WalletPersistence.walletManager.activeWallet;
    const derivedAddress = wallet.derivedAddresses?.[assetKeyVal];

    const derivedTokens = getTokensForChain(wallet, assetKeyVal);
    const derivedStableCoins = getStableCoinsForChain(wallet, assetKeyVal);

    //TEST 1
    if (!derivedAddress && !derivedTokens && !derivedStableCoins)
      throw new Error("Transaction To Sign: Wallet Is Missing Crypto Info.");

    //TEST 2
    if (!derivedTokens && !derivedStableCoins)
      throw new Error("Transaction To Sign: Wallet Has No Related Tokens Or Stable Coins.");

    const tx = params[0];

    //------------------------------------------------
    // Wrong 'from' address
    //------------------------------------------------

    if (derivedAddress.address !== tx.from) {
      const msg = `Transaction To Sign: Wrong Address: ${tx.from}`;
      throw new Error(msg);
    }

    //const toLower = (addr) => (addr || "").toLowerCase();

    //------------------------------------------------
    // unknown 'contract' address
    //------------------------------------------------

    const knownAddresses = [
      ...(derivedTokens || []).map(t => toLower(t.contractAddress)),
      ...(derivedStableCoins || []).map(t => toLower(t.contractAddress))
    ];
    const txTo = toLower(tx.to);
    const matches = knownAddresses.filter(addr => addr === txTo);
    if (matches.length !== 1) {
      throw new Error(`Transaction To Sign: Unknown or ambiguous contract address: ${tx.to}`);
    }


    //------------------------------------------------
    // something wrong with the value field?
    //------------------------------------------------

    if (!tx.value) throw new Error("Transaction To Sign: Missing value field");

    const numericValue = parseInt(tx.value, 16);
    if (isNaN(numericValue) || numericValue <= 0) {
      throw new Error(`Transaction To Sign: Invalid value: ${tx.value}`);
    }

    //------------------------------------------------
    // gas price is too high?
    //------------------------------------------------

    // Determine if this is a native transfer or a token/stablecoin transfer
    const isNativeTransfer = derivedTokens.length === 0 && derivedStableCoins.length === 0;

    // Parse transaction values
    const gas = parseInt(tx.gas, 16);
    const gasPrice = parseInt(tx.gasPrice, 16);
    const value = parseInt(tx.value, 16);

    if (isNaN(gas) || gas <= 0) throw new Error(`Transaction To Sign: Invalid gas: ${tx.gas}`);
    if (isNaN(gasPrice) || gasPrice <= 0) throw new Error(`Transaction To Sign: Invalid gasPrice: ${tx.gasPrice}`);
    if (isNaN(value) || value < 0) throw new Error(`Transaction To Sign: Invalid value: ${tx.value}`);

    const totalGasCost = gas * gasPrice;

    // Only enforce the fraction check for native transfers (value is in native currency)
    if (isNativeTransfer && totalGasCost > value / 100) {
      throw new Error(`Transaction To Sign: Gas cost exceeds 1% of transaction value`);
    }

    //------------------------------------------------
    // native asset balance being submitted is too high?
    //------------------------------------------------
    const valueWei = parseInt(tx.value, 16);
    if (!isNaN(valueWei) && valueWei > 0) {
      const walletBalance = parseFloat(derivedAddress.balance); // human-readable
      const txAmount = valueWei / (10 ** 18); // wei → native

      if (txAmount > walletBalance * 0.5) {
        const userApproved = await WalletYesOrNoAction.showAndBlock({
          message: 'Transaction Exceeds 50% Of Your Balance',
          details: 'Do you wish to continue with transaction?',
          positive: 'Yes',
          negative: 'No',
          onPositive: async () => {},
          onNegative: () => {
            WalletUiDappController.disconnect();
          }
        });
        if (!userApproved) {
            throw new Error(`Transaction To Sign: Amount exceeds 50% of wallet balance`);
        }
      }

    }
  }

  async function handleReadOnlyRpcCall(message) {

    if (!dappSession.isSessionStarted) {
      const type = message?.type || 'No Message Type';
      const details = JSON.stringify(message);
      const msg = `❌ NO SESSION! Bad RPC "[${type}]" Message From Dapp`;
      const status = `${msg} : ${details}`;
      WalletInfoModal.show({ message: msg, details });
      WalletPageLevelUiStatusLines.appendStatus(status);
      const logMsg = `RPC CALL WITHOUT SESSION! ${message?.type}`;
      console.log(logMsg);
      throw new Error(logMsg);
    }



      try {
        console.log(`[WalletDappMsgHandlerHelper.handleReadOnlyRpcCall] - start: ${message}`);

        WalletUiDappController.logDappSession();

        if (dappSession.thereWasAnErrorDuringThisSession) {
          const forceError = true;
          WalletUiDappController.determineAndHandleDappErrorMessage(message, forceError);
          console.log(`[WalletDappMsgHandlerHelper.handleReadOnlyRpcCall] - there was an error - done.`);
          const err = {}; err.message = 'There was a previous error';
          WalletUiDappController.handleRpcCallError(message?.type, err);
          dappSession.thereWasAnErrorDuringThisSession = false;
          return;
        }

        prepareTransaction(message);

        const result = await WalletMultiNetworkUtils.queryBlockchainState(dappSession.transaction);
        postDappResponse(message, result);

      } catch (err) {
        WalletUiDappController.handleRpcCallError(message, err);
      }

  }

  async function handleWriteOnlyRpcCall(message) {

    //if (message?.type === 'personal_sign' || message?.type === 'eth_signTypedData_v4') {
    if ([
      'personal_sign',
      'eth_signTypedData_v4',
      'eth_sendTransaction',
      'wallet_sendTransaction'
      ].includes(message?.type)) {

      if (!dappSession.isSessionStarted) {
        const type = message?.type || 'No Message Type';
        const details = JSON.stringify(message);
        const msg = `❌ NO SESSION! Bad RPC "[${type}]" Message From Dapp`;
        const status = `${msg} : ${details}`;
        WalletInfoModal.show({ message: msg, details });
        WalletPageLevelUiStatusLines.appendStatus(status);
        const logMsg = `RPC CALL WITHOUT SESSION! ${message?.type}`;
        console.log(logMsg);
        throw new Error(logMsg);
      }



        WalletUiDappController.logDappSession();

        if (dappSession.thereWasAnErrorDuringThisSession) { //<--this can be set by handleRpcCallError() during the catch.
          console.log(`[WalletDappMsgHandlerHelper.handleWriteOnlyRpcCall] - there was an error - done.`);
          const err = {}; err.message = 'There was a previous error';
          WalletUiDappController.handleRpcCallError(message?.type, err); //<-- re-used due to other things it does.
          const forceError = true;
          WalletUiDappController.determineAndHandleDappErrorMessage(message, forceError); //<--this does a dappFunctions.disconnect();
          dappSession.thereWasAnErrorDuringThisSession = false; //now we can clear
          return;
        }


        const params = message?.params || message?.payload || null;

        try {

          prepareTransaction(message);

          let result = null;
          if (message.type === 'personal_sign') {
            result = await WalletMultiNetworkUtils.personalSign(dappSession.transaction);
          } else if (message.type === 'eth_signTypedData_v4') {
            result = await WalletMultiNetworkUtils.signTypedDataV4(dappSession.transaction);
          } else {
            result = await WalletMultiNetworkUtils.dappSendTransaction(dappSession.transaction);
          }

          postDappResponse(message, result);


        } catch (err) {
          WalletUiDappController.handleRpcCallError(message, err);
        }


    } else {
      handleReadOnlyRpcCall(message);
    }
  }

  return {
    verifyTransactionToSign,
    handleReadOnlyRpcCall,
    handleWriteOnlyRpcCall,
  }
})();
