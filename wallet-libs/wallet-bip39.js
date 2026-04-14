// wallet-libs/wallet-bip39.js
;(function (global) {
  const PBKDF2_ROUNDS = 2048;
  const hmacSHA512 = function(key) {
    return new sjcl.misc.hmac(key, sjcl.hash.sha512);
  };
  const WalletBip39 = global.WalletBip39 = global.WalletBip39 || {};

  WalletBip39.mnemonicToSeed = function (mnemonic, passphrase) {
    passphrase = passphrase || '';
    // Collapse whitespace
    mnemonic = mnemonic.trim().split(/\s+/g).join(' ');

    const mNorm = sjcl.codec.utf8String.toBits(mnemonic.normalize('NFKD'));
    const pNorm = sjcl.codec.utf8String.toBits(('mnemonic' + passphrase).normalize('NFKD'));

    const seedBits = sjcl.misc.pbkdf2(mNorm, pNorm, PBKDF2_ROUNDS, 512, hmacSHA512);
    return sjcl.codec.hex.fromBits(seedBits);
  };

})(this);
