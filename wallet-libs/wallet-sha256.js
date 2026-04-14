const WalletSha256 = (function () {
  async function hash(data) {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(buf);
  }
  return {
    hash,
  };
})();
window.WalletSha256 = WalletSha256;

