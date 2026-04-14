// background-helper.js

/**
 * Pokes all open tabs to trigger their registration push
 */
function pokeAllTabsForRegistration() {
  console.log('[Background-helper] Poking all tabs for registration...');
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      // Added 'from: background' for content-script filtering
      chrome.tabs.sendMessage(tab.id, { 
        type: 'RE_REGISTER_PROMPT', 
        from: 'background' 
      }, () => {
        if (chrome.runtime.lastError) {
          // This is expected for tabs where your script isn't injected
        }
      });
    });
  });
}

/**
 * Loads the optional production config and updates global settings
 */
async function loadExtensionConfig() {
  try {
    const url = chrome.runtime.getURL('wallet-extension-config.json');
    const response = await fetch(url);

    if (response.ok) {
      const CONFIG = await response.json();

      if (typeof CONFIG === 'object' && CONFIG.production) {
        const prod = CONFIG.production;

        if (prod.MAX_DAPP_TABS !== undefined) {
          MAX_DAPP_TABS = prod.MAX_DAPP_TABS;
          console.log('[Background-helper] Loaded MAX_DAPP_TABS:', MAX_DAPP_TABS);
        }

        if (prod.CLOSE_ALL_TABS_IF_WALLET_TAB_MISSING !== undefined) {
          CLOSE_ALL_TABS_IF_WALLET_TAB_MISSING = prod.CLOSE_ALL_TABS_IF_WALLET_TAB_MISSING;
          console.log('[Background-helper] Loaded CLOSE_ALL_TABS_IF_WALLET_TAB_MISSING:', CLOSE_ALL_TABS_IF_WALLET_TAB_MISSING);
        }

        if (prod.ALLOW_CHROME_EXTENSION_MANAGER !== undefined) {
          ALLOW_CHROME_EXTENSION_MANAGER = prod.ALLOW_CHROME_EXTENSION_MANAGER;
          console.log('[Background-helper] Loaded ALLOW_CHROME_EXTENSION_MANAGER:', ALLOW_CHROME_EXTENSION_MANAGER);
        }
      }
    } else {
      console.log('[Background-helper] wallet-extension-config.json not found, using dev defaults.');
    }
  } catch (err) {
    console.warn('[Background-helper] Config fetch failed, using dev defaults:', err);
  }
}


/**
 * Close all tabs except wallet, then wallet last
 */
async function closeAllTabsSequentially(walletTabId) {
  const tabs = await chrome.tabs.query({});
  const otherTabs = tabs.filter(t => t.id !== walletTabId);

  // Close all non-wallet tabs first
  for (const tab of otherTabs) {
    try {
      console.log('[Background] Closing tab:', tab.id);
      await chrome.tabs.remove(tab.id);
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.warn('[Background] Failed closing tab:', tab.id, err);
    }
  }

  await new Promise(r => setTimeout(r, 1000));

  // Close wallet last
  try {
    console.log('[Background] Closing wallet tab:', walletTabId);
    await chrome.tabs.remove(walletTabId);
  } catch (err) {
    console.warn('[Background] Failed closing wallet tab:', walletTabId, err);
  }
}

/**
 * Helper to inject the blocked UI from the local blocked.html file
 */
async function injectBlockedUI(tabId) {
  try {
    const response = await fetch(chrome.runtime.getURL('blocked.html'));
    const html = await response.text();

    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (htmlContent) => {
        window.stop();
        document.documentElement.innerHTML = htmlContent;
      },
      args: [html]
    });
  } catch (err) {
    console.error('[Background] Failed to inject blocked UI:', err);
  }
}


/**
 * Pops a tab (or new window) into a half-screen layout:
 * - Wallet: left half
 * - dApp: right half
 */
async function createOffsetWindow(tabId = null) {
  const displays = await new Promise(resolve =>
    chrome.system.display.getInfo(resolve)
  );

  // Use primary display
  const primary = displays.find(d => d.isPrimary) || displays[0];
  const screenWidth = primary.workArea.width;
  const screenHeight = primary.workArea.height;

  const isWallet = tabId === oldWalletTabId;
  const left = isWallet ? 0 : Math.floor(screenWidth / 2);
  const width = Math.floor(screenWidth / 2);

  const options = {
    type: 'normal',
    focused: true,
    left: left,
    top: 0,
    width: width,
    height: screenHeight
  };

  if (tabId) options.tabId = tabId;

  return chrome.windows.create(options);
}


