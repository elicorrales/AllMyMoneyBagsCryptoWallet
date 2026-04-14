// wallet-ui-verify-panel.js

//document.addEventListener('DOMContentLoaded', () => {
(document.readyState === 'loading' ? document.addEventListener.bind(document, 'DOMContentLoaded') : fn => fn())(() => {

  // Clear generated seed from memory if present
  delete WalletAppState.generatedSeed;

  const textarea = document.getElementById('verifyMnemonicInput');
  const verifyBtn = document.getElementById('verifySeedBtn');

  // Get or create progress container just once
  let progressDiv = document.getElementById('verifyProgress');
  if (!progressDiv) {
    progressDiv = document.createElement('div');
    progressDiv.id = 'verifyProgress';
    verifyBtn.insertAdjacentElement('afterend', progressDiv);
    progressDiv.style.marginTop = '0.5em';
    progressDiv.style.fontFamily = 'monospace';
  }

  if (!textarea || !verifyBtn) return;

  // Store progress steps here
  const progressSteps = [];

  // Helper to show a simple progress line and save step
  async function updateStep(index, success, message) {
    await new Promise(r => requestAnimationFrame(r));

    const stepId = `verify-step-${index}`;
    let step = document.getElementById(stepId);
    if (!step) {
      step = document.createElement('div');
      step.id = stepId;
      progressDiv.appendChild(step);
    }
    const icon = success ? '✅' : '❌';
    step.textContent = `${icon} ${message}`;
    step.style.color = success ? 'green' : 'red';

    // Save step for post-backup panel
    progressSteps[index] = { index, success, message };
  }

  function showError(msg) {
    const errorDiv = document.getElementById('verifySeedError');
    if (errorDiv) errorDiv.textContent = msg;
  }

  ///////////////////////////////////////////////////////////////////////////////
  // VERIFY SEED
  ///////////////////////////////////////////////////////////////////////////////
  async function eventHandlerVerifySeed() {
    await WalletBusyModal.show('Verifying Seed Phrase..Please Wait...');
    // Give browser a chance to paint the modal/spinner
    await new Promise(r => requestAnimationFrame(r));

    try {
      // Clear any prior messages and saved steps
      progressDiv.innerHTML = '';
      progressSteps.length = 0;
      showError('');

      // Normalize & validate
      const words = WalletCore.normalizeMnemonicInput(textarea.value);
      const validation = WalletCore.validateMnemonicWords
        ? WalletCore.validateMnemonicWords(words, bip39Wordlist)
        : validateMnemonicWords(words, bip39Wordlist);

      await new Promise(r => requestAnimationFrame(r));

      if (!validation.ok) {
        showError(`❌ ${validation.error}`);
        return;
      }

      if (words.length !== 24) {
        showError('❌ Seed must be exactly 24 words');
        return;
      }

      const mnemonicString = words.join(' ');

      await new Promise(r => requestAnimationFrame(r));

      // 2) Quick check: all words present in BIP-39 list?
      const invalidWords = words.filter(w => !bip39Wordlist.includes(w));
      if (invalidWords.length) {
        showError('❌ Invalid seed phrase');
        return;
      }

      const password = WalletAppState.password;
      if (!password) {
        showError('❌ Invalid seed phrase');
        return;
      }

      let matched = false;
      try {
        matched = await WalletCore.verifyEncryptedSeed(password, words);
      } catch { }
      if (!matched) {
        showError('❌ Invalid seed phrase');
        return;
      }

      // (a) Show that seed matches expected
      updateStep(0, true, 'Seed words match expected');

      // (b) Check that encrypted mnemonic exists
      const encrypted = WalletPersistence.walletManager.inprogress.tempEncryptedMnemonic;
      if (!encrypted) {
        updateStep(1, false, 'Mnemonic encrypted (earlier)');
        showError('❌ No encrypted mnemonic found');
        return;
      }
      updateStep(1, true, 'Mnemonic encrypted (earlier)');

      // (c) Confirm that decryption returns the same 24 words
      try {
        const decrypted = await WalletCore.decryptMnemonic(encrypted, password);
        const success = decrypted === mnemonicString;
        updateStep(2, success, 'Stored mnemonic decrypted correctly');
        if (!success) {
          showError('❌ Decryption mismatch');
          return;
        }
        WalletPersistence.walletManager.inprogress.encryptedMnemonic = encrypted;
        WalletPersistence.walletManager.inprogress.tempEncryptedMnemonic = null;

      } catch (err) {
        updateStep(2, false, 'Stored mnemonic decryption failed');
        showError('❌ Decryption failed');
        return;
      }

///////////////////////////
//IF ERRORS, I COMMENTED THIS OUT
//    WalletAppState.userProvidedSeed = words;
///////////////////////////

      // CREATE INITIAL CRYPTOGRAPHIC SEED--------------------------------------------------
      let seedHex = null;
      try {
        seedHex = WalletMnemonicHandler.getSeedHexFromWords(mnemonicString);
      } catch (e) {
        progressDiv.innerHTML = `<div style="color:red;">❌ Seed derivation failed: ${e.message}</div>`;
        console.log(`Seed derivation failed: ${e.message}`);
        return;
      }

      // 🎯 Derive addresses now, like import flow -----------------------------
      try {
        await WalletMultiNetworkUtils.deriveAllWalletNativeAssetsFromSeedHexAndAssetProviders(seedHex, WalletPersistence.walletManager.inprogress);
        updateStep(3, true, 'Addresses derived successfully');
      } catch (err) {
        console.error('Error deriving addresses:', err);
        updateStep(3, false, 'Address derivation failed');
        showError('❌ Address derivation failed');
        return;
      }

      try {
        await WalletMultiTokenUtils.deriveAllWalletTokens(WalletPersistence.walletManager.inprogress);
      } catch (err) {
        console.error('Error deriving tokens:', err);
        updateStep(4, false, 'Token derivation failed');
        showError('❌ Token derivation failed');
        return;
      }

      // Pass progress steps array to post-backup panel before switching
      if (window.updatePostBackupProgress) {
        window.updatePostBackupProgress(progressSteps);
      }

      // 🎯 Now go to post‐backup panel
      WalletUiPanel.show('postBackupPanel');

    } finally {
      WalletBusyModal.hide();
    }

  }

  // Requirement 1: Enable button at all times, no real-time disabling
  verifyBtn.disabled = false;

  // Requirement 2: Remove real-time checks completely—no textarea listener

  verifyBtn.addEventListener('click', () => {
    eventHandlerVerifySeed();
  });

});

