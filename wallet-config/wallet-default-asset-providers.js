// wallet-default-asset-providers.js

const WalletDefaultAssetProviders = (function() {
const providers = [

...WalletDefaultBscAssetProviders.providers,
...WalletDefaultEthAssetProviders.providers,
...WalletDefaultPolAssetProviders.providers,
...WalletDefaultBtcAssetProviders.providers,
...WalletDefaultXlmAssetProviders.providers,
...WalletDefaultXrpAssetProviders.providers,


];
return { providers };

})();
