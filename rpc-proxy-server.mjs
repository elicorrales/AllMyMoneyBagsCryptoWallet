// rpc-proxy-server.mjs
import http from 'http';
import url from 'url';
import fs from 'fs/promises';
import vm from 'vm';
import crypto from 'crypto';
import path from 'path';

import { timestamp, setCorsHeaders, isOriginAllowed, tryParseJson } from './proxy-lib/originsAndCorsHeaders.mjs';
import {
  ALLOWED_ORIGINS,
  WALLET_CUSTOM_ORIGIN_HEADER,
  WALLET_EXPECTED_ORIGIN,
  PORTS_TO_TRY,
  MAX_UNAUTHORIZED_INIT,
  MAX_VERIFY_ATTEMPTS,
  SECRET_VALIDITY_SECONDS,
} from './proxy-lib/constants.mjs';
import { handleClientRequestRoutes } from './proxy-handlers/handleClientRequestRoutes.mjs';

import { checkAndSetProxyLock, shutdown } from './proxy-lib/manageProxyLocking.mjs';
import { decryptBody } from './proxy-lib/encryptDecrypt.mjs';

const SERIAL_PROCESSING = true;

const state = {
  WALLET_CLIENT_PROXY_INIT_SECRET: null,
  PROXY_SESSION_SECRET: null,
  idleShutdownTimer: null,
  secretAlreadyServed: false,
  unauthorizedInitCount: 0,
  verifySecretAttempts: 0,
  secretIssuedAt: null,
  MAX_UNAUTHORIZED_INIT,
  MAX_VERIFY_ATTEMPTS,
};

const oldClientCalls = [];
const newClientCalls = [
  '/status', '/secret', '/verify-secret','/shutdown',
  '/rpc/get', '/rpc/post','/rpc/GET', '/rpc/POST'
];

// Must run before anything that would allow the proxy to start
checkAndSetProxyLock();

process.on('SIGINT', () => {
  console.log('[🔌] Caught SIGINT (Ctrl+C or shutdown signal)');
  console.log('[⚰️ ] Exiting with code 130');
  shutdown(130); // 128 + SIGINT (2)
});

process.on('SIGTERM', () => {
  console.log('[🔌] Caught SIGTERM (termination signal)');
  console.log('[⚰️ ] Exiting with code 143');
  shutdown(143); // 128 + SIGTERM (15)
});

process.on('SIGHUP', () => {
  console.log('[🔌] Caught SIGHUP');
  console.log('[⚰️ ] Exiting with code 129');
  shutdown(129); // 128 + SIGHUP (1)
});

process.on('SIGUSR1', () => {
  console.log('[🔌] Caught SIGUSR1');
  console.log('[⚰️ ] Exiting with code 138');
  shutdown(138); // 128 + SIGUSR1 (10)
});

process.on('SIGUSR2', () => {
  console.log('[🔌] Caught SIGUSR2');
  console.log('[⚰️ ] Exiting with code 139');
  shutdown(139); // 128 + SIGUSR2 (11)
});

process.on('exit', (code) => {
  console.log(`[⚰️ ] Process exiting with code ${code}`);
  // Don't call shutdown() here — avoid infinite loop if shutdown calls process.exit()
});

process.on('uncaughtException', (err) => {
  console.error('[💥] Uncaught Exception:', err);
  console.log('[⚰️ ] Exiting with code 1');
  shutdown(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[🤷] Unhandled Rejection at:', promise, 'reason:', reason);
  console.log('[⚰️ ] Exiting with code 1');
  shutdown(1);
});

async function loadProxyConfig() {
  try {
    const configPath = './.wallet-temp/wallet-proxy-config.js';
    const configCode = await fs.readFile(configPath, 'utf-8');

    const context = { globalThis: {} };
    vm.createContext(context);
    vm.runInContext(configCode, context);

    const secretFilePath = context.globalThis.WALLET_INITIAL_FILE;

    if (!secretFilePath || typeof secretFilePath !== 'string') {
      console.error(`${timestamp()} FATAL: Secret filepath missing or invalid`);
      console.log('[⚰️ ] Exiting with code 1');
      shutdown(1);
    }

    const secretFullPath = path.resolve('./.wallet-temp', secretFilePath);
    const secretContent = await fs.readFile(secretFullPath, 'utf-8');

    if (!secretContent.trim()) {
      console.error(`${timestamp()} FATAL: Secret file is empty`);
      console.log('[⚰️ ] Exiting with code 1');
      shutdown(1);
    }

    //state.WALLET_CLIENT_PROXY_INIT_SECRET = secretContent.trim();
    const match = secretContent.match(/'([^']+)'/);
    state.WALLET_CLIENT_PROXY_INIT_SECRET = match?.[1] || null;

    state.USE_ENCRYPTION = context.globalThis.USE_ENCRYPTION;

  } catch (e) {
    console.error(`${timestamp()} FATAL: Failed to load WALLET_CLIENT_PROXY_INIT_SECRET: ${e.message}`);
    console.log('[⚰️ ] Exiting with code 1');
    shutdown(1);
  }
}

function generateOneTimeSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function handleOptionsRequest(req, res) {
  const origin = req.headers.origin || 'null';
  setCorsHeaders(res, origin);
  res.writeHead(204);
  res.end();
}

function handleInvalidRoute(req, res) {
  console.log(`${timestamp()} Rejected request: ${req.method} ${req.url}`);
  const origin = req.headers.origin || 'null';
  setCorsHeaders(res, origin);
  res.writeHead(req.method === 'POST' ? 404 : 405, { 'Allow': 'GET, POST' });
  res.end(req.method === 'POST' ? 'Not Found' : 'Method Not Allowed');
}

