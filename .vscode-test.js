const { defineConfig } = require('@vscode/test-cli');
const path = require('path');
const os = require('os');

const userDataDir = path.join(os.tmpdir(), 'vsc-powersyntax-test-userdata');
const extensionsDir = path.join(os.tmpdir(), 'vsc-powersyntax-test-extensions');
const launchArgs = [
  '--user-data-dir', userDataDir,
  '--extensions-dir', extensionsDir,
  '--disable-gpu',
  '--no-sandbox',
  '--disable-updates',
  '--skip-welcome',
  '--skip-release-notes',
  '--disable-workspace-trust'
];

module.exports = defineConfig([
  {
    label: 'smoke',
    files: 'out/test/smoke/**/*.test.js',
    version: 'stable',
    workspaceFolder: '.',
    launchArgs,
    mocha: {
      ui: 'tdd',
      timeout: 20000
    }
  },
  {
    label: 'unit',
    files: 'out/test/server/unit/**/*.test.js',
    version: 'stable',
    workspaceFolder: '.',
    launchArgs,
    mocha: {
      ui: 'tdd',
      timeout: 20000
    }
  },
  {
    label: 'integration',
    files: 'out/test/server/integration/**/*.test.js',
    version: 'stable',
    workspaceFolder: '.',
    launchArgs,
    mocha: {
      ui: 'tdd',
      timeout: 30000
    }
  },
  {
    label: 'performance',
    files: 'out/test/server/performance/**/*.test.js',
    version: 'stable',
    workspaceFolder: '.',
    launchArgs,
    mocha: {
      ui: 'tdd',
      timeout: 120000
    }
  }
]);