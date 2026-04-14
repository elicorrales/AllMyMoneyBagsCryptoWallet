//wallet-iframe/navigation.js

    // Whitelist of allowed pages (without .html)
    const allowedPages = new Set([
      'SimpleWebPageCryptoWallet-loggedoff',
      'SimpleWebPageCryptoWallet-intro',
      'SimpleWebPageCryptoWallet-app-closed',
      'SimpleWebPageCryptoWallet-main',
      'SimpleWebPageCryptoWallet-new-or-select',
      // add other valid page names as needed
    ]);

    // Load initial page
    iframe.src = 'SimpleWebPageCryptoWallet-loggedoff.html?launchedByScript=1';

    window.addEventListener('message', (event) => {
      if (event.source !== iframe.contentWindow) return;

      const data = event.data;
      if (!data || data.type !== 'navigateTo' || !data.page) return;

      if (!allowedPages.has(data.page)) {
        console.warn('Blocked navigation to unauthorized page:', data.page);
        return;
      }

      iframe.src = `${data.page}.html?launchedByScript=1`;
      //console.log('Shell loading page:', data.page);
    });

    // Forward messages from top window (content.js / extension) into iframe
    window.addEventListener('message', (event) => {
      //console.log('[NAV HELPER] msg event?:', event);

      // ignore messages from the iframe itself
      if (event.source === iframe.contentWindow) return;

      const msg = event.data;
      //console.log('[NAV HELPER] Got message from top window:', msg);
      if (!msg) return;

      // optionally filter by known 'from' types
      const validFrom = ['extension', 'dapp', 'wallet', 'background'];
      if (!validFrom.includes(msg.from)) return;

      // forward into iframe
      //console.log('[NAV HELPER] forward into iframe:', msg);
      iframe.contentWindow.postMessage(msg, '*');
    });

    // --- New: Forward messages from iframe back to top window ---
    window.addEventListener('message', (event) => {
      if (event.source !== iframe.contentWindow) return;

      const msg = event.data;
      if (!msg) return;

      // 🚫 STOP wallet messages here (prevents double REGISTER)
      if (msg.from === 'wallet') return;

      // optionally filter
      const validFrom = ['wallet', 'dapp', 'wallet-to-background'];
      if (!validFrom.includes(msg.from)) return;

      console.log('[NAV HELPER] Forwarding message from iframe to top window:', msg);
      window.postMessage(msg, '*');
    });