function checkWalletOrigin(req, path, requestId) {
  const originHeader = req.headers[WALLET_CUSTOM_ORIGIN_HEADER];
  const method = req.method;

  if (oldClientCalls.includes(path)) {
    if (originHeader !== WALLET_EXPECTED_ORIGIN) {
      console.log(`${timestamp()} Blocked: Missing or invalid x-wallet-origin (${originHeader})`);
      console.log(`${timestamp()} [${requestId}] Blocked: Missing or invalid x-wallet-origin (${originHeader})`);
      return { allowed: false, reason: 'Missing or invalid wallet origin header' };
    }
  } else if (newClientCalls.includes(path)) {
    if (method !== 'POST') {
      console.log(`${timestamp()} Blocked: ${path} requires POST method`);
      console.log(`${timestamp()} [${requestId}] Blocked: ${path} requires POST method`);
      return { allowed: false, reason: `${path} requires POST method` };
    }
    // For now, no origin header check for new calls
  }

  return { allowed: true };
}

async function processLocalClientRequest(req, res, port, state, server) {
  const clientOrigin = req.headers[WALLET_CUSTOM_ORIGIN_HEADER] || 'null';
  const origin = req.headers.origin || 'null';
  const requestId = req._id || '(no-id)';
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = parsedUrl.pathname;

  //console.log(`${timestamp()} Incoming request → ${req.method} ${req.url}  Origin: ${origin}`);
  //console.log(`${timestamp()} Incoming request → ${req.method} ${req.url}  Client Origin: ${clientOrigin}`);
  //console.log(`${timestamp()} [${requestId}] Incoming request → ${req.method} ${req.url}  Origin: ${origin}`);
  //console.log(`${timestamp()} [${requestId}] Client Origin: ${clientOrigin}`);

  setCorsHeaders(res, origin);

  if (!isOriginAllowed(origin)) {
    //console.log(`${timestamp()} Forbidden: Origin not allowed (${origin})`);
    console.log(`${timestamp()} [${requestId}] Forbidden: Origin not allowed (${origin})`);

    res.writeHead(403);
    res.end('Forbidden: Origin not allowed');
    return;
  }


  //console.log(`${timestamp()} [${requestId}] CORS preflight for ${req.url} from origin: ${req.headers.origin}`);

  //console.log(`${timestamp()} CORS preflight for ${req.url} from origin: ${req.headers.origin}`);

  if (req.method === 'OPTIONS') return handleOptionsRequest(req, res);

  console.log(`${timestamp()} [${requestId}] Incoming request → ${req.method} ${req.url}`);
  const check = checkWalletOrigin(req, path, requestId);
  if (!check.allowed) {
    res.writeHead(403);
    res.end(`Forbidden: ${check.reason}`);
    return;
  }

  const handled = handleClientRequestRoutes(req, res, path, port, state, server);
  if (handled === false) return handleInvalidRoute(req, res);
}

// --- Serial processing using promise chain ---
let processingChain = Promise.resolve();

function processLocalClientRequestSerially(req, res, port, state, server) {
  const origin = req.headers.origin || 'null';
  req._id = crypto.randomUUID();
  const requestId = req._id;
  console.log(`${timestamp()} [${requestId}] Queued for serial processing`);

  processingChain = processingChain
    .then(() => {
      console.log(`${timestamp()} [${requestId}] → Begin processing`);
      return processLocalClientRequest(req, res, port, state, server)
        .catch(err => {
          console.error(`${timestamp()} Error processing request [${requestId}]:`, err);
          if (!res.headersSent) {
            setCorsHeaders(res, origin);
            res.writeHead(500);
            res.end('Internal Server Error');
          }
        })
        .then(() => {
          console.log(`${timestamp()} [${requestId}] ✓ Done`);
        });
    })
    .catch(err => {
      console.error(`${timestamp()} Unexpected error in processing chain:`, err);
    });

  return processingChain;
}

function startProxyServer(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      // Always serial processing
      processLocalClientRequestSerially(req, res, port, state, server);
    });

    server.listen(port, '127.0.0.1', () => {
      state.PROXY_SESSION_SECRET = generateOneTimeSecret();
      state.secretIssuedAt = Date.now();
      console.log(`${timestamp()} RPC proxy listening on http://127.0.0.1:${port}`);
      console.log(`${timestamp()} WALLET_CLIENT_PROXY_INIT_SECRET required to GET /secret`);
      console.log(`${timestamp()} One-time proxy session secret generated and ready for /secret`);
      console.log(`${timestamp()} Running in SERIAL processing mode.`);
      resolve({ server, port });

      state.idleShutdownTimer = setTimeout(() => {
        console.log(`${timestamp()} No initial /secret request received within window, shutting down`);
        console.log('[⚰️ ] Exiting with code 0');
        shutdown();
      }, SECRET_VALIDITY_SECONDS * 1000);
    });

    server.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error('Port in use'));
      } else {
        reject(err);
      }
    });
  });
}

async function findAndStartProxy() {
  for (const port of PORTS_TO_TRY) {
    try {
      return await startProxyServer(port);
    } catch (e) {
      if (e.message === 'Port in use') continue;
      throw e;
    }
  }
  console.log('[⚰️ ] Exiting with code 1');
  shutdown(1);
}

(async () => {
  await loadProxyConfig();
  try {
    const { port } = await findAndStartProxy();
    console.log(`${timestamp()} Proxy server running on port ${port}`);
  } catch (err) {
    console.error(`${timestamp()} Failed to start proxy server:`, err);
    console.log('[⚰️ ] Exiting with code 1');
    shutdown(1);
  }
})();

