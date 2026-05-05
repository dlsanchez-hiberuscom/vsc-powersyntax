import * as assert from 'assert/strict';
import Module = require('node:module');

import type { ClientCommandRegistrationDependencies } from '../../../src/client/commandRegistration';
import { SERVER_EXECUTE_COMMANDS } from '../../../src/server/handlers/lifecycleHandlers';

const moduleLoader = Module as typeof Module & {
  _load(request: string, parent: NodeModule | undefined, isMain: boolean): unknown;
};

const originalModuleLoad = moduleLoader._load.bind(moduleLoader);

moduleLoader._load = ((request: string, parent: NodeModule | undefined, isMain: boolean) => {
  if (request === 'vscode') {
    return {
      commands: {
        executeCommand: async () => undefined,
        registerCommand: () => ({ dispose() {} }),
      },
      window: {
        activeTextEditor: undefined,
        showInformationMessage: async () => undefined,
        showQuickPick: async () => undefined,
      },
    };
  }

  return originalModuleLoad(request, parent, isMain);
}) as typeof moduleLoader._load;

const {
  buildClientCommandRegistrations,
  expandClientCommandIds,
} = require('../../../src/client/commandRegistration') as typeof import('../../../src/client/commandRegistration');

moduleLoader._load = originalModuleLoad;

function createClientCommandDependenciesStub(): ClientCommandRegistrationDependencies {
  return new Proxy({}, {
    get: () => () => undefined,
  }) as ClientCommandRegistrationDependencies;
}

suite('unit/commandOwnership (VSIX-01)', () => {
  test('los comandos cliente expandidos no duplican IDs', () => {
    const commandIds = expandClientCommandIds(
      buildClientCommandRegistrations(createClientCommandDependenciesStub()),
    );

    assert.equal(commandIds.length, new Set(commandIds).size);
  });

  test('los comandos UI del cliente no se solapan con executeCommandProvider del servidor', () => {
    const clientCommandIds = new Set(
      expandClientCommandIds(buildClientCommandRegistrations(createClientCommandDependenciesStub())),
    );

    const overlaps = SERVER_EXECUTE_COMMANDS.filter((id) => clientCommandIds.has(id));

    assert.deepEqual(overlaps, []);
    assert.ok(clientCommandIds.has('powerbuilder.inspectHierarchy'));
    assert.equal((SERVER_EXECUTE_COMMANDS as readonly string[]).includes('powerbuilder.inspectHierarchy'), false);
  });
});