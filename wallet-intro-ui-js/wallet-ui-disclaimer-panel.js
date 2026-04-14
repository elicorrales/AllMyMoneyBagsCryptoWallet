// wallet-ui-disclaimer-panel.js

//document.addEventListener('DOMContentLoaded', () => {
(document.readyState === 'loading' ? document.addEventListener.bind(document, 'DOMContentLoaded') : fn => fn())(() => {

  const checkbox = document.getElementById('disclaimerAgreeCheckbox');
  const continueBtn = document.getElementById('disclaimerContinueBtn');

  if (checkbox && continueBtn) {
    checkbox.addEventListener('change', () => {
      continueBtn.disabled = !checkbox.checked;
    });

    continueBtn.addEventListener('click', () => {
      WalletUiPanel.show('passwordSetup');
      WalletPersistence.disclaimerAccepted = 1;
    });

    // Set initial button state
    continueBtn.disabled = !checkbox.checked;
  }
});

