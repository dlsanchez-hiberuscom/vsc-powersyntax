const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig([
  {
    label: 'smoke',
    files: 'out/test/smoke/**/*.test.js',
    version: 'stable',
    workspaceFolder: '.',
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
    mocha: {
      ui: 'tdd',
      timeout: 120000
    }
  }
]);