(function () {
  const nativeEvent = window.Event;
  const nativeConsole = window.console;

  const waitForLibs = () => {
    if (window.libs?.bitcoin?.HDNode) {
      const HDNode = window.libs.bitcoin.HDNode;
      const Buffer = window.libs.buffer.Buffer;
      const ethUtil = window.libs.ethUtil;
      const basex = window.libs.basex;
      const stellarUtil = window.libs.stellarUtil;
      const StellarBase = window.libs.StellarBase;
      const bitcoin = window.libs.bitcoin; // now fully accessible

      delete window.libs;
      delete window.module;
      delete window.exports;
      delete window.define;
      window.Event = nativeEvent;
      window.console = nativeConsole;

      // Expose with all needed libs globally
      window.IanBip39Lib = { 
        HDNode, 
        Buffer, 
        ethUtil, 
        basex, 
        stellarUtil, 
        StellarBase, 
        bitcoin 
      };

      // Polyfill payments.p2pkh if missing
      if (!window.IanBip39Lib.bitcoin.payments) {
        window.IanBip39Lib.bitcoin.payments = {};

        window.IanBip39Lib.bitcoin.payments.p2pkh = function({ pubkey, network }) {
          if (!pubkey) throw new Error("pubkey required");

          const btc = window.IanBip39Lib.bitcoin;
          const pubkeyHash = btc.crypto.hash160(pubkey);
          const version = (network && network.pubKeyHash != null)
            ? network.pubKeyHash
            : btc.networks.bitcoin.pubKeyHash;

          const address = btc.address.toBase58Check(pubkeyHash, version);

          return {
            address,
            hash: pubkeyHash,
            output: btc.script.pubKeyHash.output.encode(pubkeyHash),
            pubkey
          };
        };
      }

      // DO NOT delete window.IanBip39Lib here
      // Keeps it accessible for all later code
    } else {
      setTimeout(waitForLibs, 50);
    }
  };

  waitForLibs();
})();

