// proxy-handlers/handleVerifySecret.mjs
import { timestamp } from '../proxy-lib/originsAndCorsHeaders.mjs';
import { shutdown } from '../proxy-lib/manageProxyLocking.mjs';
import { decryptBody } from '../proxy-lib/encryptDecrypt.mjs';

async function handleVerifySecret(req, res, state, server) {
  let body = '';
  req.on('data', chunk => body += chunk);
  await new Promise(resolve => req.on('end', resolve));

  let parsed = {};
  try {
    const received = JSON.parse(body || '{}');

    if (!received.encrypted) throw new Error('Missing encrypted payload');

    parsed = decryptBody(received.encrypted, state.WALLET_CLIENT_PROXY_INIT_SECRET);
  } catch (err) {
    console.log(`${timestamp()} Failed to decrypt /verify-secret body:`, err.message || err);
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'BAD_REQUEST' }));
    return;
  }

  const candidateSecret = parsed['x-secret-key'];

  if (!candidateSecret || typeof candidateSecret !== 'string') {
    res.writeHead(400, { 'content-type': 'text/plain' });
    res.end('Missing or invalid x-secret-key');
    return;
  }

  if (candidateSecret === state.PROXY_SESSION_SECRET) {
    state.verifySecretAttempts = 0;
    console.log(`${timestamp()} ✅ verify-secret: correct, counter reset`);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ valid: true }));
    return;
  }

  state.verifySecretAttempts++;
  console.log(`${timestamp()} ❌ verify-secret failed (${state.verifySecretAttempts}/${state.MAX_VERIFY_ATTEMPTS})`);

  if (state.verifySecretAttempts >= state.MAX_VERIFY_ATTEMPTS) {
    console.log(`${timestamp()} verify-secret failed too many times; shutting down`);
    res.writeHead(403, { 'content-type': 'text/plain' });
    res.end('Too many incorrect verify attempts; shutting down');
    if (state.idleShutdownTimer) {
      clearTimeout(state.idleShutdownTimer);
      console.log(`${timestamp()} Cleared idleShutdownTimer`);
    }
    server.close(() => {
      console.log(`${timestamp()} Server close callback triggered, exiting process now`);
      shutdown();
    });
    return;
  }

  res.writeHead(401, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ valid: false, remaining: state.MAX_VERIFY_ATTEMPTS - state.verifySecretAttempts }));
}

export { handleVerifySecret };

