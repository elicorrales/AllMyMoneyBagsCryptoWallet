//all-my-money-bags-helpers/constants.mjs
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const BROWSER_PROFILE_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.all-my-money-bags-browser-data');

export const PROXY_COMMAND = './rpc-proxy-server.mjs';
export const TMP_DIR = './.all-my-money-bags-lockfiles';
export const PROXY_LOCKFILE_PATH = path.join(TMP_DIR, 'all-my-money-bags-proxy.lock');
export const BROWSER_LOCKFILE_PREFIX = 'BROWSER_LOCKFILE';
export const BROWSER_LOCKFILE_PATH = path.join(TMP_DIR, BROWSER_LOCKFILE_PREFIX);
export const BROWSER_HTML_PATH = path.join(__dirname, '..', 'SimpleWebPageCryptoWallet-iframe.html');


export const BROWSER_COMMAND = { value: null };
export const BROWSER_PID = { value: null };
export const PROXY_PID = { value: null };
export const monitorInterval = { value: null };

export const WALLET_BROWSER_EXTENSION_PATH = path.join(__dirname, '..', 'wallet-browser-extension');

export const WALLET_CONFIG_DIR = './.wallet-temp';
export const WALLET_PROXY_CONFIG_FILE = 'wallet-proxy-config.js';
export const WALLET_SECRET = { value: null };
export const WALLET_CAN_DELETE_SECRET = { value: 0 };//0=no spawn; 1=one child; 2=two children

//only allowed once during a session
//have to re-start manager(application) script to re-generate another secret.
//this should only be set to true once the served to two children in the session.
export const WALLET_SECRET_HAS_BEEN_GENERATED_ONCE_THIS_RUN = { value: null };

