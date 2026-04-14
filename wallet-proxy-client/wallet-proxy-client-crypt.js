// wallet-proxy-client-crypt.js
const WalletClientCrypt = (function () {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let precomputedEncryptedPayload = null;

  async function getKey(sharedSecret) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(sharedSecret));
    return crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptBody(body, sharedSecret) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await getKey(sharedSecret);
    const encoded = encoder.encode(JSON.stringify(body));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
  }

  async function precompute(body, sharedSecret) {
    precomputedEncryptedPayload = await encryptBody(body, sharedSecret);
  }

  function getPrecomputed() {
    return precomputedEncryptedPayload;
  }

  async function decryptBody(encryptedBase64, sharedSecret) {
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const key = await getKey(sharedSecret); // <-- use local function, not WalletClientCrypt.getKey
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  }

  return {
    encryptBody,
    decryptBody,
    precompute,
    getPrecomputed
  };
})();

//window.WalletClientCrypt = WalletClientCrypt;

