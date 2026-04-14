// wallet-main-ui-crypto-send.js

const WalletCryptoSend = (function () {
  let _initialized = false;

  let _transaction = {};
  let _currentAssetKey = null;
  let _currentMaxAmount = null;
  let _isCryptoSpecificsValid = true; // until it checked

  // Store last confirmed values from Continue
  let _lastToAddress = null;
  let _lastAmountStr = null;

  // Cache DOM elements for easier refs
  const dom = {
    panelTitle: null,
    toAddress: null,
    amount: null,
    fee: null,
    maxAmountLink: null,
    feeHelpIcon: null,
    continueBtn: null,
    sendBtn: null,
    resetBtn: null, // added
  };

  function cacheDom() {
    dom.panelTitle = document.getElementById("nativeAssetSendPanelTitle");
    dom.toAddress = document.getElementById("nativeAssetSendToAddress");
    dom.amount = document.getElementById("nativeAssetSendAmount");
    dom.fee = document.getElementById("nativeAssetSendEstimatedFee");
    dom.maxAmountLink = document.getElementById("nativeAssetSendMaxAmountLink");
    dom.feeHelpIcon = document.getElementById("nativeAssetSendFeeHelpIcon");
    dom.continueBtn = document.getElementById("nativeAssetSendContinueButton");
    dom.sendBtn = document.getElementById("nativeAssetSendSendButton");
    dom.resetBtn = document.getElementById("nativeAssetSendResetButton");
  }

  function showSendPanel(assetKey) {

    _transaction = {};
    _transaction.assetKey = assetKey;
    _currentAssetKey = assetKey;
    _isCryptoSpecificsValid = true;

    const asset = WalletPersistence.walletManager.activeWallet.derivedAddresses?.[assetKey] || {};
    _currentMaxAmount = asset?.balance || null;
    _transaction.asset = asset;

    if (dom.panelTitle && asset?.symbol) {
      const net = asset.network || 'unknown';
      dom.panelTitle.textContent = `Send ${asset.assetName} (${asset.symbol}) [${net}]`;
    } else {
      console.warn("Title or asset missing:", { title: dom.panelTitle, asset });
    }

    // Reset inputs and buttons
    dom.toAddress.value = "";
    dom.amount.value = "";
    dom.fee.value = "";
    dom.fee.placeholder = "Waiting for Continue…";

    _lastToAddress = null;
    _lastAmountStr = null;

    dom.continueBtn.style.display = "inline-block";
    dom.continueBtn.disabled = true; // Disabled until valid inputs
    dom.continueBtn.textContent = "Continue";
    dom.sendBtn.style.display = "none";
    dom.sendBtn.disabled = false;
    dom.resetBtn.style.display = "none";

    // Setup max amount clickable link if available
    if (dom.maxAmountLink && _currentMaxAmount !== null) {
      dom.maxAmountLink.innerHTML = `max <a href="#" id="nativeAssetSendMaxAmountClick">${_currentMaxAmount}</a>`;
      const maxClickEl = document.getElementById("nativeAssetSendMaxAmountClick");
      if (maxClickEl) {
        maxClickEl.addEventListener("click", e => {
          e.preventDefault();
          dom.amount.value = _currentMaxAmount;
          validateForm();
          checkForInputChanges();
        });
      }
    } else if (dom.maxAmountLink) {
      dom.maxAmountLink.textContent = "";
    }

    validateForm();
    WalletUiPanel.show('nativeAssetSendPanel');
  }

  function validateForm() {
    const statusLines = [];
    let isValid = true;

    if (!dom.toAddress.value.trim()) {
      dom.toAddress.classList.add("input-error");
      statusLines.push("❌ Recipient address is required.");
      isValid = false;
    } else {
      dom.toAddress.classList.remove("input-error");
    }

    const amtVal = dom.amount.value.trim();
    const amtNum = parseFloat(amtVal);
    if (!amtVal || isNaN(amtNum) || amtNum <= 0) {
      dom.amount.classList.add("input-error");
      statusLines.push("❌ Amount must be a number greater than 0.");
      isValid = false;
    } else if (_currentMaxAmount !== null && amtNum > _currentMaxAmount) {
      dom.amount.classList.add("input-error");
      statusLines.push(`❌ Amount exceeds available balance (${_currentMaxAmount}).`);
      isValid = false;
    } else {
      dom.amount.classList.remove("input-error");
    }

    if (statusLines.length > 0) {
      WalletPageLevelUiStatusLines.updateStatus(statusLines);
    } else {
      WalletPageLevelUiStatusLines.updateStatus(["✅ Ready to continue."]);
    }

    // Enable Continue only if basic fields valid
    if (isValid && _isCryptoSpecificsValid) {
      dom.continueBtn.disabled = false;
      return true;
    } else {
      dom.continueBtn.disabled = true;
      return false;
    }
  }

  // Check if input values differ from last confirmed Continue values
  function checkForInputChanges() {
    const currentTo = dom.toAddress.value.trim();
    const currentAmt = dom.amount.value.trim();

    const changed = currentTo !== _lastToAddress || currentAmt !== _lastAmountStr;

    if (changed) {
      // Values changed, show Continue button, hide Send
      dom.continueBtn.style.display = "inline-block";
      dom.sendBtn.style.display = "none";
      dom.resetBtn.style.display = "none";
      _isCryptoSpecificsValid = true; // give it a chance; it may pass crypto validation next time
      return validateForm();
    } else if (_lastToAddress !== null && _lastAmountStr !== null) {
      // Values match last confirmed, show Send, hide Continue
      dom.continueBtn.style.display = "none";
      dom.sendBtn.style.display = "inline-block";
      dom.sendBtn.disabled = false;
    }
  }

  function disableContinueButtonBecauseCalculating() {
    dom.continueBtn.disabled = true;
    dom.continueBtn.textContent = "Calculating…";
  }

  function disableContinueButton() {
    dom.continueBtn.disabled = true;
    dom.continueBtn.textContent = "Continue";
  }

  function enableContinueButton() {
    dom.continueBtn.disabled = false;
    dom.continueBtn.textContent = "Continue";
  }

  function getAndValidateInput() {
    const toAddress = dom.toAddress.value.trim();
    const amountStr = dom.amount.value.trim();

    if (!toAddress || !amountStr) {
      WalletInfoModal.show({ message: "❌ Missing Info", details: "Please fill address and amount." });
      disableContinueButton();
      return;
    }

    _transaction.toAddress = toAddress;
    _transaction.amountStr = amountStr;
    _transaction.amount = parseFloat(amountStr);
  }

  async function fetchAndHandleBalance() {
    const transaction = _transaction;
    const cachedBalance = _currentMaxAmount;

    try {
      await WalletBusyModal.show(`⏳ Fetching balance for ${transaction.asset.symbol}...`);
      await WalletMultiNetworkUtils.getBalanceForNativeAsset(transaction);
      WalletBusyModal.hide();

      const latestBalance = WalletPersistence.walletManager.activeWallet.derivedAddresses?.[_currentAssetKey]?.balance;

      if (latestBalance !== null && cachedBalance !== null && latestBalance < cachedBalance) {
        _currentMaxAmount = latestBalance;

        if (dom.maxAmountLink) {
          dom.maxAmountLink.innerHTML = `max <a href="#" id="nativeAssetSendMaxAmountClick">${_currentMaxAmount}</a>`;
          const maxClickEl = document.getElementById("nativeAssetSendMaxAmountClick");
          if (maxClickEl) {
            maxClickEl.addEventListener("click", e => {
              e.preventDefault();
              dom.amount.value = _currentMaxAmount;
              validateForm();
              checkForInputChanges();
            });
          }
        }

        WalletInfoModal.show({
          message: "⚠️ Balance Decreased",
          details: `Your balance has dropped from ${cachedBalance} to ${latestBalance}. Please review and adjust your amount before continuing.`
        });

        enableContinueButton();
        WalletPageLevelUiStatusLines.updateStatus([`⚠️ Balance decreased from ${cachedBalance} to ${latestBalance}. Please review.`]);
        return;
      }

      _currentMaxAmount = latestBalance;
      return;

    } catch (err) {
      WalletBusyModal.hide();
      throw err;
    }
  }

  function isAmountTooHigh() {
    const amount = _transaction.amount;
    const maxAmount = _currentMaxAmount;
    if (maxAmount !== null && amount > maxAmount) {
      WalletInfoModal.show({
        message: "❌ Insufficient balance",
        details: `Your balance is ${maxAmount}, but you tried to send ${amount}. Please adjust the amount.`
      });
      disableContinueButton();
      WalletPageLevelUiStatusLines.updateStatus([`❌ Amount exceeds available balance (${maxAmount}). Please adjust.`]);
      return true; //amount IS too high
    }
    return false; //amount is NOT too high
  }

  async function isAmountTooHighDueToFetchedBalance() {
    await fetchAndHandleBalance();
    return isAmountTooHigh();
  }

  async function isDestinationAndPreFeeValid(transaction) {
    try {
      await WalletBusyModal.show('⏳ Checking if destination exists...');
      await WalletMultiNetworkUtils.determineDoesDestAddressExist(transaction);
      WalletBusyModal.hide();

      // if crypto specifics fail, we stop
      if (!isValidCryptoSpecifics(transaction.amount, transaction.destAddressExists, 0)) {
        return false; // stop flow, invalid
      }

      // warning only, not stopping
      if (transaction.destAddressExists === false) {
        WalletInfoModal.show({
          message: "⚠️ Address Not Found On Chain. New Address? Use Caution",
          details: "The recipient address does not exist on-chain. Double-check or proceed with caution."
        });
      }

      return true; // valid, can continue

    } catch (err) {
      WalletBusyModal.hide();
      WalletInfoModal.show({ message: "❌ Failed to check destination address.", details: err.message });
      const current = WalletPageLevelUiStatusLines.getCurrentStatus(); // get existing status lines
      current.push(`❌ Failed to check destination address: ${err.message}`);
      WalletPageLevelUiStatusLines.updateStatus(current); // overwrite with combined array
      disableContinueButton();
      return false; // stop flow due to error
    }
  }

  async function isFeeAndAdjustmentsValid(transaction) {
    try {
      await WalletBusyModal.show(`⏳ Estimating fee for ${transaction.asset.symbol}...`);
      await WalletMultiNetworkUtils.getFeeEstimateForNativeAsset(transaction);
      WalletBusyModal.hide();

      const feeVal = parseFloat(transaction.fee);

      if (!isNaN(feeVal) && feeVal > 0) {
        let adjustedAmount = transaction.amount;

        if (adjustedAmount > feeVal) {
          adjustedAmount = adjustedAmount - feeVal;
          const adjustedStr = adjustedAmount.toFixed(8);
          dom.amount.value = adjustedStr;
          transaction.amountStr = adjustedStr;
          transaction.amount = adjustedAmount;
          WalletPageLevelUiStatusLines.updateStatus([`⚠️ Amount adjusted for fee. New amount: ${adjustedStr}`]);
        } else {
          const balance = _currentMaxAmount ?? "unknown";
          const requested = transaction.amount ?? "unknown";
          const requiredTotal = (!isNaN(requested) && !isNaN(feeVal))
            ? (requested + feeVal).toFixed(8)
            : "unknown";

          WalletPageLevelUiStatusLines.updateStatus([
            `❌ Amount too low to cover fee.`,
            `   • Balance: ${balance}`,
            `   • Requested: ${requested}`,
            `   • Fee: ${feeVal}`,
            `   • Required (amount + fee): ${requiredTotal}`
          ]);
          disableContinueButton();
          return false; // failed → stop
        }
      } else {
        const current = WalletPageLevelUiStatusLines.getCurrentStatus(); // get existing status lines
        current.push(`❌ Failed to estimate fee.`);
        WalletPageLevelUiStatusLines.updateStatus(current); // overwrite with combined array
        enableContinueButton();
        return false; // failed → stop
      }

      // Check crypto specifics after fee adjustment
      if (!isValidCryptoSpecifics(transaction.amount, transaction.destAddressExists, feeVal)) {
        return false; // failed → stop
      }

      //dom.fee.value = feeVal || "N/A";
      dom.fee.value = parseFloat(transaction.fee).toFixed(8) || "N/A";

      return true; // passed → continue

    } catch (err) {
      WalletBusyModal.hide();
      WalletInfoModal.show({ message: "❌ Failed to estimate fee.", details: err.message });
      const current = WalletPageLevelUiStatusLines.getCurrentStatus(); // get existing status lines
      current.push(`❌ Fee estimation failed: ${err.message}.`);
      WalletPageLevelUiStatusLines.updateStatus(current); // overwrite with combined array
      enableContinueButton();
      return false; // failed → stop
    }
  }

  function finalizeSendUI() {
    _lastToAddress = dom.toAddress.value.trim();
    _lastAmountStr = dom.amount.value.trim();

    dom.continueBtn.style.display = "none";
    dom.sendBtn.style.display = "inline-block";

    dom.sendBtn.disabled = false;
    dom.sendBtn.textContent = "Send";
  }

  async function onContinueClicked() {
    disableContinueButton();
    getAndValidateInput();

    try {

    if (await isAmountTooHighDueToFetchedBalance()) {
      return;//amount IS too high, stop the send flow
    }

    if (!(await isDestinationAndPreFeeValid(_transaction))) {
      return; //not valid , stop the send flow
    }

    if (!(await isFeeAndAdjustmentsValid(_transaction))) {
      return; //not valid, stop the send flow
    }

    finalizeSendUI();

    } catch (err) {
      WalletBusyModal.hide();
      console.error("Error during Continue:", err);

      // Update status lines if present
      if (err?.statusLines?.length > 0) {
        WalletPageLevelUiStatusLines.updateStatus(err.statusLines);
      } else {
        const current = WalletPageLevelUiStatusLines.getCurrentStatus();
        current.push(`❌ ${err.message || "Unexpected error occurred."}`);
        WalletPageLevelUiStatusLines.updateStatus(current);
      }

      WalletInfoModal.show({
        message: "❌ Something went wrong",
        details: err.message || "Unexpected error occurred."
      });
      enableContinueButton();
    }
  }

  async function onSendClicked() {
    if (!_transaction.assetKey || !_transaction.toAddress || !_transaction.amountStr) {
      return WalletInfoModal.show({ message: "❌ Missing Info", details: "Please fill address and amount." });
    }

    try {
      await WalletBusyModal.show(`⏳ Sending ${_transaction.asset.symbol} transaction...`);
      // Give browser a chance to paint the modal/spinner
      await new Promise(r => requestAnimationFrame(r));

      await WalletMultiNetworkUtils.sendTransactionForNativeAsset(_transaction);
      WalletBusyModal.hide();

      const detailsText = `TX Hash: ${_transaction.txHash}. NOTE: true balance may take time. Try refresh:🔄`;

      WalletInfoModal.show({
        message: "✅ Sent",
        details: detailsText
      });

      // Refresh balance after send
      await WalletBusyModal.show("🔄 Updating balance...");
      // Give browser a chance to paint the modal/spinner
      await new Promise(r => requestAnimationFrame(r));
      await WalletMultiNetworkUtils.getBalanceForNativeAsset(_transaction);
      WalletBusyModal.hide();

      const persistedBalance = WalletPersistence.walletManager.activeWallet.derivedAddresses?.[_transaction.assetKey]?.balance;
      const statusLines = [
        "✅ Transaction sent successfully.",
        detailsText,
        "ℹ️ Use this hash on a block explorer to see on-chain details."
      ];

      if (persistedBalance === _currentMaxAmount) {
        statusLines.push("⚠️ Balance may not be updated yet. Please refresh after a minute.");
      }

      statusLines.push(`🔗 TX Hash: ${_transaction.txHash}`);
      statusLines.push("ℹ️ Use this hash on a block explorer to see on-chain details.");

      WalletPageLevelUiStatusLines.updateStatus(statusLines);

      if (persistedBalance === _currentMaxAmount) {
        WalletInfoModal.show({
          message: "⏳ Balance Unchanged",
          details: "The network may not have updated your balance yet. Tap the back arrow and refresh after a minute to see the updated balance."
        });
      }

      // Switch UI to Reset state
      dom.sendBtn.style.display = "none";
      dom.resetBtn.style.display = "inline-block";
      dom.resetBtn.disabled = false;

      WalletBusyModal.hide();
    } catch (err) {
      WalletBusyModal.hide();
      console.error("sendTransactionForNativeAsset error:", err);

      // Update status lines if present
      if (err?.statusLines?.length > 0) {
        WalletPageLevelUiStatusLines.updateStatus(err.statusLines);
      }

      WalletInfoModal.show({
        message: "❌ Send Failed, but refresh 🔄 your balance, fees may have still been deducted.",
        details: err.message
      });
    }
  }

  function onResetClicked() {
    if (_currentAssetKey) {
      showSendPanel(_currentAssetKey);
    }
  }

  function isValidCryptoSpecifics(amountToSend, destAddressExists, fee = 0) {
    const sendAmount = parseFloat(amountToSend);
    const asset = WalletPersistence.walletManager.activeWallet.derivedAddresses?.[_currentAssetKey];
    const assetSymbol = asset?.symbol?.toUpperCase();
    const originBalance = parseFloat(_currentMaxAmount);
    const feeAmount = parseFloat(fee) || 0;

    const cryptoSpec = WalletCryptoSpecifics.specifics[assetSymbol];
    if (!cryptoSpec) {
      _isCryptoSpecificsValid = false;
      disableContinueButton();
      console.warn(`No crypto specifics found for ${assetSymbol}`);
      WalletPageLevelUiStatusLines.updateStatus([`❌ No crypto specifics found for ${assetSymbol}.`]);
      throw new Error(`No crypto specifics found for ${assetSymbol}.`);
    }

    // 1) Check new or existing destination address minimum send amount
    const destReqKey = destAddressExists ? 'existingDestAddressRequirements' : 'newDestAddressRequirements';
    const minSendReq = cryptoSpec[destReqKey]?.minimumSend;

    if (minSendReq && minSendReq.minimum !== null && sendAmount < minSendReq.minimum) {
        const msg = minSendReq.message.replace('{minimum}', minSendReq.minimum);
        WalletInfoModal.show({ message: "❌ Amount Too Low", details: msg });
        WalletPageLevelUiStatusLines.updateStatus([`❌ ${msg}`]);
        _isCryptoSpecificsValid = false;
        disableContinueButton();
        return false; // failed validation, do NOT continue the send flow
    }

    // 2) Check origin address minimum balance requirement AFTER send + fee + reserve
    const originReq = cryptoSpec.originAddressRequirements?.minOriginBalance;
    if (originReq && originReq.minimum !== null) {
      // minBalance = sendAmount + fee + origin minimum
      const minBalanceNeeded = sendAmount + feeAmount + originReq.minimum;
      if (originBalance < minBalanceNeeded) {
        let msg = originReq.message;
        msg = msg.replace('{minBalance}', minBalanceNeeded.toFixed(8));
        msg = msg.replace('{send}', sendAmount.toFixed(8));
        WalletInfoModal.show({ message: "❌ Insufficient Balance", details: msg });
        WalletPageLevelUiStatusLines.updateStatus([`❌ ${msg}`]);
        _isCryptoSpecificsValid = false;
        disableContinueButton();
        return false; // failed validation, do NOT continue the send flow
      }
    }

    // All checks passed
    _isCryptoSpecificsValid = true;
    enableContinueButton();
    return true; // has passed initial validation, can keep going
  }

  function initOnceDomReady() {
    if (_initialized) return;
    _initialized = true;

    cacheDom();

    dom.continueBtn.addEventListener("click", onContinueClicked);
    dom.sendBtn.addEventListener("click", onSendClicked);
    dom.resetBtn.addEventListener("click", onResetClicked);


    dom.feeHelpIcon.addEventListener("click", () => {
      WalletInfoModal.show({
        message: "Fee is the cost to process your transaction on the blockchain.",
        details: "Fees vary based on network congestion, asset, and provider.",
      });
    });

    // Input validation triggers
    [dom.toAddress, dom.amount].forEach(el => {
      el.addEventListener("input", () => {
        validateForm();
        checkForInputChanges();
      });
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
    showSendPanel,
  };


})();

