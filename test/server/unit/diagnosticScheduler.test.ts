import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  cancelScheduledDiagnostics,
  clearAllScheduledDiagnostics,
  publishDiagnosticsNow,
  scheduleDiagnostics
} from '../../../src/server/analysis/diagnosticScheduler';
import { TaskScheduler } from '../../../src/server/runtime/scheduler';
import { loadFixture } from '../helpers/fixtureLoader';

class FakeConnection {
  public calls: Array<{ uri: string; diagnostics: unknown[] }> = [];

  sendDiagnostics(payload: { uri: string; diagnostics: unknown[] }): void {
    this.calls.push(payload);
  }
}

const source = loadFixture('basic/sample.sru');

suite('unit/diagnosticScheduler', () => {
  test('publishDiagnosticsNow publica inmediatamente', async () => {
    const connection = new FakeConnection();
    const document = TextDocument.create('file:///scheduler-now.sru', 'powerbuilder', 1, source);

    publishDiagnosticsNow(connection as never, document, new TaskScheduler());

    // scheduler runs interactive tasks asynchronously (Promises)
    // we need to wait a tick
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(connection.calls.length, 1);
    assert.equal(connection.calls[0].uri, document.uri);
  });

  test('scheduleDiagnostics publica tras el retardo', async () => {
    const connection = new FakeConnection();
    const document = TextDocument.create('file:///scheduler-delay.sru', 'powerbuilder', 1, source);
    const scheduler = new TaskScheduler();

    scheduleDiagnostics(connection as never, document, scheduler, 10);

    assert.equal(connection.calls.length, 1);

    await new Promise((resolve) => setTimeout(resolve, 30));

    assert.equal(connection.calls.length, 2);
  });

  test('cancelScheduledDiagnostics cancela una publicación pendiente', async () => {
    const connection = new FakeConnection();
    const document = TextDocument.create('file:///scheduler-cancel.sru', 'powerbuilder', 1, source);
    const scheduler = new TaskScheduler();

    scheduleDiagnostics(connection as never, document, scheduler, 20);
    cancelScheduledDiagnostics(document.uri);

    await new Promise((resolve) => setTimeout(resolve, 40));

    assert.equal(connection.calls.length, 1);
    clearAllScheduledDiagnostics();
  });
});