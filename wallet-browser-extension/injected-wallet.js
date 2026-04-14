// injected-wallet.js

if (location.protocol === 'file:') {
  // Define the handler
  function handleIncoming(event) {
    const msg = event.data;

    if (msg.to && msg.to !== 'wallet') {
      // Message not intended for wallet, ignore
      return;
    }

    // 🚫 prevent wallet echo / self-loop
    if (msg?.from === 'wallet') {
      return;
    }

    // Only accept known, valid sources
    const validFrom = ['dapp', 'wallet', 'extension', 'background'];
    if (!validFrom.includes(msg?.from)) {
      //console.warn('[Wallet] Ignoring message from unknown source:', msg);
      return;
    }

    //console.log(`[Wallet] Message received from '${msg.from}':`, msg);

    // Handle fire-and-forget eth_accounts_probe
    if (msg.type === 'eth_accounts_probe') {
      //console.log('[Wallet] eth_accounts_probe received from dApp:', msg.origin);

      // Trigger your centralized UI handler
      if (typeof window.walletHandleDappMessage === 'function') {
        window.walletHandleDappMessage(msg);
      }

      // STOP HERE. We've handled the probe; don't run the generic code below.
      return;
    }

    // --- Minimal Change Start ---
    // Handle internal extension registration ACK silently
    if (msg.type === 'REGISTER_ACK') {
      if (typeof window.walletHandleDappMessage === 'function') {
        window.walletHandleDappMessage(msg);
      }
      return;
    }
    // --- Minimal Change End ---

    // Generic log for all other non-probe messages (requests, responses, etc)
    //console.log(`[Wallet] Message received from '${msg.from}':`, msg);

    // Forward all other valid messages for centralized handling
    if (typeof window.walletHandleDappMessage === 'function') {
      window.walletHandleDappMessage(msg);
    } else {
      // Only warn for actual dapp-originated messages that have no handler
      if (msg.from === 'dapp') {
        console.warn('[Wallet] No walletHandleDappMessage handler available.');
      }
    }
  }

  // Expose activation function
  window.walletStartListening = () => {
    //console.log('[Wallet] Starting listener for messages');
    window.addEventListener('message', handleIncoming);
  };

  window.walletStopListening = () => {
    //console.log('[Wallet] Stopping listener for messages');
    try {
      window.removeEventListener('message', handleIncoming);
    } catch (err) {
      console.warn('[Wallet] Tried to remove listener, but failed:', err);
    }
  };

  // --- START listener automatically ---
  window.walletStartListening();
}
