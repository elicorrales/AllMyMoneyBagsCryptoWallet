// wallet-default-pol-asset-providers.js

const WalletDefaultPolAssetProviders = (function() {
const providers = [

////////////////////////////////////////////////////////////////////////////////////////
// Polygon PoS Mainnet (chainId 137)
////////////////////////////////////////////////////////////////////////////////////////

{
  providerName: "Polygon Mainnet (Ankr)",
  rpcUrl: "https://rpc.ankr.com/polygon",
  chainId: 137,
  network: "mainnet",
  symbol: "POL",
  assetName: "Polygon",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  rpcMethods: {
    getBalance: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice", getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas", getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce: { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction: { method: "eth_sendRawTransaction", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Polygon Mainnet (polygon-bor publicnode)",
  rpcUrl: "https://polygon-bor-rpc.publicnode.com",
  chainId: 137,
  network: "mainnet",
  symbol: "POL",
  assetName: "Polygon",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  rpcMethods: {
    getBalance: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice", getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas", getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce: { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction: { method: "eth_sendRawTransaction", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Polygon Mainnet (dRPC)",
  rpcUrl: "https://polygon.drpc.org",
  chainId: 137,
  network: "mainnet",
  symbol: "POL",
  assetName: "Polygon",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  rpcMethods: {
    getBalance: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice", getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas", getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce: { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction: { method: "eth_sendRawTransaction", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Polygon Mainnet (Blast API)",
  rpcUrl: "https://polygon-mainnet.public.blastapi.io",
  chainId: 137,
  network: "mainnet",
  symbol: "POL",
  assetName: "Polygon",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  rpcMethods: {
    getBalance: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice", getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas", getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce: { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction: { method: "eth_sendRawTransaction", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

////////////////////////////////////////////////////////////////////////////////////////
// Polygon Amoy Testnet (chainId 80002)
////////////////////////////////////////////////////////////////////////////////////////

{
  providerName: "Polygon Amoy Testnet (publicnode)",
  rpcUrl: "https://polygon-amoy-bor-rpc.publicnode.com",
  chainId: 80002,
  network: "testnet",
  symbol: "POL",
  assetName: "Polygon",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  rpcMethods: {
    getBalance: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice", getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas", getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce: { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction: { method: "eth_sendRawTransaction", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Polygon Amoy Testnet (dRPC)",
  rpcUrl: "https://polygon.drpc.org",
  chainId: 80002,
  network: "testnet",
  symbol: "POL",
  assetName: "Polygon",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  rpcMethods: {
    getBalance: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice", getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas", getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce: { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction: { method: "eth_sendRawTransaction", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Polygon Amoy Testnet (Tatum)",
  rpcUrl: "https://polygon-amoy.gateway.tatum.io",
  chainId: 80002,
  network: "testnet",
  symbol: "POL",
  assetName: "Polygon",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  rpcMethods: {
    getBalance: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice", getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas", getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce: { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction: { method: "eth_sendRawTransaction", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},



];

return { providers };

})();

