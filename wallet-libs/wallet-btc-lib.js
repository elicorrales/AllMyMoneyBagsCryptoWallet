// wallet-btc-lib.js
const WalletBtcLib = (function () {
  let HDNode, Buffer, bitcoinjs;
  let _initialized = false;

  function ready() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.IanBip39Lib &&
            window.IanBip39Lib.Buffer &&
            window.IanBip39Lib.HDNode &&
            window.IanBip39Lib.bitcoin) {   // <- updated
          Buffer = window.IanBip39Lib.Buffer;
          HDNode = window.IanBip39Lib.HDNode;
          bitcoinjs = window.IanBip39Lib.bitcoin; // <- updated
          // DEV sanity check: make sure payments.p2pkh exists
          if (!bitcoinjs.payments?.p2pkh) {
            console.warn("⚠️ bitcoinjs.payments.p2pkh not found. You may need to polyfill it.");
          }
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  async function getAddressFromSeedHex(seedHex, derivePath, networkStr) {
    await ready();
    const path = derivePath;

    const network = networkStr === 'testnet' ? bitcoinjs.networks.testnet : bitcoinjs.networks.bitcoin;

    const seedBuffer = Buffer.from(seedHex, "hex");
    const root = HDNode.fromSeedBuffer(seedBuffer);
    const child = root.derivePath(path);
    const keyPair = child.keyPair;

    // P2PKH address using the polyfill payments
    return bitcoinjs.payments.p2pkh({ pubkey: keyPair.Q.getEncoded(), network }).address;
  }

  async function signTransaction(transaction) {
    await ready();
    const { seedHex, derivePath: pathOverride, inputs, outputs, network } = transaction;

    if (!Array.isArray(inputs) || inputs.length === 0) {
      throw new Error("Bitcoin transaction requires at least one input");
    }
    if (!Array.isArray(outputs) || outputs.length === 0) {
      throw new Error("Bitcoin transaction requires at least one output");
    }

    const path = pathOverride || derivePath;
    const seedBuffer = Buffer.from(seedHex, "hex");
    const root = HDNode.fromSeedBuffer(seedBuffer);
    const child = root.derivePath(path);
    const keyPair = child.keyPair;

    const btcNetwork = network === 'testnet' ? bitcoinjs.networks.testnet : bitcoinjs.networks.bitcoin;
    const txb = new bitcoinjs.TransactionBuilder(btcNetwork);

    inputs.forEach((input) => {
      if (input.scriptPubKey) {
        txb.addInput(input.txid, input.vout, null, Buffer.from(input.scriptPubKey, 'hex'));
      } else {
        txb.addInput(input.txid, input.vout);
      }
    });

    outputs.forEach((output) => {
      //const script = bitcoinjs.address.toOutputScript(output.address, btcNetwork);
      //const script = bitcoinjs.payments.p2pkh({ address: output.address, network: btcNetwork }).output;
      const { output: script } = bitcoinjs.payments.p2pkh({ pubkey: keyPair.getPublicKeyBuffer(), network: btcNetwork });
      txb.addOutput(script, Number(output.amount));
    });

    inputs.forEach((input, i) => txb.sign(i, keyPair));

    const tx = txb.build();
    return tx.toHex();
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
    //derivePath,
    getAddressFromSeedHex,
    signTransaction
  };
})();

window.WalletBtcLib = WalletBtcLib;

