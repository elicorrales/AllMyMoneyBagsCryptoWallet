// proxy-handlers/handleSecret.mjs
import { timestamp } from '../proxy-lib/originsAndCorsHeaders.mjs';
import { decryptBody, encryptBody } from '../proxy-lib/encryptDecrypt.mjs';
import { shutdown } from '../proxy-lib/manageProxyLocking.mjs';

async function handleGetSecret(req, res, state, server) {
  const {
    WALLET_CLIENT_PROXY_INIT_SECRET,
    PROXY_SESSION_SECRET,
    idleShutdownTimer,
    secretAlreadyServed,
    unauthorizedInitCount,
    MAX_UNAUTHORIZED_INIT
  } = state;

  let body = '';
  req.on('data', chunk => body += chunk);
  await new Promise(resolve => req.on('end', resolve));

  let parsed = {};
  try {
    parsed = decryptBody(JSON.parse(body).encrypted, WALLET_CLIENT_PROXY_INIT_SECRET);
  } catch (err) {
    console.log(`${timestamp()} Failed to decrypt /secret body:`, err.message || err);
    res.writeHead(400, { 'content-type': 'text/plain' });
    res.end('Bad Request');
    return;
  }

  const { initSecret: clientInitKey, walletOrigin: clientOrigin } = parsed;

  if (clientInitKey !== WALLET_CLIENT_PROXY_INIT_SECRET) {
    state.unauthorizedInitCount++;
    console.log(`${timestamp()} Unauthorized /secret request (${state.unauthorizedInitCount}/${MAX_UNAUTHORIZED_INIT})`);
    res.writeHead(401, { 'content-type': 'text/plain' });
    res.end('Unauthorized');
    if (state.unauthorizedInitCount >= MAX_UNAUTHORIZED_INIT) {
      if (state.idleShutdownTimer) clearTimeout(state.idleShutdownTimer);
      server.close(() => shutdown());
    }
    return;
  }

  if (!PROXY_SESSION_SECRET || secretAlreadyServed) {
    res.writeHead(403, { 'content-type': 'text/plain' });
    res.end(secretAlreadyServed ? 'Secret already served' : 'Secret not available');
    return;
  }

  state.secretAlreadyServed = true;
  if (state.idleShutdownTimer) {
    clearTimeout(state.idleShutdownTimer);
    state.idleShutdownTimer = null;
  }

  // Encrypt response
  let encryptedResponse;
  try {
    encryptedResponse = await encryptBody({ secret: PROXY_SESSION_SECRET }, WALLET_CLIENT_PROXY_INIT_SECRET);
  } catch (err) {
    console.log(`${timestamp()} Failed to encrypt /secret response:`, err.message || err);
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('Internal Server Error');
    return;
  }

  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ encrypted: encryptedResponse }));
  console.log(`${timestamp()} ✅ Secret served to client (encrypted)`);
}

export { handleGetSecret };

