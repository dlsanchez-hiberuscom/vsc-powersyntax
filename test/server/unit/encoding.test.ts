import * as assert from 'assert/strict';
import { stripBom, bytesToText } from '../../../src/server/system/encoding';

suite('unit/encoding (B130)', () => {
  test('stripBom retira BOM inicial', () => {
    assert.equal(stripBom('\uFEFFhello'), 'hello');
    assert.equal(stripBom('hello'), 'hello');
    assert.equal(stripBom('a\uFEFFb'), 'a\uFEFFb');
  });

  test('bytesToText decodifica UTF-8 con BOM', () => {
    const buf = Buffer.from([0xEF, 0xBB, 0xBF, 0x68, 0x69]); // BOM + "hi"
    assert.equal(bytesToText(buf), 'hi');
  });
});
