// proxy-handlers/handleAlert.mjs
import { timestamp } from '../proxy-lib/originsAndCorsHeaders.mjs';
import { WALLET_CUSTOM_ORIGIN_HEADER, WALLET_EXPECTED_ORIGIN } from '../proxy-lib/constants.mjs';
import { decryptBody } from '../proxy-lib/encryptDecrypt.mjs';

async function handleAlertWrapped(req, res, state) {

  if (!req || typeof req.on !== 'function') {
    console.error('[handleAlertWrapped] ERROR: req is not a stream!');
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Server error: invalid request object');
    }
    return false;
  }

  let body = '';
  try {
    await new Promise((resolve, reject) => {
      req.on('data', chunk => body += chunk);
      req.on('end', resolve);
      req.on('error', reject);
    });
  } catch (err) {
    console.error('[handleAlertWrapped] Error reading request body:', err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Server error reading body');
    }
    return false;
  }

  let parsed = {};
  try {
    const received = JSON.parse(body || '{}');

    if (!received.encrypted) throw new Error('Missing encrypted payload');

    parsed = decryptBody(received.encrypted, state.WALLET_CLIENT_PROXY_INIT_SECRET);
  } catch (err) {
    console.log(`${timestamp()} Failed to decrypt /alert body:`, err.message || err);
    if (!res.headersSent) {
      res.writeHead(204); // silently ignore invalid alerts
      res.end();
    }
    return false;
  }

  try {
    return handleAlert(parsed, state);
  } catch (err) {
    console.error('[handleAlertWrapped] Unexpected error in handleAlert:', err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Server error during alert handling');
    }
    return false;
  }
}

function handleAlert({ from, secret }, state) {
  if (from === 'wallet' && secret === state.PROXY_SESSION_SECRET) {
    console.log(`${timestamp()} Valid alert received from wallet`);
    return true;
  } else {
    console.log(`${timestamp()} Invalid alert — ignored`);
    return false;
  }
}

export { handleAlertWrapped, handleAlert };

