// wallet-ui-wallet-choice-panel.js

//document.addEventListener('DOMContentLoaded', () => {
(document.readyState === 'loading' ? document.addEventListener.bind(document, 'DOMContentLoaded') : fn => fn())(() => {
  const willSavePasswordCheckbox = document.getElementById('willSavePasswordCheckbox');
  const willMakeCopiesCheckbox = document.getElementById('willMakeCopiesCheckbox');
  const willUnderstandLossCheckbox = document.getElementById('willUnderstandLossCheckbox');
  const createWalletBtn = document.getElementById('createWalletBtn');
  const goToImportWalletBtn = document.getElementById('goToImportWalletBtn');
  const doImportWalletBtn = document.getElementById('doImportWalletBtn');
  const importMnemonicInput = document.getElementById('importMnemonicInput');
  const walletNameInput = document.getElementById('walletNameInput');
  const walletNameMessage = document.getElementById('walletNameMessage');

  // Ensure all elements exist
  if (!willSavePasswordCheckbox || !willMakeCopiesCheckbox || !willUnderstandLossCheckbox ||
    !createWalletBtn || !doImportWalletBtn || !importMnemonicInput || !goToImportWalletBtn ||
    !walletNameInput || !walletNameMessage) return;

  let overrideCheckboxes = false;

  // Hide checkbox panel if there is already at least one wallet
  if (WalletPersistence.walletManager.numWallets > 0) {
    const container = document.getElementById('checkboxContainer');
    if (container) container.style.display = 'none';
    // Auto-enable create/import buttons since checkboxes are hidden
    overrideCheckboxes = true;
  }

  function validateWalletName(name) {
    // allow a-z, A-Z, 0-9, spaces, dashes; minimum 8 characters
    if (!name) return { valid: false, message: 'Wallet name is required' };
    if (name.length < 8) return { valid: false, message: 'Wallet name must be at least 8 characters' };
    if (!/^[a-zA-Z0-9\s-]+$/.test(name)) return { valid: false, message: 'Only letters, numbers, spaces and dashes allowed' };
    if (!WalletPersistence.walletManager.isWalletUnique(name))
      return { valid: false, message: 'A Wallet Already Exists By That Name' };

    return { valid: true, message: '' };
  }

  async function updateButtonState() {
    const allChecked = overrideCheckboxes || (willSavePasswordCheckbox.checked &&
      willMakeCopiesCheckbox.checked &&
      willUnderstandLossCheckbox.checked);

    const { valid, message } = validateWalletName(walletNameInput.value.trim());

    if (!valid) {
      walletNameMessage.textContent = message;
    } else {
      walletNameMessage.textContent = '';
    }

    const enable = allChecked && valid;
    createWalletBtn.disabled = !enable;
    goToImportWalletBtn.disabled = !enable;
  }

  willSavePasswordCheckbox.addEventListener('change', updateButtonState);
  willMakeCopiesCheckbox.addEventListener('change', updateButtonState);
  willUnderstandLossCheckbox.addEventListener('change', updateButtonState);
  walletNameInput.addEventListener('input', updateButtonState);

  // Always enable Import Wallet button only when checkboxes & valid name met
  doImportWalletBtn.disabled = false;

  async function createZipWithSeed(seedWords, password) {
    // Give browser a chance to paint the modal/spinner
    await new Promise(r => requestAnimationFrame(r));

    const mnemonicStr = seedWords.join(' ');

    const blobWriter = new zip.BlobWriter("application/zip");
    const zipWriter = new zip.ZipWriter(blobWriter);

    // Add the seed phrase text file
    await zipWriter.add(
      "wallet-seed-phrase.txt",
      new zip.TextReader(mnemonicStr),
      { password: password, encryptionStrength: 3 } // 1 = low, 2 = medium, 3 = high
    );

    // Close the zip and get the blob
    const zipBlob = await zipWriter.close();
    return zipBlob;
  }

  ///////////////////////////////////////////////////////////////////////////////
  // CREATE WALLET
  ///////////////////////////////////////////////////////////////////////////////
  async function eventHandlerCreateWallet() {

    walletNameMessage.textContent = '';
    try {
      await WalletBusyModal.show("Creating your wallet...");

      // Give browser a chance to paint the modal/spinner
      await new Promise(r => requestAnimationFrame(r));

      const walletName = walletNameInput.value.trim();
      const newWallet = WalletPersistence.walletManager.addWallet(walletName);
      // Use WalletCore to generate+encrypt the seed behind the scenes
      // • WalletCore.createSeedBundle() returns { plainText, encryptedB64 }
      // • plainText is "word1 word2 ... word24"
      // • encryptedB64 is the Base64‐encoded encrypted mnemonic
      const password = WalletAppState.password || '';
      // Give browser a chance to paint the modal/spinner
      await new Promise(r => requestAnimationFrame(r));
      const { plainText, encryptedB64 } = await WalletCore.createSeedBundle();
      // Give browser a chance to paint the modal/spinner
      await new Promise(r => requestAnimationFrame(r));
      // Split the plainText into an array so createZipWithSeed can still accept seedWords[]
      const seedWords = plainText.split(' ');

      // Create zip file with seed phrase inside
      const zipBlob = await createZipWithSeed(seedWords, password);

      // Hide busy modal before showing system file dialog
      WalletBusyModal.hide();

      // Trigger download
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${newWallet.id}-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // Store the encrypted seed for verification later; no need to expose raw words again
      newWallet.tempEncryptedMnemonic = encryptedB64;

      // Move to the next panel
      WalletUiPanel.show('verifySeed');
    } catch (err) {
      WalletBusyModal.hide();
      const message = err.message || 'Failed to create wallet';
      walletNameMessage.textContent = message;
      WalletPageLevelUiStatusLines.updateStatus([`❌ ${message}`]);
    }
  }

  ///////////////////////////////////////////////////////////////////////////////
  // IMPORT WALLET
  ///////////////////////////////////////////////////////////////////////////////
  const eventHandlerImportWallet = async () => {
    const password = WalletAppState.password || '';
    walletNameMessage.textContent = '';
    try {
      const textarea = document.getElementById('importMnemonicInput');
      const progress = document.getElementById('importProgress');
      if (!textarea || !progress) return;

      progress.innerHTML = '';

      // VALIDATE WORDS ---------------------------------------------------------
      // Normalize & validate
      const words = WalletCore.normalizeMnemonicInput(textarea.value.toLowerCase());
      const validation = WalletCore.validateMnemonicWords
                      ? WalletCore.validateMnemonicWords(words, bip39Wordlist)
                      : validateMnemonicWords(words, bip39Wordlist);

      if (!validation.ok) {
        progress.innerHTML = `<div style="color:red;">❌ ${validation.error}</div>`;
        return;
      }

      if (words.length !== 12 && words.length !== 24) {
        progress.innerHTML = `<div style="color:red;">❌ Seed must be exactly 12 or 24 words</div>`;
        return;
      }

      const invalidWords = words.filter(word => !bip39Wordlist.includes(word));
      if (invalidWords.length > 0) {
        progress.innerHTML = `<div style="color:red;">❌ Invalid seed</div>`;
        return;
      }

      const input = words.join(' ');



      // Check if this mnemonic already exists
      await WalletBusyModal.show("Checking if Wallet Already Exists...");
      const existingWallet = await WalletPersistence.walletManager.findWalletByMnemonic(words, password);
      await WalletBusyModal.hide();
      if (existingWallet) {
        const  message = `❌ This mnemonic matches an existing wallet: ${existingWallet.name}`;
        console.log(message);
        WalletInfoModal.show({
          message: message,
          details: 'Please use a different mnemonic or recover the existing wallet.',
        });
        WalletPageLevelUiStatusLines.updateStatus([`❌ ${message}`]);
        return; // stop further import
      }

      await WalletBusyModal.show("Importing your wallet...");

      // Give browser a chance to paint the modal/spinner
      await new Promise(r => requestAnimationFrame(r));

      // CREATE INITIAL CRYPTOGRAPHIC SEED--------------------------------------------------
      let seedHex = null;
      try {
        seedHex = WalletMnemonicHandler.getSeedHexFromWords(input);
      } catch(e) {
        WalletBusyModal.hide();
        progress.innerHTML = `<div style="color:red;">❌ Seed derivation failed: ${e.message}</div>`;
        const message = `Seed derivation failed: ${e.message}`;
        console.log(message);
        WalletPageLevelUiStatusLines.updateStatus([`❌ ${message}`]);
        return;
      }

      // ENCRYPT WORDS ---------------------------------------------------------

      const encryptedB64 = await WalletCore.encryptMnemonic(input, password);
      const walletName = walletNameInput.value.trim();
      const newWallet = WalletPersistence.walletManager.addWallet(walletName);
      newWallet.encryptedMnemonic = encryptedB64;

      try {
        const decrypted = await WalletCore.decryptMnemonic(encryptedB64, password);
        if (decrypted !== input) {
          throw new Error('Decryption mismatch');
        }

        progress.innerHTML = `<div style="color:green;">✅ Wallet imported and verified</div>`;

        // Derive addresses from the generated cryptographic imported seed and save the addresses
        try {
          await WalletMultiNetworkUtils.deriveAllWalletNativeAssetsFromSeedHexAndAssetProviders(seedHex, newWallet);
        } catch (err) {
          WalletBusyModal.hide();
          const message = `Error deriving addresses: ${err}`;
          console.error(message);
          progress.innerHTML = `<div style="color:red;">❌ Address derivation failed</div>`;
          WalletPageLevelUiStatusLines.updateStatus([`❌ ${message}`]);
          return;
        }

        try {
          await WalletMultiTokenUtils.deriveAllWalletTokens(newWallet);
        } catch (err) {
          WalletBusyModal.hide();
          const message = `Error deriving tokens: ${err}`;
          console.error(message);
          progress.innerHTML = `<div style="color:red;">❌ Token derivation failed</div>`;
          WalletPageLevelUiStatusLines.updateStatus([`❌ ${message}`]);
          return;
        }

        setTimeout(() => {
          WalletUiPanel.show('postBackupPanel');
        }, 800);
      } catch (err) {
        WalletBusyModal.hide();
        progress.innerHTML = `<div style="color:red;">❌ Invalid seed</div>`;
        WalletPageLevelUiStatusLines.updateStatus(['❌ Invalid seed']);
      }
      WalletBusyModal.hide();

    } catch (err) {
      WalletBusyModal.hide();
      const message = err.message || 'Failed to import wallet';
      walletNameMessage.textContent = message;
      WalletPageLevelUiStatusLines.updateStatus([`❌ ${message} You may have to use back arrow.`]);
    }
  };

  createWalletBtn.addEventListener('click', eventHandlerCreateWallet);
  goToImportWalletBtn.addEventListener('click', () => WalletUiPanel.show('importWallet'));
  doImportWalletBtn.addEventListener('click', eventHandlerImportWallet);
});

