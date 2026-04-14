// wallet-main-ui-crypto-detail.js

(function (window) {
  let _initialized = false;
  let _currentAssetKey = null;

  const detailPanel = document.getElementById("nativeAssetDetailPanel");
  const receiveBtn = document.getElementById("nativeAssetReceiveButton");
  const sendBtn = document.getElementById("nativeAssetSendButton");
  const defiBtn = document.getElementById("nativeAssetDeFiButton");
  const receiveAddressContainer = document.getElementById("nativeAssetReceiveAddressContainer");

  function copyToClipboard(text) {
    if (!navigator.clipboard) {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";  // Prevent scrolling to bottom
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
      } catch {
        alert("Copy failed");
      }
      document.body.removeChild(textarea);
      return;
    }
    navigator.clipboard.writeText(text).catch(() => alert("Copy failed"));
  }

  async function refreshCurrentAssetBalance() {

    const asset = WalletPersistence.walletManager.activeWallet.derivedAddresses?.[_currentAssetKey];
    if (!asset) return;

    try {
      await WalletInfoModal.showAndBlock({
        message:"🛑 Hit ESC at any time...",
        details: "..to interrupt getting balance.",
      });

      await WalletBusyModal.show(`🔄 Refreshing ${asset.symbol} [${asset.network}]...`);

      const transaction = {
        asset: asset,
        assetKey: _currentAssetKey
      };

      const { asset: updatedAsset, statusLines } = await WalletMultiNetworkUtils.getBalanceForNativeAsset(transaction);
      // read-modify-write using the setter
      const current = WalletPersistence.walletManager.activeWallet.derivedAddresses;
      current[_currentAssetKey] = updatedAsset;
      WalletPersistence.walletManager.activeWallet.derivedAddresses = current;

      WalletBusyModal.hide();

      WalletPageLevelUiStatusLines.updateStatus([ ...statusLines, `✅ Updated ${asset.symbol} balance` ]);
      showAssetDetails(_currentAssetKey);
    } catch (err) {
      WalletBusyModal.hide();
      const statusLines = err.statusLines || [];
      WalletPageLevelUiStatusLines.updateStatus([ ...statusLines, `❌ ${err.message}` ]);
      WalletInfoModal.show({
        message: "Failed to refresh asset balance.",
        details: err.message || "Unknown error.",
      });
      showAssetDetails(_currentAssetKey);
    }
  }

  // the complication is that this function is now called from different points.
  // it is first called on way in from crypto list.
  // but it is called again after a refresh
  function showAssetDetails(key) {

    _currentAssetKey = key || _currentAssetKey;

    const derived = WalletPersistence.walletManager.activeWallet.derivedAddresses?.[_currentAssetKey] || {};

    const displayBalance = derived.balance != null ? derived.balance : '—';
    const warningIcon = derived.error ? ' ⚠️' : '';

    // Update title with refresh button + icon + asset info
    const titleElem = document.getElementById("nativeAssetDetailTitle");
    titleElem.innerHTML = `
      <div class="cryptoDetailTitleFlex">
        <button id="nativeAssetDetailRefreshBtn" class="cryptoDetailRefreshBtn" title="Refresh balance">🔄</button>
        <img src="icons/${derived.symbol.toLowerCase()}.svg" class="crypto-icon" alt="${derived.symbol} logo" onerror="this.replaceWith(document.createTextNode('💰'));">

      <span class="cryptoDetailTitleText">
          ${derived.assetName} (${derived.symbol}) [${derived.network || 'unknown'}] <br/>
          Quantity:&nbsp;&nbsp;${displayBalance}${warningIcon}
        </span>
      </div>
    `;

    // Attach refresh handler to the new button
    const refreshBtn = document.getElementById("nativeAssetDetailRefreshBtn");
    if (refreshBtn) {
      refreshBtn.onclick = refreshCurrentAssetBalance;
    }

    // Hide any old receive address
    receiveAddressContainer.style.display = "none";
    receiveAddressContainer.textContent = "";

    // Build or replace the info block
    let infoBlock = document.getElementById("nativeAssetExtraInfo");
    if (!infoBlock) {
      infoBlock = document.createElement("div");
      infoBlock.id = "nativeAssetExtraInfo";
      infoBlock.style.marginTop = "1em";
      infoBlock.style.fontSize = "1.2em";
      infoBlock.style.color = "#666";
      detailPanel.appendChild(infoBlock);
    }
    // Always clear it before writing
    infoBlock.innerHTML = "";

    // Format the timestamp we fetched from state
    const timeStr = derived.lastChecked
      ? new Date(derived.lastChecked).toLocaleString()
      : "N/A";

    // Rebuild its content
    infoBlock.innerHTML = `
      <div style="color: white;"><strong>Last Checked:</strong> ${timeStr}</div>
      ${derived.error ? `<div style="color:red;"><strong>Last Error:</strong> ${derived.error}</div>` : ""}
    `;

  }

  // Wire up the Receive button to re‑read the derived object and show address + copy icons
  function handleReceiveClick() {

    const derived = WalletPersistence.walletManager.activeWallet.derivedAddresses?.[_currentAssetKey];
    if (!derived) return;

    if (receiveAddressContainer.style.display === "none") {
      receiveAddressContainer.innerHTML = `
        <code>${derived.address}</code>
        <div class="copyButtonsContainer">
          <button id="copyBtn2" class="copyBtn" title="Copy to clipboard">⧉</button>
          <button id="copyBtn1" class="copyBtn" title="Copy to clipboard">📋 Copy</button>
        </div>
      `;

      receiveAddressContainer.style.display = "block";

      const copyButtons = [document.getElementById("copyBtn1"), document.getElementById("copyBtn2")];
      copyButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          copyToClipboard(derived.address);
          btn.textContent = "✓";
          setTimeout(() => {
            btn.textContent = btn.id === "copyBtn1" ? "📋 Copy" : "⧉";
          }, 1500);
        });
      });
    } else {
      receiveAddressContainer.style.display = "none";
      receiveAddressContainer.textContent = "";
    }
  }

  function handleSendClick() {
    const derived = WalletPersistence.walletManager.activeWallet.derivedAddresses?.[_currentAssetKey];
    if (!derived) return;

    const balance = parseFloat(derived?.balance);

    if (!balance || isNaN(balance) || balance <= 0) {
      WalletInfoModal.show({
        message: "Insufficient balance",
        details: `${derived.assetName} (${derived.symbol}) [${derived.network || 'unknown'}] has no available balance or it could not be retrieved. Please try again later. You can try refreshing the balance using the 🔄 button located to the right of '${derived.assetName} (${derived.symbol}) [${derived.network || 'unknown'}]'.`,
      });
      return;
    }

    WalletPageLevelUiBackArrow.showBackArrow({
      show:"nativeAssetDetailPanel",
      onBackArrow: () => {
        WalletPageLevelUiStatusLines.clearStatus();
        showAssetDetails(_currentAssetKey);
      }
    });

    WalletCryptoSend.showSendPanel(_currentAssetKey);
  }

  function handleDeFiClick() {
    WalletUiDappController.activateAssetForDapp(_currentAssetKey);
    WalletPageLevelUiBackArrow.triggerBackArrow();
    WalletCryptoList.prepAndShowDigitalAssetsListPanel();
  }


  function initOnceDomReady() {
    if (_initialized) return;
    _initialized = true;

    if (receiveBtn) {
      receiveBtn.addEventListener("click", handleReceiveClick);
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", handleSendClick);
    }

    if (defiBtn) {
      defiBtn.addEventListener("click", handleDeFiClick);
    }
  }

  function onDomReady(cb) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", cb);
    } else {
      cb();
    }
  }

  onDomReady(initOnceDomReady);

  window.WalletCryptoDetail = {
    showAssetDetails,
  };
})(window);

