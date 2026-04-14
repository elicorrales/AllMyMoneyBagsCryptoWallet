// injected-dapp.js

;(function () {

  if (location.protocol !== 'file:' && window.top === window) {

    const ETH_REQUEST_ACCOUNTS_TIMEOUT = 15000;
    const EVM_NETWORK_TYPE = 'EVM';
    const {
      providerState,
      postToWallet,
      postEvmProvStatusToWallet,
      markAsDapp,
      pushSiteRequestToConnectToWallet,
      handleReadOnlyRpcApiCall,
      handleWriteOnlyRpcApiCall,
      revokeConnection,
      forwardRequest,
      emit,
      announce
} = window.injectedDappUtils;

    const listeners = window.injectedDappUtils.listeners;

    const INITIAL_STATUS_PUSH_DELAY = 4000; //six seconds
    const NORMAL_STATUS_PUSH_DELAY = 1000; //one seconds


    function on(event, handler) {
      console.log('[on] subscription:', event); // Added log
      (listeners[event] ||= []).push(handler);
    }

    // Timer loop to auto-fire if no push happened recently
    function startAutoStatusTimer() {
      setInterval(() => {
        // ⛔ DO NOT SEND AUTO-STATUS IF A PROMISE IS PENDING
        if (providerState.pending) return;
        const now = Date.now();
        const delay = providerState.initialStatusTimeDelayHasExpired ? NORMAL_STATUS_PUSH_DELAY : INITIAL_STATUS_PUSH_DELAY;

        const exceededDelay = (now - providerState.lastTimePushedSiteStatusUpdate >= delay);
        if (exceededDelay) {
          postEvmProvStatusToWallet({ pushedByTimer: true, whichEthRequestIfAny: null });
          if (!providerState.initialStatusTimeDelayHasExpired) providerState.initialStatusTimeDelayHasExpired = true;
        }
      }, 500); // check twice per second
    }

    async function handleRequestAccounts() {
      console.log('[handleRequestAccounts] called');

      markAsDapp();
      providerState.isConnected = true;
      console.log('[handleRequestAccounts] - saving session:',{accounts0: providerState.accounts[0], currentChainId: providerState.currentChainId});

      console.log('where: handleRequestAccounts - provider/local values before emitting:', {
        providerSelectedAddress: provider.selectedAddress,
        providerChainId: provider.chainId,
        accounts: providerState.accounts
      });

      provider.selectedAddress = providerState.accounts[0];
      postEvmProvStatusToWallet({ pushedByTimer: false, whichEthRequestIfAny: 'EVM_PROV_UPDATE' });

      console.log('where: handleRequestAccounts - about to emit connect/accountsChanged');
      emit('connect', { chainId: providerState.currentChainId });
      emit('accountsChanged', providerState.accounts);
      return providerState.accounts;
    }

    const methodHandlers = {
      'eth_requestAccounts': async () => {

        //console.log('🟢 injected-dapp.js start of eth_requestAccounts..');


        // ✅ SHORT-CIRCUIT
        if (providerState.isDapp && providerState.isConnected && providerState.accounts.length > 0) {
          console.log('[eth_requestAccounts] already connected — returning existing accounts');
          return providerState.accounts.slice();
        }

        // 2. Trigger the Wallet UI (Direct postMessage)
        console.log('[eth_requestAccounts] triggering wallet approval UI');
        markAsDapp();
        const payload = {
          isDapp: providerState.isDapp,
          isConnected: providerState.isConnected,
          accounts: providerState.accounts.slice(),
          currentChainId: providerState.currentChainId,
        };

        console.log('[eth_requestAccounts] - provider/local values before post:', {
          providerSelectedAddress: provider.selectedAddress,
          providerChainId: provider.chainId,
          accounts: providerState.accounts
        });

        postToWallet({
          to: 'wallet',
          type: 'eth_requestAccounts',
          origin: window.location.origin,
          href: window.location.href,
          payload
        });

        //-----------------------------------------------------------
        //The eth_requestAccounts handler includes a Promise AND a
        // wallet response listener code to only handle THIS promise,
        // independent of the global listener.
        //-----------------------------------------------------------
        // 3. BLOCK: Wait for 'wallet_origin_approved' OR 'wallet_origin_response' OR 'wallet_origin_rejected' before resolving
        return new Promise((resolve, reject) => {
          console.log('🟢 injected-dapp.js eth_requestAccounts - new Promise');

          // 1. Setup the timeout first
          const timeoutId = setTimeout(() => {
            cleanup();
            const error = new Error('No response from wallet.');
            error.code = 4001;
            console.log('⛔ [eth_requestAccounts] TIMEOUT firing');
            // 1️⃣ Notify wallet/UI that the request timed out
            postToWallet({
                to: 'wallet',
                type: 'eth_requestAccounts_timeout',
                payload: {
                  message: `Request timed out after ${ETH_REQUEST_ACCOUNTS_TIMEOUT}ms`
              },
              origin: window.location.origin,
              href: window.location.href,
              isNotification: true
            });
            reject(error); //<------returns here
          }, ETH_REQUEST_ACCOUNTS_TIMEOUT);

          // 2. Define a cleanup function to use in all cases
          const cleanup = () => {
            console.log('[eth_requestAccounts] cleanup() called.');
            clearTimeout(timeoutId);
            window.removeEventListener('message', listener);
          };

          //-----------------------------------------------------------------
          //START OF separate eth_requestAccounts Promise wallet response listener code.
          //-----------------------------------------------------------------
          const listener = (event) => {
            const msg = event.data;

            console.log('[eth_requestAccounts - listener] incoming msg:',msg);

//THIS statement causes dApp to spin if user attempt connecion from dApp instead of wallet tab.
            //if (!msg || msg.from !== 'wallet') return;
//THIS statement causes dApp to spin if user attempt connecion from dApp instead of wallet tab.

            // --- USER APPROVED (any of the acceptable types) ---
            if (msg?.type === 'wallet_origin_approved' || msg?.type === 'wallet_origin_response') {
              console.log('[eth_requestAccounts - listener] type one of correct ones:',msg.type );
              cleanup();

              if (msg.result) {
                const approvedAddress = Array.isArray(msg.result) ? msg.result[0] : msg.result;
                providerState.accounts[0] = approvedAddress;

                let newChainId = msg.chainId || msg.payload?.chainId || null;
                if (newChainId != null) {
                  if (typeof newChainId === 'number') {
                    newChainId = '0x' + newChainId.toString(16);
                  } else if (!newChainId.startsWith('0x')) {
                    newChainId = '0x' + parseInt(newChainId, 10).toString(16);
                  }
                  providerState.currentChainId = newChainId;
                }

                // Use your helper to update persistence and emit events
                resolve(handleRequestAccounts());
              } else {
                const error = new Error('Wallet approved but no address returned.');
                error.code = 4001;
                reject(error);
              }
            }
            // --- USER REJECTED ---
            else if (msg?.type === 'wallet_origin_rejected') {
              console.log('[eth_requestAccounts - listener] user rejected.');
              cleanup();

              // Optional emit for listeners
              emit('reject', { code: 4001, message: 'User rejected the request.' });

              const error = new Error('User rejected the request.');
              error.code = 4001;
              reject(error);
            }

            // --- WALLET REVOKED PERMISSIONS ---
            else if (msg?.type === 'wallet_origin_revokePermissions') {
              console.log('[eth_requestAccounts - listener] wallet revoked permissions.');
              cleanup();

              // Reset provider state + emit standard events
              revokeConnection('wallet_origin_revokePermissions');

              const error = new Error('Request was revoked by wallet.');
              error.code = 4001;
              reject(error);
            }
          };
          window.addEventListener('message', listener);
          //-----------------------------------------------------------------
          //END OF separate eth_requestAccounts Promise wallet response listener code.
          //-----------------------------------------------------------------

        });
      },

      'eth_accounts': async () => {
        // 🔥 One-time authoritative reset on first eth_accounts call
        if (!methodHandlers._resetEmitted) {
          methodHandlers._resetEmitted = true;
          emit('disconnect', { code: 4900, message: 'Authoritative reset (eth_accounts)' });
          emit('accountsChanged', providerState.accounts);
        }

        // 2. Fire-and-forget: Tell the wallet we are here, but don't create a Promise/Listener
        pushSiteRequestToConnectToWallet();

        // 3. Immediately return accounts array to dApp
        return providerState.accounts;
      },

      'eth_chainId': async () => {
        postEvmProvStatusToWallet({ pushedByTimer: false, whichEthRequestIfAny: 'eth_chainId' });
        return providerState.currentChainId;
      },
      'net_version': async () => {
        postEvmProvStatusToWallet({ pushedByTimer: false, whichEthRequestIfAny: 'net_version' });
        return providerState.currentChainId ? parseInt(providerState.currentChainId, 16).toString() : null;
      },
      'eth_blockNumber': async (params) => {
        return handleReadOnlyRpcApiCall('eth_blockNumber', params);
      },
      'eth_call': async (params) => {
        return handleReadOnlyRpcApiCall('eth_call', params);
      },
      'eth_gasPrice': async (params) => {
        return handleReadOnlyRpcApiCall('eth_gasPrice', params);
      },

      'wallet_getCapabilities': async (params) => {
         // Return an empty object per EIP-5792 to signal "Standard Wallet"
         // The key is the chainId in HEX
        postEvmProvStatusToWallet({ pushedByTimer: false, whichEthRequestIfAny: 'wallet_getCapabilities' });
        return {
          "0x1": { "read": { "supported": true }, "sign_transaction": { "supported": true }, "sign_message": { "supported": true }, "switch_chain": { "supported": true } },
          "0xaa36a7": { "read": { "supported": true }, "sign_transaction": { "supported": true }, "sign_message": { "supported": true }, "switch_chain": { "supported": true } },
          "0x38": { "read": { "supported": true }, "sign_transaction": { "supported": true }, "sign_message": { "supported": true }, "switch_chain": { "supported": true } },
          "0x61": { "read": { "supported": true }, "sign_transaction": { "supported": true }, "sign_message": { "supported": true }, "switch_chain": { "supported": true } },
          "0x89": { "read": { "supported": true }, "sign_transaction": { "supported": true }, "sign_message": { "supported": true }, "switch_chain": { "supported": true } },
          "0x13882": { "read": { "supported": true }, "sign_transaction": { "supported": true }, "sign_message": { "supported": true }, "switch_chain": { "supported": true } },
          "0x4250": { "read": { "supported": true }, "sign_transaction": { "supported": true }, "sign_message": { "supported": true }, "switch_chain": { "supported": true } }
        };
      },
      'eth_getBalance': async (params) => {
        return handleReadOnlyRpcApiCall('eth_getBalance', params);
      },
      'eth_estimateGas': async () => {
        postEvmProvStatusToWallet({ pushedByTimer: false, whichEthRequestIfAny: 'eth_estimateGas' });
        return '0x5208';
      },
      'eth_subscribe': async () => {
        postEvmProvStatusToWallet({ pushedByTimer: false, whichEthRequestIfAny: 'eth_subscribe' });
        return '0x' + Math.random().toString(16).slice(2);
      },
      'eth_unsubscribe': async () => {
        postEvmProvStatusToWallet({ pushedByTimer: false, whichEthRequestIfAny: 'eth_unsubscribe' });
        return true;
      },
      'eth_getBlockByNumber': async (params) => {
        return handleReadOnlyRpcApiCall('eth_getBlockByNumber', params);
      },
      'eth_maxPriorityFeePerGas': async (params) => {
        return handleReadOnlyRpcApiCall('eth_maxPriorityFeePerGas', params);
      },
      'personal_sign': async (params) => {
        return handleWriteOnlyRpcApiCall('personal_sign', params);
      },
      'eth_signTypedData_v4': async (params) => {
        return handleWriteOnlyRpcApiCall('eth_signTypedData_v4', params);
      },



      'eth_getCode': async (params) => {
        return handleReadOnlyRpcApiCall('eth_getCode', params);
      },

      'wallet_switchEthereumChain': async ([params]) => {
        // 1. Log locally so you can see it in the dApp console
        console.log('[wallet_switchEthereumChain] Intercepted Params:', JSON.stringify(params));
        let switchChainId = params?.chainId;
        if (switchChainId != null) {
          if (typeof switchChainId === 'number') {
            switchChainId = '0x' + switchChainId.toString(16);
          } else if (!switchChainId.startsWith('0x')) {
            switchChainId = '0x' + parseInt(switchChainId, 10).toString(16);
          }
        }

        // 2. Use forwardRequest to send to wallet AND wait for the result
        try {
          const args = {
            method: 'wallet_switchEthereumChain',
            params: [params],
            payload: { switchChainId: switchChainId },
          };
          const result = await forwardRequest(args);
          console.log('[wallet_switchEthereumChain Result from wallet:', result);
//Summary Table for result
//Scenario       Return Value(msg.result)  Error Code
//User Approves      null                     N/A
//User Cancels     N/A (Reject)              4001
//Chain Unknown    N/A (Reject)              4902
//Wallet Busy      N/A (Reject)             -32002
          providerState.currentChainId = switchChainId;
          provider.chainId = switchChainId;
          provider.networkVersion = parseInt(switchChainId, 16).toString();
          // Notify dApp of chain/network change via standard EIP-1193 events
          emit('chainChanged', switchChainId);                               // hex string
          emit('networkChanged', parseInt(switchChainId, 16).toString());    // legacy support

          return result;
        } catch (error) {
          // New: Alert the wallet UI for debugging
          postToWallet({
            to: 'wallet',
            type: 'message_to_programmer',
            error: true,
            errorDetail: error.message || 'Unknown wallet_switchEthereumChain error',
            method: 'wallet_switchEthereumChain'
          });
          throw error; // Still throw so the dApp knows it failed
        }
      },

      'wallet_revokePermissions': async () => {

        revokeConnection('wallet_revokePermissions');

        return null;
      },

      'wallet_requestPermissions': async (params) => {
//FIX ATTEMPT when attepting connect via dapp Connect button:
        providerState.pending = false;
        return provider.request({ method: 'eth_requestAccounts' });
      },
      'wallet_watchAsset': async (params) => {
        return handleReadOnlyRpcApiCall('wallet_watchAsset', params);
      },
      'wallet_getPermissions': async (params) => {
        //return handleReadOnlyRpcApiCall('wallet_getPermissions', params);
        return [];
      },
      'web3_clientVersion': async () => {
        postEvmProvStatusToWallet({ pushedByTimer: false, whichEthRequestIfAny: 'web3_clientVersion' });
        return "SimpleWebpageCryptoWallet/v0.0.1/Linux/javascript";
      },

      'eth_sendTransaction': async (params) => {
        return handleWriteOnlyRpcApiCall('eth_sendTransaction', params);
      },

      'wallet_sendTransaction': async (params) => {
        return handleWriteOnlyRpcApiCall('wallet_sendTransaction', params);
      }
    };


    //------------------------------------------------------------
    // GLOBAL LISTENER?
    //------------------------------------------------------------
    // 🔹 Minimal addition: listen for wallet-initiated approval events
    window.addEventListener('message', (event) => {
      // 1. Initialize msg first
      const msg = event.data;

      console.log('----------------------------');
      console.log('GLOBAL LISTENER');
      console.log('----------------------------');
      console.log('[Global Listener RAW IN ←]',
        JSON.stringify({
          timestamp: Date.now(),
          origin: event.origin,
          sourceIsWindow: event.source === window,
          data: event.data
        })
      );

//FIX ATTEMPT when attepting connect via dapp Connect button:
      if (providerState.pending) {
        console.log('----------------------------');
        console.log('GLOBAL LISTENER');
        console.log('----------------------------');
        console.log('A Pending - Global Listener is out.');
        return;
      }

      // FIX: Accept both 'extension' and 'wallet' as valid senders
      const isValidSender = msg?.from === 'extension' || msg?.from === 'wallet';

      if (isValidSender && msg.type === 'wallet_origin_revokePermissions') {
        console.log('----------------------------');
        console.log('GLOBAL LISTENER');
        console.log('----------------------------');
        console.log('Global Listener got a revoke Permissions from wallet.');

        revokeConnection('wallet_origin_revokePermissions');
        return;
      }

      // REQUIRE networkType on all wallet → dapp messages
      if (isValidSender && !msg.networkType && !msg.payload?.networkType) {
        console.log('----------------------------');
        console.log('GLOBAL LISTENER');
        console.log('----------------------------');
        console.log(`Global Listener got message ${msg?.type} from wallet but missing networkType.`);
        postEvmProvStatusToWallet({
          pushedByTimer: false,
          whichEthRequestIfAny: msg?.type || null,
          hasError: true,
          errorDetail: 'Missing Network Type'
        });
        return;
      }

      const networkType = msg?.networkType || msg.payload?.networkType;
      if (isValidSender && networkType !== providerState.currentNetworkType) {
        console.log('----------------------------');
        console.log('GLOBAL LISTENER');
        console.log('----------------------------');
        console.log(`Global Listener got message ${msg?.type} from wallet but WRONG networkType.`);
        postEvmProvStatusToWallet({
          pushedByTimer: false,
          whichEthRequestIfAny: msg?.type || null,
          hasError: true,
          errorDetail: 'Network Type NOT EVM'
        });
        return;
      }

      if (isValidSender && (msg.type === 'wallet_origin_approved' || msg.type === 'wallet_origin_response')) {
        console.log('----------------------------');
        console.log('GLOBAL LISTENER');
        console.log('----------------------------');
        console.log(`Global Listener got APPROVE to connect from wallet.`);

        const approvedAddress = Array.isArray(msg.result) ? msg.result[0] : msg.result;
        const newChainId = msg.chainId || msg.payload?.chainId || null;

        console.log('[Global Listener] Updated provider state:', {
          accounts: providerState.accounts,
          currentChainId: providerState.currentChainId,
          selectedAddress: provider.selectedAddress,
          chainId: provider.chainId,
          newChainId
        });

        // Update provider state
        providerState.isConnected = true;
        providerState.currentChainId = newChainId;
        providerState.accounts[0] = approvedAddress;
        provider.selectedAddress = approvedAddress;
        provider.chainId = newChainId;
        provider.networkVersion = parseInt(newChainId, 16).toString();

        postEvmProvStatusToWallet({ pushedByTimer: false, whichEthRequestIfAny: null });

        emit('connect', { chainId: providerState.currentChainId });
        emit('accountsChanged', [approvedAddress]);
      }

      // 🔹 Handle chain/network change from wallet
      if (isValidSender && msg.type === 'wallet_origin_chainChanged') {
        console.log('----------------------------');
        console.log('GLOBAL LISTENER');
        console.log('----------------------------');
        console.log(`Global Listener got CHNG NETWORK connect from wallet.`);
        const newChainId = msg.chainId || msg.payload?.chainId || null;
        if (!newChainId) return;

        providerState.currentChainId = newChainId;
        provider.chainId = newChainId;
        provider.networkVersion = parseInt(newChainId, 16).toString();

        // Notify dApp of chain/network change
        emit('chainChanged', newChainId); // Ensure this is the hex string (e.g., '0x1')
      }

    });

  const provider = {
    isMyWallet: true,
    isMetaMask: true,
    isStatus: true,
    host: window.location.host,
    path: window.location.pathname,
    selectedAddress: providerState.isConnected ? providerState.accounts[0] : null,
    isConnected: () => providerState.isConnected,
    chainId: providerState.currentChainId,
    networkVersion: providerState.currentChainId ? parseInt(providerState.currentChainId, 16).toString() : null,
    on, emit,
    request: async ({ method, params }) => {
      if (methodHandlers[method]) return await methodHandlers[method](params);
      console.warn('[provider.request] MISSING HANDLER:', method);
      postEvmProvStatusToWallet({
        pushedByTimer: false,
        whichEthRequestIfAny: method,
        hasError: true,
        errorDetail: 'Missing Dapp Provider Method'
      });
      throw new Error('Method not implemented: ' + method);
    },
    enable() {
      return this.request({ method: 'eth_requestAccounts' });
    },
  };

  // After provider is fully initialized
  providerState.provider = provider;

    // Add the shims AFTER so they can reference provider.request
    provider.sendAsync = (payload, callback) => {
      provider.request(payload)
        .then(res => callback(null, { id: payload.id, jsonrpc: '2.0', result: res }))
        .catch(err => callback(err));
    };

    provider.send = (payload, callback) => {
      if (typeof callback === 'function') return provider.sendAsync(payload, callback);

      // Synchronous fallback for basic property checks (legacy web3.js)
      const method = typeof payload === 'string' ? payload : payload?.method;

      // 🟢 PATCH: Fire probe if sync check happens
      if (method === 'eth_accounts') {
        if (providerState.accounts[0]) return providerState.accounts;
        markAsDapp();
        const payload = {
          isDapp: providerState.isDapp,
          isConnected: providerState.isConnected,
          accounts: providerState.accounts.slice(),
          currentChainId: providerState.currentChainId,
        };

        postToWallet({
          to: 'wallet',
          type: 'eth_accounts_probe',
          origin: window.location.origin,
          href: window.location.href,
          payload,
          isNotification: true
        });
        return [];
      }
      if (method === 'eth_chainId') {
        postEvmProvStatusToWallet({ pushedByTimer: false, whichEthRequestIfAny: 'eth_chainId' });
        return providerState.currentChainId;
      }

      return { id: payload?.id, jsonrpc: '2.0', result: null };
    };

    // single-flight guard for blocking requests
    const origRequest = provider.request;
    provider.request = async (args) => {

      // 🔹 mark the dapp active on any call
      markAsDapp();

      // 🔹 set network type if not yet set
      if (!providerState.currentNetworkType) providerState.currentNetworkType = EVM_NETWORK_TYPE;

      while (providerState.pending) await new Promise(r => setTimeout(r, 10));
      providerState.pending = true;
      try {
        return await origRequest.call(provider, args);
      } finally {
        providerState.pending = false;
      }
    };

    window.myWallet = provider;
    window.ethereum = provider;

    // Ensure window.ethereum exists and our provider is first
    if (!window.ethereum) {
      window.ethereum = provider;
    } else {
      window.ethereum.providers ||= [];
      if (!window.ethereum.providers.includes(provider)) {
        window.ethereum.providers.unshift(provider);
      }
    }

    // 🔹 FORCE DISCONNECT
    revokeConnection('Forced disconnect at load');

    if (!providerState.statusTimerStarted) {
      providerState.statusTimerStarted = true;
      startAutoStatusTimer();
    }


    // Listen for discovery requests and announce immediately
    window.addEventListener('eip6963:requestProvider', announce);
    announce();

    // EIP-6963 announce, slightly delayed to ensure dapp can detect
    setTimeout(announce, 50);

    // announce again shortly to catch late scanners
    setTimeout(() => {announce();}, 200);



  }
})();//END OF FILE