function sendMessageToTab(tabId, msg) {
  console.log(`[Background] Attempting to send message to tab ${tabId}:`, JSON.stringify(msg));
  chrome.tabs.sendMessage(tabId, msg);
}

/**
 * Handles tab registration for both Wallet and Dapp roles
 */
function handleRegistration(message, tabId) {
  console.log(`[Background-helper] message is type ${message.type}`);

  if (message.from === 'wallet') {
    if (!message.tabId) message.tabId = tabId;
    if (!message.role) message.role = 'wallet';
  }

  // --- WALLET ROLE ---
  if (message.role === 'wallet') {
    oldWalletTabId = tabId;
    walletReady = true;
    message.tabId = tabId;
    console.log(`[Background-helper] Wallet tab registered. ID: ${oldWalletTabId}`);

    sendMessageToTab(oldWalletTabId, {
      from: 'extension',
      type: 'REGISTER_ACK',
      role: message.role,    // reuse from incoming message
      tabId: tabId,          // still need the tabId from background context
      origin: message.origin,
      href: message.href
    });
  }

  // --- DAPP ROLE ---
  if (message.role === 'dapp') {
    if (!activeDapps.has(tabId)) {
      if (activeDapps.size >= MAX_DAPP_TABS) {
        console.warn(`[Background-helper] Blocking tab ${tabId}: Limit reached.`);
        injectBlockedUI(tabId);
        return; 
      }
      //activeDapps.add(tabId);
      activeDapps.set(tabId, {
        origin: message.origin,
        href: message.href
      });
      console.log(`[Background-helper] Slot assigned. Total: ${activeDapps.size}`);

      // Send informative REGISTER_ACK to wallet
      if (walletReady && oldWalletTabId) {
        sendMessageToTab(oldWalletTabId, {
          from: 'extension',
          type: 'REGISTER_ACK',
          role: 'dapp',
          tabId,
          origin: message.origin,
          href: message.href
        });
      }
    }

    dappTabId = tabId;
    pendingDappResponse = null; 
    message.tabId = tabId;
    console.log('[Background-helper] Dapp registered. ID:', dappTabId);
  }

  console.log(`[Background-helper] Registered ${message.role} tab:`, message.tabId);
}


function routeDappToWallet(message) {
  // Check if it's actually from a dApp source
  if (
    message.from === 'dapp' ||
    (message.from === 'extension' && message.originalSource === 'dapp')
  ) {
    console.log('[Background-helper] Processing Dapp message. Current state:', { oldWalletTabId, walletReady, isNotification: message.isNotification });

    if (oldWalletTabId) {
      console.log('[Background-helper] oldWalletTabId && walletReady');
      
      if (message.isNotification) {
        console.log('[Background-helper] Routing notification to wallet:', message.type);
        sendMessageToTab(oldWalletTabId, message);
        return;
      }

      console.log('[Background-helper] Forwarding Dapp message to wallet');
      sendMessageToTab(oldWalletTabId, message);
    } else {
      console.warn('[Background-helper] Cannot forward Dapp message: Wallet tab not ready or not registered');
    }
    return true; // Indicates we handled a dApp message
  } else {
    // This is the else block you noticed was missing
    if (message.from !== 'wallet') {
      console.warn(`[Background-helper] msg not from dapp?:from:${message.from}`);
    }
    return false;
  }
}


function routeWalletToDapp(message) {
  console.log('[Background-helper] Processing Wallet message. Current state:', { dappTabId });

  if (dappTabId) {
    console.log('[Background-helper] Pushing wallet event/response to dapp...');
    console.log(' \\');
    console.log('  \\[Background-helper] Forwarding to dapp tab:', dappTabId, 'full message:', JSON.stringify(message));

    // Ensure payload is forwarded
    sendMessageToTab(dappTabId, {
      ...message,
      payload: message.payload ?? null
    });
  } else {
    console.warn('[Background-helper] Cannot push wallet event: No dappTabId registered');
  }
}

/**
 * Enforces tab limits and redirects "New Tab" attempts into the existing dApp slot.
 */
