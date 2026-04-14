// wallet-iframe/secret-session.js

// One-time secret, generated when parent loads
const parentSecret = crypto.getRandomValues(new Uint32Array(4)).join('-');
let secretAcked = false;
let secretRetryTimer = null;

// send secret until child acks
function sendSecret() {
  if (iframe.contentWindow && !secretAcked) {
    iframe.contentWindow.postMessage({ type: 'parentSecret', value: parentSecret }, '*');
    //console.log('Parent sent secret to child');
  }
}

// start retry loop on each iframe load
iframe.addEventListener('load', () => {
  secretAcked = false;
  if (secretRetryTimer) clearInterval(secretRetryTimer);
  secretRetryTimer = setInterval(() => sendSecret(), 500); // retry every 500ms
  sendSecret(); // fire immediately
});

// handle ack from child
window.addEventListener('message', (event) => {
  if (event.source !== iframe.contentWindow) return;
  const data = event.data;
  if (!data) return;

  if (data.type === 'ackSecret' && data.value === parentSecret) {
    secretAcked = true;
    if (secretRetryTimer) {
      clearInterval(secretRetryTimer);
      secretRetryTimer = null;
    }
    //console.log('Parent: child acknowledged secret');
  }
});

// utility for verifying child messages
function verifyChildMessage(event) {
  if (event.source !== iframe.contentWindow) return false;
  if (!event.data || event.data.secret !== parentSecret) return false;
  return true;
}

let cachedPassword = null;

window.addEventListener('message', (event) => {
  if (event.source !== iframe.contentWindow) return;
  const data = event.data;
  if (!data || data.secret !== parentSecret) return;

  switch (data.type) {
    case 'storePassword':
      cachedPassword = data.value || null;
      //console.log('Parent: cached password from child');
      //console.log(`Parent: cached password from child: ${cachedPassword}`);
      event.source.postMessage({ type: 'ackStorePassword', secret: parentSecret }, '*');
      break;

    case 'requestPassword':
      event.source.postMessage({ type: 'deliverPassword', secret: parentSecret, value: cachedPassword }, '*');
      //console.log('Parent: delivered password to new child');
      break;
  }
});

