// wallet-app-state.js

window.WalletAppState = (() => {
  const walletAppState = {
    password: null,
    passwordVisible: false,
    lastPasswordScore: 0,
    generatedSeed: null,
    userProvidedSeed: null,
      argon2Level: 0,
  };

  window.clearAppState = function () {
    Object.assign(walletAppState, {
      password: null,
      passwordVisible: false,
      lastPasswordScore: 0,
      generatedSeed: null,
      userProvidedSeed: null,
      derivedAddresses: {},
      argon2Level: 0,

    });
  };

  /**
   * Returns a plain object copy of our in-memory walletAppState.
   */
  window.getAppState = () => ({ ...walletAppState });
  window.walletAppState = walletAppState;

  return {
    get password() { return walletAppState.password },
    set password(val) { walletAppState.password = val },

    get passwordVisible() { return walletAppState.passwordVisible },
    set passwordVisible(val) { walletAppState.passwordVisible = val },

    get lastPasswordScore() { return walletAppState.lastPasswordScore },
    set lastPasswordScore(val) { walletAppState.lastPasswordScore = val },

    get generatedSeed() { return walletAppState.generatedSeed },
    set generatedSeed(val) { walletAppState.generatedSeed = val },

    get userProvidedSeed() { return walletAppState.userProvidedSeed },
    set userProvidedSeed(val) { walletAppState.userProvidedSeed = val },

    get argon2Level() { return walletAppState.argon2Level },
    set argon2Level(val) { walletAppState.argon2Level = val },

    clearAll: () => clearAppState(),
    getState: () => ({ ...walletAppState }),
  };
})();

