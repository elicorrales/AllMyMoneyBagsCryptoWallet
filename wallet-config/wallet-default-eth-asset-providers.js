// wallet-default-eth-asset-providers.js

const WalletDefaultEthAssetProviders = (function() {
const providers = [

////////////////////////////////////////////////////////////////////////////////////////
//Ethereum
////////////////////////////////////////////////////////////////////////////////////////
//WORKED

{
  providerName: "Ethereum Mainnet (GetBlock)",
  rpcUrl: "https://go.getblock.us/27eb23f40b964c9bb71b62f721e594e7",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},


{
  providerName: "Ethereum Mainnet (0xRPC)",
  rpcUrl: "https://0xrpc.io/eth",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (1RPC)",
  rpcUrl: "https://1rpc.io/eth",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (Alchemy)",
  rpcUrl: "https://eth-mainnet.g.alchemy.com/public",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (Allnodes)",
  rpcUrl: "https://ethereum.publicnode.com",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (Blast API)",
  rpcUrl: "https://eth-mainnet.public.blastapi.io",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (Blink)",
  rpcUrl: "https://ethereum.blinklabs.xyz/",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (BlockEden.xyz)",
  rpcUrl: "https://api.blockeden.xyz/eth/67nCBdZQSH9z3YqDDjdm",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (BlockPI)",
  rpcUrl: "https://ethereum.blockpi.network/v1/rpc/public",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (bloXroute Labs)",
  rpcUrl: "https://eth-protect.rpc.blxrbdn.com",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum V1 Mainnet (Cloudflare)",
  rpcUrl: "https://cloudflare-eth.com/v1/mainnet",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (Eden Network)",
  rpcUrl: "https://api.edennetwork.io/v1/rocket",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (ENVIO)",
  rpcUrl: "https://eth.rpc.hypersync.xyz/",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (Flashbots)",
  rpcUrl: "https://rpc.flashbots.net/",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (Grove)",
  rpcUrl: "https://eth.rpc.grove.city/v1/01fdb492",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (Kolibrio)",
  rpcUrl: "https://eth.meowrpc.com",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (LeoRPC)",
  rpcUrl: "https://eth.leorpc.com/?api_key=FREE",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (LlamaNodes)",
  rpcUrl: "https://eth.llamarpc.com",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (merkle)",
  rpcUrl: "https://eth.merkle.io/",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (MEV Blocker)",
  rpcUrl: "https://rpc.mevblocker.io",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (Node RPC)",
  rpcUrl: "https://api.noderpc.xyz/rpc-mainnet/public",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (Nodies)",
  rpcUrl: "https://ethereum-public.nodies.app",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (NOWNodes)",
  rpcUrl: "https://public-eth.nownodes.io/",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (OMNIA)",
  rpcUrl: "https://endpoints.omniatech.io/v1/eth/mainnet/public",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (OnFinality)",
  rpcUrl: "https://eth.api.onfinality.io/public",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",       getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Mainnet (dRPC)",
  rpcUrl: "https://eth.drpc.org",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  },
},

{
  providerName: "Ethereum Mainnet (Cloudflare)",
  rpcUrl: "https://cloudflare-eth.com",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},


{
  providerName: "Ethereum Mainnet (Ankr)",
  rpcUrl: "https://rpc.ankr.com/eth",
  chainId: 1,
  network: "mainnet",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},



{
  providerName: "Ethereum Holesky Testnet (DRPC)",
  rpcUrl: "https://holesky.drpc.org",
  chainId: 17000,
  network: "holesky",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: "https://holeskyfaucet.com",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},


{
  providerName: "Ethereum Sepolia Testnet (DRPC)",
  rpcUrl: "https://sepolia.drpc.org",
  chainId: 11155111,
  network: "sepolia",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: "https://faucet.sepolia.dev",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Testnet (GetBlock Shared)",
  rpcUrl: "https://go.getblock.io/75cdcd79a01041509b6203273ccd426b",
  chainId: 11155111,
  network: "sepolia",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: null,
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  },
},


{
  providerName: "Ethereum Sepolia Testnet (W3Node) (API)",
  rpcUrl: "https://sepolia-eth.w3node.com/25d7db36a6689f8073a81db535ab22d663f8e181f1483f57759a885c85592ddb/api",
  chainId: 11155111,
  network: "sepolia",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: "https://faucet.sepolia.dev",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},


{
  providerName: "Ethereum Sepolia Testnet (RockX)",
  rpcUrl: "https://rpc-sepolia.rockx.com",
  chainId: 11155111,
  network: "sepolia",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: "https://faucet.sepolia.dev",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

{
  providerName: "Ethereum Sepolia Testnet (Alchemy)",
  rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/demo",
  chainId: 11155111,
  network: "sepolia",
  symbol: "ETH",
  assetName: "Ethereum",
  networkType: "EVM",
  faucetUrl: "https://faucet.sepolia.dev",
  apiType: "jsonrpc",
  numRpcTimeoutErrors: null,
  numRpcTries: null,
  rpcMethods: {
    getBalance:         { method: "eth_getBalance",           getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    queryState: { method: "eth_call", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    getFee: [
      { method: "eth_gasPrice",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" },
      { method: "eth_estimateGas",          getOrPost: "POST",  contentType: "application/json", payloadFormat: "none" }
    ],
    getNonce:           { method: "eth_getTransactionCount",  getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    sendTransaction:    { method: "eth_sendRawTransaction",   getOrPost: "POST", contentType: "application/json", payloadFormat: "json" },
    determineDoesDestAddressExist: { method: "eth_getBalance", getOrPost: "POST", contentType: "application/json", payloadFormat: "json" }
  }
},

];
return { providers };

})();
