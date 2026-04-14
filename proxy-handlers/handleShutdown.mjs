// proxy-handlers/handleShutdown.mjs
import { timestamp } from '../proxy-lib/originsAndCorsHeaders.mjs';
import { WALLET_EXPECTED_ORIGIN, WALLET_CUSTOM_ORIGIN_HEADER } from '../proxy-lib/constants.mjs';
import { shutdown } from '../proxy-lib/manageProxyLocking.mjs';
import { decryptBody } from '../proxy-lib/encryptDecrypt.mjs';

async function handleShutdown(req, res, state, server, calledFromAlert=false) {

  if (calledFromAlert) {
    console.log(`${timestamp()} Shutdown request accepted. Closing server...`);
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('Proxy shutting down...');

    if (server) {
      server.close(() => {
        console.log(`${timestamp()} Server closed. Exiting now.`);
        shutdown();
      });
    } else {
      shutdown();
    }
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  await new Promise(resolve => req.on('end', resolve));

  let parsed = {};
  try {
    const received = JSON.parse(body || '{}');

    if (!received.encrypted) throw new Error('Missing encrypted payload');

    parsed = decryptBody(received.encrypted, state.WALLET_CLIENT_PROXY_INIT_SECRET);
    console.log(`${timestamp()} Decrypted payload: ${JSON.stringify(parsed)}`);
  } catch (err) {
    console.log(`${timestamp()} Failed to decrypt /shutdown body:`, err.message || err);
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'BAD_REQUEST' }));
    return;
  }

  const walletOrigin = parsed[WALLET_CUSTOM_ORIGIN_HEADER];

  if (walletOrigin !== WALLET_EXPECTED_ORIGIN) {
    console.log(`${timestamp()} Forbidden shutdown: invalid wallet origin (${walletOrigin})`);
    res.writeHead(403, { 'content-type': 'text/plain' });
    res.end('Forbidden: invalid wallet origin');
    return;
  }

  const secret = parsed['x-secret-key'];
  if (secret !== state.PROXY_SESSION_SECRET) {
    console.log(`${timestamp()} Forbidden shutdown: invalid or missing API key`);
    res.writeHead(401, { 'content-type': 'text/plain' });
    res.end('Forbidden: invalid or missing API key');
    return;
  }

  console.log(`${timestamp()} Shutdown request accepted. Closing server...`);
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('Proxy shutting down...');

  if (server) {
    server.close(() => {
      console.log(`${timestamp()} Server closed. Exiting now.`);
      shutdown();
    });
  } else {
    shutdown();
  }
}

export { handleShutdown };

