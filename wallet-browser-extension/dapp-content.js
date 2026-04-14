// dapp-content.js — Dapp-only content script

console.log('[dapp-content.js] loaded at', window.location.href);

function sendRegistrationToBackground(type = 'REGISTER') {
  // 1) Dapp registration (page load)
  //console.log('[dapp-content.js] sending REGISTER role:dapp');
  chrome.runtime.sendMessage({
    type,
    role: 'dapp',
    origin: window.location.origin,
    href: window.location.href
  });
}


sendRegistrationToBackground();

// 2) Bridge: Page -> Extension
window.addEventListener('message', event => {
  //console.log('[dapp-content.js] window message event received:', event);

  const msg = event.data;
  //console.log('[dapp-content.js] extracted msg:', msg);

  if (!msg) {
    //console.log('[dapp-content.js] msg is null/undefined, ignoring');
    return;
  }

  if (!msg.from) {
    //console.log('[dapp-content.js] msg.from missing, ignoring');
    return;
  }

  // 🚫 LOOP PROTECTION: If the message is from 'extension', it's a message
  // we just posted into the page. We must NOT send it back to background.
  if (msg.from === 'extension') {
    //console.log('[dapp-content.js] skipping message from extension to prevent loop:', msg);
    return;
  }

  if (!['dapp', 'wallet'].includes(msg.from)) {
    //console.log('[dapp-content.js] msg.from invalid, ignoring:', msg.from);
    return;
  }

  // Prevent REGISTER echo loops
  if (msg.type === 'REGISTER' && msg.originalSource === 'extension') {
    //console.log('[dapp-content.js] ignoring REGISTER from extension to prevent loop');
    return;
  }

  if (msg.type === 'REGISTER' && msg.from === 'extension' && !msg.isNotification) {
    //console.log('[dapp-content.js] dropping REGISTER from extension');
    return;
  }

  //console.log('[dapp-content.js] forwarding message to background:', msg);
  chrome.runtime.sendMessage(msg);
});

// 3) Bridge: Extension -> Page
chrome.runtime.onMessage.addListener(message => {
  //console.log('[dapp-content.js] received message from background:', message);

  if (!message) {
    //console.log('[dapp-content.js] background message is null/undefined, ignoring');
    return;
  }

  if (message.from === 'background' && message.type === 'RE_REGISTER_PROMPT') {
    //console.log('[Content] Received poke, re-registering...');
    // Call your existing push registration function
    sendRegistrationToBackground('RE_REGISTER_ACK');
    return;
  }

  const relay = {
    ...message,
    from: 'extension',
    originalSource: message.from
  };

  //console.log('[dapp-content.js] posting message to page:', relay);
  window.postMessage(relay, '*');
});
