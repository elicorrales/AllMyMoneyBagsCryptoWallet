// background.js — top-level

importScripts('site-persistence.js', 'background-helper.js');

let lastOpenDappTimestamp = 0;

let oldWalletTabId = null;
let walletReady = false;
let dappTabId = null;
// Single in-flight dapp request (by design)
let pendingDappResponse = null;

// DEFAULT DEV VALUE
let MAX_DAPP_TABS = 7; // dev default
let CLOSE_ALL_TABS_IF_WALLET_TAB_MISSING = false; // dev default
let ALLOW_CHROME_EXTENSION_MANAGER = null;

/*
// --- LOAD SCREEN SIZE CONFIG ---
let WINDOW_WIDTH = null;
let WINDOW_HEIGHT = null;
let WINDOW_OFFSET_X = null;
let WINDOW_OFFSET_Y = null;
*/
let lastAuthorizedUrl = null; // only set via WALLET_OPEN_DAPP message

console.log('[background] Starting service worker...');
console.log('[background] Default MAX_DAPP_TABS:', MAX_DAPP_TABS);

// background.js top-level
loadExtensionConfig().then(() => { pokeAllTabsForRegistration(); });
/*
// Load configs in sequence
loadExtensionConfig()
  .then(() => {
    pokeAllTabsForRegistration();
    return loadExtensionScreenSizeConfig();
  })
  .then(() => {
    console.log('[background] Screen-size config loaded, ready for window creation.');
  })
  .catch(err => {
    console.warn('[background] Failed to load configs:', err);
  });;
*/
//let activeDapps = new Set();
let activeDapps = new Map();

// --- PROACTIVE BOUNCER ---
chrome.tabs.onCreated.addListener(handleTabCreated);

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener(handleTabRemoved);


// --- NEW: Minimize/Restore all related windows via polling ---
const projectWindowIds = new Set();
const lastWindowStates = new Map(); // track previous states for logging

async function updateProjectWindowsSet() {
  const tabs = await chrome.tabs.query({});
  projectWindowIds.clear();
  tabs.forEach(tab => {
    if (tab.id === oldWalletTabId || tab.id === dappTabId) {
      projectWindowIds.add(tab.windowId);
    }
  });
  console.log('[DEBUG] Project window IDs updated:', Array.from(projectWindowIds));
}

// Poll all project windows every 500ms to detect minimize/restore
async function pollProjectWindowStates() {
  await updateProjectWindowsSet();

  for (const winId of projectWindowIds) {
    try {
      const win = await chrome.windows.get(winId);
      const prevState = lastWindowStates.get(winId) || 'unknown';

      if (win.state !== prevState) {
        console.log(`[DEBUG] Window ${winId} state changed: ${prevState} → ${win.state}`);
        lastWindowStates.set(winId, win.state);

        // Apply this new state to all other project windows
        projectWindowIds.forEach(id => {
          if (id !== winId) {
            console.log(`[DEBUG] Updating window ${id} to state ${win.state}`);
            chrome.windows.update(id, { state: win.state });
          }
        });
      }
    } catch (err) {
      console.warn('[DEBUG] Failed to get window', winId, err);
    }
  }
}

// Start polling
setInterval(pollProjectWindowStates, 500);

// Track tab/window changes to refresh the project window set
chrome.tabs.onCreated.addListener(async (tab) => {
  console.log('[DEBUG] tab created:', tab.id);
  await updateProjectWindowsSet();
});
chrome.tabs.onRemoved.addListener(async (tabId) => {
  console.log('[DEBUG] tab removed:', tabId);
  await updateProjectWindowsSet();
});
chrome.windows.onRemoved.addListener(async (winId) => {
  console.log('[DEBUG] window removed:', winId);
  await updateProjectWindowsSet();
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id; // <-- optional chaining in case sender.tab is undefined
  console.log('[Background] got message:', JSON.stringify(message), 'from tab:', tabId);

  // -------------------------------
  // NEW: Wallet-triggered shutdown
  // -------------------------------
  if (message.type === 'WALLET_CLOSE_ALL' && message.from === 'wallet-to-background') {
    if (oldWalletTabId) {
      closeAllTabsSequentially(oldWalletTabId);
    }
    return;
  }

  if (message.type === 'OPEN_DAPP' && message.from === 'wallet-to-background') {
    const now = Date.now();
    // Ignore if sent within 500ms of the last one
    if (now - lastOpenDappTimestamp < 500) {
      console.log('[Background] Ignoring duplicate OPEN_DAPP message');
      return;
    }
    lastOpenDappTimestamp = now;

    handleOpenDappRequest();
    return;
  }
  // Registration
  if (message.type === 'REGISTER' || message.type === 'RE_REGISTER_ACK') {
    handleRegistration(message, tabId);
    return;
  }

  // Dapp → Wallet (BLOCK HERE)
  // Handle Dapp → Wallet routing via helper
  const wasDappMessage = routeDappToWallet(message);
  if (wasDappMessage) return;

  // Wallet → Dapp (USER APPROVAL RESOLUTION)
  if (message.from === 'wallet') {
    routeWalletToDapp(message);
    return;
  }

});//END OF chrome.runtime.onMessage.addListener block


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // We only care if the URL has actually changed and is fully loaded
  if (changeInfo.url) {
    console.log('[Background] URL change detected:', changeInfo.url);

    // Optional: Filter out internal chrome:// pages or the extension's own pages
    if (changeInfo.url.startsWith('http')) {
      SitePersistence.addUrl(changeInfo.url);
    }
  }
});


// --- SERVICE WORKER PERSISTENCE HACK (NON-FUNCTIONAL) ---
// Listen for the dummy port from wallet-content.js to reset the idle timer.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "NON_FUNCTIONAL_KEEP_ALIVE") {
    // We don't need to do anything with this port.
    // Just its existence keeps the Service Worker from sleeping.
    port.onMessage.addListener(() => { /* No-op */ });
  }
});
