// all-my-money-bags-helpers/handleSecrecy.mjs
////////////////////////////////////////////////////////////////////
//these functions assume they are being called during spawning
// of a child and at no other time.
// they assume there are TWO children max.
////////////////////////////////////////////////////////////////////

import { promises as fs } from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

import { printBanner } from './commonFunctions.mjs';
import { quitScript } from './handleMenus.mjs';

import {
  WALLET_CONFIG_DIR,
  WALLET_PROXY_CONFIG_FILE,
  WALLET_SECRET,
  WALLET_CAN_DELETE_SECRET,
  WALLET_SECRET_HAS_BEEN_GENERATED_ONCE_THIS_RUN
} from './constants.mjs';

const CONFIG_DIR = path.resolve(WALLET_CONFIG_DIR);

function generateRandomHex(bytes = 32) {
  return randomBytes(bytes).toString('hex'); // 64-char hex string
}

function generateRandomJsFileName() {
  return `${randomBytes(12).toString('hex')}`;
}

function isCanDeleteSecret() {
  return (WALLET_CAN_DELETE_SECRET.value >= 2);
}

function secretGeneratedForChild() {
  WALLET_CAN_DELETE_SECRET.value =  WALLET_CAN_DELETE_SECRET.value + 1;
  if (isCanDeleteSecret()) {
    WALLET_SECRET_HAS_BEEN_GENERATED_ONCE_THIS_RUN.value = true;
  }
}

////////////////////////////////////////////////////////////////////
//this function assumes it is being called during spawning
// of a child and at no other time.
// it assumes there are TWO children max.
////////////////////////////////////////////////////////////////////
export async function createSecretFilesIfNeeded() {

  //secret was already generated once during this run.
  //and passed to each child.
  if (WALLET_SECRET_HAS_BEEN_GENERATED_ONCE_THIS_RUN.value === true) {
    printBanner ('[❌]','Sorry, This Application Is Closing. Start Over.');
    await quitScript();
  }

  secretGeneratedForChild();//increments number of times secret is given out

  //secret was already generated once during this run,
  //but only passed to 1 child. do NOT generate again,
  //so both children have same secret.
  if (WALLET_SECRET.value !== null) {
    return;
  }

  await fs.mkdir(CONFIG_DIR, { recursive: true });

  const secret = generateRandomHex();
  const secretFile = generateRandomJsFileName();

  const secretFilePath = path.join(CONFIG_DIR, secretFile);
  const configFilePath = path.join(CONFIG_DIR, WALLET_PROXY_CONFIG_FILE);

  const secretJs = `globalThis.WALLET_CLIENT_PROXY_INIT_SECRET = '${secret}';\n`;
  const configJs = `globalThis.WALLET_INITIAL_FILE = '${secretFile}';\n`;

  await fs.writeFile(secretFilePath, secretJs);
  await fs.writeFile(configFilePath, configJs);

  WALLET_SECRET.value = secret;
  console.log(`[🧪 LM GENERATED SECRET] ${secret}`);


}

export async function deleteSecretFilesMaybe() {
  if (isCanDeleteSecret()) {
    setTimeout(() => {
      deleteSecretFilesForced();
    }, 2000); // 2 seconds
  }
}


//this could be called from quitScript when terminating lifecycle manager
//this could be called from quitScript when terminating lifecycle manager
export async function deleteSecretFilesForced() {

  const configFilePath = path.join(CONFIG_DIR, WALLET_PROXY_CONFIG_FILE);

  try {
    const configJs = await fs.readFile(configFilePath, 'utf8');
    const match = configJs.match(/WALLET_INITIAL_FILE\s*=\s*['"]([^'"]+)['"]/);
    const secretFile = match?.[1];

    if (secretFile) {
      const secretFilePath = path.join(CONFIG_DIR, secretFile);
      await fs.unlink(secretFilePath).catch(() => {});
    }

    await fs.unlink(configFilePath).catch(() => {});
  } catch {
    // no-op if config file is missing or unreadable
  }

  try {
    const files = await fs.readdir(CONFIG_DIR);
    for (const file of files) {
      if (file.endsWith('.js')) continue;
      if (file.length !== 24) continue;

      const filePath = path.join(CONFIG_DIR, file);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        if (content.startsWith("globalThis.WALLET_CLIENT_PROXY_INIT_SECRET = '")) {
          await fs.unlink(filePath).catch(() => {});
        }
      } catch {
        // skip unreadable file
      }
    }
  } catch {
    // skip unreadable directory
  }

  WALLET_SECRET.value = null;
  WALLET_CAN_DELETE_SECRET.value = 0;
}



