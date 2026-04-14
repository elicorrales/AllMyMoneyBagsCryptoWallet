// all-my-money-bags-helpers/handleFindSuitableNodeJs.mjs

const REQUIRED_NODE_VERSION = '22.17.1';

function parseVersion(v) {
  return v.replace(/^v/, '').split('.').map(n => parseInt(n, 10));
}

function versionIsTooLow(current, required) {
  for (let i = 0; i < required.length; i++) {
    if ((current[i] ?? 0) < required[i]) return true;
    if ((current[i] ?? 0) > required[i]) return false;
  }
  return false;
}

export function checkNodeVersionOrExit() {
  const currentRaw = process.version;
  const current = parseVersion(currentRaw);
  const required = parseVersion(REQUIRED_NODE_VERSION);

  if (versionIsTooLow(current, required)) {
    console.error('\n❌ Node.js version too old.');
    console.error(`   Required: v${REQUIRED_NODE_VERSION}`);
    console.error(`   Current : ${currentRaw}`);
    console.error('   Please upgrade Node.js and try again.\n');
    process.exit(1);
  }
}

