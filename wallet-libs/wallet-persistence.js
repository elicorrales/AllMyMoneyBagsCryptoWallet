// wallet-persistence.js

const WalletPersistence = (() => {
  const STORAGE_KEY = 'walletPersistence';
  let data = {};

  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      data = raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.warn("WalletPersistence.loadAll error", err);
      data = {};
    }
  }

  function saveAll() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn("WalletPersistence.saveAll error", err);
    }
  }

  function get(key) {
    loadAll();
    return data[key] ?? null;
  }

  function set(key, value) {
    loadAll();
    data[key] = value;
    saveAll();
  }

  function remove(key) {
    loadAll();
    delete data[key];
    saveAll();
  }

  function keys() {
    loadAll();
    return Object.keys(data);
  }

  function clearAll() {
    data = {};
    saveAll();
    walletManager.clearAll();
  }

  function getState() {
    loadAll();
    return {
      persistenceData: { ...data },
      walletManagerState: walletManager.getState(),
    };
  }

  function updateAssetProvider(key, updatedFields) {
    const providers = WalletPersistence.assetProviders;
    
    if (!providers[key]) {
      console.warn(`[WalletPersistence] Update FAILED. Key not found: "${key}"`);
      // Optional: Log all keys to see the difference
      console.log("Available keys:", Object.keys(providers));
      return; 
    }

    providers[key] = { ...providers[key], ...updatedFields };
    WalletPersistence.assetProviders = providers; 
    console.log(`[WalletPersistence] Successfully updated: ${key}`);
  }

  // createWalletManager no longer takes args (handles its own persistence)
  const walletManager = createWalletManager();

  return {
    get,
    set,
    remove,
    keys,
    clearAll,
    getState,
    updateAssetProvider,

    // Shortcut properties
    get disclaimerAccepted() { return get('disclaimerAccepted') },
    set disclaimerAccepted(val) { set('disclaimerAccepted', val) },

    get proxyPort() { return get('proxyPort') },
    set proxyPort(val) { set('proxyPort', val) },
    removeProxyPort() { remove('proxyPort') },

    get proxyInitialSecret() { return get('proxyInitialSecret') },
    set proxyInitialSecret(val) { set('proxyInitialSecret', val) },
    removeInitialProxySecret() { remove('proxyInitialSecret') },

    get proxySecret() { return get('proxySecret') },
    set proxySecret(val) { set('proxySecret', val) },
    removeProxySecret() { remove('proxySecret') },

    get proxyUrl() { return get('proxyUrl') },
    set proxyUrl(val) { set('proxyUrl', val) },
    removeProxyUrl() { remove('proxyUrl') },

    get assetProviders() {
      const raw = get('assetProviders');
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch {
        return {};
      }
    },

    set assetProviders(val) {
      if (!val || typeof val !== 'object') return;
      try {
        set('assetProviders', JSON.stringify(val));
      } catch (err) {
        console.error('Failed to persist assetProviders:', err);
      }
    },

    get loggedOffReason() { return get('loggedOffReason') },
    set loggedOffReason(val) { set('loggedOffReason', val) },
    removeLoggedOffReason() { remove('loggedOffReason') },

    get loggedOffDump() { return get('loggedOffDump') },
    set loggedOffDump(val) { set('loggedOffDump', val) },
    removeLoggedOffDump() { remove('loggedOffDump') },

    get lastTimeUserInteractedWithWallet() { return get('lastTimeUserInteractedWithWallet') },
    set lastTimeUserInteractedWithWallet(val) { set('lastTimeUserInteractedWithWallet', val) },

    get isShowNewPage() { return get('isShowNewPage') },
    set isShowNewPage(val) { set('isShowNewPage', val) },

    get cameFromThisPage() { return get('cameFromThisPage') },
    set cameFromThisPage(val) { set('cameFromThisPage', val) },

    get estimatedArgon2Delays() { return get('estimatedArgon2Delays') },
    set estimatedArgon2Delays(val) { set('estimatedArgon2Delays', val) },

    get selectedArgon2SliderLevel() { return get('selectedArgon2SliderLevel')  ?? null },
    set selectedArgon2SliderLevel(val) { set('selectedArgon2SliderLevel', val) },

    get argon2SliderLevelIsSet() { return get('argon2SliderLevelIsSet') ?? false; },
    set argon2SliderLevelIsSet(val) { set('argon2SliderLevelIsSet', !!val); },

    get tokenPossibilities() { return get('tokenPossibilities') ?? null },
    set tokenPossibilities(val) { set('tokenPossibilities', val) },

    get dappMessagesDetails() { return get('dappMessagesDetails') ?? null },
    set dappMessagesDetails(val) { set('dappMessagesDetails', val) },

    walletManager,
  };
})();

