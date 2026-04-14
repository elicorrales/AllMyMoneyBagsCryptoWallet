// proxy-lib/encryptDecrypt.mjs
import crypto from 'crypto';

export function decryptBody(base64String, sharedSecret) {

  //console.log('[decryptBody] Shared secret:', sharedSecret);

  const key = crypto.createHash('sha256').update(sharedSecret).digest(); // 32-byte key

  //console.log('[decryptBody] Key (hex):', key.toString('hex'));

  const data = Buffer.from(base64String, 'base64');
  const iv = data.slice(0, 12);
  const ciphertextWithTag = data.slice(12);
  const tag = ciphertextWithTag.slice(-16);
  const ciphertext = ciphertextWithTag.slice(0, -16);

  //console.log('[decryptBody] IV:', iv.toString('hex'));
  //console.log('[decryptBody] Tag:', tag.toString('hex'));
  //console.log('[decryptBody] Ciphertext:', ciphertext.toString('hex'));

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}

export function encryptBody(body, sharedSecret) {
  const key = crypto.createHash('sha256').update(sharedSecret).digest(); // 32-byte key
  const iv = crypto.randomBytes(12); // 12-byte IV for AES-GCM

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(body), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const combined = Buffer.concat([iv, encrypted, tag]);
  return combined.toString('base64');
}

