// handleConfigSymlink.mjs
import fs from 'fs';
import path from 'path';
import { printBanner } from './commonFunctions.mjs'; // import printBanner

export function ensureWalletConfigSymlink() {
  const source = path.resolve('wallet-config', 'wallet-extension-config.json'); // real file
  const dest = path.resolve('wallet-browser-extension', 'wallet-extension-config.json'); // symlink location

  try {
    const stat = fs.lstatSync(dest);
    if (stat.isSymbolicLink()) {
      const currentTarget = fs.readlinkSync(dest);
      if (currentTarget === source) {
        printBanner('[🧩]', 'Wallet config symlink already correct.');
        return; // already correct
      } else {
        fs.unlinkSync(dest); // remove incorrect symlink
        printBanner('[🧩]', 'Removed old incorrect wallet config symlink.');
      }
    } else {
      fs.unlinkSync(dest); // remove regular file if present
      printBanner('[🧩]', 'Removed existing file at symlink location.');
    }
  } catch (err) {
    // doesn't exist, fine
  }

  fs.symlinkSync(source, dest, 'file');
  printBanner('[🧩]', `Wallet config symlink created: ${dest} -> ${source}`);
}

/**
 * Remove the symlink (or file) safely
 */
export function removeWalletConfigSymlink() {
  const dest = path.resolve('wallet-browser-extension', 'wallet-extension-config.json');
  try {
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
      printBanner('[🧩]', `Wallet config symlink removed: ${dest}`);
    }
  } catch (err) {
    printBanner('[❌]', `Failed to remove wallet config symlink: ${err.message}`);
  }
}

