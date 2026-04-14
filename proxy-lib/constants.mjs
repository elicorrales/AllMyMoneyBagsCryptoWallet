// proxy-lib/constants.mjs
// Shared constants for rpc-proxy-server

export const ALLOWED_ORIGINS = new Set([
  'null',              // file://
  'app://-',           // Tauri
  'file://wallet',     // add this line
  'http://localhost',
  'https://localhost',
  'http://localhost:8080',
  'https://localhost:8080',
]);

export const WALLET_CUSTOM_ORIGIN_HEADER = 'x-wallet-origin';
export const WALLET_EXPECTED_ORIGIN = 'file://wallet';

export const PORTS_TO_TRY = [18545, 18546, 18547, 18548, 18549];
export const MAX_UNAUTHORIZED_INIT = 3;
export const MAX_VERIFY_ATTEMPTS = 3;
export const SECRET_VALIDITY_SECONDS = 300;

