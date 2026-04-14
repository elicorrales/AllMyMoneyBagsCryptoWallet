#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const walk = require('acorn-walk');

const TARGETS = [
  'window.walletAppState',
  'localStorage',
  'sessionStorage',
  'walletStorage',
  'walletProxyClient',
  'window',
  'document',
  'fetch',
  'navigator',
  'crypto.subtle',
];



const projectRoot = path.resolve(__dirname, '..');

const results = {};

function getJsFiles(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      if (entry === 'code-analyzer') continue;
      files = files.concat(getJsFiles(fullPath));
    } else if (entry.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

function analyzeFile(filePath) {
  const relative = path.relative(projectRoot, filePath);
  if (relative === 'analyze-project-code-structure.js') return;

  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

  for (const target of TARGETS) {
    if (content.includes(target)) {
      if (!results[target]) results[target] = [];
      results[target].push(relative);
    }
  }
}

const files = getJsFiles(projectRoot);
files.forEach(analyzeFile);

const args = process.argv.slice(2);
let outputFormat = 'mermaid';
let filterFnName = null;

if (args[0] === '--text' && args[1]) {
  outputFormat = 'text';
  filterFnName = args[1];
} else if (args[0] === '--mermaid' && args[1]) {
  outputFormat = 'mermaid';
  filterFnName = args[1];
} else if (args.length === 1) {
  filterFnName = args[0];
} else if (args.length > 0) {
  console.error(`Unknown or incomplete arguments: ${args.join(' ')}`);
  process.exit(1);
}

function sanitize(name) {
  const safe = name.replace(/[^\w]/g, '_');
  return ['end', 'subgraph', 'click', 'style', 'classDef'].includes(safe) ? `_${safe}` : safe;
}

const functionDefs = new Map();
const callGraph = new Map();
const reverseGraph = new Map();

function getFullCalleeName(callee) {
  if (callee.type === 'Identifier') {
    return callee.name;
  }
  if (callee.type === 'MemberExpression') {
    const obj = callee.object;
    const prop = callee.property;
    if (obj.type === 'Identifier' && prop.type === 'Identifier') {
      return `${obj.name}.${prop.name}`;
    }
    if (obj.type === 'MemberExpression') {
      const objName = getFullCalleeName(obj);
      if (prop.type === 'Identifier' && objName) {
        return `${objName}.${prop.name}`;
      }
    }
  }
  return null;
}

function analyzeCalls(filePath) {
  const relativePath = path.relative(projectRoot, filePath);
  if (relativePath === 'analyze-project-code-structure.js') return;

  const base = path.basename(filePath);
  const isWalletFile = /^wallet.*\.js$/.test(base);

  const code = fs.readFileSync(filePath, 'utf8');
  let ast;
  try {
    ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
  } catch (e) {
    console.error(`Failed to parse ${filePath}: ${e.message}`);
    return;
  }

  // Phase 1: register all function declarations everywhere
  walk.simple(ast, {
    FunctionDeclaration(node) {
      if (node.id && node.id.name) {
        functionDefs.set(node.id.name, { file: filePath });
      }
    },
    // if you have VariableDeclarator tracking, include that here too
    VariableDeclarator(node) {
      if (
        node.id && node.id.name &&
        node.init &&
        (node.init.type === 'FunctionExpression' || node.init.type === 'ArrowFunctionExpression')
      ) {
        functionDefs.set(node.id.name, { file: filePath });
      }
    }
  });

  // Phase 2: only in wallet*.js do we build callGraph & reverseGraph
  if (isWalletFile) {
    const fnStack = [];

    walk.recursive(ast, null, {
      FunctionDeclaration(node, state, c) {
        if (node.id && node.id.name) fnStack.push(node.id.name);
        if (node.body && node.body.body) {
          for (const stmt of node.body.body) c(stmt, state);
        }
        if (node.id && node.id.name) fnStack.pop();
      },
      FunctionExpression(node, state, c) {
        fnStack.push(node.id ? node.id.name : '<anon>');
        if (node.body.type === 'BlockStatement') {
          for (const stmt of node.body.body) c(stmt, state);
        } else {
          c(node.body, state);
        }
        fnStack.pop();
      },
      ArrowFunctionExpression(node, state, c) {
        fnStack.push('<anon_arrow>');
        // your existing debug log here, if any
        if (node.body.type === 'BlockStatement') {
          for (const stmt of node.body.body) c(stmt, state);
        } else {
          c(node.body, state);
        }
        fnStack.pop();
      },
      CallExpression(node, state, c) {
        const fullName = getFullCalleeName(node.callee);
        const resolved = fullName;

        if (resolved && fnStack.length > 0) {
          const caller = fnStack[fnStack.length - 1];
          if (!callGraph.has(caller)) callGraph.set(caller, new Set());
          if (!reverseGraph.has(resolved)) reverseGraph.set(resolved, new Set());
          callGraph.get(caller).add(resolved);
          reverseGraph.get(resolved).add(caller);
        }

        if (node.arguments) {
          for (const arg of node.arguments) c(arg, state);
        }
        c(node.callee, state);
      },
      Statement(node, state, c) {
        for (const key in node) {
          if (key === 'type' || key === 'body') continue;
          const val = node[key];
          if (Array.isArray(val)) {
            for (const child of val) if (child && typeof child.type === 'string') c(child, state);
          } else if (val && typeof val.type === 'string') {
            c(val, state);
          }
        }
        if (node.body && Array.isArray(node.body)) {
          for (const stmt of node.body) c(stmt, state);
        } else if (node.body && typeof node.body.type === 'string') {
          c(node.body, state);
        }
      }
    });
  }
}



files.forEach(analyzeCalls);

function buildReverseTree(fnName, seen = new Set()) {
  if (seen.has(fnName)) return [];
  seen.add(fnName);

  const callers = reverseGraph.get(fnName);
  if (!callers) return [];

  const result = [];
  for (const caller of callers) {
    const info = functionDefs.get(caller);
    const file = info ? path.relative(projectRoot, info.file) : '(unknown)';
    result.push({
      caller,
      file,
      parents: buildReverseTree(caller, seen)
    });
  }
  return result;
}

if (!filterFnName) {
  if (Object.keys(results).length === 0) {
    console.log('No global targets found in project files.');
  } else {
    console.log('graph TD');
    for (const [target, files] of Object.entries(results)) {
      const safeTarget = sanitize(target);
      console.log(`  subgraph cluster_${safeTarget}`);
      console.log(`    style cluster_${safeTarget} fill:#f0f8ff,stroke:#3399ff,stroke-width:1px`);
      console.log(`    ${safeTarget}["${target}"]:::global`);
      for (const file of files) {
        const safeFile = sanitize(file);
        console.log(`    ${safeFile}["${file}"]:::file --> ${safeTarget}`);
      }
      console.log('  end');
    }
    console.log(`
  classDef global fill:#cce5ff,stroke:#3399ff,color:#003366,font-weight:bold;
  classDef file fill:#d4edda,stroke:#28a745,color:#155724;
`);
  }
} else {
  const tree = buildReverseTree(filterFnName);

  function renderTreeText(nodes, indent = '') {
    for (const node of nodes) {
      console.log(`${indent}- ${node.caller} (${node.file})`);
      renderTreeText(node.parents, indent + '  ');
    }
  }

function renderTreeMermaid(nodes, parent = filterFnName) {
  const parentId = sanitize(parent);
  const parentFile = functionDefs.get(parent)?.file
    ? path.relative(projectRoot, functionDefs.get(parent).file)
    : '(unknown)';
  const label = `${parent}<br/>${parentFile}`;
  console.log(`  ${parentId}["${label}"]`);

  for (const node of nodes) {
    const id = sanitize(node.caller);
    const nodeLabel = `${node.caller}<br/>${node.file}`;
    console.log(`  ${id}["${nodeLabel}"]`);
    console.log(`  ${id} --> ${parentId}`);
    renderTreeMermaid(node.parents, node.caller);
  }
}


if (filterFnName) {
  console.log('checkAllNetworksHealth found:', functionDefs.has('checkAllNetworksHealth'));
  console.log('Location:', functionDefs.get('checkAllNetworksHealth')?.file);
}

  // DEBUG: Dump reverseGraph for target function
  if (filterFnName && reverseGraph.has(filterFnName)) {
    console.log('\n# DEBUG: Raw reverseGraph entries for', filterFnName);
    for (const caller of reverseGraph.get(filterFnName)) {
      const info = functionDefs.get(caller);
      const label = info ? `${caller}\\n${path.relative(projectRoot, info.file)}` : caller;
      console.log(`- ${label}`);
    }
  }

  if (outputFormat === 'text') {
    console.log(`\nReverse call tree to: ${filterFnName}\n`);
    renderTreeText(tree);
  } else {
    console.log(`graph TD`);
    renderTreeMermaid(tree);
  }
}

