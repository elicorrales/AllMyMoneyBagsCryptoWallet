// wallet-networks-encryption.js

// Use crypto.subtle API for simple AES-GCM encryption/decryption

async function getKeyFromPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptNetworks(networks, password) {
  const enc = new TextEncoder();
  const data = enc.encode(JSON.stringify(networks));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKeyFromPassword(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  // Store salt, iv and encrypted data all base64 encoded as one string
  return btoa(String.fromCharCode(...salt)) + ":" +
         btoa(String.fromCharCode(...iv)) + ":" +
         btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

async function decryptNetworks(encryptedString, password) {
  const [saltB64, ivB64, dataB64] = encryptedString.split(":");
  if (!saltB64 || !ivB64 || !dataB64) throw new Error("Invalid encrypted format");

  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const data = Uint8Array.from(atob(dataB64), c => c.charCodeAt(0));

  const key = await getKeyFromPassword(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted));
}

