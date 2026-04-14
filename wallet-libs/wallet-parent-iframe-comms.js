// wallet-libs/wallet-parent-iframe-comms.js

const WalletParentComms = (function () {
  let parentSecret = null;
  let secretAcked = false; // new flag

  async function obtainUserEnteredPasswordFromParentIframeIfThereIsOne() {

    // if we already have the password, no need to do this?
    if (WalletAppState.password !== null) { return; }

    try {
      // wait up to 2 seconds for secret ack
      const timeout = 2000;
      const interval = 50;
      let waited = 0;

      while (!WalletParentComms.secretIsAcked() && waited < timeout) {
        await new Promise(r => setTimeout(r, interval));
        waited += interval;
      }

      if (!WalletParentComms.secretIsAcked()) {
        throw new Error('Parent-child secret exchange failed');
      }

      await WalletParentComms.requestPasswordFromParent();

    } catch (err) {
      console.warn('Could not obtain password from parent iframe:', err);
      WalletInfoModal.show({
        message: `Wallet not launched correctly, OR Proxy shutdown: ${err}`,
        details: 'Use official launcher to open wallet, or re-try.',
        redirectTo: 'SimpleWebPageCryptoWallet-app-closed.html'
      });
    }
  }

  function requestPasswordFromParent() {
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data && event.data.type === 'deliverPassword' && event.data.secret === parentSecret) {
          window.removeEventListener('message', handler);
          WalletAppState.password = event.data.value || null;
          console.log('Child: got password from parent');
          resolve(WalletAppState.password);
        }
      };
      window.addEventListener('message', handler);

      window.parent.postMessage({ type: 'requestPassword', secret: parentSecret }, '*');
    });
  }

  function sendMessageToParent(type, payload) {
    if (!parentSecret) {
      //console.warn('Tried to send before secret was set');
      return;
    }
    window.parent.postMessage({ type, secret: parentSecret, payload }, '*');
  }

  function handleParentSecret(event) {
    if (!event.data || event.data.type !== 'parentSecret') return;
    parentSecret = event.data.value;
    secretAcked = true; // set flag

    // send ack
    window.parent.postMessage({ type: 'ackSecret', value: parentSecret }, '*');
  }

  async function sendPasswordToParentAndSwitch(newPage) {
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data && event.data.type === 'ackStorePassword' && event.data.secret === parentSecret) {
          window.removeEventListener('message', handler);
          resolve();
        }
      };
      window.addEventListener('message', handler);

      window.parent.postMessage({
        type: 'storePassword',
        secret: parentSecret,
        value: WalletAppState.password || null
      }, '*');
    }).then(() => {
      window.parent.postMessage(
        { type: 'navigateTo', page: newPage.replace('.html', '') },
        '*'
      );
    });
  }

  function secretIsAcked() {
    return !!secretAcked;
  }

  window.addEventListener('message', handleParentSecret);

  return {
    obtainUserEnteredPasswordFromParentIframeIfThereIsOne,
    requestPasswordFromParent,
    sendMessageToParent,
    sendPasswordToParentAndSwitch,
    secretIsAcked, // expose method
  };
})();

