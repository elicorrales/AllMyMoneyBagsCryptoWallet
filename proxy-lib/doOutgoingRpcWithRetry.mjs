// proxy-lib/doOutgoingRpcWithRetry.mjs
import http from 'http';
import https from 'https';
import { timestamp } from './originsAndCorsHeaders.mjs';

const NORMAL_RPC_REQUEST_TIMEOUT_MS = 4000;

function doOutgoingRpcWithRetry(agent, reqOptions, body = null, retries = 1) {
  return new Promise((resolve, reject) => {
    function attempt(remainingRetries) {
      const req = agent.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            text: async () => data,
            headers: res.headers,
          });
        });
      });

      req.on('error', (err) => {
        if (remainingRetries > 0) {
          attempt(remainingRetries - 1);
        } else {
          reject(err);
        }
      });

      const timeout = setTimeout(() => {
        req.destroy(new Error('Request timed out'));
      }, NORMAL_RPC_REQUEST_TIMEOUT_MS);

      req.on('close', () => clearTimeout(timeout));

      if (body) req.write(body);
      req.end();
    }

    attempt(retries);
  });
}

export { doOutgoingRpcWithRetry };


