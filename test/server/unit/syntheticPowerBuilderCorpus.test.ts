import * as assert from 'assert/strict';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  materializeSyntheticPowerBuilderCorpus,
  mutateSyntheticPowerBuilderCorpus,
} from '../helpers/syntheticPowerBuilderCorpus';

suite('unit/syntheticPowerBuilderCorpus (Wave 08)', () => {
  test('materializa surface extendida con sra/srf/srp y mutaciones deterministas', async function () {
    this.timeout(30000);

    const rootDir = path.join(os.tmpdir(), `vsc-powersyntax-synthetic-helper-${Date.now()}`);
    try {
      const corpus = await materializeSyntheticPowerBuilderCorpus(rootDir, 'smoke');
      const sampleApplication = corpus.files.find((file) => file.endsWith('.sra'));
      const sampleFunction = corpus.files.find((file) => file.endsWith('.srf'));
      const samplePipeline = corpus.files.find((file) => file.endsWith('.srp'));

      assert.ok(sampleApplication);
      assert.ok(sampleFunction);
      assert.ok(samplePipeline);

      const beforeApplication = await fs.readFile(sampleApplication!, 'utf8');
      const beforeFunction = await fs.readFile(sampleFunction!, 'utf8');
      const beforePipeline = await fs.readFile(samplePipeline!, 'utf8');

      assert.match(beforeApplication, /global type a_syn_\d+ from application/i);
      assert.match(beforeFunction, /global function integer gf_syn_\d+/i);
      assert.match(beforePipeline, /global type p_syn_\d+ from pipeline/i);

      const mutation = await mutateSyntheticPowerBuilderCorpus(rootDir, 'smoke', 1);

      assert.ok(mutation.mutatedFiles.length > 0);
      assert.ok(mutation.mutatedFiles.includes(sampleApplication!));
      assert.ok(mutation.mutatedFiles.includes(sampleFunction!));
      assert.ok(mutation.mutatedFiles.includes(samplePipeline!));

      const afterApplication = await fs.readFile(sampleApplication!, 'utf8');
      const afterFunction = await fs.readFile(sampleFunction!, 'utf8');
      const afterPipeline = await fs.readFile(samplePipeline!, 'utf8');
      const metadata = JSON.parse(await fs.readFile(mutation.metadataPath, 'utf8')) as {
        revision: number;
        mutatedFiles: number;
        extensionSummary?: Record<string, number>;
      };

      assert.notEqual(afterApplication, beforeApplication);
      assert.notEqual(afterFunction, beforeFunction);
      assert.notEqual(afterPipeline, beforePipeline);
      assert.equal(metadata.revision, 1);
      assert.equal(metadata.mutatedFiles, mutation.mutatedFiles.length);
      assert.ok((metadata.extensionSummary?.['.sra'] ?? 0) > 0);
      assert.ok((metadata.extensionSummary?.['.srf'] ?? 0) > 0);
      assert.ok((metadata.extensionSummary?.['.srp'] ?? 0) > 0);
    } finally {
      await fs.rm(rootDir, { recursive: true, force: true });
    }
  });
});