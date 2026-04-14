// wallet-main-ui-crypto-list.js

const WalletCryptoList = (function () {
  let _initialized = false;
  let _balancesMayBeOutdatedWarningShown = false;

  function getStableCoins() {

    const wallet = WalletPersistence.walletManager.activeWallet;
    const derived = wallet.derivedStableCoins || {};
    const assets = [];

    for (const [key, entry] of Object.entries(derived)) {
      assets.push({
        key,
        address: entry.contractAddress,
        tokenName: entry.tokenName,
        tokenSymbol: entry.tokenSymbol,
        assetSymbol: entry.assetSymbol,
        network: entry.network,
        balance: entry.balance != null ? entry.balance : '—',
        error: entry.error || null,
        lastChecked: entry.lastChecked || null,
      });
    }
    return assets;

  }


  async function renderStableCoinsList() {

    const container = document.getElementById("stableCoinListContainer");
    container.innerHTML = ''; // clear previous

    let assets = await getStableCoins();

    if (!assets.length) {
      container.textContent = "No derived stable coins or balances found.";
      return;
    }

    assets.forEach(asset => {
      const row = document.createElement("div");
      row.className = "crypto-row";

      // token icon
      const tokenImg = document.createElement("img");
      tokenImg.src = `icons/${asset.tokenSymbol.toLowerCase()}.svg`;
      tokenImg.className = "crypto-icon";
      tokenImg.alt = `${asset.tokenSymbol} logo`;
      tokenImg.onerror = () => { tokenImg.replaceWith(document.createTextNode("💰")); };

      // network icon
      const networkImg = document.createElement("img");
      networkImg.src = `icons/${asset.assetSymbol.toLowerCase()}.svg`;
      networkImg.className = "crypto-icon";
      networkImg.alt = `${asset.assetSymbol} logo`;
      networkImg.onerror = () => { networkImg.replaceWith(document.createTextNode("💰")); };

      const infoDiv = document.createElement("div");
      infoDiv.className = "crypto-info";

      const nameSpan = document.createElement("span");
      nameSpan.className = "crypto-name";
      nameSpan.textContent = `${asset.tokenName} (${asset.tokenSymbol}) [${asset.network || 'unknown'}]`;
      infoDiv.appendChild(nameSpan);

      const leftContainer = document.createElement("div");
      leftContainer.className = "crypto-left";
      leftContainer.style.display = "flex";
      leftContainer.style.alignItems = "center";
      leftContainer.appendChild(tokenImg);
      leftContainer.appendChild(networkImg);
      leftContainer.appendChild(infoDiv);

      const balanceSpan = document.createElement("span");
      balanceSpan.className = "crypto-balance";
      balanceSpan.textContent = `${asset.balance}${asset.error ? ' ⚠️' : ''}`;

      row.appendChild(leftContainer);
      row.appendChild(balanceSpan);

      row.addEventListener("click", () => {

        WalletPageLevelUiBackArrow.showBackArrow({
          show: "allDigitalAssetsListPanel",
          onBackArrow: async () => {
            await updateAndRenderAllCryptoLists();
          }
        });
        WalletStableCoinDetail.showStableCoinDetails(asset.key);
        WalletUiPanel.show('stableCoinDetailPanel');
      });

      container.appendChild(row);
    });

  }

  function getDigitalTokens() {

    const wallet = WalletPersistence.walletManager.activeWallet;
    const derived = wallet.derivedTokens || {};
    const assets = [];

    for (const [key, entry] of Object.entries(derived)) {
      assets.push({
        key,
        address: entry.contractAddress,
        tokenName: entry.tokenName,
        tokenSymbol: entry.tokenSymbol,
        assetSymbol: entry.assetSymbol,
        network: entry.network,
        balance: entry.balance != null ? entry.balance : '—',
        error: entry.error || null,
        lastChecked: entry.lastChecked || null,
      });
    }
    return assets;

  }

  async function renderDigitalTokensList() {

    const container = document.getElementById("tokensListContainer");
    container.innerHTML = ''; // clear previous

    let assets = await getDigitalTokens();

    if (!assets.length) {
      container.textContent = "No derived tokens or balances found.";
      return;
    }

    assets.forEach(asset => {
      const row = document.createElement("div");
      row.className = "crypto-row";

      // token icon
      const tokenImg = document.createElement("img");
      tokenImg.src = `icons/${asset.tokenSymbol.toLowerCase()}.svg`;
      tokenImg.className = "crypto-icon";
      tokenImg.alt = `${asset.tokenSymbol} logo`;
      tokenImg.onerror = () => { tokenImg.replaceWith(document.createTextNode("💰")); };

      // network icon
      const networkImg = document.createElement("img");
      networkImg.src = `icons/${asset.assetSymbol.toLowerCase()}.svg`;
      networkImg.className = "crypto-icon";
      networkImg.alt = `${asset.assetSymbol} logo`;
      networkImg.onerror = () => { networkImg.replaceWith(document.createTextNode("💰")); };

      const infoDiv = document.createElement("div");
      infoDiv.className = "crypto-info";

      const nameSpan = document.createElement("span");
      nameSpan.className = "crypto-name";
      nameSpan.textContent = `${asset.tokenName} (${asset.tokenSymbol}) [${asset.network || 'unknown'}]`;
      infoDiv.appendChild(nameSpan);

      const leftContainer = document.createElement("div");
      leftContainer.className = "crypto-left";
      leftContainer.style.display = "flex";
      leftContainer.style.alignItems = "center";
      leftContainer.appendChild(tokenImg);
      leftContainer.appendChild(networkImg);
      leftContainer.appendChild(infoDiv);

      const balanceSpan = document.createElement("span");
      balanceSpan.className = "crypto-balance";
      balanceSpan.textContent = `${asset.balance}${asset.error ? ' ⚠️' : ''}`;

      row.appendChild(leftContainer);
      row.appendChild(balanceSpan);

      row.addEventListener("click", () => {
        WalletPageLevelUiBackArrow.showBackArrow({
          show: "allDigitalAssetsListPanel",
          onBackArrow: async () => {
            await updateAndRenderAllCryptoLists();
          }
        });
        WalletTokenDetail.showTokenDetails(asset.key);
        WalletUiPanel.show('tokenDetailPanel');
      });

      container.appendChild(row);
    });

  }



  function getNativeDigitalAssets() {
    const wallet = WalletPersistence.walletManager.activeWallet;
    const derived = wallet.derivedAddresses || {};
    const assets = [];

    for (const [key, entry] of Object.entries(derived)) {
      assets.push({
        key,
        address: entry.address,
        assetName: entry.assetName,
        symbol: entry.symbol,
        network: entry.network,
        balance: entry.balance != null ? entry.balance : '—',
        error: entry.error || null,
        lastChecked: entry.lastChecked || null,
      });
    }
    return assets;
  }

  async function renderNativeDigitalAssetsList() {
    const container = document.getElementById("nativeAssetListContainer");
    container.innerHTML = ''; // clear previous

    let assets = await getNativeDigitalAssets();

    if (!assets.length) {
      container.textContent = "No derived addresses or balances found.";
      return;
    }

    assets.forEach(asset => {
      const row = document.createElement("div");
      row.className = "crypto-row";

      const iconPath = `icons/${asset.symbol.toLowerCase()}.svg`;
      const img = document.createElement("img");
      img.src = iconPath;
      img.className = "crypto-icon";
      img.alt = `${asset.symbol} logo`;
      img.onerror = () => { img.replaceWith(document.createTextNode("💰")); };

      const infoDiv = document.createElement("div");
      infoDiv.className = "crypto-info";

      const nameSpan = document.createElement("span");
      nameSpan.className = "crypto-name";
      nameSpan.textContent = `${asset.assetName} (${asset.symbol}) [${asset.network || 'unknown'}]`;
      infoDiv.appendChild(nameSpan);

      const leftContainer = document.createElement("div");
      leftContainer.className = "crypto-left";
      leftContainer.style.display = "flex";
      leftContainer.style.alignItems = "center";
      leftContainer.appendChild(img);
      leftContainer.appendChild(infoDiv);

      const balanceSpan = document.createElement("span");
      balanceSpan.className = "crypto-balance";
      balanceSpan.textContent = `${asset.balance}${asset.error ? ' ⚠️' : ''}`;

      row.appendChild(leftContainer);
      row.appendChild(balanceSpan);

      row.addEventListener("click", () => {
        WalletPageLevelUiBackArrow.showBackArrow({
          show: "allDigitalAssetsListPanel",
          onBackArrow: async () => {
            await updateAndRenderAllCryptoLists();
          }
        });
        WalletCryptoDetail.showAssetDetails(asset.key);
        WalletUiPanel.show('nativeAssetDetailPanel');
      });

      container.appendChild(row);
    });
  }

  async function updateAndRenderAllCryptoLists(forceIt = false) {
    if (!forceIt) {
      if (
          !WalletPersistence.walletManager.activeWallet.isDerivedAddressesChanged &&
          !WalletPersistence.walletManager.activeWallet.isDerivedTokensChanged &&
          !WalletPersistence.walletManager.activeWallet.isDerivedStableCoinsChanged
      ) {
        return;  //there was no change, no need to update UI lists
      }
    }

    WalletPersistence.walletManager.activeWallet.clearIsCryptoChanged();

    await WalletBusyModal.show("Updating Lists.....");
    try {
      const wallet = WalletPersistence.walletManager.activeWallet;
      await WalletMultiNetworkUtils.updateAllAddressesTokensStableCoinsAssetProviders(wallet);
      await renderNativeDigitalAssetsList();
      await renderDigitalTokensList();
      await renderStableCoinsList();
    } catch (err) {
      await WalletBusyModal.hide();
      throw err;
    }
    await WalletBusyModal.hide();
  }

  function formatModalDetails(details) {
    if (typeof details !== "string") return details;

    // Replace all newlines that are NOT the final trailing newline
    return details.replace(/\n(?!$)/g, "<br/>");
  }

  async function prepAndShowDigitalAssetsListPanel() {

    WalletPageLevelUiBackArrow.showBackArrow({show:"SimpleWebPageCryptoWallet-new-or-select.html"});

    WalletUiPanel.hide('allDigitalAssetsListPanel');

    // Give browser a chance to paint the modal/spinner
    await new Promise(r => requestAnimationFrame(r));

    await WalletBusyModal.show("Accessing Wallet.....");

    // Give browser a chance to paint the modal/spinner
    await new Promise(r => requestAnimationFrame(r));

    try {
      await updateAndRenderAllCryptoLists(true);
      WalletUiPanel.show('allDigitalAssetsListPanel');
      if (!_balancesMayBeOutdatedWarningShown) {
        WalletInfoModal.show({
          message: "Balances may be outdated.",
          details: `Click the <strong>🔄</strong> refresh icon at the top right to fetch the latest balances from the network.`,
        });
        _balancesMayBeOutdatedWarningShown = true;
      }

      if (WalletAppState.password !== null && typeof window.walletStopListening === 'function') {
        //wallet is now open to notifications from dapps in another tab
        window.walletStartListening();
      }

      WalletBusyModal.hide();

    } catch (err) {
      console.error('Error during prepAndShowDigitalAssetsListPanel()', err);
      WalletBusyModal.hide();

      let details = err.message || String(err);

      // Summarize duplicate provider errors
      if (err.message?.startsWith("Duplicate asset provider detected")) {
        try {
          const matches = err.message.match(/\{[\s\S]+?\}/g); // crude JSON objects
          if (matches && matches.length >= 2) {
            const p1 = JSON.parse(matches[0]);
            const p2 = JSON.parse(matches[1]);
            details = `Duplicate providers detected:\n- ${p1.providerName} [${p1.network}]\n- ${p2.providerName} [${p2.network}]`;
          } else {
            details = "Duplicate asset providers detected. Please check your configuration.";
          }
        } catch {
          details = "Duplicate asset providers detected. Please check your configuration.";
        }
      }

      // Summarize invalid URL errors from _composeKey
      if (err instanceof TypeError && err.message.includes("Failed to construct 'URL'")) {
        if (err.provider) {
          const p = err.provider;
          details = `Invalid RPC URL for provider:\n- ${p.providerName} [${p.network}]\nURL: ${p.rpcUrl || '<missing>'}`;
        }
      }

      WalletInfoModal.show({
        message: "❌ Error accessing wallet",
        details: formatModalDetails(details)
      });

      if (err?.result?.isStatusLines) {
        WalletPageLevelUiStatusLines.updateStatus(err.result.statusLines);
      } else {
        // Full error in status for debugging
        WalletPageLevelUiStatusLines.updateStatus([`❌ ${err}`]);
      }
    }
  }

  function _initOnceDomReady() {

    if (_initialized) return;
    _initialized = true;

    document.getElementById('nativeAssetListRefreshBtn')?.addEventListener('click', async () => {
      try {
        await WalletBusyModal.show('Please Wait....');
        const wallet = WalletPersistence.walletManager.activeWallet;
        await WalletMultiNetworkUtils.updateAllAddressesTokensStableCoinsAssetProviders(wallet);
        WalletBusyModal.hide();
        const statusLines = await WalletMultiNetworkUtils.getAllNativeAssetBalances(wallet);
        WalletPageLevelUiStatusLines.updateStatus(statusLines);
        await renderNativeDigitalAssetsList();
      } catch (err) {
        console.error('❌ Failed to refresh balances:', err);
        WalletInfoModal.show({
          message: "Error fetching balances.",
          details: err.message || "Please check your connection or try again.",
        });
      }
    });

    document.getElementById('tokenListRefreshBtn')?.addEventListener('click', async () => {
      try {
        await WalletBusyModal.show('Please Wait....');
        const wallet = WalletPersistence.walletManager.activeWallet;
        await WalletMultiNetworkUtils.updateAllAddressesTokensStableCoinsAssetProviders(wallet);
        WalletBusyModal.hide();
        const statusLines = await WalletMultiTokenUtils.getAllTokenAssetBalances(wallet, 'tokens');
        WalletPageLevelUiStatusLines.updateStatus(statusLines);
        await renderDigitalTokensList();
      } catch (err) {
        console.error('❌ Failed to refresh balances:', err);
        WalletInfoModal.show({
          message: "Error fetching balances.",
          details: err.message || "Please check your connection or try again.",
        });
      }
    });


    document.getElementById('stableCoinListRefreshBtn')?.addEventListener('click', async () => {
      try {
        await WalletBusyModal.show('Please Wait....');
        const wallet = WalletPersistence.walletManager.activeWallet;
        await WalletMultiNetworkUtils.updateAllAddressesTokensStableCoinsAssetProviders(wallet);
        WalletBusyModal.hide();
        const statusLines = await WalletMultiTokenUtils.getAllTokenAssetBalances(wallet, 'stablecoins');
        WalletPageLevelUiStatusLines.updateStatus(statusLines);
        await renderStableCoinsList();
      } catch (err) {
        console.error('❌ Failed to refresh balances:', err);
        WalletInfoModal.show({
          message: "Error fetching balances.",
          details: err.message || "Please check your connection or try again.",
        });
      }
    });


    document.querySelector("#nativeAssetListPanel .toggle-header")
      .addEventListener("click", function() {
        const panel = document.getElementById("nativeAssetListPanel");
        panel.classList.toggle("collapsed");

        const icon = panel.querySelector(".toggle-icon");
        icon.textContent = panel.classList.contains("collapsed") ? "▼" : "▲";

      });

    document.querySelector("#tokenListPanel .toggle-header")
      .addEventListener("click", function() {
        const panel = document.getElementById("tokenListPanel");
        panel.classList.toggle("collapsed");

        const icon = panel.querySelector(".toggle-icon");
        icon.textContent = panel.classList.contains("collapsed") ? "▼" : "▲";
    });

    document.querySelector("#stableCoinListPanel .toggle-header")
      .addEventListener("click", function() {
        const panel = document.getElementById("stableCoinListPanel");
        panel.classList.toggle("collapsed");

        const icon = panel.querySelector(".toggle-icon");
        icon.textContent = panel.classList.contains("collapsed") ? "▼" : "▲";
    });

    const helpIcon = document.getElementById('assetHelpIcon');
    if (helpIcon) {
      helpIcon.addEventListener('click', () => {
        WalletInfoModal.show({
          message: "Providers are tried til one succeeds.",
          imageSrc: "images/asset-providers-network.png",
          imageAlt: "Asset Provider Explanation"
        });
      });
    }
  }

  function _onDomReady(cb) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", cb);
    } else {
      cb();
    }
  }

  _onDomReady(_initOnceDomReady);

  return {
    prepAndShowDigitalAssetsListPanel
  };
})();

