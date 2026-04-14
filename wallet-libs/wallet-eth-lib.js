// wallet-eth-lib.js
const WalletEthLib = (function () {
  let HDNode, Buffer, ethUtil;
  let _initialized = false;

  function ready() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.IanBip39Lib &&
          window.IanBip39Lib.HDNode && window.IanBip39Lib.Buffer) {
          HDNode = window.IanBip39Lib.HDNode;
          Buffer = window.IanBip39Lib.Buffer;
          ethUtil = window.IanBip39Lib.ethUtil || window.libs?.ethUtil;
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }


  ////////////////////////////////////////////////////////////////////
  // this function accepts lower case, upper case, mixed case
  // ETH addresses, and converts them into mixed-case checksummed
  // verifiable addresses
  ////////////////////////////////////////////////////////////////////
  async function normalizeEthereumAddress(address) {
    await ready();
    if (!ethUtil || !ethUtil.toChecksumAddress) {
      throw new Error("ethUtil not loaded");
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error("Invalid ETH address format");
    }
    return ethUtil.toChecksumAddress(address);
  }

  ////////////////////////////////////////////////////////////////////
  // this function tests does the ETH address pass checksum
  // verification (correctly mixed-case)
  ////////////////////////////////////////////////////////////////////
  async function isValidChecksummedEthereumAddress(address) {
    await ready();
    if (!ethUtil || !ethUtil.isValidChecksumAddress) {
      // fallback if ethUtil lacks isValidChecksumAddress
      return normalizeEthereumAddress(address) === address;
    }
    return ethUtil.isValidChecksumAddress(address);
  }


  ////////////////////////////////////////////////////////////////////
  //NOTE!: this public function is called dynamically by
  //wallet-multi-network-utils.js, and it expects ALL network-specific
  //children (such as this file) to have the same function
  //name.
  ////////////////////////////////////////////////////////////////////
  async function getAddressFromSeedHex(seedHex, derivePath) {
    await ready();

    const seedBuffer = Buffer.from(seedHex, "hex");
    const masterNode = HDNode.fromSeedBuffer(seedBuffer);
    const derived = masterNode.derivePath(derivePath);
    const privKey = derived.keyPair.d.toBuffer(32);
    const pubKey = ethUtil.privateToPublic(privKey);
    const address = ethUtil.publicToAddress(pubKey, true);

    const checksumAddr = normalizeEthereumAddress('0x' + address.toString('hex'));

    return checksumAddr;
  }

  ////////////////////////////////////////////////////////////////////
  // ERC20/BEP20 aware unit conversion
  ////////////////////////////////////////////////////////////////////
  function formatUnits(valueBigInt, decimals) {
    if (typeof valueBigInt !== 'bigint') {
      throw new Error("formatUnits expects a BigInt");
    }
    if (typeof decimals !== 'number' || decimals < 0) {
      throw new Error("formatUnits expects a non-negative decimals number");
    }

    const valueStr = valueBigInt.toString();
    const len = valueStr.length;

    if (decimals === 0) return valueStr;

    if (len <= decimals) {
      let padded = valueStr.padStart(decimals, '0');
      padded = padded.replace(/0+$/, '');
      return padded.length === 0 ? '0' : '0.' + padded;
    }

    const intPart = valueStr.slice(0, len - decimals);
    let decPart = valueStr.slice(len - decimals);

    decPart = decPart.replace(/0+$/, '');
    if (decPart.length === 0) return intPart;

    if (decPart.length > 8) {
      decPart = decPart.slice(0, 8);
    }
    return intPart + '.' + decPart;
  }

  function parseUnits(amountStr, decimals) {
    if (typeof amountStr !== 'string') {
      throw new Error("parseUnits expects a string");
    }
    if (typeof decimals !== 'number' || decimals < 0) {
      throw new Error("parseUnits expects a non-negative decimals number");
    }

    const [whole, fraction = ''] = amountStr.split('.');
    const wholePart = BigInt(whole || '0');
    const fracPart = BigInt((fraction + '0'.repeat(decimals)).slice(0, decimals));

    return wholePart * 10n ** BigInt(decimals) + fracPart;
  }

  function formatEther(weiBigInt) {
    const weiStr = weiBigInt.toString();
    const len = weiStr.length;

    if (len <= 18) {
      // Pad left and format fraction less than 1 ETH
      let padded = weiStr.padStart(18, '0');
      // Remove trailing zeros but keep at least one digit
      padded = padded.replace(/0+$/, '');
      return padded.length === 0 ? '0' : '0.' + padded;
    }

    // Integer and fractional parts
    const intPart = weiStr.slice(0, len - 18);
    let decPart = weiStr.slice(len - 18);

    // Trim trailing zeros from fraction
    decPart = decPart.replace(/0+$/, '');

    if (decPart.length === 0) {
      // No fraction left, return integer only
      return intPart;
    }

    // Limit to max 8 decimals for neatness
    if (decPart.length > 8) {
      decPart = decPart.slice(0, 8);
    }

    return intPart + '.' + decPart;
  }

  function parseEther(ethString) {
    if (typeof ethString !== 'string') throw new Error('parseEther expects a string');

    const [whole, fraction = ''] = ethString.split('.');
    const wholePart = BigInt(whole || '0');
    const fracPart = BigInt((fraction + '0'.repeat(18)).slice(0, 18));

    return wholePart * 10n ** 18n + fracPart;
  }

  async function signTransaction(transaction) {
    await ready();
    console.log("🔑 Starting signTransaction...");

    const {
      seedHex, derivePath, nonce, gasPrice, gasLimit,
      toAddress, amount, provider
    } = transaction;

    const chainId = provider.chainId;
    const valueWei = BigInt(transaction.amountWei);

    // Verify user input address
    if (!isValidChecksummedEthereumAddress(toAddress)) {
      throw new Error("Invalid Ethereum address: checksum failed");
    }
    const checksumToAddress = normalizeEthereumAddress(toAddress);

    const seedBuffer = Buffer.from(seedHex, "hex");
    const masterNode = HDNode.fromSeedBuffer(seedBuffer);
    const derived = masterNode.derivePath(derivePath);
    const privKey = derived.keyPair.d.toBuffer(32);
    const wallet = new ethers.Wallet('0x' + privKey.toString('hex'));

    const tx = {
      to: checksumToAddress,           // normalized & verified
      value: valueWei,
      gasPrice: BigInt(gasPrice),
      gasLimit: BigInt(gasLimit),
      nonce: Number(nonce),
      chainId: chainId
    };

    if (transaction.data) {
      tx.data = transaction.data;
    }

    const signed = await wallet.signTransaction(tx);
    return signed;
  }


  async function signMessage(messageData) {
    await ready();
    const { seedHex, derivePath, message } = messageData;

    // 1. Derive the private key (same as signTransaction)
    const seedBuffer = Buffer.from(seedHex, "hex");
    const masterNode = HDNode.fromSeedBuffer(seedBuffer);
    const derived = masterNode.derivePath(derivePath);
    const privKey = '0x' + derived.keyPair.d.toBuffer(32).toString('hex');

    // 2. Use ethers.Wallet to sign the message
    const wallet = new ethers.Wallet(privKey);

    // signMessage automatically prepends the "\x19Ethereum Signed Message" prefix
    const signature = await wallet.signMessage(message);
    
    return signature;
  }

////////////////////////////////////////////////////////////////////
  // EIP-712 Typed Data Signing (eth_signTypedData_v4)
  ////////////////////////////////////////////////////////////////////
  async function signTypedData(signPayload) {
    await ready();
    const { seedHex, derivePath, typedData } = signPayload;

    // 1. Derive Private Key
    const seedBuffer = Buffer.from(seedHex, "hex");
    const masterNode = HDNode.fromSeedBuffer(seedBuffer);
    const derived = masterNode.derivePath(derivePath);
    const privKey = '0x' + derived.keyPair.d.toBuffer(32).toString('hex');

    // 2. Init Wallet
    const wallet = new ethers.Wallet(privKey);

    // 3. Handle EIP-712 Payload
    // Ethers expects: domain, types, message. 
    // It DOES NOT want 'EIP712Domain' inside the types object.
    const { domain, types, message } = typedData;
    const filteredTypes = { ...types };
    delete filteredTypes.EIP712Domain;

    // 4. Feature Detection for Ethers v5 vs v6
    // v6 uses .signTypedData(), v5 uses ._signTypedData()
    let signature;
    if (typeof wallet.signTypedData === 'function') {
      signature = await wallet.signTypedData(domain, filteredTypes, message);
    } else if (typeof wallet._signTypedData === 'function') {
      signature = await wallet._signTypedData(domain, filteredTypes, message);
    } else {
      throw new Error("Ethers library version does not support signTypedData");
    }

    return signature;
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
    normalizeEthereumAddress,
    isValidChecksummedEthereumAddress,
    getAddressFromSeedHex,
    formatEther,
    parseEther,
    formatUnits,
    parseUnits,
    signTransaction,
    signMessage,
    signTypedData,
  };
})();

window.WalletEthLib = WalletEthLib;

