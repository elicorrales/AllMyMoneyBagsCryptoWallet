// wallet-default-xrp-asset-providers.js

const WalletDefaultXrpAssetProviders = (function() {
const providers = [


////////////////////////////////////////////////////////////////////////////////////////
//XRP
////////////////////////////////////////////////////////////////////////////////////////

{
  "providerName": "XRP Ledger (Tatum Testnet)",
  "networkType": "XRP",
  "network": "testnet",
  "symbol": "XRP",
  "assetName": "XRP",
  "rpcUrl": "https://ripple-testnet.gateway.tatum.io",
  "explorerUrl": "https://testnet.xrpl.org/",
  "apiType": "rippled",
  "providerApiKey": "t-685a1a55ebbd22bb4b50b22b-a9c4817753734ea99144b5ec",
  //"providerApiKey": "t-685a1a55ebbd22bb4b50b22b-7166ea2ab3e24878ab734b16",
  "numRpcTimeoutErrors": null,
  "numRpcTries": null,
  "rpcMethods": {
    "getBalance":    { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getFee":        { "method": "fee",          "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "determineDoesDestAddressExist": { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getLedger": { "method": "ledger", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "sendTransaction": { "method": "submit",     "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" }
  },
},

{
  "providerName": "XRP Ledger (Tatum Mainnet)",
  "networkType": "XRP",
  "network": "mainnet",
  "symbol": "XRP",
  "assetName": "XRP",
  "rpcUrl": "https://ripple-mainnet.gateway.tatum.io",
  "explorerUrl": "https://mainnet.xrpl.org/",
  "apiType": "rippled",
  "providerApiKey": "t-685a1a55ebbd22bb4b50b22b-7166ea2ab3e24878ab734b16",
  "numRpcTimeoutErrors": null,
  "numRpcTries": null,
  "rpcMethods": {
    "getBalance":    { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getFee":        { "method": "fee",          "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "determineDoesDestAddressExist": { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getLedger": { "method": "ledger", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "sendTransaction": { "method": "submit",     "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" }
  }
},

{
  "providerName": "XRP Ledger (GetBlock - Germany)",
  "networkType": "XRP",
  "network": "mainnet",
  "symbol": "XRP",
  "assetName": "XRP",
  "rpcUrl": "https://go.getblock.io/1f64cded573e45c09d30b3e2c405c12d",
  "explorerUrl": "https://mainnet.xrpl.org/",
  "apiType": "rippled",
  "providerApiKey": null,
  "numRpcTimeoutErrors": null,
  "numRpcTries": null,
  "rpcMethods": {
    "getBalance":    { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getFee":        { "method": "fee",          "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "determineDoesDestAddressExist": { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getLedger": { "method": "ledger", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "sendTransaction": { "method": "submit",     "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" }
  }
},



//BEEN USING THIS ONE FOR TESTING
{
  "providerName": "XRP Ledger Testnet (Ripple)",
  "networkType": "XRP",
  "network": "testnet",
  "symbol": "XRP",
  "assetName": "XRP",
  "rpcUrl": "https://s.altnet.rippletest.net:51234",
  "explorerUrl": "https://testnet.xrpl.org/",
  "apiType": "rippled",
  "providerApiKey": null,
  "numRpcTimeoutErrors": null,
  "numRpcTries": null,
  "rpcMethods": {
    "getBalance":    { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getFee":        { "method": "fee",          "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "determineDoesDestAddressExist": { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getLedger": { "method": "ledger", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "sendTransaction": { "method": "submit",     "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" }
  }
},



{
  "providerName": "XRP Ledger Testnet (XRPL Labs)",
  "networkType": "XRP",
  "network": "testnet",
  "symbol": "XRP",
  "assetName": "XRP",
  "rpcUrl": "https://testnet.xrpl-labs.com",
  "explorerUrl": "https://testnet.xrpl.org/",
  "apiType": "rippled",
  "providerApiKey": null,
  "numRpcTimeoutErrors": null,
  "numRpcTries": null,
  "rpcMethods": {
    "getBalance":    { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getFee":        { "method": "fee",          "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "determineDoesDestAddressExist": { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getLedger": { "method": "ledger", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },

    "sendTransaction": { "method": "submit",     "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" }
  }
},


{
  "providerName": "XRP Ledger (GetBlock)",
  "networkType": "XRP",
  "network": "mainnet",
  "symbol": "XRP",
  "assetName": "XRP",
  "rpcUrl": "https://go.getblock.io/cc12fd253fb14834ab22602fc42d29bf",
  "explorerUrl": "https://mainnet.xrpl.org/",
  "apiType": "rippled",
  "providerApiKey": null,
  "numRpcTimeoutErrors": null,
  "numRpcTries": null,
  "rpcMethods": {
    "getBalance":    { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getFee":        { "method": "fee",          "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "determineDoesDestAddressExist": { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getLedger": { "method": "ledger", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "sendTransaction": { "method": "submit",     "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" }
  }
},

{
  "providerName": "XRP Ledger (dRPC Mainnet)",
  "networkType": "XRP",
  "network": "mainnet",
  "symbol": "XRP",
  "assetName": "XRP",
  "rpcUrl": "https://ripple.drpc.org/",
  "explorerUrl": "https://mainnet.xrpl.org/",
  "apiType": "rippled",
  "providerApiKey": null,
  "numRpcTimeoutErrors": null,
  "numRpcTries": null,
  "rpcMethods": {
    "getBalance":    { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getFee":        { "method": "fee",          "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "determineDoesDestAddressExist": { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getLedger": { "method": "ledger", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "sendTransaction": { "method": "submit",     "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" }
  }
},

{
  "providerName": "XRP Ledger (dRPC Testnet)",
  "networkType": "XRP",
  "network": "testnet",
  "symbol": "XRP",
  "assetName": "XRP",
  "rpcUrl": "https://ripple-testnet.drpc.org/",
  "explorerUrl": "https://testnet.xrpl.org/",
  "apiType": "rippled",
  "providerApiKey": null,
  "numRpcTimeoutErrors": null,
  "numRpcTries": null,
  "rpcMethods": {
    "getBalance":    { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getFee":        { "method": "fee",          "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "determineDoesDestAddressExist": { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getLedger": { "method": "ledger", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "sendTransaction": { "method": "submit",     "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" }
  }
},

{
  "providerName": "XRP Ledger Testnet (Ripple Clio - JSON-RPC)",
  "networkType": "XRP",
  "network": "testnet",
  "symbol": "XRP",
  "assetName": "XRP",
  "rpcUrl": "https://clio.altnet.rippletest.net:51234/",
  "explorerUrl": "https://testnet.xrpl.org/",
  "apiType": "rippled",
  "providerApiKey": null,
  "numRpcTimeoutErrors": null,
  "numRpcTries": null,
  "rpcMethods": {
    "getBalance":    { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getFee":        { "method": "fee",          "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "determineDoesDestAddressExist": { "method": "account_info", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "getLedger": { "method": "ledger", "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" },
    "sendTransaction": { "method": "submit",     "getOrPost": "POST", "contentType": "application/json", "payloadFormat": "json" }
  }
},




];
return { providers };

})();
