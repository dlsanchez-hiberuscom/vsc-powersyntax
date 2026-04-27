import test from 'node:test';
import assert from 'node:assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  cancelScheduledDiagnostics,
  clearAllScheduledDiagnostics,
  publishDiagnosticsNow,
  scheduleDiagnostics
} from '../../../src/server/analysis/diagnosticScheduler';
import { loadFixture } from '../helpers/fixtureLoader';

class FakeConnection {
  public calls: Array<{ uri: string; diagnostics: unknown[] }> = [];

  sendDiagnostics(payload: { uri: string; diagnostics: unknown[] }): void {
    this.calls.push(payload);
  }
}

const source = loadFixture('basic/sample.sru');

test('publishDiagnosticsNow publica inmediatamente', () => {
  const connection = new FakeConnection();
  const document = TextDocument.create('file:///scheduler-now.sru', 'powerbuilder', 1, source);

  publishDiagnosticsNow(connection as never, document);

  assert.equal(connection.calls.length, 1);
  assert.equal(connection.calls[0].uri, document.uri);
});

test('scheduleDiagnostics publica tras el retardo', async () => {
  const connection = new FakeConnection();
  const document = TextDocument.create('file:///scheduler-delay.sru', 'powerbuilder', 1, source);

  scheduleDiagnostics(connection as never, document, 10);

  await new Promise((resolve) => setTimeout(resolve, 30));

  assert.equal(connection.calls.length, 1);
});

test('cancelScheduledDiagnostics cancela una publicación pendiente', async () => {
  const connection = new FakeConnection();
  const document = TextDocument.create('file:///scheduler-cancel.sru', 'powerbuilder', 1, source);

  scheduleDiagnostics(connection as never, document, 20);
  cancelScheduledDiagnostics(document.uri);

  await new Promise((resolve) => setTimeout(resolve, 40));

  assert.equal(connection.calls.length, 0);
  clearAllScheduledDiagnostics();
});
