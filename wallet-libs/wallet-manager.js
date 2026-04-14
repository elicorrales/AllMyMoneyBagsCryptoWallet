// wallet-manager.js

function createWalletManager() {
  const STORAGE_KEY_WALLETS = 'wallets';
  const STORAGE_KEY_INPROGRESS = 'inprogressWallet';
  const STORAGE_KEY_ACTIVE = 'activeWalletId';

  // flag keys
  const FLAG_DERIVED_ADDRESSES = 'flag_derivedAddressesChanged';
  const FLAG_DERIVED_TOKENS = 'flag_derivedTokensChanged';
  const FLAG_DERIVED_STABLECOINS = 'flag_derivedStableCoinsChanged';

  function getFlag(key) {
    return localStorage.getItem(key) === 'true';
  }

  function setFlag(key, val) {
    localStorage.setItem(key, val ? 'true' : 'false');
  }

  function clearAll() {
    clearInprogressWallet();
    localStorage.removeItem(STORAGE_KEY_WALLETS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
    setFlag(FLAG_DERIVED_ADDRESSES, false);
    setFlag(FLAG_DERIVED_TOKENS, false);
    setFlag(FLAG_DERIVED_STABLECOINS, false);
  }

  function getState() {
    return {
      wallets: getAllWallets(),
      inprogress: getInprogress(),
      activeWalletId: localStorage.getItem(STORAGE_KEY_ACTIVE),
    };
  }

  function sanitizeNameToId(name) {
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  function isNameUnique(name, wallets, ignoreId = null) {
    const nameLower = name.toLowerCase();
    for (const id in wallets) {
      if (id === ignoreId) continue;
      if (wallets[id].name.toLowerCase() === nameLower) return false;
    }
    return true;
  }

  function isIdUnique(id, wallets, ignoreId = null) {
    return !(id in wallets) || id === ignoreId;
  }

  function getAllWallets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WALLETS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveAllWallets(wallets) {
    localStorage.setItem(STORAGE_KEY_WALLETS, JSON.stringify(wallets));
  }

  function getInprogress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_INPROGRESS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveInprogressWallet(obj) {
    localStorage.setItem(STORAGE_KEY_INPROGRESS, JSON.stringify(obj));
  }

  function clearInprogressWallet() {
    localStorage.removeItem(STORAGE_KEY_INPROGRESS);
  }

  function validateFullyInitialized(wallet) {
    if (!wallet) throw new Error('No wallet provided');
    if (!wallet.id || !wallet.name)
      throw new Error('Wallet must have an ID and name');
    if (!wallet.encryptedMnemonic)
      throw new Error('Wallet must include an encrypted mnemonic');
    if (!wallet.derivedAddresses || Object.keys(wallet.derivedAddresses).length === 0)
      throw new Error('Wallet must include derived addresses');
    if (!wallet.ackedPostBackup) throw new Error('Wallet has to be acked Post Backup');

    return true;
  }

  function promoteInprogress() {
    const internalInprogress = getInprogress();
    if (!internalInprogress || Object.keys(internalInprogress).length === 0) throw new Error('No in-progress wallet to promote');

    validateFullyInitialized(internalInprogress, false);

    const wallets = getAllWallets();
    if (!isNameUnique(internalInprogress.name, wallets)) {
      throw new Error('Wallet name must be unique');
    }
    if (!isIdUnique(internalInprogress.id, wallets)) {
      throw new Error('Wallet ID conflict');
    }

    wallets[internalInprogress.id] = internalInprogress;
    saveAllWallets(wallets);

    localStorage.setItem(STORAGE_KEY_ACTIVE, internalInprogress.id);

    clearInprogressWallet();

    return internalInprogress.id;
  }

  function tryPromoteIfReady() {
    const wallet = getInprogress();
    const wallets = getAllWallets();
    try {
      validateFullyInitialized(wallet);
      // maybe also check uniqueness here before promoting
      if (!isIdUnique(wallet.id, wallets)) throw new Error('Derived wallet ID conflicts');
      promoteInprogress();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  function hasChanged(current, val) {
    return JSON.stringify(current) !== JSON.stringify(val);
  }

  async function findWalletByMnemonic(wordsArray, password) {
    const wallets = getAllWallets();
    const inputStr = wordsArray.join(' ').trim();

    for (const id in wallets) {
      const wallet = wallets[id];
      if (!wallet.encryptedMnemonic) continue;

      try {
        const decrypted = await WalletCore.decryptMnemonic(wallet.encryptedMnemonic, password);
        if (decrypted.trim() === inputStr) return wallet;  // <-- return the wallet object
      } catch (e) {
        console.warn(`Failed to decrypt wallet ${wallet.name}:`, e);
      }
    }

    return null;
  }

  return {
    clearAll,
    getState,
    findWalletByMnemonic,

    addWallet(name) {
      const currentInprogress = getInprogress();
      if (currentInprogress && Object.values(currentInprogress).some(v => v !== null && v !== '' && v !== undefined && !(typeof v === 'object' && Object.keys(v).length === 0))) {
        throw new Error('There is already an in-progress wallet. Complete or clear it before adding a new one.');
      }

      const wallets = getAllWallets();
      if (!isNameUnique(name, wallets)) throw new Error('Wallet name must be unique');

      const id = sanitizeNameToId(name);
      if (!isIdUnique(id, wallets)) throw new Error('Derived wallet ID conflicts');

      const newInprogress = {
        id,
        name,
        encryptedMnemonic: null,
        derivedAddresses: {},
        derivedTokens: {},
        derivedStableCoins: {},
        tempEncryptedMnemonic: null,
        ackedPostBackup: false,
      };
      saveInprogressWallet(newInprogress);

      return this.inprogress;
    },

    promoteInprogress,
    clearInprogressWallet,
    getAllWallets,
    removeWallet(id) {
      const wallets = getAllWallets();
      delete wallets[id];
      saveAllWallets(wallets);
      if (localStorage.getItem(STORAGE_KEY_ACTIVE) === id) {
        localStorage.removeItem(STORAGE_KEY_ACTIVE);
      }
    },

    get numWallets() {
      return Object.keys(getAllWallets()).length;
    },
    isWalletUnique(name) {
      const wallets = getAllWallets();
      const id = sanitizeNameToId(name);
      return isNameUnique(name, wallets) && isIdUnique(id, wallets);
    },

    // ----- Active wallet -----
    activeWallet: {
      get id() {
        return localStorage.getItem(STORAGE_KEY_ACTIVE);
      },
      get wallet() {
        const id = localStorage.getItem(STORAGE_KEY_ACTIVE);
        if (!id) return null;
        const wallets = getAllWallets();
        return wallets[id] || null;
      },
      setActiveWalletId(id) {
        const wallets = getAllWallets();
        if (wallets[id]) {
          localStorage.setItem(STORAGE_KEY_ACTIVE, id);
          return true;
        }
        return false;
      },

      rename(newName) {
        const id = localStorage.getItem(STORAGE_KEY_ACTIVE);
        if (!id) return false;
        const wallets = getAllWallets();
        if (!wallets[id]) return false;

        if (!isNameUnique(newName, wallets, id)) throw new Error('Wallet name must be unique');

        wallets[id].name = newName;
        saveAllWallets(wallets);
        return true;
      },

      updateField(field, value) {
        if (field === 'name') return this.rename(value);
        const id = localStorage.getItem(STORAGE_KEY_ACTIVE);
        if (!id) return false;
        const wallets = getAllWallets();
        if (!wallets[id]) return false;
        wallets[id][field] = value;
        saveAllWallets(wallets);
        return true;
      },

      get name() { return this.wallet?.name ?? null; },
      set name(val) { this.updateField('name', val); },
      get encryptedMnemonic() { return this.wallet?.encryptedMnemonic ?? null; },
      set encryptedMnemonic(val) { this.updateField('encryptedMnemonic', val); },
      get tempEncryptedMnemonic() { return this.wallet?.tempEncryptedMnemonic ?? null; },
      set tempEncryptedMnemonic(val) { this.updateField('tempEncryptedMnemonic', val); },

      // ---- Derived fields with dirty flags ----
      get derivedAddresses() {
        return this.wallet?.derivedAddresses ?? {};
      },
      set derivedAddresses(val) {
        const current = this.wallet?.derivedAddresses ?? {};
        if (!hasChanged(current, val)) return;
        this.updateField('derivedAddresses', val);
        setFlag(FLAG_DERIVED_ADDRESSES, true);
      },

      get derivedTokens() {
        return this.wallet?.derivedTokens ?? {};
      },
      set derivedTokens(val) {
        const current = this.wallet?.derivedTokens ?? {};
        if (!hasChanged(current, val)) return;
        this.updateField('derivedTokens', val);
        setFlag(FLAG_DERIVED_TOKENS, true);
      },

      get derivedStableCoins() {
        return this.wallet?.derivedStableCoins ?? {};
      },
      set derivedStableCoins(val) {
        const current = this.wallet?.derivedStableCoins ?? {};
        if (!hasChanged(current, val)) return;
        this.updateField('derivedStableCoins', val);
        setFlag(FLAG_DERIVED_STABLECOINS, true);
      },

      clearIsCryptoChanged() {
        setFlag(FLAG_DERIVED_ADDRESSES, false);
        setFlag(FLAG_DERIVED_TOKENS, false);
        setFlag(FLAG_DERIVED_STABLECOINS, false);
      },

      get ackedPostBackup() { return this.wallet?.ackedPostBackup ?? false; },
      set ackedPostBackup(val) { this.updateField('ackedPostBackup', !!val); },
      get iterations() { return this.wallet?.iterations ?? 100000; },
      set iterations(val) { if (typeof val === 'number' && val > 0) this.updateField('iterations', val); },

      get isDerivedAddressesChanged() { return getFlag(FLAG_DERIVED_ADDRESSES); },
      get isDerivedTokensChanged() { return getFlag(FLAG_DERIVED_TOKENS); },
      get isDerivedStableCoinsChanged() { return getFlag(FLAG_DERIVED_STABLECOINS); },
    },

    // ----- In-progress wallet -----
    inprogress: {
      get wallet() {
        const obj = getInprogress();
        return Object.keys(obj).length ? obj : null;
      },
      updateField(field, value) {
        const wallet = getInprogress();
        if (!wallet) return false;
        wallet[field] = value;
        saveInprogressWallet(wallet);
        tryPromoteIfReady();
        return true;
      },

      get encryptedMnemonic() { return this.wallet?.encryptedMnemonic ?? null; },
      set encryptedMnemonic(val) { this.updateField('encryptedMnemonic', val); },
      get tempEncryptedMnemonic() { return this.wallet?.tempEncryptedMnemonic ?? null; },
      set tempEncryptedMnemonic(val) { this.updateField('tempEncryptedMnemonic', val); },

      get derivedAddresses() { return this.wallet?.derivedAddresses ?? {}; },
      set derivedAddresses(val) { if (typeof val === 'object') this.updateField('derivedAddresses', val); },

      get derivedTokens() { return this.wallet?.derivedTokens ?? {}; },
      set derivedTokens(val) { if (typeof val === 'object') this.updateField('derivedTokens', val); },

      get derivedStableCoins() { return this.wallet?.derivedStableCoins ?? {}; },
      set derivedStableCoins(val) { if (typeof val === 'object') this.updateField('derivedStableCoins', val); },

      get ackedPostBackup() { return this.wallet?.ackedPostBackup ?? false; },
      set ackedPostBackup(val) { this.updateField('ackedPostBackup', !!val); },
      get iterations() { return this.wallet?.iterations ?? 100000; },
      set iterations(val) { if (typeof val === 'number' && val > 0) this.updateField('iterations', val); },
      get name() { return this.wallet?.name ?? null; },
      set name(val) { this.updateField('name', val); },
      get id() { return this.wallet?.id ?? null; },
    },
  };
}

