const { defineConfig } = require('@vscode/test-cli');
const path = require('path');
const os = require('os');

const userDataDir = path.join(os.tmpdir(), 'vsc-powersyntax-test-userdata');
const extensionsDir = path.join(os.tmpdir(), 'vsc-powersyntax-test-extensions');
const installedUserDataDir = path.join(os.tmpdir(), 'vsc-powersyntax-installed-test-userdata');
const installedExtensionsDir = path.join(os.tmpdir(), 'vsc-powersyntax-installed-test-extensions');
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
const installedLaunchArgs = [
  '--user-data-dir', installedUserDataDir,
  '--extensions-dir', installedExtensionsDir,
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
    label: 'smoke-installed',
    files: 'out/test/smoke/extension.test.js',
    version: 'stable',
    workspaceFolder: '.',
    extensionDevelopmentPath: [],
    installExtensions: ['.dist/vsc-powersyntax.vsix'],
    launchArgs: installedLaunchArgs,
    mocha: {
      ui: 'tdd',
      timeout: 30000
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