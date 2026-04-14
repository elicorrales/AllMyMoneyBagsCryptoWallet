//SimpleWebPageCryptoWallet-intro.js

const SimpleWebPageCryptoWalletIntro = {

  async obtainUserEnteredPasswordFromParentIframeIfThereIsOne() {

    // if we already have the password, no need to do this?
    if (WalletAppState.password !== null) { return; }

    try {
      // wait up to 2 seconds for secret ack
      const timeout = 2000;
      const interval = 50;
      let waited = 0;

      while (!WalletParentComms.secretIsAcked() && waited < timeout) {
        await new Promise(r => setTimeout(r, interval));
        waited += interval;
      }

      if (!WalletParentComms.secretIsAcked()) {
        throw new Error('Parent-child secret exchange failed');
      }

      await WalletParentComms.requestPasswordFromParent();

    } catch (err) {
      console.warn('Could not obtain password from parent iframe:', err);
      WalletInfoModal.show({
        message: `Wallet not launched correctly, OR Proxy shutdown: ${err}`,
        details: 'Use official launcher to open wallet, or re-try.',
        redirectTo: 'SimpleWebPageCryptoWallet-app-closed.html'
      });
    }
  },

  removeAnyStaleInprogressWalletBeforeAllowingPanel() {
    //------------------------------------------------------
    // may need to clear stale inprogress wallet before moving on.
    //------------------------------------------------------
    const inprogress = WalletPersistence.walletManager.inprogress;
    if (inprogress.wallet !== null) {
      const message = "A previous Wallet Creation or Import was not Completed";
      const details = `Wallet name: [${inprogress.name}] will be deleted. You need to start over.`;
      WalletInfoModal.show({
        message: message,
        details: details,
        onClose: WalletPersistence.walletManager.clearInprogressWallet
      });
    }
  },

  whichPanelToShow() {
    const disclaimer = WalletPersistence.disclaimerAccepted;
    if (disclaimer) {
      if (WalletAppState.password === null) {
        WalletUiPanel.show('passwordSetupPanel');
      } else {
        //supposedly, we have the password, move to next panel
        WalletUiPanel.show("walletChoicePanel");
      }
    } else {
      // Disclaimer not accepted
      WalletUiPanel.show('disclaimer');
    }
  }

};

(document.readyState === 'loading'
  ? document.addEventListener.bind(document, 'DOMContentLoaded')
  : fn => fn()
)(() => {


  (async () => {

    try {

      await WalletUiPagesInit.initializeWebPage();

      SimpleWebPageCryptoWalletIntro.removeAnyStaleInprogressWalletBeforeAllowingPanel();

      //for intro page, does not matter which panel is showing at the moment, back arrow
      //should only go back to the beginning page.
      WalletPageLevelUiBackArrow.showBackArrow({show:"SimpleWebPageCryptoWallet-new-or-select.html"});

      await SimpleWebPageCryptoWalletIntro.obtainUserEnteredPasswordFromParentIframeIfThereIsOne();

      SimpleWebPageCryptoWalletIntro.whichPanelToShow();

      //if "loggedin" (authenticated), show the hamburger Menu
      WalletPageLevelUI.updatePageLevelUI(WalletAppState.password !== null);


    } catch (err) {
      WalletInfoModal.show({
        message: `Wallet not launched correctly, OR Proxy shutdown: ${err}`,
        details: 'Use official launcher to open wallet, or re-try.',
        redirectTo: 'SimpleWebPageCryptoWallet-app-closed.html'
      });
    }

    //console.log('Completed execution of IIFE in Intro Page');

  })(); // end async IIFE

});
