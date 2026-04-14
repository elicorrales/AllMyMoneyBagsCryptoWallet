// proxy-handlers/handleRpc.mjs

import http from 'http';
import https from 'https';
import { doOutgoingRpcWithRetry } from '../proxy-lib/doOutgoingRpcWithRetry.mjs';
import { timestamp } from '../proxy-lib/originsAndCorsHeaders.mjs';
import { decryptBody } from '../proxy-lib/encryptDecrypt.mjs';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

async function handlePostRpc(req, res, state, server) {
  let theRpcUrl = null;
  try {
    let bodyData = '';
    for await (const chunk of req) {
      bodyData += chunk;
    }

    let decrypted;
    try {
      const received = JSON.parse(bodyData || '{}');
      if (!received.encrypted) throw new Error('Missing encrypted payload');
      decrypted = decryptBody(received.encrypted, state.WALLET_CLIENT_PROXY_INIT_SECRET);
    } catch (err) {
      console.log(`${timestamp()} Failed to decrypt /rpc POST body:`, err.message || err);
      res.writeHead(400, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ error: 'BAD_REQUEST', rpcUrl: null }));
    }

    const { rpcUrl, contentType, extraHeaders = {}, body: innerBody } = decrypted;

    if (!rpcUrl) {
      res.writeHead(400, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing url in request body', rpcUrl: null }));
    }

    const parsed = new URL(rpcUrl);
    theRpcUrl = parsed;
    const agent = parsed.protocol === 'https:' ? https : http;

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': contentType || 'application/json',
        ...extraHeaders
      },
    };

    const requestBody =
      typeof innerBody === 'object' && innerBody !== null
        ? JSON.stringify(innerBody)
        : innerBody;

    // ---- extract RPC method for logging ----
    let rpcMethod = 'unknown';
    try {
      const parsedReq = JSON.parse(requestBody);
      rpcMethod = parsedReq.method || 'unknown';
    } catch {}

    console.log(`${timestamp()} ${c.cyan}→ Sending RPC POST →${c.reset} ${rpcUrl} ${c.gray}[${rpcMethod}]${c.reset}`);
    console.log(`${timestamp()} ${c.cyan}Request Headers:${c.reset}`, reqOptions.headers);
    console.log(`${timestamp()} ${c.cyan}Request Body:${c.reset}`, requestBody);

    const response = await doOutgoingRpcWithRetry(agent, reqOptions, requestBody, 1);
    const responseBody = await response.text();

    const contentTypeResp = response.headers['content-type'];
    const isJson = contentTypeResp && contentTypeResp.includes('application/json');

    console.log(`${timestamp()} ${c.gray}Raw RPC response:${c.reset}`, responseBody);

    let bodyToSend = responseBody;
    if (isJson) {
      try {
        const parsedBody = JSON.parse(responseBody);
        if (parsedBody && typeof parsedBody === 'object') {
          parsedBody.rpcUrl = theRpcUrl.href;
          bodyToSend = JSON.stringify(parsedBody);
        }
      } catch (e) {
        console.warn(`${timestamp()} ${c.red}⚠ Non-JSON body despite JSON header${c.reset}`);
      }
    }

    if (response.status >= 200 && response.status < 300) {

      if (isJson) {
        try {
          const parsedBody = JSON.parse(bodyToSend);
          if (parsedBody.result && typeof parsedBody.result === 'object') {
            console.log(`${timestamp()} ${c.gray}→ result keys:${c.reset}`, Object.keys(parsedBody.result));
            if (parsedBody.result.transactions) console.log(`${timestamp()} ${c.gray}→ tx count:${c.reset}`, parsedBody.result.transactions.length);
            if (parsedBody.result.blockNumber) console.log(`${timestamp()} ${c.gray}→ block number:${c.reset}`, parsedBody.result.blockNumber);
          }

          if (parsedBody.error) {
            console.warn(`${timestamp()} ${c.red}⚠ RPC provider returned error:${c.reset}`, parsedBody.error);
          } else if (!('result' in parsedBody)) {
            console.warn(`${timestamp()} ${c.yellow}⚠ RPC response missing 'result' field${c.reset}`);
            console.warn(`${timestamp()} ${c.gray}Parsed body:${c.reset}`, parsedBody);
          } else if (parsedBody.result === null) {
            console.warn(`${timestamp()} ${c.yellow}⚠ RPC result is null${c.reset}`);
          }

        } catch (e) {
          console.warn(`${timestamp()} ${c.red}⚠ Failed to parse JSON response${c.reset}`);
        }
      } else {
        console.warn(`${timestamp()} ${c.yellow}⚠ Response not JSON${c.reset}`);
      }

      console.log(`${timestamp()} ${c.green}✅ RPC POST Success${c.reset} ← ${rpcUrl} [${response.status}]`);
      console.log('');

    } else {

      console.warn(`${timestamp()} ${c.yellow}Status Message:${c.reset} ${response.statusMessage || 'N/A'}`);

      if (isJson) {
        try {
          const parsedBody = JSON.parse(bodyToSend);
          console.warn(`${timestamp()} ${c.gray}⇠ Response body:${c.reset}`, parsedBody);
          if (parsedBody.result && typeof parsedBody.result === 'object') {
            console.log(`${timestamp()} ${c.gray}→ result keys:${c.reset}`, Object.keys(parsedBody.result));
            if (parsedBody.result.transactions) console.log(`${timestamp()} ${c.gray}→ tx count:${c.reset}`, parsedBody.result.transactions.length);
            if (parsedBody.result.blockNumber) console.log(`${timestamp()} ${c.gray}→ block number:${c.reset}`, parsedBody.result.blockNumber);
          }

          if (parsedBody.error) {
            console.warn(`${timestamp()} ${c.red}Error field:${c.reset}`, parsedBody.error);
          } else if (parsedBody.message) {
            console.warn(`${timestamp()} ${c.red}Message field:${c.reset}`, parsedBody.message);
          }

        } catch (e) {
          console.warn(`${timestamp()} ${c.gray}⇠ Non-JSON response:${c.reset}`, bodyToSend);
        }

      } else {
        console.warn(`${timestamp()} ${c.gray}⇠ Raw response:${c.reset}`, bodyToSend);
      }

      console.warn(`${timestamp()} ${c.yellow}⚠️  RPC POST Warning${c.reset} ← ${rpcUrl} [${response.status}]\n`);
      console.log('');
    }

    const headersToSend = {};
    if (contentTypeResp) {
      headersToSend['content-type'] = contentTypeResp;
    }

    res.writeHead(response.status, headersToSend);
    res.end(bodyToSend);

  } catch (err) {

    console.log(`${timestamp()} ${c.red}❌ POST /rpc error${c.reset}: ${err.message}`);
    console.log(`${timestamp()} ${c.red}Responding to client with timeout JSON for RPC URL:${c.reset} ${theRpcUrl || 'unknown'}`);
    console.log('');

    res.writeHead(500, { 'content-type': 'application/json' });

    const message = "The asset provider did not respond.";

    res.end(JSON.stringify({
      error: 'TIMEOUT',
      message,
      rpcUrl: theRpcUrl ? theRpcUrl.href : 'unknown'
    }));
  }
}

