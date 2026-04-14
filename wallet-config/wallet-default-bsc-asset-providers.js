// wallet-default-bsc-asset-providers.js

const WalletDefaultBscAssetProviders = (function() {
const providers = [


////////////////////////////////////////////////////////////////////////////////////////
// BSC (Binance Smart Chain)
////////////////////////////////////////////////////////////////////////////////////////



{
  providerName: "BSC Testnet (dRPC)",
  rpcUrl: "https://bsc-testnet.drpc.org/",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },

    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},


{
  providerName: "BSC Testnet (ENVIO)",
  rpcUrl: "https://bsc-testnet.rpc.hypersync.xyz/",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Testnet (OMNIA)",
  rpcUrl: "https://endpoints.omniatech.io/v1/bsc/testnet/public",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Testnet (TheRPC)",
  rpcUrl: "https://bsc-testnet.therpc.io",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Testnet (thirdweb)",
  rpcUrl: "https://binance-testnet.rpc.thirdweb.com/",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},


{
  providerName: "BSC Mainnet (Blast API)",
  rpcUrl: "https://bsc-mainnet.public.blastapi.io",
  chainId: 56,
  network: "mainnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},


{
  providerName: "BSC Mainnet (BlockEden.xyz)",
  rpcUrl: "https://api.blockeden.xyz/bsc/67nCBdZQSH9z3YqDDjdm",
  chainId: 56,
  network: "mainnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Mainnet (bloXroute Labs)",
  rpcUrl: "https://bsc.rpc.blxrbdn.com",
  chainId: 56,
  network: "mainnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Mainnet (dRPC)",
  rpcUrl: "https://bsc.drpc.org/",
  chainId: 56,
  network: "mainnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Mainnet (ENVIO)",
  rpcUrl: "https://bsc.rpc.hypersync.xyz/",
  chainId: 56,
  network: "mainnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Mainnet (Fastnode.io)",
  rpcUrl: "https://public-bsc-mainnet.fastnode.io/",
  chainId: 56,
  network: "mainnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Mainnet (Grove)",
  rpcUrl: "https://bsc.rpc.grove.city/v1/01fdb492",
  chainId: 56,
  network: "mainnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},


{
  providerName: "BSC Mainnet (GetBlock)",
  rpcUrl: "https://go.getblock.us/92e9e5a052504b589d256c53387e34b9",
  chainId: 56,
  network: "mainnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Mainnet (1RPC)",
  rpcUrl: "https://1rpc.io/bnb",
  chainId: 56,
  network: "mainnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Mainnet (Allnodes)",
  rpcUrl: "https://bsc.publicnode.com",
  chainId: 56,
  network: "mainnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Mainnet (Binance.org)",
  rpcUrl: "https://bsc-dataseed.binance.org/",
  chainId: 56,
  network: "mainnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},




{
  providerName: "BSC Testnet (Allnodes)",
  rpcUrl: "https://bsc-testnet.publicnode.com",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: "https://testnet.bnbchain.org/faucet-smart",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Testnet (Binance.org Seed 1-S1)",
  rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: "https://testnet.bnbchain.org/faucet-smart",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},



{
  providerName: "BSC Testnet (NodeReal)",
  rpcUrl: "https://bsc-testnet.nodereal.io/v1/e9a36765eb8a40b9bd12e680a1fd2bc5",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: "https://testnet.bnbchain.org/faucet-smart",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Testnet (BNBChain Seed 2-S1)",
  rpcUrl: "https://data-seed-prebsc-2-s1.bnbchain.org:8545/",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: "https://testnet.bnbchain.org/faucet-smart",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},


{
  providerName: "BSC Testnet (BNBChain Seed 1-S3)",
  rpcUrl: "https://data-seed-prebsc-1-s3.bnbchain.org:8545/",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: "https://testnet.bnbchain.org/faucet-smart",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Testnet (Binance Seed 1-S2)",
  rpcUrl: "https://data-seed-prebsc-1-s2.binance.org:8545/",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: "https://testnet.bnbchain.org/faucet-smart",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Testnet (Binance Seed 2-S2)",
  rpcUrl: "https://data-seed-prebsc-2-s2.binance.org:8545/",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: "https://testnet.bnbchain.org/faucet-smart",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},


{
  providerName: "BSC Testnet (BNBChain Seed 2-S2)",
  rpcUrl: "https://data-seed-prebsc-2-s2.bnbchain.org:8545/",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: "https://testnet.bnbchain.org/faucet-smart",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Testnet (BNBChain Seed 2-S3)",
  rpcUrl: "https://data-seed-prebsc-2-s3.bnbchain.org:8545/",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: "https://testnet.bnbchain.org/faucet-smart",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Testnet (Binance Seed 2-S3)",
  rpcUrl: "https://data-seed-prebsc-2-s3.binance.org:8545/",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: "https://testnet.bnbchain.org/faucet-smart",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Testnet (BNBChain Seed 1-S1)",
  rpcUrl: "https://data-seed-prebsc-1-s1.bnbchain.org:8545/",
  chainId: 97,
  network: "testnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: "https://testnet.bnbchain.org/faucet-smart",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},


{
  providerName: "BSC Mainnet (NodeReal)",
  rpcUrl: "https://bsc.nodereal.io",
  chainId: 56,
  network: "mainnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Mainnet (NodeReal v1)",
  rpcUrl: "https://bsc-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3",
  chainId: 56,
  network: "mainnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "BSC Mainnet (Defibit)",
  rpcUrl: "https://bsc-dataseed1.defibit.io",
  chainId: 56,
  network: "mainnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},


{
  providerName: "BSC Mainnet (Ninicoin)",
  rpcUrl: "https://bsc-dataseed1.ninicoin.io",
  chainId: 56,
  network: "mainnet",
  symbol: "BNB",
  assetName: "Binance Coin",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST", contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST", contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},


];
return { providers };

})();
