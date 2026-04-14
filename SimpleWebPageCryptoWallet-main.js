//SimpleWebPageCryptoWallet-main.js

const SimpleWebPageCryptoWalletMain = {

  validateWalletName(name) {
    // allow a-z, A-Z, 0-9, spaces, dashes; minimum 8 characters
    if (!name) return { valid: false, message: 'Wallet name is required' };
    if (name.length < 8) return { valid: false, message: 'Wallet name must be at least 8 characters' };
    if (!/^[a-zA-Z0-9\s-]+$/.test(name)) return { valid: false, message: 'Only letters, numbers, spaces and dashes allowed' };
    if (!WalletPersistence.walletManager.isWalletUnique(name))
      return { valid: false, message: 'A Wallet Already Exists By That Name' };

    return { valid: true, message: '' };
  },

  showActiveWalletName() {
    const walletName = WalletPersistence.walletManager.activeWallet.name || 'No Active Wallet';
    const el = document.getElementById('activeWalletName');
    el.textContent = walletName;

    const editIcon = document.getElementById('editActiveWalletIcon');
    if (editIcon) {
      editIcon.onclick = () => {
        // prefill the textbox
        document.getElementById('editWalletNameInput').value = walletName;

        //CANCEL BUTTON
        //before showing panel, make sure we can come back to where we were.
        const cancelBtn = document.getElementById('cancelWalletEditBtn');
        const current = WalletUiPanel.getCurrentPanelId();
        cancelBtn.onclick = () => {
          if (current) WalletUiPanel.show(current);
        };

        //SAVE WALLET NEW NAME BUTTON
        const saveBtn = document.getElementById('saveWalletNameBtn');
        if (saveBtn) {
          saveBtn.onclick = () => {
            const newName = document.getElementById('editWalletNameInput').value.trim();
            try {
              // validate first
              const { valid, message } = SimpleWebPageCryptoWalletMain.validateWalletName(newName);
              if (!valid) throw new Error(message);

              WalletPersistence.walletManager.activeWallet.rename(newName);
              SimpleWebPageCryptoWalletMain.showActiveWalletName(); // refresh display
              WalletPageLevelUiStatusLines.clearStatus();
              WalletUiPanel.show(current); // go back to previous panel

            } catch (err) {
              WalletInfoModal.show({
                message: `Failed to rename wallet: ${err.message}`,
                details: 'Make sure the new name is unique and valid.'
              });
              WalletPageLevelUiStatusLines.updateStatus([`❌ ${err.message}`]);
            }
          };
        }

        // DELETE WALLET BUTTON
        const deleteBtn = document.getElementById('deleteWalletBtn');
        if (deleteBtn) {
          deleteBtn.onclick = async () => {
            const password = document.getElementById('deleteWalletPasswordInput')?.value || '';
            if (!password) {
              WalletInfoModal.show({ message: 'Password required to delete wallet' });
              WalletPageLevelUiStatusLines.updateStatus([`❌ Password required to delete wallet`]);
              return;
            }

            try {
              // verify password by attempting decryption
              await WalletCore.decryptMnemonic(
                WalletPersistence.walletManager.activeWallet.encryptedMnemonic, password);

              // if successful, delete wallet
              WalletPersistence.walletManager.removeWallet(WalletPersistence.walletManager.activeWallet.id);

              await WalletInfoModal.showAndBlock({ message: 'Wallet deleted successfully' });
              WalletPageLevelUiStatusLines.updateStatus([`✅ Wallet deleted`]);

              // ── If no wallets left, clear all + notify background to close
              if (WalletPersistence.walletManager.numWallets === 0) {
                WalletAppState.clearAll();
                WalletPersistence.clearAll();

                window.parent.postMessage({
                  from: 'wallet-to-background',
                  type: 'WALLET_CLOSE_ALL'
                }, '*');

                return; // stop further execution
              }

              // show wallet selection panel if wallets remain
              WalletUiPanel.show("SimpleWebPageCryptoWallet-new-or-select.html");

            } catch (err) {
              WalletInfoModal.show({
                message: `Failed to delete wallet: ${err.message}`,
                details: 'Ensure your password is correct.'
              });
              WalletPageLevelUiStatusLines.updateStatus([`❌ ${err.message}`]);
            }
          };
        }

        // show the panel
        WalletUiPanel.show('activeWalletEditPanel');
      };
    }
  },


  showWhichPanel() {
    if (WalletAppState.password === null) {
      WalletUiPanel.show("mainPasswordPanel");
    } else {
      WalletCryptoList.prepAndShowDigitalAssetsListPanel();
    }
  },
};

(document.readyState === 'loading'
  ? document.addEventListener.bind(document, 'DOMContentLoaded')
  : fn => fn()
)(() => {

  (async () => {

    try {

      await WalletUiPagesInit.initializeWebPage();

      SimpleWebPageCryptoWalletMain.showActiveWalletName();

      await WalletParentComms.obtainUserEnteredPasswordFromParentIframeIfThereIsOne();

      SimpleWebPageCryptoWalletMain.showWhichPanel();

      //if "loggedin" (authenticated), show the hamburger Menu
      WalletPageLevelUI.updatePageLevelUI(WalletAppState.password !== null);


    } catch (err) {
      WalletInfoModal.show({
        message: `Wallet not launched correctly, OR Proxy shutdown: ${err}`,
        details: 'Use official launcher to open wallet, or re-try.',
        redirectTo: 'SimpleWebPageCryptoWallet-app-closed.html'
      });
    }



    // notify extension/background that wallet is fully ready
    window.parent.postMessage({
      from: 'wallet',
      type: 'REGISTER',
      href: window.location.href,
      origin: window.location.origin
    }, '*');


    WalletPageLevelUI.startPossibleMissingExtensionTimer();

    // ─── Added: log any incoming postMessage and forward to dapp handler ───
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg) return;

      console.log('[WALLET MAIN PAGE] postMessage received:', msg);

      // 🚫 prevent echo: wallet messages coming BACK from parent
      if (event.source === window.parent && msg.from === 'wallet') {
        return;
      }

      // ✅ wallet → dapp responses go UP to parent (iframe shell / extension)
      if (msg.from === 'wallet' && msg.to === 'dapp') {
        console.log('[WALLET MAIN PAGE] going to postMessage UP to Parent iframe shell:', msg);
        window.parent.postMessage(msg, '*');
        return;
      }

      // dapp → wallet messages handled locally
      if (window.walletHandleDappMessage) {
        console.log('[WALLET MAIN PAGE] going to window.walletHandleDappMessage():', msg);
        window.walletHandleDappMessage(msg);
      }
    });

    //console.log('Completed execution of IIFE in Main Page');

  })(); // end async IIFE

});
