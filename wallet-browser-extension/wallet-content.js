// wallet-content.js — Wallet-only content script

//console.log('[wallet-content.js] loaded at', window.location.href);

function sendRegistrationToBackground(type = 'REGISTER') {
  chrome.runtime.sendMessage({
    type,
    role: 'wallet',   // or 'dapp'
    href: window.location.href,
    origin: window.location.origin
  });
}

sendRegistrationToBackground();

// 1) Inject the wallet script into the page
//console.log('[wallet-content.js] injecting injected-wallet.js');
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected-wallet.js');
script.onload = () => {
  //console.log('[wallet-content.js] injected-wallet.js loaded, removing script tag');
  script.remove();
};
(document.head || document.documentElement).appendChild(script);

// 2) Bridge: Page -> Extension
window.addEventListener('message', event => {
  //console.log('[wallet-content.js] window message event received:', event);

  const msg = event.data;
  //console.log('[wallet-content.js] extracted msg:', msg);

  if (!msg) {
    //console.log('[wallet-content.js] msg is null/undefined, ignoring');
    return;
  }

  if (!msg.from) {
    //console.log('[wallet-content.js] msg.from missing, ignoring');
    return;
  }

  // Prevent infinite echo: skip messages that came from extension back to wallet
  // This also catches messages we just posted ourselves (labeled 'from: extension')
  if (msg.from === 'extension') {
    //console.log('[wallet-content.js] skipping message labeled from extension to prevent echo loop:', msg);
    return;
  }

  if (!['wallet','wallet-to-background'].includes(msg.from)) {
    //console.log('[wallet-content.js] msg.from not wallet, ignoring:', msg.from);
    return;
  }

  if (msg.type === 'REGISTER' && msg.from === 'wallet') {
    //console.log('[wallet-content.js] forwarding wallet REGISTER to background:', msg);
    chrome.runtime.sendMessage(msg);
    return;
  }

  //console.log('[wallet-content.js] forwarding wallet message to background:', msg);
  chrome.runtime.sendMessage(msg);
});

// 3) Bridge: Extension -> Page
chrome.runtime.onMessage.addListener(message => {
  //console.log('[wallet-content.js] received message from background:', message);

  if (!message) {
    //console.log('[wallet-content.js] background message is null/undefined, ignoring');
    return;
  }

  if (message.from === 'background' && message.type === 'RE_REGISTER_PROMPT') {
    //console.log('[Content] Received poke, re-registering...');
    // Call your existing push registration function
    sendRegistrationToBackground('RE_REGISTER_ACK');
    return;
  }

  // Prevent infinite echo: skip messages already originating from wallet
  if (message.originalSource === 'wallet') {
    //console.log('[wallet-content.js] skipping background message originally from wallet to prevent echo:', message);
    return;
  }

  const relay = { ...message, from: 'extension', originalSource: message.from };
  //console.log('[wallet-content.js] posting message to page:', relay);

  window.postMessage(relay, '*');
});

// --- SERVICE WORKER PERSISTENCE HACK (NON-FUNCTIONAL) ---
// This code exists solely to prevent the MV3 Service Worker from sleeping.
// It does not send or receive any actual wallet data.

let swLifecyclePort = null;

function keepServiceWorkerAlive() {
  if (swLifecyclePort) return;

  // Open a dummy port to the background script
  swLifecyclePort = chrome.runtime.connect({ name: "NON_FUNCTIONAL_KEEP_ALIVE" });

  // If the Service Worker closes/crashes, reconnect immediately to wake it up
  swLifecyclePort.onDisconnect.addListener(() => {
    swLifecyclePort = null;
    console.log("[Wallet Lifecycle] Service Worker cycled. Reconnecting to wake...");
    setTimeout(keepServiceWorkerAlive, 500); // Short delay to avoid spamming
  });
}

// Start the "call" as soon as the wallet content script loads
keepServiceWorkerAlive();
