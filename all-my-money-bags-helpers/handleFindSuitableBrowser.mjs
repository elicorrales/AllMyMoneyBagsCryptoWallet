// all-my-money-bags-helpers/handleFindSuitableBrowser.mjs

import { spawnSync } from 'child_process';
import { access } from 'fs/promises';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { BROWSER_COMMAND } from './constants.mjs';

const BROWSERS = [
  'ungoogled-chromium',
  'brave',
  'chromium',
  'chrome',
];

const WIN_PROGRAM_FILES = [
  process.env['ProgramFiles'] || 'C:\\Program Files',
  process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
];

// Helper to check if a file is executable (exists & accessible)
async function isExecutable(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

// On Windows: try registry query for installed browsers (lightweight)
function queryWindowsRegistryForBrowsers() {
  const results = [];
  // We check the registry key where browsers register (for example):
  // HKEY_LOCAL_MACHINE\SOFTWARE\Clients\StartMenuInternet
  // Each subkey is a browser; inside, "shell\open\command" has exe path.

  try {
    const reg = spawnSync('reg', ['query', 'HKLM\\SOFTWARE\\Clients\\StartMenuInternet'], { encoding: 'utf8' });
    if (reg.status !== 0) return results;

    const lines = reg.stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      // line is a subkey path, e.g. "HKLM\SOFTWARE\Clients\StartMenuInternet\Brave"
      const nameMatch = line.match(/[^\\]+$/);
      if (!nameMatch) continue;
      const browserKey = line;

      // Query the open\command subkey for exe path
      const cmdReg = spawnSync('reg', ['query', `${browserKey}\\shell\\open\\command`], { encoding: 'utf8' });
      if (cmdReg.status !== 0) continue;

      const cmdLines = cmdReg.stdout.split(/\r?\n/);
      for (const cl of cmdLines) {
        const m = cl.match(/^\s*Default\s+REG_SZ\s+(.+)$/i);
        if (m) {
          let exePath = m[1].trim().replace(/^"|"$/g, '');
          // Clean arguments after exe
          exePath = exePath.split('" ')[0];
          results.push(exePath.toLowerCase());
        }
      }
    }
  } catch {
    // ignore failures
  }
  return results;
}

// Check standard Windows paths for browser executables (case-insensitive)
async function checkWindowsStandardPaths() {
  const candidates = [];
  const browsersExeNames = {
    'ungoogled-chromium': 'chrome.exe', // ungoogled usually is named chromium, fallback to chrome.exe
    brave: 'brave.exe',
    chromium: 'chromium.exe',
    chrome: 'chrome.exe',
  };

  for (const baseDir of WIN_PROGRAM_FILES) {
    for (const browser of BROWSERS) {
      const exeName = browsersExeNames[browser];
      if (!exeName) continue;
      // Some browsers install in subfolders (common Brave path)
      const possiblePaths = [
        path.join(baseDir, browser, 'Application', exeName),
        path.join(baseDir, 'BraveSoftware', 'Brave-Browser', 'Application', exeName),
        path.join(baseDir, 'Google', 'Chrome', 'Application', exeName),
        path.join(baseDir, 'Chromium', 'Application', exeName),
      ];
      for (const candidate of possiblePaths) {
        if (await isExecutable(candidate)) {
          candidates.push(candidate.toLowerCase());
        }
      }
    }
  }
  return candidates;
}

// On Linux/macOS: use `which` or check common bin dirs
async function checkUnixPaths() {
  const candidates = [];

  // Helper to run 'which' and return full path if found
  function which(cmd) {
    const res = spawnSync('which', [cmd], { encoding: 'utf8' });
    if (res.status === 0) {
      return res.stdout.trim();
    }
    return null;
  }

  // Check each browser command via which
  for (const browser of BROWSERS) {
    const pathFound = which(browser);
    if (pathFound && await isExecutable(pathFound)) {
      candidates.push(pathFound);
    }
  }

  // Additional common locations (for ungoogled-chromium or snaps)
  const extraPaths = [
    '/usr/bin/ungoogled-chromium',
    '/usr/bin/brave-browser',
    '/usr/bin/chromium-browser',
    '/snap/bin/brave',
    '/snap/bin/chromium',
  ];

  for (const pth of extraPaths) {
    if (await isExecutable(pth) && !candidates.includes(pth)) {
      candidates.push(pth);
    }
  }

  return candidates;
}

// Verify a browser executable is usable by running `--version`
function verifyBrowserCommand(cmd) {
  try {
    const res = spawnSync(cmd, ['--version'], { encoding: 'utf8', timeout: 3000 });
    if (res.status === 0 && res.stdout && res.stdout.toLowerCase().includes('chrome') || res.stdout.toLowerCase().includes('brave')) {
      return true;
    }
  } catch {}
  return false;
}

// Show a simple numbered prompt menu in console
async function promptUserToChoose(candidates) {
  if (candidates.length === 1) return candidates[0];

  console.log('\nMultiple browsers found, please select one:');
  candidates.forEach((c, i) => {
    console.log(`  [${i + 1}] ${c}`);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (q) => new Promise(res => rl.question(q, res));

  while (true) {
    const ans = await question('Enter number of your choice (or 0 to cancel): ');
    const num = parseInt(ans.trim(), 10);
    if (num === 0) {
      rl.close();
      throw new Error('User cancelled browser selection');
    }
    if (num > 0 && num <= candidates.length) {
      rl.close();
      return candidates[num - 1];
    }
    console.log('Invalid selection. Try again.');
  }
}

export async function findSuitableBrowser() {
  const platform = process.platform;
  let candidates = [];

  if (platform === 'win32') {
    // Windows
    // 1) Registry query
    const regCandidates = queryWindowsRegistryForBrowsers();
    candidates.push(...regCandidates);

    // 2) Standard program files paths
    const stdPaths = await checkWindowsStandardPaths();
    candidates.push(...stdPaths);

    // Deduplicate & lowercase
    candidates = [...new Set(candidates)];
  } else {
    // Linux/macOS
    const unixCandidates = await checkUnixPaths();
    candidates.push(...unixCandidates);

    // Deduplicate
    candidates = [...new Set(candidates)];
  }

  // Filter out unusable by verifying --version
  const verified = [];
  for (const c of candidates) {
    if (verifyBrowserCommand(c)) {
      verified.push(c);
    }
  }

  if (verified.length === 0) {
    console.error('\n❌ No suitable browsers found on your system.');
    console.error('   Please install one of the following browsers:');
    console.error('   - ungoogled-chromium');
    console.error('   - brave');
    console.error('   - chromium');
    console.error('   - chrome\n');
    process.exit(1);
  }

  const chosen = await promptUserToChoose(verified);
  BROWSER_COMMAND.value = chosen;
  console.log(`Selected browser: ${chosen}`);
  return chosen;
}

