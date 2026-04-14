//SimpleWebPageCryptoWallet-new-or-select.js

const SimpleWebPageCryptoWalletNewOrSelect = {

  async handlePasswordPanel() {

    await WalletParentComms.obtainUserEnteredPasswordFromParentIframeIfThereIsOne();

    if (WalletPersistence.walletManager.numWallets > 0 && !WalletAppState.password) {
      WalletUiPanel.show("newSelectPasswordPanel");
      const panelToShowIfAuthenticated = "chooseCreateOrSelectWalletActionPanel";
      WalletNewSelectPasswordPanel.setupToAuthenticateUser(panelToShowIfAuthenticated);
      return;
    }

    // no need for auth password panel, we can go directly to new or select panel
    // because there have been no users/no wallets, or all reset, OR user already ENTERED password.
    WalletUiPanel.show("chooseCreateOrSelectWalletActionPanel");

  },

  renderWalletList() {
    const container = document.getElementById('walletListContainer');
    container.innerHTML = ''; // clear previous

    const walletsObj = WalletPersistence.walletManager.getAllWallets();
    const wallets = Object.values(walletsObj);

    if (!wallets.length) {
      container.textContent = 'No wallets found.';
      return;
    }

    wallets.forEach((wallet, index) => {
      const row = document.createElement('div');
      row.className = 'wallet-row';

      const numberSpan = document.createElement('span');
      numberSpan.className = 'wallet-number';
      numberSpan.textContent = `${index + 1}`;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'wallet-name';
      nameSpan.textContent = wallet.name;

      row.appendChild(numberSpan);
      row.appendChild(nameSpan);

      row.addEventListener('click', () => {
        WalletPersistence.walletManager.activeWallet.setActiveWalletId(wallet.id);
        WalletUiPanel.show('SimpleWebPageCryptoWallet-main.html');
      });

      container.appendChild(row);
    });
  },

  setupSimpleWalletNewOrSelectPageButtons() {

    console.log('New/Select page - setup buttons');

    const useActiveWalletBtn = document.getElementById('useActiveWalletBtn');
    const createOrImportBtn = document.getElementById('createOrImportBtn');
    const selectWalletBtn = document.getElementById('selectWalletBtn');

    //not showing this yet. jsut setting up the buttons.
    //first, the user may have to be authenticated.
    //WalletUiPanel.show('chooseCreateOrSelectWalletActionPanel');

    // Disable selectWalletBtn if no wallets exist
    if (WalletPersistence.walletManager.numWallets === 0) {
      useActiveWalletBtn.disabled = true;
      useActiveWalletBtn.style.opacity = '0.5';
      selectWalletBtn.disabled = true;
      selectWalletBtn.style.opacity = '0.5';
    } else {
      useActiveWalletBtn.disabled = false;
      useActiveWalletBtn.style.opacity = '1';
      selectWalletBtn.disabled = false;
      selectWalletBtn.style.opacity = '1';
    }

    const activeWalletName = WalletPersistence.walletManager.activeWallet.name;

    if (activeWalletName) {
      useActiveWalletBtn.textContent = `Use Wallet [${activeWalletName}]`;
      useActiveWalletBtn.style.display = 'inline-block';
      useActiveWalletBtn.disabled = false;
      useActiveWalletBtn.style.opacity = '1';
    } else {
      useActiveWalletBtn.style.display = 'none';
    }

    useActiveWalletBtn.addEventListener('click', () => {
      WalletUiPanel.show('SimpleWebPageCryptoWallet-main.html');
    });

    createOrImportBtn.addEventListener('click', () => {
      WalletUiPanel.show('SimpleWebPageCryptoWallet-intro.html');
    });

    selectWalletBtn.addEventListener('click', () => {
      WalletUiPanel.show('selectActiveWalletPanel');
      SimpleWebPageCryptoWalletNewOrSelect.renderWalletList();
      WalletPageLevelUiBackArrow.showBackArrow({ show:'chooseCreateOrSelectWalletActionPanel'});
    });
  },


};

(document.readyState === 'loading'
  ? document.addEventListener.bind(document, 'DOMContentLoaded')
  : fn => fn()
)(() => {

  (async () => {

    try {

      await WalletUiPagesInit.initializeWebPage();

      await SimpleWebPageCryptoWalletNewOrSelect.handlePasswordPanel();//should not get past here if unauth

      SimpleWebPageCryptoWalletNewOrSelect.setupSimpleWalletNewOrSelectPageButtons();

      //if "loggedin" (authenticated), show the hamburger Menu
      WalletPageLevelUI.updatePageLevelUI(WalletAppState.password !== null);

    } catch (err) {
      WalletInfoModal.show({
        message: `User Unknown, Wallet not launched correctly, OR Proxy shutdown: ${err}`,
        details: 'Use official launcher to open wallet, or re-try.',
        redirectTo: 'SimpleWebPageCryptoWallet-app-closed.html'
      });
    }

    //console.log('Completed execution of IIFE in New or Select  Page');

  })(); // end async IIFE

});
