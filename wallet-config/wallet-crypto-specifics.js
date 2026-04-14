//wallet-crypto-specifics

const WalletCryptoSpecifics = (function() {

const specifics = {

TBEP: {
  newDestAddressRequirements: {
    minimumSend: {
      minimum: null,
      message: "You can send any amount of TBEP to a new address, but keep in mind gas fees apply regardless of amount."
    }
  },
  existingDestAddressRequirements: {
    minimumSend: {
      minimum: 10, // adjust as sensible for testing
      message: "For existing TBEP addresses, we recommend sending at least {minimum} TBEP to cover gas and avoid dust amounts."
    }
  },
  originAddressRequirements: {
    minOriginBalance: {
      minimum: 100, // keep some SHIB in origin for gas
      message: "You need at least {minBalance} TBEP in your account to send {send}, cover fees, and keep the required reserve."
    }
  }
},


TTK: {
  newDestAddressRequirements: {
    minimumSend: {
      minimum: null,
      message: "You can send any amount of TTK to a new address, but keep in mind gas fees apply regardless of amount."
    }
  },
  existingDestAddressRequirements: {
    minimumSend: {
      minimum: 10, // adjust as sensible for testing
      message: "For existing TTK addresses, we recommend sending at least {minimum} TTK to cover gas and avoid dust amounts."
    }
  },
  originAddressRequirements: {
    minOriginBalance: {
      minimum: 100, // keep some SHIB in origin for gas
      message: "You need at least {minBalance} TTK in your account to send {send}, cover fees, and keep the required reserve."
    }
  }
},


SHIB: {
  newDestAddressRequirements: {
    minimumSend: {
      minimum: null,
      message: "You can send any amount of SHIB to a new address, but keep in mind gas fees apply regardless of amount."
    }
  },
  existingDestAddressRequirements: {
    minimumSend: {
      minimum: 10, // adjust as sensible for testing
      message: "For existing SHIB addresses, we recommend sending at least {minimum} SHIB to cover gas and avoid dust amounts."
    }
  },
  originAddressRequirements: {
    minOriginBalance: {
      minimum: 100, // keep some SHIB in origin for gas
      message: "You need at least {minBalance} SHIB in your account to send {send}, cover fees, and keep the required reserve."
    }
  }
},

  XLM: {
    newDestAddressRequirements: {
      minimumSend: {
        //minimum: 1,
        minimum: 1,
        message: "To send XLM to a new address, you must send at least {minimum} XLM to activate it. We recommend this minimum to ensure your payment is accepted and not lost."
      }
    },
    existingDestAddressRequirements: {
      minimumSend: {
        minimum: 0.0001,
        message: "For existing XLM addresses, we recommend sending at least {minimum} XLM to avoid sending very small amounts that may not be practical."
      }
    },
    originAddressRequirements: {
      minOriginBalance: {
        minimum: 2,
        message: "You need at least {minBalance} in your account to send {send}, cover fees, and keep the required reserve."
      }
    }
  },


  ETH: {
    newDestAddressRequirements: {
      minimumSend: {
        minimum: null,
        message: "You can send any amount of ETH to a new address, but keep in mind gas fees apply regardless of amount."
      }
    },
    existingDestAddressRequirements: {
      minimumSend: {
        minimum: 0.001,
        message: "For existing ETH addresses, we recommend sending at least {minimum} ETH so that gas fees don’t exceed the value sent."
      }
    },
    originAddressRequirements: {
      minOriginBalance: {
        minimum: 0.01,
        message: "You need at least {minBalance} in your account to send {send}, cover fees, and keep the required reserve."
      }
    }
  },
  XRP: {
    newDestAddressRequirements: {
      minimumSend: {
        minimum: 1,
        message: "To send XRP to a new address, you must send at least {minimum} XRP to activate it. This ensures the address is created on the network."
      }
    },
    existingDestAddressRequirements: {
      minimumSend: {
        minimum: 0.000001,
        message: "For existing XRP addresses, we recommend sending at least {minimum} XRP to avoid sending amounts too small to be useful."
      }
    },
    originAddressRequirements: {
      minOriginBalance: {
        minimum: 1,
        message: "You need at least {minBalance} in your account to send {send}, cover fees, and keep the required reserve."
      }
    }
  },

  BNB: {
    newDestAddressRequirements: {
      minimumSend: {
        minimum: null,
        message: "You can send any amount of BNB to a new address, but remember gas fees apply regardless of amount."
      }
    },
    existingDestAddressRequirements: {
      minimumSend: {
        minimum: 0.001,
        message: "For existing BNB addresses, we recommend sending at least {minimum} BNB so gas fees don’t outweigh the transfer."
      }
    },
    originAddressRequirements: {
      minOriginBalance: {
        minimum: 0.02,
        message: "You need at least {minBalance} BNB in your account to send {send}, cover gas fees, and keep the required reserve."
      }
    }
  },

  BTC: {
    newDestAddressRequirements: {
      minimumSend: {
        minimum: null,
        message: "You can send any amount of BTC to a new address. Unlike XLM or XRP, Bitcoin addresses don’t require activation, but keep in mind miner fees apply regardless of the amount."
      }
    },
    existingDestAddressRequirements: {
      minimumSend: {
        minimum: 0.00001, // ~1,000 satoshis, avoids 'dust' UTXOs
        message: "For existing BTC addresses, we recommend sending at least {minimum} BTC to avoid dust outputs that may be uneconomical to spend later."
      }
    },
    originAddressRequirements: {
      minOriginBalance: {
        minimum: 0.00005, // ~5,000 sats, small buffer to cover fees
        message: "You need at least {minBalance} BTC in your account to send {send}, cover miner fees, and avoid creating unspendable dust."
      }
    }
  },

  POL: {
    newDestAddressRequirements: {
      minimumSend: {
        minimum: null,
        message: "You can send any amount of POL to a new address, but keep in mind gas fees apply regardless of amount."
      }
    },
    existingDestAddressRequirements: {
      minimumSend: {
        minimum: 0.001,
        message: "For existing POL addresses, we recommend sending at least {minimum} POL so gas fees don’t exceed the value sent."
      }
    },
    originAddressRequirements: {
      minOriginBalance: {
        minimum: 0.01,
        message: "You need at least {minBalance} POL in your account to send {send}, cover fees, and keep the required reserve."
      }
    }
  },

  WETH: {
    newDestAddressRequirements: {
      minimumSend: {
        minimum: null,
        message: "You can send any amount of WETH to a new address, but keep in mind gas fees apply regardless of amount."
      }
    },
    existingDestAddressRequirements: {
      minimumSend: {
        minimum: 0.001,
        message: "For existing WETH addresses, we recommend sending at least {minimum} WETH so that gas fees don’t exceed the value sent."
      }
    },
    originAddressRequirements: {
      minOriginBalance: {
        minimum: 0.01,
        message: "You need at least {minBalance} WETH in your account to send {send}, cover fees, and keep the required reserve."
      }
    }
  },

  WBNB: {
    newDestAddressRequirements: {
      minimumSend: {
        minimum: null,
        message: "You can send any amount of WBNB to a new address, but keep in mind gas fees apply regardless of amount."
      }
    },
    existingDestAddressRequirements: {
      minimumSend: {
        minimum: 0.001,
        message: "For existing WBNB addresses, we recommend sending at least {minimum} WBNB so that gas fees don’t exceed the value sent."
      }
    },
    originAddressRequirements: {
      minOriginBalance: {
        minimum: 0.01,
        message: "You need at least {minBalance} WBNB in your account to send {send}, cover fees, and keep the required reserve."
      }
    }
  },

};


return { specifics };

})();

