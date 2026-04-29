import * as assert from 'assert/strict';
import { stripCommentsSmart, CharType } from '../../../src/server/utils/comments';

suite('unit/comments_stripper', () => {
  test('debe manejar comentarios de línea simple //', () => {
    const lines = ['li_val = 1 // comentario'];
    const { lines: stripped, masks } = stripCommentsSmart(lines);

    assert.strictEqual(stripped[0].trim(), 'li_val = 1');
    assert.strictEqual(masks[0][0], CharType.Code);
    assert.strictEqual(masks[0][11], CharType.Comment);
  });

  test('debe manejar bloques de comentarios /* */', () => {
    const lines = ['li_val = /* bloque */ 1'];
    const { lines: stripped, masks } = stripCommentsSmart(lines);

    assert.strictEqual(stripped[0].includes('bloque'), false);
    assert.strictEqual(masks[0][9], CharType.Comment);
    assert.strictEqual(masks[0][21], CharType.None); // Espacio después de */
    assert.strictEqual(masks[0][22], CharType.Code); // El carácter '1'
  });

  test('debe manejar comentarios anidados /* /* ... */ */', () => {
    const lines = [
      '/* outer /* inner */ outer */'
    ];
    const { masks } = stripCommentsSmart(lines);

    for (let i = 0; i < lines[0].length; i++) {
      assert.strictEqual(masks[0][i], CharType.Comment);
    }
  });

  test('debe manejar strings con escapes (~)', () => {
    const lines = ['ls_val = "string with ~"quotes~" and ~~tildes"'];
    const { masks } = stripCommentsSmart(lines);

    assert.strictEqual(masks[0][9], CharType.String); // "
    assert.strictEqual(masks[0][21], CharType.String); // ~
    assert.strictEqual(masks[0][22], CharType.String); // "
  });

  test('debe manejar escapes hexadecimales (~hHH) y decimales (~###)', () => {
    const lines = ['ls_val = "~h0A~123"'];
    const { masks } = stripCommentsSmart(lines);

    assert.strictEqual(masks[0][10], CharType.String); // ~
    assert.strictEqual(masks[0][11], CharType.String); // h
    assert.strictEqual(masks[0][12], CharType.String); // 0
    assert.strictEqual(masks[0][13], CharType.String); // A
    assert.strictEqual(masks[0][14], CharType.String); // ~
    assert.strictEqual(masks[0][15], CharType.String); // 1
    assert.strictEqual(masks[0][16], CharType.String); // 2
    assert.strictEqual(masks[0][17], CharType.String); // 3
  });

  test('debe manejar strings multi-línea con continuación (&)', () => {
    const lines = [
      'ls_str = "Parte 1 &',
      'Parte 2"'
    ];
    const { masks } = stripCommentsSmart(lines);

    // Línea 0: "Parte 1 & -> todo debe ser String desde el índice 9
    for (let i = 9; i < lines[0].length; i++) {
      assert.strictEqual(masks[0][i], CharType.String, `Error en línea 0 posición ${i}`);
    }

    // Línea 1: Parte 2" -> todo debe ser String hasta el índice 7 (incluyendo la comilla)
    for (let i = 0; i < 8; i++) {
      assert.strictEqual(masks[1][i], CharType.String, `Error en línea 1 posición ${i}`);
    }
  });

  test('debe cerrar strings al final de línea si no hay continuación (&)', () => {
    const lines = [
      'ls_str = "Error sin ampersand',
      'li_val = 1'
    ];
    const { masks } = stripCommentsSmart(lines);

    // Línea 0: todo después de " es String
    assert.strictEqual(masks[0][9], CharType.String);

    // Línea 1: li_val debe ser Code (no String)
    assert.strictEqual(masks[1][0], CharType.Code, 'La línea 1 no debería ser String');
  });

  test('debe ignorar comentarios dentro de strings multi-línea', () => {
    const lines = [
      'ls_str = "Comentario // no es comentario &',
      'continuación"'
    ];
    const { lines: stripped } = stripCommentsSmart(lines);

    assert.strictEqual(stripped[0].includes('//'), true, 'El // dentro de un string multi-línea no debe eliminarse');
  });
});
