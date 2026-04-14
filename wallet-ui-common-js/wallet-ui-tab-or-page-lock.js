// wallet-ui-tab-or-page-lock.js

;(function(window) {
  const channel = new BroadcastChannel('wallet_channel');
  const tabId = crypto.randomUUID();

  window.enforceMutualExclusion = function(group) {

    const PING = `${group}_ping`;
    const PONG = `${group}_pong`;
    let pongReceived = false;

    // Listen for other tabs announcing themselves
    channel.onmessage = (e) => {
      if (typeof e.data !== 'object' || !e.data.type || !e.data.id) return;

      // Reply to other tab's ping
      if (e.data.type === PING && e.data.id !== tabId) {
        // Respond to another tab's presence check
        channel.postMessage({ type: PONG, id: tabId });
      }

      // If pong received from other tab, mark it
      if (e.data.type === PONG && e.data.id !== tabId) {
        // Someone else is already open
        pongReceived = true;
      }
    };

    // Initiate check
    setTimeout(() => {
      channel.postMessage({ type: PING, id: tabId });
    }, 0);

    // Wait 150ms for pong replies, then decide
    setTimeout(() => {
      if (pongReceived) {
        window.close();
        setTimeout(() => {
          window.location.href = 'wallet-ui-tab-or-page-blocked.html';
        }, 200);
      }
    }, 150);
  };
})(window);

