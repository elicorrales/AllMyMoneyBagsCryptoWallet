// proxy-handlers/handleStatusCheck.mjs
import { timestamp } from '../proxy-lib/originsAndCorsHeaders.mjs';
import { decryptBody } from '../proxy-lib/encryptDecrypt.mjs';

async function handleStatusCheck(req, res, port, state) {
  let body = '';
  req.on('data', chunk => body += chunk);
  await new Promise(resolve => req.on('end', resolve));

  let parsed = {};
  try {
    const received = JSON.parse(body || '{}');

    if (!received.encrypted) throw new Error('Missing encrypted payload');

    parsed = decryptBody(received.encrypted, state.WALLET_CLIENT_PROXY_INIT_SECRET);
  } catch (err) {
    console.log(`${timestamp()} Failed to decrypt /status body:`, err.message || err);

    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'BAD_REQUEST' }));
    return;
  }

  const {
    secret: proxySessionKey,
    origin: clientOrigin,
    url: rpcUrl,
    key: networkKey
  } = parsed;

  // ...rest of your existing secret checks and response logic here...

  if (proxySessionKey !== state.PROXY_SESSION_SECRET) {
    console.log(`${timestamp()} Unauthorized status check: Invalid SESSION SECRET`);

    res.writeHead(403, {
      'content-type': 'application/json',
      'x-wallet-auth': 'NEEDS_WALLET_AUTH',
      'access-control-expose-headers': 'x-wallet-auth'
    });

    console.log(`\n${timestamp()} Sending 403 with NEEDS_WALLET_AUTH\n`);

    res.end(JSON.stringify({ error: 'NEEDS_WALLET_AUTH' }));
    return;
  }

  console.log(
    `${timestamp()} [STATUS] proxy-port=${port}` +
    (networkKey ? ` network=${networkKey}` : '') +
    (rpcUrl     ? ` rpcUrl=${rpcUrl}`     : '')
  );

  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    port,
    networkKey,
    rpcUrl,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  }));
}

export { handleStatusCheck };

