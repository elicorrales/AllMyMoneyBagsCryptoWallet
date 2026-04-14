// wallet-xrp-lib.js
const WalletXrpLib = (function () {
  let HDNode, Buffer, basex;

  function ready() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.IanBip39Lib &&
          window.IanBip39Lib.HDNode && window.IanBip39Lib.Buffer &&
          window.IanBip39Lib.basex) {
          HDNode = window.IanBip39Lib.HDNode;
          Buffer = window.IanBip39Lib.Buffer;
          basex = window.IanBip39Lib.basex;
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  ////////////////////////////////////////////////////////////
  // Returns: Base58Check-encoded XRP address (r... format)
  // Derived from compressed public key
  // Used to send/receive XRP
  ////////////////////////////////////////////////////////////
  async function getAddressFromSeedHex(seedHex, derivePath) {
    await ready();
    const seedBuffer = Buffer.from(seedHex, "hex");
    const masterNode = HDNode.fromSeedBuffer(seedBuffer);
    const derived = masterNode.derivePath(derivePath);
    const rawAddress = derived.getAddress().toString();
    return convertRippleAdrr(rawAddress);

  }

  ////////////////////////////////////////////////////////////
  // Returns: Raw private key as hex (64 chars)
  // Used to sign transactions
  ////////////////////////////////////////////////////////////
  async function getPrivateKeyFromSeedHex(seedHex, derivePath) {
    await ready();
    const seedBuffer = Buffer.from(seedHex, "hex");
    const masterNode = HDNode.fromSeedBuffer(seedBuffer);
    const derived = masterNode.derivePath(derivePath);
    return derived.keyPair.d.toBuffer(32).toString("hex");
  }

  ////////////////////////////////////////////////////////////
  // Returns: Compressed public key (33 bytes, hex)
  // Used in XRP signing (SigningPubKey field)
  ////////////////////////////////////////////////////////////
  async function getPublicKeyCompressedFromSeedHex(seedHex, derivePath) {
    await ready();
    const seedBuffer = Buffer.from(seedHex, "hex");
    const masterNode = HDNode.fromSeedBuffer(seedBuffer);
    const derived = masterNode.derivePath(derivePath);
    const pubKeyBuffer = derived.keyPair.getPublicKeyBuffer();
    return Buffer.from(pubKeyBuffer).toString("hex");
  }

  ////////////////////////////////////////////////////////////
  //Returns: Uncompressed public key (65 bytes, hex)
  //Useful for debugging / tool comparison (like Ian Coleman)
  ////////////////////////////////////////////////////////////
  async function getPublicKeyUncompressedFromSeedHex(seedHex, derivePath) {
    await ready();
    const seedBuffer = Buffer.from(seedHex, "hex");
    const masterNode = HDNode.fromSeedBuffer(seedBuffer);
    const derived = masterNode.derivePath(derivePath);
    const compressedPubKey = derived.keyPair.getPublicKeyBuffer();
    const uncompressedPubKey = window.IanBip39Lib.ethUtil.secp256k1.publicKeyConvert(compressedPubKey, false);
    return Buffer.from(uncompressedPubKey).toString("hex");
  }




  function convertRippleAdrr(address) {
    const b58 = basex("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
    const ripple58 = basex("rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz");
    return ripple58.encode(b58.decode(address));
  }

/*
  function convertRipplePriv(priv) {
    const b58 = basex("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
    return b58.decode(priv).toString("hex").slice(2, 66);
  }
*/

  function formatXrp(dropsBigInt) {
    const dropsStr = dropsBigInt.toString(), len = dropsStr.length;
    if (len <= 6) {
      const padded = dropsStr.padStart(6, '0');
      return '0.' + padded.replace(/0+$/, '') || '0';
    }
    const intPart = dropsStr.slice(0, len - 6);
    const decPart = dropsStr.slice(len - 6).replace(/0+$/, '') || '0';
    return intPart + '.' + decPart;
  }


async function signTransaction(transaction) {
  await ready();
  //console.log("🔑 Starting XRP signTransaction...");
  //console.log("📦 Transaction input:", JSON.parse(JSON.stringify(transaction, (_, v) => typeof v === 'bigint' ? v.toString() : v)));
  const { seedHex, derivePath, toAddress, amount, fee, sequence, lastLedgerSequence } = transaction;
  const privKey = await getPrivateKeyFromSeedHex(seedHex, derivePath);
  const pubCompKey  = await getPublicKeyCompressedFromSeedHex(seedHex, derivePath);
  const wallet = new xrpl.Wallet(pubCompKey, privKey);
  const amountDrops = xrpl.xrpToDrops(amount);
  const feeDrops = xrpl.xrpToDrops(fee);

  const txJson = {
    TransactionType: "Payment",
    Account: wallet.classicAddress,
    Destination: toAddress,
    Amount: amountDrops,
    Fee: feeDrops,
    Sequence: sequence,
    LastLedgerSequence: lastLedgerSequence
  };

  //console.log("🧾 Prepared XRP TX:", txJson);

  const signed = wallet.sign(txJson);
  transaction.serializedTx = signed.tx_blob;

  //console.log("🖋 Signature:", transaction.signature);
  //console.log("📦 Serialized TX:", transaction.serializedTx);
  return transaction.serializedTx;
}

  return {
    getAddressFromSeedHex,
    getPrivateKeyFromSeedHex,
    getPublicKeyCompressedFromSeedHex,
    getPublicKeyUncompressedFromSeedHex,
    formatXrp,
    signTransaction
  };
})();

window.WalletXrpLib = WalletXrpLib;

