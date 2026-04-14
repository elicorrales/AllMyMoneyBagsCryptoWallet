// wallet-main-ui-dapp-msg-handler.js
///////////////////////////////////////////////////////////////////
// this file handles the various actions related to incoming dapp
// messages.
//
// this may turn into JUST for ETH-type dapp messages,
// then we would repeat this type of file for other crypto.
//

(function () {
  function determineFinalDappState() {

    WalletUiDappController.logDappSession();

    const rows = WalletDappHandling.getRenderedRows();
    const onlyFileOrAck = rows.every(r =>
      r.origin === "file://" && r.type === "REGISTER_ACK"
    );

    if (onlyFileOrAck) {
      WalletUiDappController.updateDappControlButton?.({ state: WalletUiDappController.UNKNOWN_IF_DAPP });
      return;
    }

    const lastTimeReceivedMessage = WalletUiDappController.getLastTimeReceivedMessage();
    if (Date.now() - lastTimeReceivedMessage > 1000) {
      WalletUiDappController.updateDappControlButton?.({ state: WalletUiDappController.UNKNOWN_IF_DAPP });
      return;
    }

  }

  function setInitialDappState(message) {

    WalletUiDappController.logDappSession();

    //if this message resulted from the wallet itself, not from the dapp window/tab.
    // then we should not base the connected state from this message.
    if (message?.role === 'wallet') return;

    WalletUiDappController.setLastTimeReceivedMessage();
    WalletUiDappController.flashDappStatusButton();

    //toggle dappControlBtn state based on connection
    const connected = message?.payload?.isConnected;
    const isDapp = message?.payload?.isDapp;
    let connectedState = WalletUiDappController.UNKNOWN_IF_DAPP;
    if (isDapp === true && connected === true) connectedState = 'connected';
    else if (isDapp === true && connected === false) connectedState= 'disconnected';

    WalletUiDappController.updateDappControlButton?.({ state: connectedState });
    WalletUiDappController.resetDappNotActiveTimer();

    WalletUiDappController.logDappSession();
  }

  async function handleSendTransaction(message) {

    if (Date.now() - WalletUiDappController.dappSession.lastTimeSendTransactionMessage < 5000) {
      throw new Error('Suspicious Transaction!  Previous Transaction too soon!');
    }

    if (!WalletUiDappController.dappSession.isSessionStarted) {
      throw new Error('Bad Transaction!  NO SESSION!.');
    }

    await WalletDappMsgHandlerHelper.verifyTransactionToSign(message);

    WalletUiDappController.dappSession.lastTimeSendTransactionMessage = Date.now();

    await WalletYesOrNoAction.showAndBlock({
        message: 'Confirm The Transaction',
        details: 'Do you wish to continue with transaction?',
        positive: 'Yes',
        negative: 'No',
        onPositive: async () => {
          WalletPageLevelUiStatusLines.clearStatus();
          await WalletDappMsgHandlerHelper.handleWriteOnlyRpcCall(message);
        },
        onNegative: () => {
          WalletUiDappController.disconnect();
          WalletPageLevelUiStatusLines.clearStatus();
        }
      });
  }

  const handlers = {

    'Forced disconnect at load': function(message) {
      console.log('[Wallet MAIN, DAPP MSG HANDLER] injected-dapp forced disconnect msg received', message);
    },

    REGISTER: function(message) {
      console.log('[Wallet MAIN, DAPP MSG HANDLER] wallet\'s REGISTER received', message);
    },

    REGISTER_ACK: function(message) {
      console.log('[Wallet MAIN, DAPP MSG HANDLER] background\'s REGISTER_ACK received', message);
      WalletPageLevelUI.clearPossibleMissingExtensionTimer();
    },

    // 1️⃣ The Silent Probe: This is triggered by dApp polling
    eth_accounts_probe: function (message) {
      console.log('[Wallet MAIN, DAPP MSG HANDLER] dApp is polling. Showing connection hint.');
    },

    eth_requestAccounts: function (message) {
      console.log('[Wallet MAIN, DAPP MSG HANDLER] dApp is eth_requestAccounts.');
      try {
        WalletUiDappController.handleDappIsRequestingToConnect(message);
      } catch (err) {
        console.error('[Wallet MAIN, DAPP MSG HANDLER] startDappSession failed', err);
        const forceError = true;
        WalletUiDappController.determineAndHandleDappErrorMessage(message, forceError);
      }
    },


    wallet_switchEthereumChain: function (message) {
      console.log('[Wallet MAIN, DAPP MSG HANDLER] dApp is wallet_switchEthereumChain.');
      WalletUiDappController.handleDappIsRequestingNetworkChange(message);
    },


    eth_call: function (message) {
      WalletDappMsgHandlerHelper.handleReadOnlyRpcCall(message);
    },


    eth_gasPrice: function (message) {
      WalletDappMsgHandlerHelper.handleReadOnlyRpcCall(message);
    },


    eth_getCode: function (message) {
      WalletDappMsgHandlerHelper.handleReadOnlyRpcCall(message);
    },

    eth_blockNumber: function (message) {
      WalletDappMsgHandlerHelper.handleReadOnlyRpcCall(message);
    },

    eth_getBalance: function (message) {
      WalletDappMsgHandlerHelper.handleReadOnlyRpcCall(message);
    },

    eth_getBlockByNumber: function (message) {
      WalletDappMsgHandlerHelper.handleReadOnlyRpcCall(message);
    },
    eth_maxPriorityFeePerGas: function (message) {
      WalletDappMsgHandlerHelper.handleReadOnlyRpcCall(message);
    },

    personal_sign: function (message) {
      WalletInfoModal.show({message:'Safe Signing', details: 'No addresses, no funds, no cost'});
      WalletDappMsgHandlerHelper.handleWriteOnlyRpcCall(message);
    },

    eth_signTypedData_v4: function (message) {
      WalletInfoModal.show({message:'Safe Signing', details: 'No addresses, no funds, no cost'});
      WalletDappMsgHandlerHelper.handleWriteOnlyRpcCall(message);
    },


    eth_sendTransaction: async function (message) { await handleSendTransaction(message); },

    wallet_sendTransaction: async function (message) { await handleSendTransaction(message); },

    wallet_revokePermissions: function (message) { WalletUiDappController.clearDappSession(); },

    wallet_origin_revokePermissions: function (message) { },

    eth_chainId: function (message) { },

    wallet_getCapabilities: function (message) { },

    web3_clientVersion: function (message) { },

    net_version: function (message) { },

    wallet_watchAsset: function (message) {
      console.log('[Wallet] Blocking watchAsset request.');

      // Send back an EIP-1193 "Method Not Implemented" Error (Code: 4200)
      const errorResponse = {
        from: 'wallet',
        to: 'dapp',
        type: `wallet_origin_${message.type}_response`,
        error: {
          code: 4200,
          message: 'The wallet does not support watchAsset at this time.'
        },
        payload: { originalMessage: message }
      };

      window.parent.postMessage(errorResponse, '*');
    },


    //this one is not a dapp request message; it is
    //originated by injected-dapp whenever there is
    // a connect or disconnect - when SitePersistence changes.
    EVM_PROV_UPDATE: function (message) {
      console.log('[wallet msg handler] - start of sitePermissionsUpdate():',message);
    },


  };

  // ---------- ORIGINAL HANDLER RENAMED ----------
  async function _walletHandleDappMessage(message) {
    try {
      console.log('[Wallet MAIN, DAPP MSG HANDLER] Received dApp message:', message.type, message);

      setInitialDappState(message);

      const type = message?.type;
      if (type && handlers[type]) {
        WalletDappHandling.renderRequestRow?.(message);
        await handlers[type](message);
      } else {
        console.log('[Wallet MAIN, DAPP MSG HANDLER] Unhandled dApp message type:', type, message);
        WalletDappHandling.renderRequestRow?.(message, true);
        WalletUiDappController.determineAndHandleDappErrorMessage(message);
      }

      determineFinalDappState();
    } catch (err) {
      WalletInfoModal.showError(err);
      WalletPageLevelUiStatusLines.appendStatus(err);
    }
  }

  // ---------- SERIAL QUEUE WRAPPER ----------
  (function() {
    let messagePending = false;
    let queuedMessages = [];

    window.walletHandleDappMessage = function(message) {
      return new Promise((resolve, reject) => {
        queuedMessages.push({ message, resolve, reject });
        processQueue();
      });
    };

    async function processQueue() {
      if (messagePending) return;
      if (queuedMessages.length === 0) return;

      const { message, resolve, reject } = queuedMessages.shift();
      messagePending = true;

      try {
        await _walletHandleDappMessage(message);
        resolve();
      } catch (err) {
        WalletInfoModal.showError?.(err);
        WalletPageLevelUiStatusLines.appendStatus?.(err)
        reject(err);
      } finally {
        messagePending = false;
        processQueue();
      }
    }
  })();

})();
