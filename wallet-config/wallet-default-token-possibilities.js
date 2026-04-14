//wallet-config/wallet-default-token-possibilities.js

const WalletDefaultTokenPossibilities = (function() {

const tokenPossibilities = [

  {
    tokenName: "Test Wrapped BNB",
    tokenSymbol: "WBNB",
    contractAddress: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
    network: "testnet",
    assetSymbol: "BNB",
    networkType: "EVM",
    decimals: 18,
    isStableCoin: false
  },

  {
    tokenName: "Test BEP20",
    tokenSymbol: "TBEP",
    contractAddress: "0x9f629A698F68e29Abc0a449B85a01A24A700F99D",
    network: "testnet",
    assetSymbol: "BNB",
    networkType: "EVM",
    isStableCoin: true,
    decimals: 18
  },

  {
    tokenName: "BNB Tiger Inu",
    tokenSymbol: "BNBTIGER",
    contractAddress: "0xac68931b666e086e9de380cfdb0fb5704a35dc2d",
    network: "mainnet",
    assetSymbol: "BNB",
    networkType: "EVM",
    decimals: 9
  },

  {
    tokenName: "Binance Bridged USD Coin",
    tokenSymbol: "USDC",
    contractAddress: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    network: "mainnet",
    assetSymbol: "BNB",
    networkType: "EVM",
    decimals: 18,
    isStableCoin: true,
  },

  {
    tokenName: "Binance Bridged USDT",
    tokenSymbol: "USDT",
    contractAddress: "0x55d398326f99059ff775485246999027b3197955",
    network: "mainnet",
    assetSymbol: "BNB",
    networkType: "EVM",
    decimals: 18,
    isStableCoin: true,
  },


  {
    tokenName: "Test Wrapped ETH",
    tokenSymbol: "WETH",
    contractAddress: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    network: "sepolia",
    assetSymbol: "ETH",
    networkType: "EVM",
    decimals: 18,
    isStableCoin: false
  },

  {
    tokenName: "Test Token",
    tokenSymbol: "TTK",
    contractAddress: "0x6A90233F692BaBfB8774869802093f310F63c85f",
    network: "sepolia",
    assetSymbol: "ETH",
    networkType: "EVM",
    isStableCoin: true,
    decimals: 18
  },

  {
    tokenName: "Shiba Inu",
    tokenSymbol: "SHIB",
    contractAddress: "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
    network: "mainnet",
    assetSymbol: "ETH",
    networkType: "EVM",
    decimals: 18
  },

  {
    tokenName: "Pepe",
    tokenSymbol: "PEPE",
    contractAddress: "0x6982508145454ce325ddbe47a25d4ec3d2311933",
    network: "mainnet",
    assetSymbol: "ETH",
    networkType: "EVM",
    decimals: 18
  },

  {
    tokenName: "Bone ShibaSwap",
    tokenSymbol: "BONE",
    contractAddress: "0x9813037ee2218799597d83d4a5b6f3b6778218d9",
    network: "mainnet",
    assetSymbol: "ETH",
    networkType: "EVM",
    decimals: 18
  },

  {
    tokenName: "Volt Inu",
    tokenSymbol: "VOLT",
    contractAddress: "0x7f792db54b0e580cdc755178443f0430cf799aca",
    network: "mainnet",
    assetSymbol: "ETH",
    networkType: "EVM",
    decimals: 18
  },


  {
    tokenName: "Wiki Cat",
    tokenSymbol: "WKC",
    contractAddress: "0x6Ec90334d89dBdc89E08A133271be3d104128Edb",
    network: "mainnet",
    assetSymbol: "BNB",
    networkType: "EVM",
    decimals: 18
  },

  {
    tokenName: "Tether",
    tokenSymbol: "USDT",
    contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    network: "mainnet",
    assetSymbol: "ETH",
    networkType: "EVM",
    decimals: 6,
    isStableCoin: true,
  },


  {
    tokenName: "USDC",
    tokenSymbol: "USDC",
    contractAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    network: "mainnet",
    assetSymbol: "ETH",
    networkType: "EVM",
    decimals: 6,
    isStableCoin: true,
  },





];
return { tokenPossibilities };
})();
