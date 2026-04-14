// wallet-ui-common-js/wallet-ui-provider-stats.js
const WalletAssetProviderStats = (function() {

  let _initialized = false;
  let _suppressFilterListeners = false; // ✅ new flag

  function loadAndShow() {
    const previousPanel = WalletUiPanel.getCurrentPanelId();
    renderProviders();
    
    // 1. Run the global show (sets display: block)
    WalletUiPanel.show('assetProviderStatsPanel');
    
    // 2. ✅ FORCE flex layout locally for scrolling
    const panel = document.getElementById('assetProviderStatsPanel');
    if (panel) panel.style.display = 'flex';

    WalletPageLevelUiBackArrow.showBackArrow({ show: previousPanel });
  }

  // ✅ helper to format "X secs/mins/days ago"
  function formatTimeAgo(ms) {
    const now = Date.now();
    const delta = now - ms;
    if (delta < 60_000) return `${Math.floor(delta / 1000)} secs ago`;
    if (delta < 3_600_000) return `${Math.floor(delta / 60_000)} mins ago`;
    if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)} hours ago`;
    return `${Math.floor(delta / 86_400_000)} days ago`;
  }

  function renderProviders() {
    const container = document.getElementById('assetProvListContainer');
    if (!container) return;

    container.innerHTML = '';

    const providers = Object.values(WalletPersistence.assetProviders || {});

    // Sort: Most recent (highest timestamp) at the top
    providers.sort((a, b) => {
      const timeA = Math.max(a.lastTimeTried || 0, a.lastTimeWhenError || 0);
      const timeB = Math.max(b.lastTimeTried || 0, b.lastTimeWhenError || 0); // ✅ correct
      return timeB - timeA;
    });

    // get filter checkbox states
    const showAll = document.getElementById('assetProvAllCheckbox')?.checked;
    const showErrors = document.getElementById('assetProvErrorsCheckbox')?.checked;
    const showUnused = document.getElementById('assetProvUnusedCheckbox')?.checked;

    const searchText = document.getElementById('assetProvSearchBox')?.value.toLowerCase().trim();

    providers.forEach(p => {
      const lastTried = p.lastTimeTried || 0;
      const lastError = p.lastTimeWhenError || 0;

      const isError = lastError > lastTried;
      const isUnused = !p.numRpcTries || p.numRpcTries === 0;

      // apply filter logic
      if (!showAll) {
        if (isError && !showErrors) return;
        if (isUnused && !showUnused) return;
        if (!isError && !isUnused) return;
      }

      // apply search filter if text is entered
      if (searchText) {
        const rowText = [
          p.assetName,
          p.symbol,
          p.providerName,
          p.rpcUrl,
          isError && p.lastErrorDetails ? (p.lastErrorDetails.message || JSON.stringify(p.lastErrorDetails)) : ''
        ].join(' ').toLowerCase();

        if (!rowText.includes(searchText)) return;
      }

      const row = document.createElement('div');
      row.className = 'asset-prov-row';

      if (isError) row.classList.add('error');
      if (isUnused) row.classList.add('unused');

      const info = document.createElement('div');
      info.className = 'asset-prov-info';

      // 1. TOP LINE CONTAINER (Status + Time + Right-aligned Toggle)
      const topLine = document.createElement('div');
      topLine.style.display = 'flex';
      topLine.style.alignItems = 'center';
      topLine.style.marginBottom = '4px';

      // Status Icon
      const statusIcon = document.createElement('span');
      statusIcon.className = 'asset-prov-status';
      if (isError) statusIcon.textContent = '❌';
      else if (isUnused) {
        statusIcon.textContent = '❓';
        statusIcon.style.color = '#c71585';
      } else statusIcon.textContent = '✅';
      topLine.appendChild(statusIcon);

      // "X ago" timestamp
      const timeAgoSpan = document.createElement('span');
      timeAgoSpan.className = 'asset-prov-timeago';
      timeAgoSpan.style.marginLeft = '6px';
      timeAgoSpan.style.fontSize = '0.9em';
      timeAgoSpan.style.color = '#666';

      if (isError || !isUnused) {
        const timestamp = Math.max(p.lastTimeTried || 0, p.lastTimeWhenError || 0);
        timeAgoSpan.textContent = formatTimeAgo(timestamp);
      } else if (isUnused) timeAgoSpan.textContent = 'not used';
      topLine.appendChild(timeAgoSpan);

      // --- THE SPACER (This pushes the next items to the right) ---
      const spacer = document.createElement('span');
      spacer.style.marginLeft = 'auto';
      topLine.appendChild(spacer);

      // Enabled Toggle
      const enabledCb = document.createElement('input');
      enabledCb.type = 'checkbox';
      enabledCb.className = 'asset-prov-enabled';
      enabledCb.checked = p.enabled ?? true;

      const enabledLabel = document.createElement('span');
      enabledLabel.style.marginLeft = '4px';
      enabledLabel.style.fontSize = '0.9em';
      enabledLabel.style.color = '#333';
      enabledLabel.textContent = enabledCb.checked ? 'Enabled' : 'Disabled';

      enabledCb.addEventListener('change', () => {
        p.enabled = enabledCb.checked;
        enabledLabel.textContent = enabledCb.checked ? 'Enabled' : 'Disabled';
        WalletPersistence.updateAssetProvider(p.provKey, {
          enabled: enabledCb.checked
        });
      });

      topLine.appendChild(enabledCb);
      topLine.appendChild(enabledLabel);
      info.appendChild(topLine); 
      // ----------------------------------------------------------

      // Provider Name
      const strongDiv = document.createElement('div');
      strongDiv.innerHTML = `<strong>${p.assetName || ''} (${p.symbol || ''})</strong>`;
      info.appendChild(strongDiv);

      // Provider Details
      const providerDiv = document.createElement('div');
      providerDiv.textContent = p.providerName || '';
      info.appendChild(providerDiv);

      const rpcDiv = document.createElement('div');
      rpcDiv.textContent = p.rpcUrl || '';
      info.appendChild(rpcDiv);

      // error details if present
      const errorDetailsText = isError && p.lastErrorDetails
        ? (p.lastErrorDetails.message || JSON.stringify(p.lastErrorDetails))
        : '';
      if (errorDetailsText) {
        const errorDiv = document.createElement('div');
        const codeEl = document.createElement('code');
        codeEl.textContent = errorDetailsText;
        errorDiv.appendChild(codeEl);
        info.appendChild(errorDiv);
      }

      row.appendChild(info);
      container.appendChild(row);
    });
  }

  function initOnceDomReady() {
    if (_initialized) return;
    _initialized = true;

    const allCb = document.getElementById('assetProvAllCheckbox');
    const errorsCb = document.getElementById('assetProvErrorsCheckbox');
    const unusedCb = document.getElementById('assetProvUnusedCheckbox');

    // All checkbox handler
    allCb?.addEventListener('change', () => {
      if (_suppressFilterListeners) return;

      _suppressFilterListeners = true; // pause other listeners

      if (allCb.checked) {
        errorsCb.checked = false;
        unusedCb.checked = false;
      }

      _suppressFilterListeners = false; // resume

      renderProviders();
    });

    // Errors checkbox handler
    errorsCb?.addEventListener('change', () => {
      if (_suppressFilterListeners) return;

      if (errorsCb.checked || unusedCb.checked) {
        allCb.checked = false;
      } else if (!errorsCb.checked && !unusedCb.checked) {
        allCb.checked = true;
      }

      renderProviders();
    });

    // Unused checkbox handler
    unusedCb?.addEventListener('change', () => {
      if (_suppressFilterListeners) return;

      if (errorsCb.checked || unusedCb.checked) {
        allCb.checked = false;
      } else if (!errorsCb.checked && !unusedCb.checked) {
        allCb.checked = true;
      }

      renderProviders();
    });

    const searchBox = document.getElementById('assetProvSearchBox');
    searchBox?.addEventListener('input', () => {
      if (_suppressFilterListeners) return;

        _suppressFilterListeners = true;

        // force All checked, others unchecked
        allCb.checked = true;
        errorsCb.checked = false;
        unusedCb.checked = false;

        _suppressFilterListeners = false;

        renderProviders();
    });

  }

  function onDomReady(cb) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", cb);
    } else {
      cb();
    }
  }

  onDomReady(initOnceDomReady);

  return {
    loadAndShow
  };

})();
