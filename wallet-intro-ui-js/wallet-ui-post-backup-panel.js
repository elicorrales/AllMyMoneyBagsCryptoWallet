// wallet-ui-post-backup-panel.js

/**
 * Opens a new tab with the main wallet page.
 */
function openMainPanelTab() {
  WalletPersistence.argon2SliderLevelIsSet = true;
  WalletUiPanel.show('SimpleWebPageCryptoWallet-main.html');
}

// New function: update post-backup progress list
function updatePostBackupProgress(steps) {
  const progressDiv = document.getElementById('postBackupVerifyProgress');
  if (!progressDiv) return;

  progressDiv.innerHTML = ''; // clear old

  steps.forEach(({ index, success, message }) => {
    const step = document.createElement('div');
    step.textContent = `${success ? '✅' : '❌'} ${message}`;
    step.style.color = success ? 'green' : 'red';
    step.id = `postBackup-step-${index}`;
    progressDiv.appendChild(step);
  });
}

window.updatePostBackupProgress = updatePostBackupProgress;

// Attach event listener to “Continue to Wallet” button
const doneBtn = document.getElementById('doneBtn');
if (doneBtn) {
  doneBtn.addEventListener('click', openMainPanelTab);
}

// Enable “Continue to Wallet” only when all three post‐backup checkboxes are checked
(function() {
  const chkSave       = document.getElementById('chkSavePasswordCheckbox');
  const chkCopies     = document.getElementById('chkMakeCopiesCheckbox');
  const chkUnderstand = document.getElementById('chkUnderstandLossCheckbox');

  function toggleDoneButton() {
    const allChecked = chkSave.checked && chkCopies.checked && chkUnderstand.checked;
    doneBtn.disabled = !allChecked;
    WalletPersistence.walletManager.inprogress.ackedPostBackup = allChecked ? true : null;
  }

  [chkSave, chkCopies, chkUnderstand].forEach(chk => chk.addEventListener('change', toggleDoneButton));

})();