async function handleGetRpc(req, res, state, server) {
  let theRpcUrl = null;
  try {

    let bodyData = '';
    for await (const chunk of req) {
      bodyData += chunk;
    }

    let decrypted;

    try {
      const received = JSON.parse(bodyData || '{}');
      if (!received.encrypted) throw new Error('Missing encrypted payload');
      decrypted = decryptBody(received.encrypted, state.WALLET_CLIENT_PROXY_INIT_SECRET);
    } catch (err) {
      console.log(`${timestamp()} Failed to decrypt /rpc GET body:`, err.message || err);
      res.writeHead(400, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ error: 'BAD_REQUEST', rpcUrl: null }));
    }

    const { rpcUrl, contentType, extraHeaders = {} } = decrypted;

    if (!rpcUrl) {
      res.writeHead(400, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing url in request body', rpcUrl: null }));
    }

    const parsed = new URL(rpcUrl);
    theRpcUrl = parsed;
    const agent = parsed.protocol === 'https:' ? https : http;

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'Content-Type': contentType || 'application/json',
        ...extraHeaders
      },
    };

    console.log(`${timestamp()} ${c.cyan}→ Sending RPC GET →${c.reset} ${rpcUrl}`);
    console.log(`${timestamp()} ${c.cyan}Request Headers:${c.reset}`, reqOptions.headers);

    const response = await doOutgoingRpcWithRetry(agent, reqOptions, null, 1);
    const responseBody = await response.text();

    const contentTypeResp = response.headers['content-type'];
    const isJson = contentTypeResp && contentTypeResp.includes('application/json');

    console.log(`${timestamp()} ${c.gray}Raw RPC response:${c.reset}`, responseBody);

    let bodyToSend = responseBody;

    if (isJson) {
      try {
        const parsedBody = JSON.parse(responseBody);

        if (parsedBody && typeof parsedBody === 'object') {
          parsedBody.rpcUrl = theRpcUrl.href;
          bodyToSend = JSON.stringify(parsedBody);
        }

      } catch (e) {
        console.warn(`${timestamp()} ${c.red}⚠ Non-JSON body despite JSON header${c.reset}`);
      }
    }

    if (response.status >= 200 && response.status < 300) {
      if (isJson) {
        try {
          const parsedBody = JSON.parse(bodyToSend);
          if (parsedBody.error) {
            console.warn(`${timestamp()} ${c.red}⚠️ RPC provider returned error:${c.reset}`, parsedBody.error);
          }
        } catch (e) {
          // ignore parse error
        }
      }
      console.log(`${timestamp()} ${c.green}✅ RPC GET Success${c.reset} ← ${rpcUrl} [${response.status}]`);
      console.log('');

    } else {

      console.warn(`${timestamp()} ${c.yellow}Status Message:${c.reset} ${response.statusMessage || 'N/A'}`);

      if (isJson) {
        try {
          const parsedBody = JSON.parse(bodyToSend);
          console.warn(`${timestamp()} ${c.gray}⇠ Response body:${c.reset}`, parsedBody);
          if (parsedBody.error) {
            console.warn(`${timestamp()} ${c.red}Error field:${c.reset}`, parsedBody.error);
          } else if (parsedBody.message) {
            console.warn(`${timestamp()} ${c.red}Message field:${c.reset}`, parsedBody.message);
          }
        } catch (e) {
          console.warn(`${timestamp()} ${c.gray}⇠ Non-JSON response:${c.reset}`, bodyToSend);
        }
      } else {
        console.warn(`${timestamp()} ${c.gray}⇠ Raw response:${c.reset}`, bodyToSend);
      }

      console.warn(`${timestamp()} ${c.yellow}⚠️  RPC GET Warning${c.reset} ← ${rpcUrl} [${response.status}]\n`);
      console.log('');
    }

    const headersToSend = {};

    if (contentTypeResp) {
      headersToSend['content-type'] = contentTypeResp;
    }

    res.writeHead(response.status, headersToSend);
    res.end(bodyToSend);

  } catch (err) {

    console.log(`${timestamp()} ${c.red}❌ GET /rpc error${c.reset}: ${err.message}`);
    console.log(`${timestamp()} ${c.red}Responding to client with timeout JSON for RPC URL:${c.reset} ${theRpcUrl || 'unknown'}`);
    console.log('');

    res.writeHead(500, { 'content-type': 'application/json' });

    const message = "The asset provider did not respond.";

    res.end(JSON.stringify({
      error: 'TIMEOUT',
      message,
      rpcUrl: theRpcUrl ? theRpcUrl.href : 'unknown'
    }));
  }
}

export { handlePostRpc, handleGetRpc };

