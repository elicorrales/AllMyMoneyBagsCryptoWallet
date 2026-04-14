//SimpleWebPageCryptoWallet-loggedoff.js

const SimpleWebPageCryptoWalletLoggedoff = {

async establishPossibleKeyDerivationTimes() {

  if (globalThis.SKIP_ARGON2_ESTIMATES_FOR_DEBUG === true) { return; }

  //if user has created or imported a wallet, this level is already
  //set; no need to do again.
  if (WalletPersistence.argon2SliderLevelIsSet) { return; }

  const NUM_TEST_RUNS = 3;

  const delays = [];

  for (let countdown = NUM_TEST_RUNS; countdown >= 1; countdown--) {
    const index = NUM_TEST_RUNS - countdown; // gives 0,1,2,3 while showing 4,3,2,1

    await WalletBusyModal.show(`All My Money Bags Is Starting in ${countdown}...`);

    const delay = await WalletCore.estimateArgon2Delay(index);
    delays[index] = delay;

    await WalletBusyModal.hide();
  }

  WalletCore.extrapolateArgon2Delays(delays);

  WalletPersistence.estimatedArgon2Delays = delays;

  await WalletBusyModal.hide();
},



  showReasonMessage() {
    // This could eventually come from query params, WalletPersistence, or app state
    const reason = WalletPersistence.loggedOffReason || "timeout";

    const reasonMap = {
      timeout: document.getElementById("reasonTimeout"),
      error: document.getElementById("reasonError"),
    };

    if (reasonMap[reason]) {
      reasonMap[reason].style.display = "block";
    }
  },

  populateResetItems() {
    const resetItemsList = document.getElementById("resetItemsList");
    resetItemsList.innerHTML = "";

    let parsed = null;
    try {
      parsed = JSON.parse(WalletPersistence.loggedOffDump || "{}");
    } catch (_) {}

    const allKeys = [
      ...(parsed?.stateKeys || []).map(k => `Memory: ${k}`),
      ...(parsed?.storageKeys || []).map(k => `Storage: ${k}`)
    ];

    const fallback = ["Nothing — no data to show."];

    for (const item of allKeys.length ? allKeys : fallback) {
      const div = document.createElement("div");
      div.className = "modal-item";

      const icon = document.createElement("span");
      icon.textContent = "🗂️";
      icon.style.marginRight = "0.5em";

      const text = document.createElement("span");
      text.textContent = item;

      div.appendChild(icon);
      div.appendChild(text);
      resetItemsList.appendChild(div);
    }
  },

  setupOpenSimpleWalletApplicationButton() {
    console.log('LoggedOff page - setup Start Button');
    const btn = document.getElementById("startWalletBtn");
    btn.addEventListener("click", async () => {
      WalletUiPanel.show("SimpleWebPageCryptoWallet-new-or-select.html");
    });
  }
};

(document.readyState === 'loading'
  ? document.addEventListener.bind(document, 'DOMContentLoaded')
  : fn => fn()
)(() => {

  (async () => {

    try {

      //this has to be first because it obtains secret handed by life-cycle manager,
      //who will remove as soon as proxy and broswer are up
      await WalletUiPagesInit.initializeWebPage();

      await SimpleWebPageCryptoWalletLoggedoff.establishPossibleKeyDerivationTimes();

      SimpleWebPageCryptoWalletLoggedoff.setupOpenSimpleWalletApplicationButton();

      //if "loggedin" (authenticated), show the hamburger Menu
      WalletPageLevelUI.updatePageLevelUI(WalletAppState.password !== null);


    } catch (err) {
      WalletInfoModal.show({
        message: `Wallet not launched correctly, OR Proxy shutdown: ${err}`,
        details: 'Use official launcher to open wallet, or re-try.',
        redirectTo: 'SimpleWebPageCryptoWallet-app-closed.html'
      });
    }

    //console.log('Completed execution of IIFE in Logged Off Page');

  })(); // end async IIFE

});