function handleTabCreated(newTab) {
  console.log(`[Background-helper] onCreated fired. Tab: ${newTab.id}, Max: ${MAX_DAPP_TABS}, Active: ${activeDapps.size}`);

  chrome.tabs.query({}, (allTabs) => {
    // 1. The very first tab is ALWAYS the wallet. Leave it alone.
    if (allTabs.length === 1) {
      console.log("[Background-helper] First tab detected. Assuming Wallet.");
      return; 
    }

    // 2. Allowed dApp slot (Tab 2)
    // This handles the very first dApp window creation in both Dev and Prod.
    if (allTabs.length === 2) {
      console.log("[Background-helper] Second tab detected. Initializing dApp slot.");
      createOffsetWindow(newTab.id).then(() => {
        chrome.tabs.update(newTab.id, { url: chrome.runtime.getURL("dapp.html") });
      });
      return;
    }

    // 3. Beyond the 2-tab limit (Wallet + 1 Dapp)
    if (allTabs.length > 2) {
      
      // --- PRODUCTION REDIRECT LOGIC ---
      if (MAX_DAPP_TABS === 1) {
        // MINIMAL CHANGE: Fetch wallet tab to verify window ownership
        chrome.tabs.get(oldWalletTabId, (walletTab) => {
          // If '+' was clicked in the Wallet window, just kill it and STOP.
          if (!chrome.runtime.lastError && walletTab && newTab.windowId === walletTab.windowId) {
            console.log("[Background-helper] Blocking extra tab in Wallet window. No redirect.");
            // MINIMAL CHANGE: Show blocked UI instead of remove to prevent flash
            chrome.tabs.update(newTab.id, { url: chrome.runtime.getURL("blocked.html") });
            return;
          }

          console.log("[Background-helper] Third tab blocked in Prod. Redirecting existing dApp slot...");
          
          // Give the browser a moment to resolve the target URL
          setTimeout(() => {
            chrome.tabs.get(newTab.id, (tab) => {
              if (chrome.runtime.lastError || !tab) return;

              const targetUrl = tab.pendingUrl || tab.url;

              // If it's a real link (not a blank chrome page), push it to the existing dApp
              if (targetUrl && !targetUrl.includes('chrome://') && !targetUrl.includes('about:')) {
                if (dappTabId) {
                  chrome.tabs.update(dappTabId, { url: targetUrl, active: true });
                }
              }
              
              // Always kill the 3rd tab in Prod
              chrome.tabs.remove(newTab.id);
            });
          }, 150);
        });
      } 
      
      // --- DEV MODE LOGIC ---
      else {
        // If we haven't hit the Dev limit yet, let it live (but maybe block it)
        if (allTabs.length > (MAX_DAPP_TABS + 1)) {
          console.warn("[Background-helper] Dev limit reached. Blocking extra tab.");
          chrome.tabs.update(newTab.id, { url: chrome.runtime.getURL("blocked.html") });
        } else {
          console.log("[Background-helper] Dev mode: allowing additional tab.");
        }
      }
    }
  });
}

/**
 * Cleans up state when a tab is closed
 */
async function handleTabRemoved(tabId) {
  console.log(`[Background-helper] onRemoved: ${tabId}`);

  // 1. Free dApp slot
  if (activeDapps.has(tabId)) {
    activeDapps.delete(tabId);
    console.log(`[Background-helper] Slot freed. Active: ${activeDapps.size}`);
  }

  // 2. Clear legacy pointer
  if (dappTabId === tabId) {
    dappTabId = null;
  }

  // 3. Wallet closed logic
  if (tabId === oldWalletTabId) {
    oldWalletTabId = null;
    walletReady = false;

    if (CLOSE_ALL_TABS_IF_WALLET_TAB_MISSING) {
      await closeAllTabsSequentially(tabId);
    }
  }
}

async function handleOpenDappRequest() {
  // 1. Check for any tab that is already 'dapp.html' or 'blocked.html'
  // Or simply any tab that isn't the wallet.
  const tabs = await chrome.tabs.query({});
  const dappTab = tabs.find(t => 
    t.url?.includes('dapp.html') || 
    t.url?.includes('blocked.html') ||
    t.pendingUrl?.includes('dapp.html') // Catch it while it's still loading
  );

  if (dappTab) {
    // Bring the window to front AND select the tab
    chrome.windows.update(dappTab.windowId, { focused: true });
    chrome.tabs.update(dappTab.id, { active: true });
    return;
  }

  // 2. Only create if no dapp tab was found
  if (tabs.length <= MAX_DAPP_TABS) {
    // This creates a separate window. 
    // Your 'handleTabCreated' will still fire and handle the URL loading.
    await createOffsetWindow();
  }
}
