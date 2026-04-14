// injected-dapp-utils.js
window.injectedDappUtils = (function() {

  const FORWARD_REQUEST_TIMEOUT = 15000;

  const providerState = {
    currentNetworkType: null,
    isDapp: false,
    isConnected: false,
    currentChainId: null,
    accounts: [],
    autoConnectDone: false,
    lastTimePushedSiteStatusUpdate: 0,
    initialStatusTimeDelayHasExpired: false,
    statusTimerStarted: false,
    pending: false,
    provider: null,
  };

  const listeners = {};

  function postEvmProvStatusToWallet({
    pushedByTimer, whichEthRequestIfAny, hasError=false, errorDetail=null
  }) {
      const payload = {
        pushedByTimer,
        isDapp: providerState.isDapp,
        ethRequest: whichEthRequestIfAny,
        isConnected: providerState.isConnected,
        accounts: providerState.accounts.slice(),
        currentChainId: providerState.currentChainId,
      };

      console.log('[postEvmProvStatusToWallet] - provider/local values before post:', {
        providerSelectedAddress: providerState.provider?.selectedAddress,
        providerChainId: providerState.provider?.chainId,
        accounts: providerState.accounts
      });

      postToWallet({
        to: 'wallet',
        type: whichEthRequestIfAny ? whichEthRequestIfAny : 'EVM_PROV_UPDATE',
        origin: window.location.origin,
        href: window.location.href,
        networkType: 'EVM',
        payload,
        isNotification: true, // fire-and-forget
        ...(hasError && { error: true }),
        ...(errorDetail !== null ? { errorDetail } : {})
      });
      // 🔹 Reset timestamp whenever a push occurs
      providerState.lastTimePushedSiteStatusUpdate = Date.now();
    }

    function postToWallet(msg) {
      // 🟢 Create a copy of the message so we don't mutate the original
      const fullMsg = {
        from: 'dapp',
        ...msg,
        // Ensure params exists as an array if not provided, for RPC safety
        params: msg.params || []
      };

      // 🟢 Ensure every message includes the current "Ground Truth" state
      // We attach this to the payload so the Wallet's helper() always sees it.
      if (!fullMsg.payload) fullMsg.payload = {};

      fullMsg.payload.isDapp = providerState.isDapp;
      fullMsg.payload.isConnected = providerState.isConnected;

      console.log('[RAW OUT → wallet]',
        JSON.stringify({
          timestamp: Date.now(),
          origin: window.location.origin,
          href: window.location.href,
          message: fullMsg
        })
      );

      window.postMessage(fullMsg, '*');
    }

    function markAsDapp() {
      if (!providerState.isDapp) providerState.isDapp = true;
    }

    function pushSiteRequestToConnectToWallet() {
      markAsDapp();
      const payload = {
        isDapp: providerState.isDapp,
        isConnected: providerState.isConnected,
        accounts: providerState.accounts.slice(),
        currentChainId: providerState.currentChainId,
      };

      console.log('[pushSiteRequestToConnectToWalletl] - provider/local values before post:', {
        providerSelectedAddress: providerState.provider.selectedAddress,
        providerChainId: providerState.provider.chainId,
        accounts: providerState.accounts
      });

      postToWallet({
        to: 'wallet',
        type: 'eth_accounts_probe',
        origin: window.location.origin,
        href: window.location.href,
        payload,
        isNotification: true
      });
    }

    async function handleWriteOnlyRpcApiCall(method, params) {
      return handleReadOnlyRpcApiCall(method, params);
    }

    async function handleReadOnlyRpcApiCall(method, params) {
        // 1. Log locally so you can see it in the dApp console
        console.log(`[${method}] Intercepted Params:`, JSON.stringify(params));

        // 2. Use forwardRequest to send to wallet AND wait for the result
        try {
          const args = {
            method: method,
            params: params,
          };
          const result = await forwardRequest(args);
          console.log(`[${method}] Result from wallet:`, result);
          return result;
        } catch (error) {
          // 🟢 GATE: If it's just "Unsupported" (4200), don't alert the wallet.
          // This prevents the Global Listener from seeing an error and revoking permissions.
          if (error.code === 4200) {
            console.warn(`[${method}] Method not supported by wallet. Skipping programmer alert.`);
            throw error; // Still throw to the dApp so it knows, but don't kill the connection.
          }
          // New: Alert the wallet UI for debugging
          postToWallet({
            to: 'wallet',
            type: 'message_to_programmer',
            error: true,
            errorDetail: error.message || `Unknown ${method} error`,
            method: method
          });

          throw error; // Still throw so the dApp knows it failed
        }
    }

    function forwardRequest(args) {
      console.log('🟢 [forwardRequest][Dapp → Wallet] Forwarding request:', JSON.stringify(args));

      // 1. Destructure the new required parameters
      const {
        method,
        payload,
        params,
      } = args || {};

      const expectedResponseMessageType = `wallet_origin_${method}_response`;
      const expectedTimeoutMessageType = `${method}_timeout`;
      const expectedRejectMessageType = `${method}_reject`;

      // 2. Strict Validation Gate (The "Programmer Error" check)
      if (!method || !expectedResponseMessageType || !expectedTimeoutMessageType || !expectedRejectMessageType) {
        console.error(
          `❌ [forwardRequest] CRITICAL MISSING PARAMS for method: ${method}\n` +
          `Required: expectedResponseMessageType, expectedTimeoutMessageType, expectedRejectMessageType`
        );

        // Kill the connection so the dev (you) sees the failure immediately
        revokeConnection('Programmer Error: forwardRequest missing required response mapping');

        // Throw to stop the async execution of the calling handler
        throw new Error(`Internal configuration error for ${method}`);
      }

      console.log(`[forwardRequest][Dapp → Wallet] Forwarding ${method}:`, JSON.stringify(payload));

      postToWallet({
        to: 'wallet',
        type: method,
        origin: window.location.origin,
        href: window.location.href,
        payload: payload ?? null,   //metadata
        params: params ?? []  //actual RPC params
      });

      // 2. Return a Promise that waits for the Extension's response
      return new Promise((resolve, reject) => {
        console.log('[forwardRequest][Dapp → Wallet] Forward request - will Promise resolve....');
        // 💡 Added Timeout Logic (30 seconds)
        const timeoutId = setTimeout(() => {
          cleanup();

          // 1️⃣ Notify wallet/UI that the request timed out
          postToWallet({
            to: 'wallet',
            type: expectedTimeoutMessageType,
            payload: {
              method,
              message: `Request timed out after ${FORWARD_REQUEST_TIMEOUT}ms`
            },
            origin: window.location.origin,
            href: window.location.href,
            isNotification: true
          });

          // 2️⃣ Reject the promise
          const error = new Error(`Request timed out: ${method}`);
          error.code = -32000; // Custom timeout code
          console.log('[forwardRequest][Dapp → Wallet] Forward request - Promise timedout???');
          console.error(`⛔ ${error.message}`);
          reject(error);
        }, FORWARD_REQUEST_TIMEOUT);

        // 💡 Added Cleanup Function
        const cleanup = () => {
          clearTimeout(timeoutId);
          window.removeEventListener('message', handler);
        };

        function handler(event) {
          console.log('[forwardRequest][RAW IN ← forwardRequest]', {
            timestamp: Date.now(),
            origin: event.origin,
            data: event.data
          });

          // Only listen to messages coming from our own extension/content script
          if (event.source !== window) {
            console.log('[forwardRequest handler] event.source != window');
            return;
          }

          const msg = event.data;

          // 1. Same sender check used in your global listener
          // 💡 Ensure we only handle messages for THIS specific request
          // if your wallet sends an ID in the payload.
          const isValidSender = msg?.from === 'extension' || msg?.from === 'wallet';
          if (!isValidSender) {
            console.log('[forwardRequest handler] !isValidSender');
            return;
          }

          console.log('[forwardRequest handler] got message:', msg);

          // 1. Handle Success
          if (msg.type === expectedResponseMessageType) {
            console.log('[forwardRequest handler] SUCCESS:', msg);
            cleanup();

            // Resolve the promise with the result (this un-pauses the dApp)
            if (msg.error) {
              console.error('[forwardRequest] Wallet returned error:', msg.error);
              reject(msg.error);
            } else {
              console.log('[forwardRequest] Wallet returned result:', msg.result);
              resolve(msg.result);
            }
          }

          // 2. Handle Explicit Revocation (Disconnect
          else if (msg.type === 'wallet_origin_revokePermissions') {
            console.log('[forwardRequest handler] WALLET REVOKED PERMISSIONS');

            cleanup();

            revokeConnection('wallet_origin_revokePermissions');

            const error = new Error('Permissions revoked by wallet');
            error.code = 4001;

            reject(error);
          }

          // 3. Handle Explicit Rejection
          else if (msg.type === expectedRejectMessageType) {
            console.log('[forwardRequest handler] REJECTED by wallet or logic');

            postToWallet({
                to: 'wallet',
                type: expectedRejectMessageType, // Signal back to the Wallet Tab
                payload: {
                method,
                message: 'Request was rejected and dApp has cleared the pending promise.'
              },
              origin: window.location.origin,
              href: window.location.href,
              isNotification: true
            });

            cleanup();
            const error = new Error(msg.payload?.message || 'User rejected request');
            error.code = 4001;
            reject(error);
          }
        }

        window.addEventListener('message', handler);
      });
    }

    function revokeConnection(reason = 'User disconnected') {
      //console.log('[revokeConnection] resetting dApp state');

      providerState.isConnected = false;
      providerState.accounts.length = 0;
      providerState.currentChainId = null;
      providerState.provider.selectedAddress = null;
      providerState.provider.chainId = providerState.currentChainId;
      providerState.provider.networkVersion = null;
      providerState.autoConnectDone = false;

      //console.log('where: revokeConnection - about to emit site status to wallet');
      postEvmProvStatusToWallet({ pushedByTimer: false, whichEthRequestIfAny: reason });

      //console.log('where: revokeConnection - about to emit disconnect/accountsChanged');
      emit('disconnect', { code: 1000, message: reason });
      emit('accountsChanged', []);
    }

    function emit(event, ...args) {
      // 1️⃣ Notify internal listeners
      const eventListeners = listeners[event];
      if (eventListeners && eventListeners.length) {
        for (const fn of eventListeners) {
          try { fn(...args); }
          catch (err) {
            console.warn('[emit] internal listener error:', err);
          }
        }
      }

      // 2️⃣ Notify provider listeners if provider exists
      if (providerState.provider && typeof providerState.provider.emit === 'function' && providerState.provider.emit !== emit) {
        try {
          providerState.provider.emit.call(providerState.provider, event, ...args);
        } catch (err) {
          console.warn('[emit] providerState.provider.emit error:', err);
        }
      }
    }

  function announce() {
    const provider = providerState.provider;

    window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
      detail: {
        info: {
          uuid: 'simple-webpage-wallet',
          name: 'All My Money Bags',
          icon: `data:image/svg+xml;base64,PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KDTwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIFRyYW5zZm9ybWVkIGJ5OiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4KPHN2ZyB3aWR0aD0iMjU2cHgiIGhlaWdodD0iMjU2cHgiIHZpZXdCb3g9IjAgMCAxMjggMTI4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBhcmlhLWhpZGRlbj0idHJ1ZSIgcm9sZT0iaW1nIiBjbGFzcz0iaWNvbmlmeSBpY29uaWZ5LS1ub3RvIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0IiBmaWxsPSIjMDAwMDAwIiB0cmFuc2Zvcm09InJvdGF0ZSgwKSIgc3Ryb2tlPSIjMDAwMDAwIj4KDTxnIGlkPSJTVkdSZXBvX2JnQ2FycmllciIgc3Ryb2tlLXdpZHRoPSIwIi8+Cg08ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KDTxnIGlkPSJTVkdSZXBvX2ljb25DYXJyaWVyIj4gPGcgZmlsbD0ibm9uZSI+IDxwYXRoIGQ9Ik05My40NiAzOS40NWM2LjcxLTEuNDkgMTUuNDUtOC4xNSAxNi43OC0xMS40M2MuNzgtMS45Mi0zLjExLTQuOTItNC4xNS02LjEzYy0yLjM4LTIuNzYtMS40Mi00LjEyLS41LTcuNDFjMS4wNS0zLjc0LTEuNDQtNy44Ny00Ljk3LTkuNDlzLTcuNzUtMS4xMS0xMS4zLjQ3Yy0zLjU1IDEuNTgtNi41OCA0LjEyLTkuNTUgNi42MmMtMi4xNy0xLjM3LTUuNjMtNy40Mi0xMS4yMy0zLjQ5Yy0zLjg3IDIuNzEtNC4yMiA4LjYxLTMuNzIgMTMuMzJjMS4xNyAxMC44NyAzLjg1IDE2LjUxIDguOSAxOC4wM2M2LjM4IDEuOTIgMTMuNDQuOTEgMTkuNzQtLjQ5eiIgZmlsbD0iI2ZmZjgyOSI+IDwvcGF0aD4gPHBhdGggZD0iTTEwNC4zNiA4LjE4Yy0uODUgMTQuNjUtMTUuMTQgMjQuMzctMjEuOTIgMjguNjVsNC40IDMuNzhzMi43OS4wNiA2LjYxLTEuMTZjNi41NS0yLjA4IDE2LjEyLTcuOTYgMTYuNzgtMTEuNDNjLjk3LTUuMDUtNC4yMS0zLjk1LTUuMzgtNy45NGMtLjYxLTIuMTEgMi45Ny02LjEtLjQ5LTExLjl6bS0yNC41OCAzLjkxcy0yLjU1LTIuNjEtNC40NC0zLjhjLS45NCAxLjc3LTEuNjEgMy42OS0xLjk0IDUuNjdjLS41OSAzLjQ4IDAgOC40MiAxLjM5IDEyLjFjLjIyLjU3IDEuMDQuNDggMS4xMy0uMTJjMS4yLTcuOTEgMy44Ni0xMy44NSAzLjg2LTEzLjg1eiIgZmlsbD0iI2UwYmQxMCI+IDwvcGF0aD4gPHBhdGggZD0iTTYxLjk2IDM4LjE2UzMwLjc3IDQxLjUzIDE2LjcgNjguNjFjLTE0LjA3IDI3LjA4LTIuMTEgNDMuNSAxMC41NSA0OS40OGMxMi42NiA1Ljk4IDQ0LjU2IDguMDkgNjUuMzEgMy4xN3MyNS45NC0xNS4xMiAyNC45Ny0yNC45N2MtMS40MS0xNC4zOC0xNC43Ny0yMy4yMi0xNC43Ny0yMy4yMnMuNTMtMTcuNzYtMTMuMjUtMjkuMjljLTEyLjIzLTEwLjI0LTI3LjU1LTUuNjItMjcuNTUtNS42MnoiIGZpbGw9IiNmZmY4MjkiPiA8L3BhdGg+IDxwYXRoIGQ9Ik03NC43NiA4My43M2MtNi42OS04LjQ0LTE0LjU5LTkuNTctMTcuMTItMTIuNmMtMS4zOC0xLjY1LTIuMTktMy4zMi0xLjg4LTUuMzljLjMzLTIuMiAyLjg4LTMuNzIgNC44Ni00LjA5YzIuMzEtLjQ0IDcuODItLjIxIDEyLjQ1IDQuMmMxLjEgMS4wNC43IDIuNjYuNjcgNC4xMWMtLjA4IDMuMTEgNC4zNyA2LjEzIDcuOTcgMy41M2MzLjYxLTIuNjEuODQtOC40Mi0xLjQ5LTExLjI0Yy0xLjc2LTIuMTMtOC4xNC02LjgyLTE2LjA3LTcuNTZjLTIuMjMtLjIxLTExLjItMS41NC0xNi4zOCA4LjMxYy0xLjQ5IDIuODMtMi4wNCA5LjY3IDUuNzYgMTUuNDVjMS42MyAxLjIxIDEwLjA5IDUuNTEgMTIuNDQgOC4zYzQuMDcgNC44MyAxLjI4IDkuMDgtMS45IDkuNjRjLTguNjcgMS41Mi0xMy41OC0zLjE3LTE0LjQ5LTUuNzRjLS42NS0xLjgzLjAzLTMuODEtLjgxLTUuNTNjLS44Ni0xLjc3LTIuNjItMi40Ny00LjQ4LTEuODhjLTYuMSAxLjk0LTQuMTYgOC42MS0xLjQ2IDEyLjI4YzIuODkgMy45MyA2LjQ0IDYuMyAxMC40MyA3LjZjMTQuODkgNC44NSAyMi4wNS0yLjgxIDIzLjMtOC40MmMuOTItNC4xMS44Mi03LjY3LTEuOC0xMC45N3oiIGZpbGw9IiM2QjRCNDYiPiA8L3BhdGg+IDxwYXRoIGQ9Ik03MS4xNiA0OC45OWMtMTIuNjcgMjcuMDYtMTQuODUgNjEuMjMtMTQuODUgNjEuMjMiIHN0cm9rZT0iIzZCNEI0NiIgc3Ryb2tlLXdpZHRoPSI1IiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiPiA8L3BhdGg+IDxwYXRoIGQ9Ik04MS42NyAzMS45NmM4LjQ0IDIuNzUgMTAuMzEgMTAuMzggOS43IDEyLjQ2Yy0uNzMgMi40NC0xMC4wOC03LjA2LTIzLjk4LTYuNDljLTQuODYuMi0zLjQ1LTIuNzgtMS4yLTQuNWMyLjk3LTIuMjcgNy45Ni0zLjkxIDE1LjQ4LTEuNDd6IiBmaWxsPSIjNkQ0QzQxIj4gPC9wYXRoPiA8cGF0aCBkPSJNODEuNjcgMzEuOTZjOC40NCAyLjc1IDEwLjMxIDEwLjM4IDkuNyAxMi40NmMtLjczIDIuNDQtMTAuMDgtNy4wNi0yMy45OC02LjQ5Yy00Ljg2LjItMy40NS0yLjc4LTEuMi00LjVjMi45Ny0yLjI3IDcuOTYtMy45MSAxNS40OC0xLjQ3eiIgZmlsbD0iIzZCNEI0NiI+IDwvcGF0aD4gPHBhdGggZD0iTTk2LjQ5IDU4Ljg2YzEuMDYtLjczIDQuNjIuNTMgNS42MiA3LjVjLjQ5IDMuNDEuNjQgNi43MS42NCA2Ljcxcy00LjItMy43Ny01LjU5LTYuNDJjLTEuNzUtMy4zNS0yLjQzLTYuNTktLjY3LTcuNzl6IiBmaWxsPSIjZTBiZDEwIj4gPC9wYXRoPiA8L2c+IDwvZz4KDTwvc3ZnPg==`,
          rdns: 'finance.all.my.money.bags'
        },
        provider
      }
    }));
  }

  // ✅ Expose what you need publicly
  return {
    listeners,
    providerState,
    postEvmProvStatusToWallet,
    postToWallet,
    markAsDapp,
    pushSiteRequestToConnectToWallet,
    handleWriteOnlyRpcApiCall,
    handleReadOnlyRpcApiCall,
    forwardRequest,
    revokeConnection,
    emit,
    announce,
  };
})();
