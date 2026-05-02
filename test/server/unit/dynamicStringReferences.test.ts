import * as assert from 'assert/strict';

import { detectDynamicStringReferences } from '../../../src/server/features/dynamicStringReferences';

suite('unit/dynamicStringReferences (B208)', () => {
  test('clasifica literales ordinarios como safe-literal', () => {
    const hits = detectDynamicStringReferences('of_add', [
      { uri: 'file:///x.sru', content: 'MessageBox("info", "of_add")' }
    ]);

    assert.equal(hits.length, 1);
    assert.equal(hits[0].classification, 'safe-literal');
  });

  test('clasifica PostEvent y TriggerEvent como dynamic', () => {
    const hits = detectDynamicStringReferences('ue_save', [
      { uri: 'file:///x.sru', content: 'this.PostEvent("ue_save")\r\nthis.TriggerEvent("ue_save")' }
    ]);

    assert.deepEqual(hits.map((hit) => hit.classification), ['dynamic', 'dynamic']);
  });

  test('clasifica rutas tipo json como probable', () => {
    const hits = detectDynamicStringReferences('customer_id', [
      { uri: 'file:///x.sru', content: 'ls_path = "$.order[0].customer_id"' }
    ]);

    assert.equal(hits.length, 1);
    assert.equal(hits[0].classification, 'probable');
  });

  test('clasifica SQL dinámico como dynamic', () => {
    const hits = detectDynamicStringReferences('cust_id', [
      { uri: 'file:///x.sru', content: 'EXECUTE IMMEDIATE "select cust_id from customer";' }
    ]);

    assert.equal(hits.length, 1);
    assert.equal(hits[0].classification, 'dynamic');
  });

  test('clasifica Open, DataObject y EvaluateJavascript como dynamic', () => {
    const hits = detectDynamicStringReferences('w_order', [
      {
        uri: 'file:///x.sru',
        content: 'Open("w_order")\r\nids_orders.DataObject = "w_order"\r\nwb_1.EvaluateJavascriptAsync("openWindow(\'w_order\')")'
      }
    ]);

    assert.deepEqual(hits.map((hit) => hit.classification), ['dynamic', 'dynamic', 'dynamic']);
  });
});