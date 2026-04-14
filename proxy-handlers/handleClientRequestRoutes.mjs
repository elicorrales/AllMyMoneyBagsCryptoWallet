// proxy-handlers/handleClientRequestRoutes.mjs
import { handleGetSecret } from './handleSecret.mjs';
import { handleVerifySecret } from './handleVerifySecret.mjs';
import { handleStatusCheck } from './handleStatusCheck.mjs';
import { handlePostRpc, handleGetRpc } from './handleRpc.mjs';
import { handleShutdown } from './handleShutdown.mjs';
import { handleAlertWrapped, handleAlert } from './handleAlert.mjs';
import { verifyContinuedOwnershipOfProxyLock } from '../proxy-lib/manageProxyLocking.mjs';
import { timestamp } from '../proxy-lib/originsAndCorsHeaders.mjs';
import { decryptBody } from '../proxy-lib/encryptDecrypt.mjs';



function handleClientRequestRoutes(req, res, path, port, state, server) {

  verifyContinuedOwnershipOfProxyLock();

  if (req.method === 'POST' && path === '/alert') {
    handleAlertWrapped(req, res, state)
      .then(isValid => {
        if (isValid) {
          // only shutdown on a valid alert
          const calledFromAlert = true;
          handleShutdown(req, res, state, server, calledFromAlert);
        } else {
          // already responded inside handleAlertWrapped if invalid
          if (!res.headersSent) {
            res.writeHead(204);
            res.end();
          }
        }
      })
      .catch(err => {
        console.error('[handleClientRequestRoutes] Unexpected error in handleAlertWrapped:', err);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end('Server error during alert handling');
        }
      });
    return;
  }

  if (req.method === 'POST' && path === '/status') {
    return handleStatusCheck(req, res, port, state);
  }

  if (req.method === 'POST' && path === '/secret') {
    return handleGetSecret(req, res, state, server);
  }

  if (req.method === 'POST' && path === '/verify-secret') {
    return handleVerifySecret(req, res, state, server);
  }

  const normalizedPath = path.toLowerCase();
  if (req.method === 'POST' && normalizedPath === '/rpc/get') {
    return handleGetRpc(req, res, state, server);
  }
  if (req.method === 'POST' && normalizedPath === '/rpc/post') {
    return handlePostRpc(req, res, state, server);
  }

  if (req.method === 'POST' && path === '/shutdown') {
    return handleShutdown(req, res, state, server);
  }

  return false; // means not handled
}


export { handleClientRequestRoutes };

