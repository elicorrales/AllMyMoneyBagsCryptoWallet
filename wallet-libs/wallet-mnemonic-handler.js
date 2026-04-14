const WalletMnemonicHandler = (() => {
  let _initialized = false;

  function getSeedHexFromWords(mnemonic) {
    if (!WalletBip39 || !WalletBip39.mnemonicToSeed) {
      throw new Error('WalletBip39.mnemonicToSeed is not available');
    }
    return WalletBip39.mnemonicToSeed(mnemonic, '');
  }

  async function getSeedHexFromStoredEncryptedMnemonic(password) {
    const encrypted = WalletPersistence.walletManager.activeWallet.encryptedMnemonic;
    if (!encrypted) throw new Error('No mnemonic found in storage');

    const decrypted = await WalletCore.decryptMnemonic(encrypted, password);
    if (!decrypted) throw new Error('Decryption failed');

    return getSeedHexFromWords(decrypted);
  }

  function initOnceDomReady() {
    if (_initialized) return;
    _initialized = true;
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
    getSeedHexFromWords,
    getSeedHexFromStoredEncryptedMnemonic
  };
})();

