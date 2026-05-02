import * as assert from 'assert/strict';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

import { NodeFileSystem } from '../../../src/server/system/fileSystem';
import { fsPathToUri } from '../../../src/server/system/uriUtils';

suite('unit/fileSystem', () => {
  test('writeFile crea carpetas padre y persiste contenido', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-fs-'));
    const nodeFs = new NodeFileSystem();
    const filePath = path.join(root, 'cache', 'checkpoint.json');
    const uri = fsPathToUri(filePath);

    try {
      await nodeFs.writeFile(uri, '{"ok":true}');

      assert.equal(await nodeFs.readFile(uri), '{"ok":true}');
      assert.ok(await fs.stat(filePath));
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  test('createDirectory y deletePath operan sobre el sistema real', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-fs-'));
    const nodeFs = new NodeFileSystem();
    const dirPath = path.join(root, 'journal');
    const dirUri = fsPathToUri(dirPath);

    try {
      await nodeFs.createDirectory(dirUri);
      assert.ok((await fs.stat(dirPath)).isDirectory());

      await nodeFs.deletePath(dirUri);
      await assert.rejects(() => fs.stat(dirPath));
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  test('copyFile preserva el contenido binario del archivo origen', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-fs-'));
    const nodeFs = new NodeFileSystem();
    const sourcePath = path.join(root, 'legacy', 'app.pbl');
    const backupPath = path.join(root, 'backup', 'app.pbl');
    const sourceUri = fsPathToUri(sourcePath);
    const backupUri = fsPathToUri(backupPath);
    const payload = Buffer.from([0x50, 0x42, 0x4c, 0x00, 0xff, 0x10]);

    try {
      await fs.mkdir(path.dirname(sourcePath), { recursive: true });
      await fs.writeFile(sourcePath, payload);

      await nodeFs.copyFile(sourceUri, backupUri);

      assert.deepEqual(await fs.readFile(backupPath), payload);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});