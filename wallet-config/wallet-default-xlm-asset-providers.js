// wallet-default-xlm-asset-providers.js

const WalletDefaultXlmAssetProviders = (function() {
const providers = [


////////////////////////////////////////////////////////////////////////////////////////
// XLM Stellar
////////////////////////////////////////////////////////////////////////////////////////

// --- ADD THESE TO YOUR providers ARRAY ---

// 1. GetBlock (Testnet)
{
  providerName: "Stellar Testnet (GetBlock)",
  rpcUrl: "https://go.getblock.io/1f64cded573e45c09d30b3e2c405c12d", // Replace with your GetBlock API Key
  network: "testnet",
  symbol: "XLM",
  assetName: "Stellar",
  networkType: "XLM",
  explorerUrl: "https://testnet.steexp.com/",
  faucetUrl: "https://laboratory.stellar.org/#account-creator?network=test",
  providerApiKey: "YOUR_API_KEY", // GetBlock requires API keys
  chainId: null,
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  apiType: "horizon",
  rpcMethods: {
    getBalance: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    getFee: { method: "fee_stats", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    sendTransaction: { method: "transactions", getOrPost: "POST", contentType: "application/x-www-form-urlencoded", payloadFormat: "urlencoded" },
    determineDoesDestAddressExist: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" }
  }
},

// 2. LOBSTR (Mainnet - High Reliability)
{
  providerName: "Stellar Mainnet (LOBSTR)",
  rpcUrl: "https://horizon.stellar.lobstr.co",
  network: "mainnet",
  symbol: "XLM",
  assetName: "Stellar",
  networkType: "XLM",
  explorerUrl: "https://steexp.com/",
  faucetUrl: null,
  providerApiKey: null,
  chainId: null,
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  apiType: "horizon",
  rpcMethods: {
    getBalance: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    getFee: { method: "fee_stats", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    sendTransaction: { method: "transactions", getOrPost: "POST", contentType: "application/x-www-form-urlencoded", payloadFormat: "urlencoded" },
    determineDoesDestAddressExist: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" }
  }
},

{
  providerName: "Stellar Mainnet (Nodies)",
  rpcUrl: "https://stellar-horizon-public.nodies.app",
  network: "mainnet",
  symbol: "XLM",
  assetName: "Stellar",
  networkType: "XLM",
  explorerUrl: "https://steexp.com/",
  faucetUrl: null,
  providerApiKey: null,
  chainId: null,
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  apiType: "horizon",
  rpcMethods: {
    getBalance: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    getFee: { method: "fee_stats", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    sendTransaction: { method: "transactions", getOrPost: "POST", contentType: "application/x-www-form-urlencoded", payloadFormat: "urlencoded" },
    determineDoesDestAddressExist: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" }
  }
},

{
  providerName: "Stellar Mainnet (OnFinality)",
  rpcUrl: "https://stellar.api.onfinality.io/public",
  network: "mainnet",
  symbol: "XLM",
  assetName: "Stellar",
  networkType: "XLM",
  explorerUrl: "https://steexp.com/",
  faucetUrl: null,
  providerApiKey: null,
  chainId: null,
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  apiType: "horizon",
  rpcMethods: {
    getBalance: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    getFee: { method: "fee_stats", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    sendTransaction: { method: "transactions", getOrPost: "POST", contentType: "application/x-www-form-urlencoded", payloadFormat: "urlencoded" },
    determineDoesDestAddressExist: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" }
  }
},

{
  providerName: "Stellar Testnet (Nodies)",
  rpcUrl: "https://stellar-horizon-testnet-public.nodies.app",
  network: "testnet",
  symbol: "XLM",
  assetName: "Stellar",
  networkType: "XLM",
  explorerUrl: "https://testnet.steexp.com/",
  faucetUrl: "https://laboratory.stellar.org/#account-creator?network=test",
  providerApiKey: null,
  chainId: null,
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  apiType: "horizon",
  rpcMethods: {
    getBalance: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    getFee: { method: "fee_stats", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    sendTransaction: { method: "transactions", getOrPost: "POST", contentType: "application/x-www-form-urlencoded", payloadFormat: "urlencoded" },
    determineDoesDestAddressExist: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" }
  }
},

{
  providerName: "Stellar Testnet (Horizon Official)",
  rpcUrl: "https://horizon-testnet.stellar.org",
  network: "testnet",
  symbol: "XLM",
  assetName: "Stellar",
  networkType: "XLM",
  explorerUrl: "https://testnet.steexp.com/",
  faucetUrl: "https://laboratory.stellar.org/#account-creator?network=test",
  providerApiKey: null,
  chainId: null,
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  apiType: "horizon",
  rpcMethods: {
    getBalance: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    getFee: { method: "fee_stats", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    sendTransaction: { method: "transactions", getOrPost: "POST", contentType: "application/x-www-form-urlencoded", payloadFormat: "urlencoded" },
    determineDoesDestAddressExist: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" }
  }
},


{
  providerName: "Stellar Mainnet (Ankr)",
  rpcUrl: "https://rpc.ankr.com/http/stellar_horizon",
  network: "mainnet",
  symbol: "XLM",
  assetName: "Stellar",
  networkType: "XLM",
  explorerUrl: "https://steexp.com/",
  faucetUrl: null,
  providerApiKey: null,
  chainId: null,
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  apiType: "horizon",
  rpcMethods: {
    getBalance: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    getFee: { method: "fee_stats", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    sendTransaction: { method: "transactions", getOrPost: "POST", contentType: "application/x-www-form-urlencoded", payloadFormat: "urlencoded" },
    determineDoesDestAddressExist: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" }
  }
},

{
  providerName: "Stellar Testnet (Ankr)",
  rpcUrl: "https://rpc.ankr.com/http/stellar_testnet_horizon",
  network: "testnet",
  symbol: "XLM",
  assetName: "Stellar",
  networkType: "XLM",
  explorerUrl: "https://testnet.steexp.com/",
  faucetUrl: "https://laboratory.stellar.org/#account-creator?network=test",
  providerApiKey: null,
  chainId: null,
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  apiType: "horizon",
  rpcMethods: {
    getBalance: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    getFee: { method: "fee_stats", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" },
    sendTransaction: { method: "transactions", getOrPost: "POST", contentType: "application/x-www-form-urlencoded", payloadFormat: "urlencoded" },
    determineDoesDestAddressExist: { method: "accounts", getOrPost: "GET", contentType: "application/json", payloadFormat: "none" }
  }
},



];
return { providers };

})();
