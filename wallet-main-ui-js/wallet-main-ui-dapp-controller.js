// wallet-main-ui-js/wallet-main-ui-dapp-controller.js

window.WalletUiDappController = (function () {

  const UNKNOWN_IF_DAPP = '??????';
  let _initialized = false;
  let _dappPanelOpen = false; // <-- added
  let _missingCurrentAddressAndNetworkFlag = true;
  let _missingCurrAdrAndNetModalAlreadyShown = false;
  let _userHasChangedCurrAddrAndNetwork = false;
  let _areThereDappSplitButtonActions = false;
  let _dappNotActiveTimer = null;
  const DAPP_NOT_ACTIVE_TIMEOUT = 5000; // 15 seconds, adjust as needed
  let _isConnected = false;
  let _lastTimeReceivedMessage = null;
  let _dAppIsRequestingNetworkChangeInCaseMessagesPaused = false;

  function isDappIsRequestingNetworkChangeInCaseMessagesPaused() {
    return _dAppIsRequestingNetworkChangeInCaseMessagesPaused;
  }

  function setDappIsRequestingNetworkChangeInCaseMessagesPaused() {
    _dAppIsRequestingNetworkChangeInCaseMessagesPaused = true;
  }

  function clearDappIsRequestingNetworkChangeInCaseMessagesPaused() {
    _dAppIsRequestingNetworkChangeInCaseMessagesPaused = false;
  }

  function setLastTimeReceivedMessage() {
    _lastTimeReceivedMessage = Date.now();
  }
  function getLastTimeReceivedMessage() {
    return _lastTimeReceivedMessage;
  }

  function setMissingCurrentAddressAndNetworkFlag() {
    _missingCurrentAddressAndNetworkFlag = true;
  }

  function clearMissingCurrentAddressAndNetworkFlag() {
    _missingCurrentAddressAndNetworkFlag = false;
  }

  function isMissingCurrentAddressAndNetworkFlag() {
    return _missingCurrentAddressAndNetworkFlag;
  }

  function isConnected() { return _isConnected; }

  function userHasChangedCurrAddrAndNetwork () {
    _userHasChangedCurrAddrAndNetwork = true;
  }

  const dappFunctions = {
    connect(args) {

      (async () => {
        const currAddr = document.getElementById("dappCurrentAddress")?.dataset.address || "";
        const currNet  = document.getElementById("dappCurrentNetwork")?.dataset.chain || "";
        const currNetType  = document.getElementById("dappCurrentNetwork")?.dataset.networkType || "";

        WalletPageLevelUiStatusLines.clearStatus();
        await startDappSession(args?.message || null);

        const message = {
          from: 'wallet',
          to: 'dapp',
          type: 'wallet_origin_approved',
          result: [currAddr],
          chainId: currNet,
          payload: {
            address: currAddr,
            accounts: [currAddr],
            chainId: currNet,
            networkType: currNetType
          }
        };

        console.log('[WalletUI] --- CONNECT BUTTON CLICKED ---');
        console.log('[WalletUI] Raw Chain from DOM:', currNet);
        console.log('[WalletUI] Posting Message:', message);

        window.parent.postMessage(message, '*');
      })();
    },

    disconnect() {
      const currNetType  = document.getElementById("dappCurrentNetwork")?.dataset.networkType || "";
      _userHasChangedCurrAddrAndNetwork = false;  // reset flag

      const message = {
        from: 'wallet',
        to: 'dapp',
        type: 'wallet_origin_revokePermissions',
        payload: {
          networkType: currNetType
        }
      };

      console.log('[WalletUI] --- DISCONNECT BUTTON CLICKED ---');
      console.log('[WalletUI] Posting Message:', message);

      window.parent.postMessage(message, '*');

      clearDappSession();
    },

    changeNet() {
      const currAddr = document.getElementById("dappCurrentAddress")?.dataset.address || "";
      const currNet  = document.getElementById("dappCurrentNetwork")?.dataset.chain || "";
      const currNetType  = document.getElementById("dappCurrentNetwork")?.dataset.networkType || "";

      const msgType = isDappIsRequestingNetworkChangeInCaseMessagesPaused()
            ? 'wallet_origin_wallet_switchEthereumChain_response'
            : 'wallet_origin_chainChanged';

      const message = {
        from: 'wallet',
        to: 'dapp',
        type: msgType,
        chainId: currNet,
        result: null,
        payload: {
          address: currAddr,
          accounts: [currAddr],
          chainId: currNet,
          networkType: currNetType,
          connected: true
        }
      };

      console.log('[WalletUI] --- CHANGE NET BUTTON CLICKED ---');
      console.log('[WalletUI] Message Type Determined:', msgType);
      console.log('[WalletUI] Posting Message:', message);

      window.parent.postMessage(message, '*');

      _userHasChangedCurrAddrAndNetwork = false;
      clearDappIsRequestingNetworkChangeInCaseMessagesPaused();
      updateDappControlButton({ state: 'connected' });
    }
  };


  const dappSplitButtonActions = {
    connect: {
      text: 'Connect',
      action: dappFunctions.connect
    },
    disconnect: {
      text: 'Disconnect',
      action: dappFunctions.disconnect
    },
    changeNetwork: {
      text: 'Change Network',
      action: dappFunctions.changeNet
    }
  };


  function disconnect() { dappFunctions.disconnect(); }


  function syncDappMismatchUI() {
    const dappControlBtn = document.getElementById('dappControlBtn');
    const splitBtn = document.getElementById('dappControlSplitBtn');

    const mismatch =
      (_isConnected && !dappSession.isSessionStarted) ||
      (!_isConnected && dappSession.isSessionStarted);

    dappControlBtn?.classList.toggle('dapp-mismatch', mismatch);
    splitBtn?.classList.toggle('dapp-mismatch', mismatch);

    if (mismatch) {
      WalletPageLevelUiStatusLines.appendStatus('ERROR!:Programmer: dappSession vs Connect Status Mismatch');
    }
  }


  function updateDappSplitButton({ state }) {
    const dappControlBtn = document.getElementById('dappControlBtn');
    const splitBtn = document.getElementById('dappControlSplitBtn');
    const splitDropdown = document.getElementById('dappControlSplitDropdown');
    if (!dappControlBtn || !splitBtn || !splitDropdown) return;

    // reset classes
    dappControlBtn.classList.remove('connected');
    splitBtn.classList.remove('connected');

    dappControlBtn.disabled = true;

    // split main action is ALWAYS Change Network
    splitBtn.querySelector('.dapp-split-main').textContent = dappSplitButtonActions.changeNetwork.text;

    // wire main split action once
    if (!splitBtn._mainClickWired) {
      splitBtn.querySelector('.dapp-split-main').onclick = () => {
        dappSplitButtonActions.changeNetwork.action();
        splitDropdown.style.display = 'none';
      };
      splitBtn._mainClickWired = true;
    }

    // wire arrow + dropdown toggle once
    if (!splitBtn._arrowClickWired) {
      const wrapper = document.getElementById('dappControlSplitWrapper');

      splitBtn.querySelector('.dapp-split-arrow').onclick = (e) => {
        e.stopPropagation();
        splitDropdown.style.display =
          splitDropdown.style.display === 'block' ? 'none' : 'block';
      };

      // Close dropdown if clicking outside
      document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
          splitDropdown.style.display = 'none';
        }
      });

      splitBtn._arrowClickWired = true;
    }

    // wire Disconnect dropdown item once
    const disconnectBtn = document.getElementById('disconnectBtn');
    if (disconnectBtn && !disconnectBtn._clickWired) {
      disconnectBtn.onclick = () => {
        splitDropdown.style.display = 'none';
        //dappFunctions.disconnect();
        dappSplitButtonActions.disconnect.action();
      };
      disconnectBtn._clickWired = true;
    }

    syncDappMismatchUI();
  }

  function updatePageBackgroundByDappState(state) {
    document.body.classList.remove('bg-connected', 'bg-disconnected', 'bg-unknown');

    switch(state) {
        case 'connected':
            document.body.classList.add('bg-connected');
            break;
        case 'disconnected':
            document.body.classList.add('bg-disconnected');
            break;
        default:
            document.body.classList.add('bg-unknown');
            break;
    }
  }

  function resetDappNotActiveTimer() {
    if (_dappNotActiveTimer) {
      clearTimeout(_dappNotActiveTimer);
      _dappNotActiveTimer = null;
    }
    startDappNotActiveTimer(); // restart
  }

  function startDappNotActiveTimer() {
    // clear existing timer first
    if (_dappNotActiveTimer) clearTimeout(_dappNotActiveTimer);

    _dappNotActiveTimer = setTimeout(() => {
      //console.log('[Wallet UI] Dapp inactive timeout expired, sending REGISTER...');
      window.parent.postMessage({
        from: 'wallet',
        type: 'REGISTER',
        href: window.location.href,
        origin: window.location.origin
      }, '*');

      // restart timer automatically if you want continuous polling
      startDappNotActiveTimer();

    }, DAPP_NOT_ACTIVE_TIMEOUT);
  }


  function flashDappStatusButton() {
    const dappStatusBtn = document.getElementById('dappStatusBtn');

    if (!dappStatusBtn) return;

    dappStatusBtn.disabled = false;
    dappStatusBtn.classList.remove('connected');
    dappStatusBtn.classList.add('connecting');
    dappStatusBtn.classList.add('flash-red');

    // Remove it after short duration (350ms)
    setTimeout(() => {
      dappStatusBtn.classList.remove('flash-red');
    }, 200);
  }

  function markDappHandleConnection() {
    const dappStatusBtn = document.getElementById('dappStatusBtn');
    if (!dappStatusBtn) return;
    dappStatusBtn.disabled = false;
    dappStatusBtn.classList.remove('connected');
    dappStatusBtn.classList.add('handling');
  }

  function markDappConnected() {
    const dappStatusBtn = document.getElementById('dappStatusBtn');
    if (!dappStatusBtn) return;
    dappStatusBtn.disabled = false;
    dappStatusBtn.classList.remove('handling');
    dappStatusBtn.classList.add('connected');
  }

  function updateDappStatusButton() {
    //console.log('[wallet ui page level] updateDappStatusButton - start');

    const dappStatusBtn = document.getElementById("dappStatusBtn");
    if (!dappStatusBtn) return;

    //console.log('[wallet ui page level] updateDappStatusButton - add event listener');
    dappStatusBtn.addEventListener("click", () => {
      //console.log('[wallet ui page level] updateDappStatusButton - button clicked.');
      markDappHandleConnection();
      WalletUiPanel.show('dappHandlingPanel');

      // hide the button now that the panel is open
      dappStatusBtn.style.display = 'none';

      WalletPageLevelUiBackArrow.showBackArrow({
        show: 'allDigitalAssetsListPanel',
        onBackArrow: () => {
          // restore button visibility when backing out
          //console.log('[wallet ui page level] - restoring dapp status button');
          dappStatusBtn.style.display = '';
          _dappPanelOpen = false;
           WalletCryptoList.prepAndShowDigitalAssetsListPanel();
        }
      });

      // track panel state
      _dappPanelOpen = true;
    });
  }

  function showOnlyButton(buttonToShowId, displayStyle = 'inline-block') {
    const buttons = ['dappControlBtn', 'dappControlSplitBtn']; // list all buttons
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.style.display = (id === buttonToShowId) ? displayStyle : 'none';
    });
  }


  function setDefaultDappControlButtonGroupState() {
    //console.log('[wallet ui page level] - start of updateDappControlButton()..');

    const dappControlBtn = document.getElementById('dappControlBtn');
    const splitBtn = document.getElementById('dappControlSplitBtn');
    const splitDropdown = document.getElementById('dappControlSplitDropdown');
    if (!dappControlBtn || !splitBtn || !splitDropdown) return;

    // Reset classes just for control button
    dappControlBtn.classList.remove('connected');
    splitBtn.classList.remove('connected');

    dappControlBtn.disabled = true;
    dappControlBtn.textContent = UNKNOWN_IF_DAPP;
    splitBtn.classList.remove('connected');
  }

  // 🔹 New: Public method to update dApp Control Button
  function updateDappControlButton({ state }) {
    //console.log('[wallet ui page level] - start of updateDappControlButton()..');

    const dappControlBtn = document.getElementById('dappControlBtn');
    const splitBtn = document.getElementById('dappControlSplitBtn');
    if (!dappControlBtn || !splitBtn) return;

    //console.log('[wallet ui page level] - updateDappControlButton() - Reset classes just for control button');
    dappControlBtn.classList.remove('connected');
    splitBtn.classList.remove('connected');

    updatePageBackgroundByDappState(state);

    //console.log('[wallet ui page level] - updateDappControlButton() -is state connected or disconnected..then.,.');
    if (state === 'connected' || state === 'disconnected') {

      _isConnected = (state === 'connected');

      //console.log('[wallet ui page level] - updateDappControlButton() -state IS connected OR disconnected..thus Dapp');
      const currAddr = document.getElementById("dappCurrentAddress")?.dataset.address || "";
      const currNet  = document.getElementById("dappCurrentNetwork")?.dataset.chain || "";

      //console.log('[wallet ui page level] - updateDappControlButton() -is cur Adr & cur Net?..');
      const isCurrAddrAndNetwork = currAddr.trim() !== "" && currNet.trim() !== "";

      if (!isCurrAddrAndNetwork) {
        //console.log('[wallet ui page level] - updateDappControlButton() -NO cur Adr Or cur Net..');
        setMissingCurrentAddressAndNetworkFlag();
        if (!_missingCurrAdrAndNetModalAlreadyShown) {
          //console.log('[wallet ui page level] - updateDappControlButton() -.. show Modal...');
          WalletInfoModal.show({
            message: "Missing Current Address & Network!",
            details: "Incoming Dapp messages, asking to connect, but you have not selected an address and network. Go and select from the assets lists, and then click the 'DeFi' button.",
          });
          //console.log('[wallet ui page level] - updateDappControlButton() -...Modalshown, we are done.');
          _missingCurrAdrAndNetModalAlreadyShown = true;
        }
        return;
      }

      // 🔹 NEW: derive split-button availability from state + user action
      const shouldShowSplit =
        state === 'connected' && _userHasChangedCurrAddrAndNetwork === true;

      _areThereDappSplitButtonActions = shouldShowSplit;

      if (_areThereDappSplitButtonActions) {
        // Show split button + dropdown
        splitBtn.style.display = 'inline-flex';
        dappControlBtn.style.display = 'none';
        updateDappSplitButton({ state });
      } else {
        // Show main button only
        dappControlBtn.style.display = 'inline-block';
        splitBtn.style.display = 'none';
        dappControlBtn.disabled = false;
        dappControlBtn.textContent =
          state === 'connected' ? 'Disconnect' : 'Connect';
      }

    } else {
      // UNKNOWN
      _isConnected = false;
      dappControlBtn.style.display = 'inline-block';
      splitBtn.style.display = 'none';
      dappControlBtn.disabled = true;
      dappControlBtn.textContent = UNKNOWN_IF_DAPP;
    }

    //console.log('[wallet ui page level] - updateDappControlButton() -has btn been wired?');
    // Wire normal dappControlBtn click once
    if (!dappControlBtn._clickHandlerWired) {
      //console.log('[wallet ui page level] - updateDappControlButton() -btn NOT wired; wire it');
      dappControlBtn.addEventListener('click', () => {
        if (dappControlBtn.textContent === 'Connect') {
          dappFunctions.connect();
          dappControlBtn.textContent = 'Disconnect';
        } else {
          dappFunctions.disconnect();
          dappControlBtn.textContent = 'Connect';
        }
      });
      dappControlBtn._clickHandlerWired = true;
    }

    syncDappMismatchUI();
  }

  function handleDappIsRequestingToConnect(message) {

    console.log('[WalletUiDappController.handleDappIsRequestingToConnect] start: message:',message);

    const isConnected = message?.payload?.isConnected;
    const isDapp = message?.payload?.isDapp;
    const originalSource = message?.originalSource || message?.payload?.originalSource;

    // Only act if the message comes from a dApp that is not connected
    if (isDapp && !isConnected && originalSource === 'dapp') {

      //first we have to make sure the user had selected an address+network.
      //if not, no point in doing this.  we tel user the issue (AGAIN),
      //and we bail.
      if (_missingCurrentAddressAndNetworkFlag) {
          WalletInfoModal.show({
            message: "Missing Current Address & Network!",
            details: "Incoming Dapp messages, asking to connect, but you have not selected an address and network. Go and select from the assets lists, and then click the 'DeFi' button.",
          });
          WalletInfoModal.show({
            message: '❌ Disconnecing - You Have NOT Selected An Asset.',
            details: 'Go to Native Digital Assets, Pick One, Click "DeFi" Button.',
          });
          const status = '❌ Disconnecing - You Have NOT Selected An Asset.';
          WalletPageLevelUiStatusLines.appendStatus(status);
          dappFunctions.disconnect();
          return;
      }

     //ok if we got this far, the user is allowed to connect or not.
      WalletYesOrNoAction.showModal({
        message: "dApp is requesting to connect",
        details: "Do you want to allow this dApp to connect to your wallet?",
        positive: "Connect",
        negative: "Reject",
        onPositive: () => {
          console.log('[WalletUI] User approved dApp connection');
          // equivalent of clicking the Connect button
          clearDappSession();
          dappFunctions.connect({message});
        },
        onNegative: () => {
          console.log('[WalletUI] User rejected dApp connection');
          // for now, just disconnect
          dappFunctions.disconnect();
        }
      });

    } else {
      const details = JSON.stringify(message);
      const msg = `❌ Bad "Request To Connect" Message From Dapp`;
      const status = `${msg} : ${details}`;
      WalletInfoModal.show({ message: msg, details });
      WalletPageLevelUiStatusLines.appendStatus(status);
    }
  }

  function normalizeChainId(val) {
    try {
      return '0x' + BigInt(val).toString(16);
    } catch {
      return null;
    }
  }

  function handleDappIsRequestingNetworkChange(message) {
    const isConnected = message?.payload?.isConnected;
    const isDapp = message?.payload?.isDapp;
    const originalSource = message?.originalSource || message?.payload?.originalSource;
    // Only act if the message comes from a dApp that IS connected
    if (isDapp && isConnected && originalSource === 'dapp') {

      const site = message?.origin || message?.href || 'The DeFi Site';
      const requestedChainId = message?.payload?.switchChainId; // 🟢 Metadata sent by dApp
      const normalizedRequested = normalizeChainId(requestedChainId);

      // 🔹 Simplified: just check the object directly
      const chainKey = Object.keys(WalletPersistence.walletManager.activeWallet.derivedAddresses)
        .find(key => {
          const addr = WalletPersistence.walletManager.activeWallet.derivedAddresses[key];
          return addr.networkType === 'EVM' && normalizeChainId(addr.chainId) === normalizedRequested;
        });


      const chainInfo = chainKey
        ? WalletPersistence.walletManager.activeWallet.derivedAddresses[chainKey]
        : null;

      const allowed = !!chainInfo;

      setDappIsRequestingNetworkChangeInCaseMessagesPaused();


      if (!allowed) {


        WalletInfoModal.show({
          message: `❌ ${site} is requesting switch to \nUNKNOWN network: ${requestedChainId}.\nRequest Rejected.`,
          onClose: () => {
            console.log('[WalletUI] Bad network. User rejected dApp network change');
            dappFunctions.disconnect()
          }
        });
        return;
      }

      WalletDappHandling.renderRequestRow(message);

      const iconPath = `icons/${chainInfo.symbol.toLowerCase()}.svg`;
      const img = document.createElement("img");
      img.src = iconPath;
      img.className = "crypto-icon";
      img.alt = `${chainInfo.symbol} logo`;
      img.onerror = () => { img.replaceWith(document.createTextNode("💰")); };

      // 1. Construct the HTML string for the icon
      // We add vertical-align and margin to make it look good next to the text
      const iconHtml = `<img src="${iconPath}" style="width:20px; height:20px; vertical-align:middle; margin-right:6px;" onerror="this.style.display='none';">`;

      //if we got this far, user can be given the option of switching networks.
      const { chainId, network, symbol } = chainInfo;
      const modalText = 'Network Change Request';
      // 2. Wrap the symbol/network in the same line as the icon
      const details = `${site}<br/><br/>` +
                `Requesting change to:<br/>` +
                `${iconHtml} <strong>${symbol}</strong> (${network})<br/>` +
                `<small>[${normalizedRequested}]</small>`;

        //ok if we got this far, the user is allowed to switch network or not.
        WalletYesOrNoAction.showModal({
          message: modalText,
          details: details,
          positive: "Switch",
          negative: "Reject",
          onPositive: () => {
            console.log('[WalletUI] User approved network change');

            // 1️⃣ update wallet state internally
            activateAssetForDapp(chainKey);

            // 2️⃣ notify the dapp
            dappFunctions.changeNet();
          },
          onNegative: () => {
            console.log('[WalletUI] User rejected network change');
            // for now, just disconnect
            dappFunctions.disconnect();
          }
        });
    } else {
      const details = JSON.stringify(message);
      const msg = `❌ NOT CONNECTED! Bad "Request To Switch Net" Message From Dapp`;
      const status = `${msg} : ${details}`;
      WalletInfoModal.show({ message: msg, details });
      WalletPageLevelUiStatusLines.appendStatus(status);
    }

  }


  function activateAssetForDapp(assetKey) {
    const derived = WalletPersistence.walletManager.activeWallet.derivedAddresses?.[assetKey];
    if (!derived) return;

    const addressLabel = document.getElementById("dappCurrentAddress");
    const networkLabel = document.getElementById("dappCurrentNetwork");

    // ✅ New invariant check: all (address, network, networkType, assetKey) must be empty or all populated
    const addressVal = addressLabel?.dataset.address || null;
    const networkVal = networkLabel?.dataset.chain || null;
    const typeVal = networkLabel?.dataset.networkType || null;
    const assetKeyVal = networkLabel?.dataset.assetKey || null;

    const allPopulated = addressVal && networkVal && typeVal && assetKeyVal;
    const allEmpty = !addressVal && !networkVal && !typeVal && !assetKeyVal;

    if (!(allPopulated || allEmpty)) {
      const msgLines = [
        "Address, Network, and NetworkType must either all be empty or all be populated.",
        `Current state: Address='${addressVal}', Network='${networkVal}', NetworkType='${typeVal}', AssetKey='${assetKeyVal}'`
      ];
      WalletInfoModal.show({
        message: "Address/Network/Type Mismatch",
        details: msgLines.join("\n")
      });
      //WalletPageLevelUiStatusLines.updateStatus(msgLines);
      WalletPageLevelUiStatusLines.appendStatus(msgLines);
      return;
    }

    const wasAlreadyPopulated =
      (addressLabel?.dataset.address || "") !== "" ||
      (networkLabel?.dataset.chain || "") !== "" ||
      (networkLabel?.dataset.networkType || "") !== "" ||
      (networkLabel?.dataset.assetKey || "") !== "";

    // --- Populate Address Label ---
    if (addressLabel) {
      const addr = derived.address || "—";
      addressLabel.textContent = addr;
      addressLabel.dataset.address = addr;
      addressLabel.classList.toggle("populated", !!derived.address);

      // Apply tooltip to the main label (visible when truncated)
      addressLabel.dataset.tooltip = addr;

      // Apply tooltip to the icon version
      const addressShrunk = document.getElementById("dappCurrentAddressShrunk");
      if (addressShrunk) addressShrunk.dataset.tooltip = addr;
    }

    // --- Populate Network Label ---
    if (networkLabel) {
      const networkName = derived.network || "—";
      const symbol = derived.symbol ? derived.symbol.toLowerCase() : null;

      networkLabel.dataset.chain = (derived.chainId != null && derived.chainId !== "")
        ? (function(val) {
             const str = val.toString().trim();
             // If it's already hex (0x...), just ensure it's clean hex
             if (str.startsWith('0x')) {
               return `0x${parseInt(str.slice(2), 16).toString(16)}`;
             }
             // Otherwise, treat as decimal and convert to hex
             return `0x${parseInt(str, 10).toString(16)}`;
           })(derived.chainId)
        : null;
      networkLabel.dataset.networkType = derived.networkType || null;
      networkLabel.dataset.assetKey = assetKey || null;
      networkLabel.classList.toggle("populated", !!derived.network);

      // Add the icon + the text into the button
      if (symbol) {
        networkLabel.innerHTML = `
          <img src="icons/${symbol}.svg" style="width:18px; height:18px; margin-right:6px;"
               onerror="this.style.display='none';">
          ${networkName}
        `;
      } else {
        networkLabel.textContent = networkName;
      }
    }

    clearMissingCurrentAddressAndNetworkFlag();

    if (wasAlreadyPopulated && isConnected()) {
      WalletUiDappController.userHasChangedCurrAddrAndNetwork();
    }

    if (isDappIsRequestingNetworkChangeInCaseMessagesPaused()) {
      updateDappControlButton?.({ state: 'connected' });
    }

    resetDappNotActiveTimer();
    startDappNotActiveTimer();

    // Immediate refresh instead of a timeout
    WalletPageLevelUI.refreshShrinkState();



    // Send message to background
    window.parent.postMessage({
      from: 'wallet-to-background',
      to: 'background',
      type: 'OPEN_DAPP'
    }, '*');

  }

  function determineAndHandleDappErrorMessage(message, forceError = false) {

    console.warn('[WalletUiDappController].determineAndHandleDappErrorMessage:', message);

    //if (!_isConnected) return; //we are no longer connected.

    if (!forceError) {

      if (!message?.error && !message?.type?.endsWith('_timeout') && !message?.type?.endsWith('_programmer')) {
        return; // It's fine; not an error nor a timeout
      }
    }

    WalletInfoModal.show({
      message: '❌ Error or Timeout message(s). Disconnecing.',
      details: 'Check status at bottom and DeFi messages.',
    });
    console.error('[WalletUiDappController].determineAndHandleDappErrorMessage:', message);
    dappFunctions.disconnect();
  }

  const dappSession = {
    isSessionStarted: false,
    thereWasAnErrorDuringThisSession : false,
    assetProviderInUse : null,
    transaction : {},
    lastTimeSendTransactionMessage: null,
  };


  function clearDappSession() {
    dappSession.isSessionStarted = false;
    dappSession.thereWasAnErrorDuringThisSession = false;
    dappSession.assetProviderInUse = null;
    dappSession.transaction = {};
    syncDappMismatchUI();
  }

  function logDappSession() {
    console.log('\n=================================================');
    console.log('Dapp Session Data-------------------------------|');
    console.log(`isSessionStarted: ${dappSession.isSessionStarted}`);
    console.log(`error: ${dappSession.thereWasAnErrorDuringThisSession}`);
    console.log(`provider: ${dappSession.assetProviderInUse?.providerName}`);
    console.log(`transaction: ${JSON.stringify(dappSession.transaction)}`);
    console.log('=================================================\n');
  }

  async function startDappSession(message) {

    console.log('\n\n[WalletUiDappController.startSession]\n\n');

    let incomingMessage = null;
    try {

      incomingMsg = message || { type: 'NO_INCOMING_MESSAGE' };
      const params = message?.params || message?.payload || null;

      const logMsg = `[WalletUiDappController.startSession] Raw ${incomingMessage?.type} params: ${params? JSON.stringify(params) : ''}`;
      console.log(logMsg);

      const networkLabel = document.getElementById("dappCurrentNetwork");
      const assetKeyVal = networkLabel?.dataset.assetKey || null;


      const derived = WalletPersistence.walletManager.activeWallet.derivedAddresses?.[assetKeyVal];

      dappSession.transaction.assetKey = assetKeyVal;
      dappSession.transaction.asset = derived;
      dappSession.transaction.params = params;
      dappSession.transaction.method = incomingMsg.type;

      console.log(
          '[WalletUiDappController.startSession] Prepared transaction object prior to test provider:',
          JSON.stringify(dappSession.transaction));

      //-------------------------------------------------
      // this method is here because it attempts to find a working asset provider,
      // that will be used in the real RPC.
      // THIS METHOD INTERNALLY ASSIGNS THE SUCCESSFUL PROVIDER TO TRANSACTION:
      // (transaction.provider).
      //-------------------------------------------------
      const result = await WalletMultiNetworkUtils.getBalanceForNativeAsset(dappSession.transaction);

      // Explicitly lock in the provider for this session
      dappSession.assetProviderInUse = result?.provider || dappSession.transaction.provider;

      console.log('[WalletDappMsgHandler.startSession] Session started. Provider locked in:', dappSession.assetProviderInUse?.providerName || 'Unknown');

      dappSession.isSessionStarted = true;

      logDappSession();

    } catch (err) {
      handleRpcCallError(incomingMsg, err);
    }

    syncDappMismatchUI();
  }

  function handleRpcCallError(message, err) {

    clearDappSession();

    dappSession.thereWasAnErrorDuringThisSession = true;

    const type = message?.type || 'unknown call type';

    // 1. Console Logging: Pass the object directly for a clickable stack trace
    console.error(`[Wallet MAIN, DAPP MSG HANDLER] ${type} error:`, err);

    // 2. UI Status Lines: Safely extract message and stack
    const errMsg = err?.message || "Unknown error";
    const errStack = err?.stack ? ` | Stack: ${err.stack}` : "";
    const statusLine = `⚠️ ${type} Failed: ${errMsg}${errStack}`;

    // Append to your UI component
    WalletPageLevelUiStatusLines.appendStatus(statusLine);

    const forceError = true;
    WalletUiDappController.determineAndHandleDappErrorMessage(message, forceError);

    throw new Error(statusLine);
  }

  function initOnceDomReady() {
    if (_initialized) return;
    _initialized = true;

    const dappStatusBtn = document.getElementById('dappStatusBtn');

    // ✅ enforce default: only main button visible
    showOnlyButton('dappControlBtn');

    setDefaultDappControlButtonGroupState();

    // setup the page-level button behavior
    updateDappStatusButton();

    window.addEventListener('beforeunload', () => {
      if (_dappNotActiveTimer) {
        clearTimeout(_dappNotActiveTimer);
        _dappNotActiveTimer = null;
        //console.log('[Wallet UI] Dapp not active timer cleared on unload');
      }
    });

    WalletPageLevelUiDappLayoutShrinker.refresh();

  }

  function onDomReady(cb) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', cb);
    } else {
      cb();
    }
  }

  onDomReady(initOnceDomReady);

  return {
    flashDappStatusButton,
    setMissingCurrentAddressAndNetworkFlag,
    clearMissingCurrentAddressAndNetworkFlag,
    isMissingCurrentAddressAndNetworkFlag,
    isDappIsRequestingNetworkChangeInCaseMessagesPaused,
    setDappIsRequestingNetworkChangeInCaseMessagesPaused,
    clearDappIsRequestingNetworkChangeInCaseMessagesPaused,
    markDappConnected,
    markDappHandleConnection,
    updateDappControlButton,
    UNKNOWN_IF_DAPP,
    resetDappNotActiveTimer,
    startDappNotActiveTimer,
    userHasChangedCurrAddrAndNetwork,
    refreshShrinkState: WalletPageLevelUiDappLayoutShrinker.refresh,
    isConnected,
    setLastTimeReceivedMessage,
    getLastTimeReceivedMessage,
    handleDappIsRequestingToConnect,
    handleDappIsRequestingNetworkChange,
    activateAssetForDapp,
    determineAndHandleDappErrorMessage,
    dappSession,
    clearDappSession,
    startDappSession,
    logDappSession,
    handleRpcCallError,
    disconnect,
  };
})();

