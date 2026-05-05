#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const canonicalScript = path.resolve(__dirname, '..', 'scripts', 'generate_official_function_catalog.cjs');
const result = spawnSync(process.execPath, [canonicalScript, ...process.argv.slice(2)], {
    cwd: path.resolve(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
});

if (result.error) {
    console.error(result.error instanceof Error ? result.error.message : String(result.error));
    process.exitCode = 1;
} else {
    process.exitCode = result.status ?? 1;
}