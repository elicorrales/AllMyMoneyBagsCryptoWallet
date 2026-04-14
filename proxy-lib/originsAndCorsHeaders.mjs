// proxy-lib/originsAndCorsHeaders.mjs
// Utility functions for rpc-proxy-server

import { ALLOWED_ORIGINS } from './constants.mjs';

function timestamp() {
  return new Date().toISOString();
}

function setCorsHeaders(res, origin) {
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, x-api-key, X-Init-Key, x-init-key, X-Wallet-Origin, x-wallet-origin, X-Secret-Key, x-secret-key, x-rpc-url');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function isOriginAllowed(origin) {
  if (typeof origin !== 'string') return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;

  for (const allowed of ALLOWED_ORIGINS) {
    if (allowed.endsWith('-') && origin.startsWith(allowed)) return true;
  }
  return false
}

function tryParseJson(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

export {
  timestamp,
  setCorsHeaders,
  isOriginAllowed,
  tryParseJson,
};

