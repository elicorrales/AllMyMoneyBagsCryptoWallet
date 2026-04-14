// wallet-main-ui-dapp-handling-panel.js

(function (window) {
  let _initialized = false;
  let _rowIdCounter = 0;
  let _lastMessage = null;
  let _lastRow = null;
  let _lastCounter = 1;
  // Track current summary site and type counts
  let _summaryCurrentSite = null;
  let _summaryTypeCounts = {};
  let _dappErrorModalAlreadyPopped = false;


  // Flood suppression helper
  const _floodState = {
    firstTs: 0,
    lastTs: 0,
    count: 0,
    suppressed: false
  };
  let _floodRow = null; // track current flood row in detail panel

  let _previousDappKey = null;
  let _currentDappKey = null;

  let _dappToggleEl = null;

  function applyDetailFilters() {
    const allCb = document.getElementById("dappAllMsgsCheckbox");
    const unknownCb = document.getElementById("dappWarningsCheckbox");
    const warnErrCb = document.getElementById("dappErrorsCheckbox");
    const searchInput = document.getElementById("dappDetailSearchInput");
    const searchTerm = searchInput?.value.trim().toLowerCase();

    const rows = document.querySelectorAll("#dappRequestInfo .dapp-row");

    rows.forEach(row => {
      const flags = (row.dataset.typeFlag || "normal").split(" ");

      let showByCheckbox = false;

      // If All is checked, show everything
      if (allCb.checked) {
        showByCheckbox = true;
      } else {
        if ((unknownCb.checked && flags.includes("unknown")) ||
            (warnErrCb.checked && flags.includes("warning-error")) ||
            (!unknownCb.checked && !warnErrCb.checked && flags.includes("normal"))) {
          showByCheckbox = true;
        }
      }

      // Search filter: match anything in row text
      let showBySearch = true;
      if (searchTerm) {
        const text = row.textContent.toLowerCase();
        showBySearch = text.includes(searchTerm);
      }

      // Final visibility
      row.style.display = showByCheckbox && showBySearch ? "" : "none";
    });
  }

function updateFreezeLabel() {
  const freezeCb = document.getElementById('dappFreezeDappMessagesCheckbox');
  const labelSpan = freezeCb?.parentElement?.querySelector('span');

  if (freezeCb && labelSpan) {
    if (freezeCb.checked) {
      labelSpan.innerHTML = "<strong>Freeze Messages(FROZEN)</strong>";
      labelSpan.style.backgroundColor = "#fff3b0";
    } else {
      labelSpan.innerHTML = "Freeze Messages";
      labelSpan.style.backgroundColor = "transparent";
    }
  }
}

  function shouldSuppressFlood() {
    const now = Date.now();

    // thresholds
    const WINDOW_MS = 500;   // Y
    const MAX_COUNT = 200;   // X

    if (!_floodState.firstTs || (now - _floodState.lastTs) > WINDOW_MS) {
      // reset window
      _floodState.firstTs = now;
      _floodState.count = 0;
      _floodState.suppressed = false;
    }

    _floodState.lastTs = now;
    _floodState.count++;

    if (_floodState.count > MAX_COUNT) {
      _floodState.suppressed = true;
    }

    return _floodState.suppressed;
  }

  function isFrozen() {
    const freezeCheckbox = document.getElementById('dappFreezeDappMessagesCheckbox');
    const overrideCheckbox = document.getElementById('dappFreezeDappMessagesOverrideCheckbox');

    // Logic: "Am I checked? YES. Is the override also checked? NO. Okay, then I'm frozen."
    return (freezeCheckbox?.checked && !overrideCheckbox?.checked);
  }

  function freezeMessages() {

    // auto-freeze messages
    const freezeCheckbox = document.getElementById('dappFreezeDappMessagesCheckbox');
    if (freezeCheckbox && !freezeCheckbox.checked) {
      freezeCheckbox.checked = true;
      updateFreezeLabel();
    }
  }

  function triggerDappWarning(message, reason, isFlood = false) {
    if (_dappErrorModalAlreadyPopped) return; // ✅ prevent multiple modals
    _dappErrorModalAlreadyPopped = true;

    if (!isFlood) {
      freezeMessages();
    }

    // show modal
    WalletInfoModal.show({
      message: "❌ Dapp Error Message(s) Detected",
      details: "There are one or more error messages in Dapp Msgs. New messages will be frozen.",
      onClose: () => {
        // reset modal flag
        _dappErrorModalAlreadyPopped = false;
        freezeMessages();
      }
    });

    // update status immediately
    const site = message?.origin || message?.href || null;
    const messageFrom = site ? ` from ${site}` : '';
    const statusLine = `❌ ${reason || 'Bad message'}: ${message?.type ?? '(unknown)'} ${messageFrom}. See DeFi Msgs.`;
    WalletPageLevelUiStatusLines.appendStatus([statusLine]);
  }

  // 🔹 NEW helper: show flood notice in detail + summary
  function renderFloodNotice(message) {
    const { origin, href, type } = message;

    // Detail panel: only one row per flood burst
    const detailContainer = document.getElementById("dappRequestInfo");
    if (detailContainer) {
      if (!_floodRow) {
        _floodRow = document.createElement("div");
        _floodRow.className = "dapp-row flood-notice";
        _floodRow.dataset.typeFlag = "warning-error"; // ✅ treat flood notice as warning/error
        _floodRow.dataset.typeOriginal = type;        // ✅ store original type for summary
        _floodRow.dataset.floodCount = "1";
        _floodRow.innerHTML = `
          <div class="dapp-text">
            <p><strong>⚠️ Flood suppressed:</strong> ${type} (<span class="flood-count">1</span>)</p>
            <p>Site: <a href="${href}" target="_blank" rel="noopener noreferrer">${origin}</a></p>
          </div>
        `;
        _floodRow.style.backgroundColor = "#fff3b0"; // soft yellow
        detailContainer.appendChild(_floodRow);

        detailContainer.scrollTo({
          top: detailContainer.scrollHeight,
          behavior: 'smooth'
        });

        // ✅ Trigger user warning for new flood row only
        triggerDappWarning(message, `⚠️ Flood detected: ${type}`, true);

      } else {
        // increment existing flood count
        let count = parseInt(_floodRow.dataset.floodCount) + 1;
        _floodRow.dataset.floodCount = count;
        const span = _floodRow.querySelector(".flood-count");
        if (span) span.textContent = count;

        // auto-scroll
        detailContainer.scrollTo({
          top: detailContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }

    // Summary panel: update FLOOD count
    updateSummaryPanel(message, "warning-error", true);
  }


  function initOnceDomReady() {
    if (_initialized) return;
    _initialized = true;

    // NEW: init toggle element
    _dappToggleEl = document.getElementById("dappToggle");
    const _dappToggleLabel = document.querySelector(".dappToggleWrapper span"); // label text

    if (_dappToggleEl && _dappToggleLabel) {
      const isOn = !!WalletPersistence.dappMessagesDetails;
      _dappToggleEl.classList.toggle("on", isOn);
      _dappToggleLabel.textContent = isOn ? "On" : "Off/Clear";

      _dappToggleEl.addEventListener("click", () => {
        _dappToggleEl.classList.toggle("on");
        const isOn = _dappToggleEl.classList.contains("on");
        _dappToggleLabel.textContent = isOn ? "On" : "Off/Clear"; // update visual label
        console.log("dApp toggle is now", isOn ? "ON" : "OFF/Clear");
        WalletPersistence.dappMessagesDetails = isOn;

        // NEW: if turned off, immediately clear all rows
        if (!isOn) {
          clearAllDappState();
        }
      });
    }

    // Tab switching
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("aria-controls");

        // Hide all panels
        tabPanels.forEach(panel => panel.hidden = true);

        // Remove active/aria-selected from all tabs
        tabButtons.forEach(b => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });

        // Show target panel
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) targetPanel.hidden = false;

        // Activate clicked tab
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
      });
    });

    // ✅ Checkbox mutual exclusion & apply filter on change
    const allCb = document.getElementById("dappAllMsgsCheckbox");
    const unknownCb = document.getElementById("dappWarningsCheckbox");
    const warnErrCb = document.getElementById("dappErrorsCheckbox");

    allCb.addEventListener("change", () => {
      if (allCb.checked) {
        // normal behavior
        unknownCb.checked = false;
        warnErrCb.checked = false;
        applyDetailFilters();
      } else {
        // prevent uncheck
        allCb.checked = true; // force it back on
        WalletInfoModal.show({
          message: "🛑 Stop. Instead, apply filters",
          details: "Try Unknown, Warnings/Errors, or a combination to filter messages."
        });
      }
    });

    [unknownCb, warnErrCb].forEach(cb => {
      cb.addEventListener("change", () => {
        if (cb.checked) {
          allCb.checked = false;
        } else {
          // ✅ if both unknown & warnErr are now unchecked, check All
          if (!unknownCb.checked && !warnErrCb.checked) {
            allCb.checked = true;
          }
        }
        applyDetailFilters();
      });
    });

    const searchInput = document.getElementById("dappDetailSearchInput");
    searchInput?.addEventListener("input", () => {
      applyDetailFilters();
    });

    const freezeCb = document.getElementById('dappFreezeDappMessagesCheckbox');
    freezeCb?.addEventListener("change", updateFreezeLabel);

  }

  function clearAllDappState() {
    const detailContainer = document.getElementById("dappRequestInfo");
    const summaryContainer = document.getElementById("summaryPanel");

    // 1. Clear DOM
    if (detailContainer) detailContainer.innerHTML = '';
    if (summaryContainer) summaryContainer.innerHTML = '';

    // 2. Reset Detail State
    _rowIdCounter = 0;
    _lastMessage = null;
    _lastRow = null;
    _lastCounter = 1;
    _floodRow = null;
    _floodState.count = 0;
    _floodState.suppressed = false;

    // 3. Reset Summary State
   _summaryCurrentSite = null;
    _summaryTypeCounts = {};

    // 4. Reset Key Tracking
    _currentDappKey = null;
    _previousDappKey = null;

    // 5. Clear page-level status
    WalletPageLevelUiStatusLines.clearStatus();

    // 6. Unfreeze if frozen
    const freezeCheckbox = document.getElementById('dappFreezeDappMessagesCheckbox');
    if (freezeCheckbox && freezeCheckbox.checked) {
      freezeCheckbox.checked = false;
      updateFreezeLabel();
    }
  }

  function buildTopLevelFieldsHtml(message) {
    let html = '<pre class="dapp-top-fields">';
    for (const key in message) {
      if (key !== 'payload') html += `${key}: ${JSON.stringify(message[key])}\n`;
    }
    html += '</pre>';
    return html;
  }

  function createDappRow(message, isUnhandled, rowId) {
    const { origin, href, type, payload } = message;

    const row = document.createElement("div");
    row.id = rowId;
    row.className = "dapp-row" + (isUnhandled ? " unhandled" : "");

    // Set type flags & background color
    if (isUnhandled && message?.error) {
      row.style.backgroundColor = "#fff3b0";
      row.dataset.typeFlag = "unknown warning-error";
    } else if (!isUnhandled && message?.error) {
      row.style.backgroundColor = "#fff3b0";
      row.dataset.typeFlag = "warning-error";
    } else if (!row.dataset.typeFlag) {
      if (isUnhandled) row.dataset.typeFlag = "unknown";
      else if (type === "warning" || type === "error") row.dataset.typeFlag = "warning-error";
    }

    // Build inner HTML
    const topLevelFieldsHtml = buildTopLevelFieldsHtml(message);

    row.innerHTML = `
      <div class="dapp-text">
        <p>
          <strong>
            <span class="dapp-counter">(1)</span>
            Incoming dApp Request
            ${isUnhandled ? '<span class="dapp-unknown-badge"> (UNKNOWN)</span>' : ''}
          </strong>
        </p>
        <p>Type: <code>${type}</code></p>
        <p>Site: <a href="${href}" target="_blank" rel="noopener noreferrer">${origin}</a></p>
        ${topLevelFieldsHtml}
        <p>Payload: <code>${JSON.stringify(payload)}</code></p>
      </div>
    `;

    // Close button
    const close = document.createElement("div");
    close.className = "dapp-row-close";
    close.textContent = "✕";
    close.addEventListener("click", () => row.remove());
    row.appendChild(close);

    return row;
  }


  function renderRequestRow(message, isUnhandled = false) {
    if (!_dappToggleEl || !_dappToggleEl.classList.contains("on")) return;

    const { origin, href, type, payload } = message;
    const container = document.getElementById("dappRequestInfo");
    if (!container) return;

    const dappKey = origin || href;
    const isFileOrigin = origin && origin.startsWith("file://");

    // Ignore file:// as a site-change trigger
    if (!isFileOrigin && dappKey && dappKey !== _currentDappKey) {

      // Finalize previous flood row if exists before clearing
      if (_floodRow) {
        updateSummaryPanel({
          type: _floodRow.dataset.typeOriginal || "unknown",
          origin: _currentDappKey,
          href: _currentDappKey
        }, "warning-error", true);
        _floodRow = null;
      }

      clearAllDappState();
      _currentDappKey = dappKey;
      _previousDappKey = dappKey;
    }

    if (isFrozen()) return;

    const primaryFieldCountCurrent = Object.keys(message).filter(k => k !== 'payload').length;
    const primaryFieldCountLast = _lastMessage
      ? Object.keys(_lastMessage).filter(k => k !== 'payload').length
      : 0;

    if (_lastMessage && primaryFieldCountCurrent !== primaryFieldCountLast) {
      _lastMessage = null;
      _lastRow = null;
    }

// --- DIAGNOSTIC LOGGING START ---
    if (_lastMessage) {
        console.group('[DappRowDebug] Comparing Messages');
        console.log('Match Type:', _lastMessage.type === type);
        console.log('Match Origin:', _lastMessage.origin === origin);
        console.log('Match Href:', _lastMessage.href === href);

        const lastPayloadStr = JSON.stringify(_lastMessage.payload);
        const currentPayloadStr = JSON.stringify(payload);
        const matchPayload = lastPayloadStr === currentPayloadStr;

        console.log('Match Payload:', matchPayload);
        if (!matchPayload) {
            console.log('Last Payload:', _lastMessage.payload);
            console.log('Curr Payload:', payload);
        }
        console.groupEnd();
    } else {
        console.log('[DappRowDebug] No _lastMessage stored yet.');
    }
// --- DIAGNOSTIC LOGGING END ---

    const isSameAsLast = _lastMessage &&
      _lastMessage.type === type &&
      _lastMessage.origin === origin &&
      _lastMessage.href === href &&
      JSON.stringify(_lastMessage.payload) === JSON.stringify(payload);

    //if (isSameAsLast && !isUnhandled) { // <--- Added !isUnhandled
    if (isSameAsLast) { // <--- the above version prevented same unknowns to be counted as same
      if (shouldSuppressFlood()) {
        renderFloodNotice(message);
        return;
      }

      _lastCounter++;
      const counterEl = _lastRow.querySelector(".dapp-counter");
      if (counterEl) {
        counterEl.textContent = `(${_lastCounter})`;
        counterEl.classList.remove("hidden-counter");
      }

      updateSummaryPanel(message, _lastRow.dataset.typeFlag);

      return;
    }

    if (_floodRow) {
      updateSummaryPanel({ type: _floodRow.dataset.typeOriginal || "unknown", origin: _currentDappKey, href: _currentDappKey }, "warning-error", true);

      const floodEl = _floodRow;
      const closeBtn = document.createElement("div");
      closeBtn.className = "dapp-row-close";
      closeBtn.textContent = "✕";
      closeBtn.addEventListener("click", () => floodEl.remove());
      floodEl.appendChild(closeBtn);
      _floodRow = null;
    }

    _floodState.count = 0;
    _floodState.suppressed = false;
    _lastCounter = 1;

    const rowId = `dapp-row-${++_rowIdCounter}`;
    const row = createDappRow(message, isUnhandled, rowId);

    container.appendChild(row);
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });

    // Store original type for flood summary accuracy
    row.dataset.typeOriginal = type;

    updateSummaryPanel(message, row.dataset.typeFlag);
    applyDetailFilters();

    _lastMessage = message;
    _lastRow = row;

    const freezeOverrideCb = document.getElementById('dappFreezeDappMessagesOverrideCheckbox');
    if (!freezeOverrideCb?.checked) {
      if ((isUnhandled || message?.error) && row.dataset.typeFlag?.includes("warning-error")) {
        triggerDappWarning(message, `❌ Bad message: ${message?.type ?? '(unknown)'}`);
      }
    }
  }

  function updateSummaryPanel(message, typeFlag, isFlood = false) {
    const { origin, href, type } = message;
    const site = origin || href;
    const container = document.getElementById("summaryPanel");
    if (!container) return;

    if (!container.innerHTML) {
      _summaryCurrentSite = site;
      _summaryTypeCounts = {};
      container.innerHTML = `
        <div class="summary-site-header" style="padding:0.5em 0;">
          <strong>Site:</strong> <a href="${href}" target="_blank" rel="noopener noreferrer">${origin}</a>
        </div>
        <div class="summary-rows"></div>
      `;
    }

    const rowsContainer = container.querySelector(".summary-rows");
    if (!rowsContainer) return;

    const summaryType = isFlood ? `FLOOD(${type})` : type;

    let rowEl = rowsContainer.querySelector(`[data-type="${summaryType}"]`);

    if (_summaryTypeCounts[summaryType]) {
      _summaryTypeCounts[summaryType]++;
      if (rowEl) rowEl.textContent = `(${_summaryTypeCounts[summaryType]}) ${summaryType}`;
    } else {
      _summaryTypeCounts[summaryType] = 1;
      if (!rowEl) {
        rowEl = document.createElement("div");
        rowEl.setAttribute("data-type", summaryType);
        rowEl.textContent = `(1) ${summaryType}`;
        rowsContainer.appendChild(rowEl);
      }
    }

    // Highlight warning/error or flood
    if ((typeFlag && typeFlag.includes("warning-error")) || isFlood) {
      rowEl.style.fontWeight = "bold";
      rowEl.style.backgroundColor = "#fff3b0";
    }

    // Highlight unknown (but not warning-error)
    else if (typeFlag && typeFlag.includes("unknown")) {
      rowEl.style.fontWeight = "bold";
      rowEl.style.backgroundColor = "#f8d7da";
    }

    // 🔹 Move the row to the bottom to reflect most-recent update
    if (rowEl && rowsContainer) {
      rowsContainer.appendChild(rowEl); // moves existing row to end
    }

  }

  function getRenderedRows() {
    const container = document.getElementById("dappRequestInfo");
    if (!container) return [];

    // Return array of rows, with some key info for checks
    return Array.from(container.querySelectorAll(".dapp-row")).map(row => ({
      type: row.dataset.typeOriginal || null,
      origin: row.querySelector("a")?.textContent || null,
      rowEl: row
    }));
  }

  function onDomReady(cb) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", cb);
    } else {
      cb();
    }
  }

  onDomReady(initOnceDomReady);

  window.WalletDappHandling = {
    renderRequestRow,
    getRenderedRows,
  };

})(window);

