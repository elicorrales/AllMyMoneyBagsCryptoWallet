// wallet-ui-common-js/wallet-ui-maintenance-listeners.js
(function() {
  const init = () => {
    // Helper to keep code clean
    const wire = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };

    const menu = document.getElementById('networkMenu');

    // 1. Core Settings & Master Reset
    wire('settingsMenuItem', () => alert('Settings clicked'));

    wire('resetAllMenuItem', () => {
      WalletUiReset.renderResetItemsList();
      document.getElementById('resetOverlayModal').classList.remove('hidden');
    });

    // 2. Provider Testing (The async one)
    wire('testAllAssetProvidersMenuItem', async () => {
      if (menu) menu.style.display = 'none';

      let resultsFilter = null;

      await WalletYesOrNoAction.showAndBlock({
        message: 'Filter Test Results',
        details: 'Do you want to see all results, or only errors?',
        positive: 'All',
        negative: 'Errors Only',
        onPositive: () => { resultsFilter = 'All'; },
        onNegative: () => { resultsFilter = 'Errors'; }
      });

      const params = {
        resultsFilter
      }
      const result = await WalletMultiNetworkUtils.testAllAssetProviders(params);;

      WalletInfoModal.show({
        message: 'Results of Testing Providers',
        details: `Tested: ${result.total}, Passed: ${result.passed}, Failed: ${result.failed}`
      });

      WalletPageLevelUiStatusLines.clearStatus();
      WalletPageLevelUiStatusLines.updateStatus(result.statusLines);
    });


    wire('allAssetProvidersStatsMenuItem', () => {
      const menu = document.getElementById('networkMenu');
      if (menu) menu.style.display = 'none';

      WalletAssetProviderStats.loadAndShow();


    });

    // 3. Granular Purge/Reset Actions
    wire('resetAllAssetProvidersMenuItem', () => WalletUiReset.deleteAllAssetProviders());
    wire('resetAllDerivedAddressesMenuItem', () => WalletUiReset.deleteAllDerivedAddresses());
    wire('resetAllDerivedTokensMenuItem', () => WalletUiReset.deleteAllDerivedTokens());
    wire('updateAllProvAssetsTokensStableMenuItem', () => WalletUiReset.updateAllProvidersAssetsTokensStable());
  };

  // Standard DOM ready check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

