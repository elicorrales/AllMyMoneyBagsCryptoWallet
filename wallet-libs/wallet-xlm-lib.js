// wallet-xlm-lib.js
const WalletXlmLib = (function () {
  let Buffer, stellarUtil;
  let _initialized = false;

  function ready() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.IanBip39Lib &&
          window.IanBip39Lib.Buffer &&
          window.IanBip39Lib.stellarUtil &&
          typeof window.IanBip39Lib.stellarUtil.getKeypair === "function" &&
          window.StellarSdk) {
          Buffer = window.IanBip39Lib.Buffer;
          stellarUtil = window.IanBip39Lib.stellarUtil;
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  ////////////////////////////////////////////////////////////////////
  // NOTE!: this public function is called dynamically by
  // wallet-multi-network-utils.js, and expects all children to have
  // the same function name.
  ////////////////////////////////////////////////////////////////////
  async function getAddressFromSeedHex(seedHex, derivePath) {
    await ready();

    const seedBuffer = Buffer.from(seedHex, "hex");

    const keypair = stellarUtil.getKeypair(derivePath, seedBuffer);

    return keypair.publicKey();
  }

  async function signTransaction(transaction) {
    await ready();
    const { seedHex, derivePath, fromAddress, toAddress, amount, provider, destAddressExists } = transaction;
    let sequence = transaction.sequence;

    const seedBuffer = Buffer.from(seedHex, "hex");
    const keypair = stellarUtil.getKeypair(derivePath, seedBuffer);

    if (keypair.publicKey() !== fromAddress) {
      throw new Error("Derived public key does not match fromAddress");
    }

    const sourceAccount = {
      accountId: () => fromAddress,
      sequenceNumber: () => sequence.toString(),
      incrementSequenceNumber: () => { sequence++; }
    };

    const feeStroops = Math.floor(parseFloat(transaction.fee || "0.00001") * 1e7).toString();
    const passphrase = (provider?.network?.toLowerCase() === "testnet")
      ? window.StellarSdk.Networks.TESTNET
      : window.StellarSdk.Networks.PUBLIC;

    const builder = new window.StellarSdk.TransactionBuilder(sourceAccount, {
      fee: feeStroops,
      networkPassphrase: passphrase,
    });

    if (!destAddressExists) {
      builder.addOperation(window.StellarSdk.Operation.createAccount({
        destination: toAddress,
        startingBalance: amount.toString()
      }));
    } else {
      builder.addOperation(window.StellarSdk.Operation.payment({
        destination: toAddress,
        asset: window.StellarSdk.Asset.native(),
        amount: amount.toString()
      }));
    }

    const tx = builder.setTimeout(30).build();
    tx.sign(keypair);
    return tx.toXDR();
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
    getAddressFromSeedHex,
    signTransaction
  };
})();

window.WalletXlmLib = WalletXlmLib;

