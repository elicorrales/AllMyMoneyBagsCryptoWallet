// wallet-default-btc-asset-providers.js

const WalletDefaultBtcAssetProviders = (function() {
const providers = [

////////////////////////////////////////////////////////////////////////////////////////
// BTC Testnet
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
// BTC Testnet (Address-based APIs)
////////////////////////////////////////////////////////////////////////////////////////

{
  "providerName": "Bitcoin Testnet (Blockstream)",
  "networkType": "BTC",
  "network": "testnet",
  "symbol": "BTC",
  "assetName": "Bitcoin",
  "rpcUrl": "https://blockstream.info/testnet/api",
  "explorerUrl": "https://blockstream.info/testnet",
  "apiType": "blockstream",
  "minRelayFeeSatsPerVByte": 38,      // updated to realistic min relay
  "defaultFeeSatsPerVByte": 50,       // updated to realistic default
  "rpcMethods": {
    "getBalance": { "method": "address/<address>", "getOrPost": "GET", "field": "chain_stats.funded_txo_sum - chain_stats.spent_txo_sum" },
    "getFee": { "method": "fee-estimates", "getOrPost": "GET" },
    "sendTransaction": { "method": "/tx", "getOrPost": "POST", "contentType": "text/plain" }
  }
},

{
  "providerName": "Bitcoin Testnet (BlockCypher)",
  "networkType": "BTC",
  "network": "testnet",
  "symbol": "BTC",
  "assetName": "Bitcoin",
  "rpcUrl": "https://api.blockcypher.com/v1/btc/test3",
  "explorerUrl": "https://live.blockcypher.com/btc-testnet",
  "apiType": "blockcypher",
  "minRelayFeeSatsPerVByte": 38,
  "defaultFeeSatsPerVByte": 50,
  "rpcMethods": {
    "getBalance": { "method": "addrs/<address>/balance", "getOrPost": "GET", "field": "final_balance" },
    "getFee": { "method": "txs", "getOrPost": "GET" },
    "sendTransaction": { "method": "/txs/push", "getOrPost": "POST", "contentType": "application/json" }
  }
},

////////////////////////////////////////////////////////////////////////////////////////
// BTC Mainnet (Address-based APIs)
////////////////////////////////////////////////////////////////////////////////////////

{
  "providerName": "Bitcoin Mainnet (Blockstream)",
  "networkType": "BTC",
  "network": "mainnet",
  "symbol": "BTC",
  "assetName": "Bitcoin",
  "rpcUrl": "https://blockstream.info/api",
  "explorerUrl": "https://blockstream.info",
  "apiType": "blockstream",
  "minRelayFeeSatsPerVByte": 38,
  "defaultFeeSatsPerVByte": 50,
  "rpcMethods": {
    "getBalance": { "method": "address/<address>", "getOrPost": "GET", "field": "chain_stats.funded_txo_sum - chain_stats.spent_txo_sum" },
    "getFee": { "method": "fee-estimates", "getOrPost": "GET" },
    "sendTransaction": { "method": "/tx", "getOrPost": "POST", "contentType": "text/plain" }
  }
},

{
  "providerName": "Bitcoin Mainnet (BlockCypher)",
  "networkType": "BTC",
  "network": "mainnet",
  "symbol": "BTC",
  "assetName": "Bitcoin",
  "rpcUrl": "https://api.blockcypher.com/v1/btc/main",
  "explorerUrl": "https://live.blockcypher.com/btc",
  "apiType": "blockcypher",
  "minRelayFeeSatsPerVByte": 38,
  "defaultFeeSatsPerVByte": 50,
  "rpcMethods": {
    "getBalance": { "method": "addrs/<address>/balance", "getOrPost": "GET", "field": "final_balance" },
    "getFee": { "method": "txs", "getOrPost": "GET" },
    "sendTransaction": { "method": "/txs/push", "getOrPost": "POST", "contentType": "application/json" }
  }
},



];

return { providers };

})();
