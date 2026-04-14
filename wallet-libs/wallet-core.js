window.WalletCore = (function ({ crypto, btoa, atob, wordlist, WalletAppState }) { // IIFE wrapper with injected dependencies
  // wallet-core.js
  // Core crypto and mnemonic utilities module
  // Assumes `wordlist` is defined globally (e.g. from bip39-wordlist.js)

  const argonMem = 44 * 1024;
  const parallel = 1;
  const timeOffset = 40;
  const argonLevels = [
    { time: 4+2, mem: argonMem, parallelism: parallel },    // Level 0 — light
    { time: 8+timeOffset, mem: argonMem, parallelism: parallel },   // Level 1
    { time: 12+timeOffset, mem: argonMem, parallelism: parallel },  // Level 2
    { time: 16+timeOffset, mem: argonMem, parallelism: parallel },  // Level 3
    { time: 20+timeOffset, mem: argonMem, parallelism: parallel },  // Level 4
    { time: 24+timeOffset, mem: argonMem, parallelism: parallel },  // Level 5
    { time: 28+timeOffset, mem: argonMem, parallelism: parallel },  // Level 6
    { time: 32+timeOffset, mem: argonMem, parallelism: parallel },  // Level 7
    { time: 36+timeOffset, mem: argonMem, parallelism: parallel },  // Level 8
    { time: 40+timeOffset, mem: argonMem, parallelism: parallel },  // Level 9
    { time: 44+timeOffset, mem: argonMem, parallelism: parallel },  // Level 10
    { time: 48+timeOffset, mem: argonMem, parallelism: parallel },  // Level 11
    { time: 52+timeOffset, mem: argonMem, parallelism: parallel },  // Level 12
    { time: 56+timeOffset, mem: argonMem, parallelism: parallel },  // Level 13
    { time: 60+timeOffset, mem: argonMem, parallelism: parallel },  // Level 14
    { time: 64+timeOffset, mem: argonMem, parallelism: parallel },  // Level 15
    { time: 68+timeOffset, mem: argonMem, parallelism: parallel },  // Level 16
    { time: 72+timeOffset, mem: argonMem, parallelism: parallel },  // Level 17
    { time: 76+timeOffset, mem: argonMem, parallelism: parallel },  // Level 18
    { time: 80+timeOffset, mem: argonMem, parallelism: parallel }   // Level 19 — very strong
  ];

  let argon2WasmPrecompilerHasRun = false;
  async function precompileArgon2Wasm() {
    try {
      const dummySalt = new Uint8Array(16);
      const dummyPassword = "precompile";
      await deriveKey(dummyPassword, dummySalt, 0);
      console.log("Argon2 WASM precompiled.");
      argon2WasmPrecompilerHasRun = true;
    } catch (err) {
      console.warn("Precompile failed:", err);
    }
  }

  async function estimateArgon2Delay(index) {
    if (index < 0 || index >= argonLevels.length) {
      throw new Error(`estimateArgon2Delay index must be between 0 and ${argonLevels.length - 1}`);
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const password = "benchmark-test";
    const start = performance.now();
    await deriveKey(password, salt, index);
    return Math.round(performance.now() - start);
  }

  function extrapolateArgon2Delays(delays) {
    for (let i = 0; i < argonLevels.length; i++) {
      if (delays[i] != null) continue;
      // find nearest lower filled index
      const lower = [...Array(i + 1).keys()].reverse().find(s => delays[s] != null) ?? 0;
      delays[i] = Math.round(
        delays[lower] * (argonLevels[i].time / argonLevels[lower].time)
      );
    }
    return delays;
  }

  async function benchmarkArgon2() {
    if(!argon2WasmPrecompilerHasRun) await precompileArgon2Wasm();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const password = "benchmark-test";
    const start = performance.now();
    await deriveKey(password, salt, 0);
    return performance.now() - start;
  }

  function generateEntropy() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array;
  }

  async function entropyToMnemonic(wordlist, entropy) {
    let entropyBits = '';
    for (let i = 0; i < entropy.length; i++) {
      entropyBits += entropy[i].toString(2).padStart(8, '0');
    }
    const hashBuffer = await WalletSha256.hash(new Uint8Array(entropy));
    const hashBytes = new Uint8Array(hashBuffer);
    const checksumLength = entropy.length / 4;
    const checksumBits = [...hashBytes]
      .map(b => b.toString(2).padStart(8, '0'))
      .join('')
      .slice(0, checksumLength);

    const bits = entropyBits + checksumBits;
    const words = [];
    for (let i = 0; i < bits.length; i += 11) {
      const idx = parseInt(bits.slice(i, i + 11), 2);
      words.push(wordlist[idx]);
    }
    return words.join(' ');
  }

  // Replace the old verifyMnemonic with full BIP39‐style validation + match check
  async function verifyMnemonic(wordlist, input, original) {
    const cleaned = input.trim();
    const words = cleaned.split(/\s+/);
    if (words.length !== 24) return false;
    const indices = [];
    for (let w of words) {
      const idx = wordlist.indexOf(w);
      if (idx < 0) return false;
      indices.push(idx);
    }

    // Reconstruct the full 264‐bit string (24 words × 11 bits)
    let bits = "";
    for (let idx of indices) bits += idx.toString(2).padStart(11, '0');
    const entropyBits = bits.slice(0, 256);
    const checksumBits = bits.slice(256);

    // Convert the 256-bit entropy to a Uint8Array of 32 bytes
    const entropyBytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) entropyBytes[i] = parseInt(entropyBits.slice(i*8,(i+1)*8),2);
    const hashBuffer = await WalletSha256.hash(entropyBytes);
    const hashArray = new Uint8Array(hashBuffer);
    const firstByte = hashArray[0];
    const hashFirstBits = firstByte.toString(2).padStart(8,'0').slice(0,8);
    if (checksumBits !== hashFirstBits) return false;
    return cleaned === original.trim();
  }


  async function deriveKey(password, salt, iterationIndex = 0) {
    const start = performance.now();

    const params = argonLevels[iterationIndex] || argonLevels[0];
    const saltStr = Array.from(salt).map(b => String.fromCharCode(b)).join('');

    const hash = await argon2.hash({
      pass: password,
      salt: saltStr,
      type: argon2.ArgonType.Argon2id,
      time: params.time,
      mem: params.mem,
      parallelism: params.parallelism,
      hashLen: 32
    });

    const key = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(hash.hash),
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
    console.log(`deriveKey(level ${iterationIndex}) took ${((performance.now()-start)/1000).toFixed(2)}s`);
    return key;
  }


  async function encryptMnemonic(mnemonic, password) {
    // 1. Generate a random 16-byte salt and derive an AES-GCM key using Argon2
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(password, salt, WalletPersistence.selectedArgon2SliderLevel);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 3. Encrypt the UTF-8 bytes of the mnemonic
    const data = new TextEncoder().encode(mnemonic);
    const ciphertext = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, data);
    const combined = new Uint8Array([...salt, ...iv, WalletPersistence.selectedArgon2SliderLevel, ...new Uint8Array(ciphertext)]);
    return btoa(String.fromCharCode(...combined));
  }

  async function decryptMnemonic(encryptedB64, password) {
    const bytes = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
    const salt = bytes.slice(0,16);
    const iv = bytes.slice(16,28);
    const iterationIndex = bytes[28];
    const ciphertext = bytes.slice(29);

    // During decryption, still read stored slider index from blob
    const key = await deriveKey(password, salt, iterationIndex);
    const decrypted = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  }

  // PLACEHOLDER for private storage of encrypted mnemonic (closure variable)
  let _encryptedSeedBlob = null;

  // createSeedBundle — generate + encrypt + store internally
  async function createSeedBundle() {
    if (!WalletAppState.password) throw new Error("Password not set.");
    const entropy = await generateEntropy();
    const mnemonic = await entropyToMnemonic(wordlist, entropy);
    const encryptedB64 = await encryptMnemonic(mnemonic, WalletAppState.password);
    _encryptedSeedBlob = encryptedB64;
    WalletAppState.generatedSeed = mnemonic.trim().split(' ');
    return { plainText: mnemonic.trim(), encryptedB64 };
  }

  // verifyEncryptedSeed — input vs stored (password-decrypted) seed
  async function verifyEncryptedSeed(password, userInputArray) {
    if (!_encryptedSeedBlob) throw new Error('No seed generated yet.');
    const decryptedMnemonic = await decryptMnemonic(_encryptedSeedBlob, password);
    const originalWords = decryptedMnemonic.trim().split(/\s+/);
    if (!Array.isArray(userInputArray) || userInputArray.length !== 24) return false;
    return userInputArray.every((w,i)=>w===originalWords[i]);
  }

  /**
   * Turn a free-form paste into an array of words.
   * Strips any leading numbering (1.  1)  1-), punctuation, tabs/newlines.
  */
  function normalizeMnemonicInput(input) {

    const lines = input.trim().split(/\r?\n/);

    if (lines.length === 12) {
      const leftWords = [], rightWords = [];
      lines.forEach(line=>{
        const matches = [...line.matchAll(/\b(\d+)\s*[\.\-\)]\s*([a-zA-Z]+)\b/g)];
        if(matches.length===2){
          const sorted = matches.sort((a,b)=>parseInt(a[1])-parseInt(b[1]));
          leftWords.push(sorted[0][2].toLowerCase());
          rightWords.push(sorted[1][2].toLowerCase());
        } else { if(matches[0]) leftWords.push(matches[0][2].toLowerCase()); }
      });
      input = [...leftWords,...rightWords].join(' ');
    } else input = lines.join(' ');
    return input.split(/\s+/).map(tok=>tok.replace(/^\s*\d+[\.\-\)]?\s*/,'').replace(/[^a-zA-Z]/g,'').toLowerCase()).filter(Boolean);
  }

  function validateMnemonicWords(words, wordlist) {
    if (words.length<12) return {ok:false,error:`Too few words (found ${words.length}).`};
    if (words.length>24) return {ok:false,error:`Too many words (found ${words.length}).`};
    const invalid = words.filter(w=>!wordlist.includes(w));
    if (invalid.length) return {ok:false,error:'Unknown word'+(invalid.length>1?'s':'')+': '+invalid.join(', ')};
    return {ok:true};
  }

  return {
    generateEntropy,
    entropyToMnemonic,
    verifyMnemonic,
    deriveKey,
    encryptMnemonic,
    decryptMnemonic,
    createSeedBundle,
    verifyEncryptedSeed,
    normalizeMnemonicInput,
    validateMnemonicWords,
    estimateArgon2Delay,
    extrapolateArgon2Delays
  };
})({ crypto: window.crypto, btoa: window.btoa, atob: window.atob, wordlist: bip39Wordlist, WalletAppState: window.WalletAppState });

