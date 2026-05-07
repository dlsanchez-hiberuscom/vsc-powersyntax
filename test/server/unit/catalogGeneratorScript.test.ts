import * as assert from 'assert/strict';
import * as nodeFs from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { loadFixture } from '../helpers/fixtureLoader';

const REPO_ROOT = path.resolve(__dirname, '../../../..');

suite('unit/catalogGeneratorScript', () => {
  function resolveGeneratorScriptPath(): string {
    return path.join(REPO_ROOT, 'scripts', 'generate_official_function_catalog.cjs');
  }

  function loadJsonFixture<T>(relativePath: string): T {
    return JSON.parse(loadFixture(relativePath)) as T;
  }

  function compactSignatures(
    signatures: Array<{ label: string; parameters?: Array<{ label: string; documentation?: string }>; returnType?: string }> | undefined,
  ): Array<{ label: string; parameters?: Array<{ label: string; documentation?: string }>; returnType?: string }> | undefined {
    return signatures?.map((signature) => ({
      label: signature.label,
      parameters: signature.parameters?.map((parameter) => ({
        label: parameter.label,
        documentation: parameter.documentation,
      })),
      returnType: signature.returnType,
    }));
  }

  function compactPowerScriptEntries(entries: Array<{
    name: string;
    returnDocumentation?: string;
    returnType?: string;
    usageNotes?: string[];
    signatures: Array<{ label: string; parameters?: Array<{ label: string; documentation?: string }>; returnType?: string }>;
  }>): unknown {
    return JSON.parse(JSON.stringify(entries.map((entry) => ({
      name: entry.name,
      returnDocumentation: entry.returnDocumentation,
      returnType: entry.returnType,
      usageNotes: entry.usageNotes,
      signatures: compactSignatures(entry.signatures),
    }))));
  }

  function compactDataWindowEntries(entries: Array<{
    name: string;
    appliesTo?: string[];
    obsolete?: boolean;
    obsoleteMessage?: string;
    replacement?: string;
    risk?: string;
    returnType?: string;
    ownerInfo?: { ownerTypes?: string[] };
    signatures: Array<{ label: string; parameters?: Array<{ label: string; documentation?: string }>; returnType?: string }>;
  }>): unknown {
    return JSON.parse(JSON.stringify(entries.map((entry) => ({
      name: entry.name,
      appliesTo: entry.appliesTo,
      ownerTypes: entry.ownerInfo?.ownerTypes,
      obsolete: entry.obsolete,
      obsoleteMessage: entry.obsoleteMessage,
      replacement: entry.replacement,
      risk: entry.risk,
      returnType: entry.returnType,
      signatures: compactSignatures(entry.signatures),
    }))));
  }

  function compactEventEntries(entries: Array<{
    appliesTo?: string[];
    eventId?: string;
    eventIds?: Array<{ id: string; ownerTypes?: string[] }>;
    name: string;
    ownerInfo?: { ownerTypes?: string[] };
    signatures: Array<{ label: string; parameters?: Array<{ label: string; documentation?: string }> }>;
    title?: string;
  }>): unknown {
    return JSON.parse(JSON.stringify(entries.map((entry) => ({
      name: entry.name,
      title: entry.title,
      appliesTo: entry.appliesTo,
      eventId: entry.eventId,
      eventIds: entry.eventIds,
      ownerTypes: entry.ownerInfo?.ownerTypes,
      signatures: compactSignatures(entry.signatures),
    }))));
  }

  function compactSystemTypeEntry(entry: {
    baseType?: string;
    events?: string[];
    functions?: string[];
    name: string;
    properties?: string[];
    summary: string;
  }): unknown {
    return JSON.parse(JSON.stringify({
      name: entry.name,
      summary: entry.summary,
      baseType: entry.baseType,
      properties: entry.properties,
      functions: entry.functions,
      events: entry.events,
    }));
  }

  function compactReservedWordEntries(entries: Array<{
    category: string;
    identifierPolicy?: string;
    name: string;
    reservedWordCanBeFunctionName?: boolean;
    signatures?: Array<{ label: string }>;
    summary: string;
  }>): unknown {
    return JSON.parse(JSON.stringify(entries.map((entry) => ({
      name: entry.name,
      category: entry.category,
      identifierPolicy: entry.identifierPolicy,
      reservedWordCanBeFunctionName: entry.reservedWordCanBeFunctionName,
      signatures: entry.signatures,
      summary: entry.summary,
    }))));
  }

  function loadGeneratorScript(): {
    extractAppliesToLabels(html: string): string[];
    extractSignatureGroups(html: string, title: string): Array<{
      name: string;
      signatures: Array<{ label: string }>;
    }>;
    parsePowerScriptPage(html: string, pageUrl: string): Array<{
      appliesTo?: string[];
      name: string;
      returnDocumentation?: string;
      returnType?: string;
      usageNotes?: string[];
      signatures: Array<{
        label: string;
        parameters?: Array<{ label: string; documentation?: string }>;
        returnType?: string;
      }>;
    }>;
    parseDataWindowPage(html: string, pageUrl: string, chapterTitle: string): Array<{
      appliesTo?: string[];
      name: string;
      obsolete?: boolean;
      obsoleteMessage?: string;
      ownerInfo?: { ownerTypes?: string[] };
      replacement?: string;
      returnDocumentation?: string;
      returnType?: string;
      risk?: string;
      signatures: Array<{
        label: string;
        parameters?: Array<{ label: string; documentation?: string }>;
        returnType?: string;
      }>;
    }>;
    parsePowerScriptEventPage(html: string, pageUrl: string, options?: Record<string, unknown>): Array<{
      appliesTo?: string[];
      eventId?: string;
      eventIds?: Array<{ id: string; ownerTypes?: string[] }>;
      name: string;
      ownerInfo?: { ownerTypes?: string[] };
      signatures: Array<{
        label: string;
        parameters?: Array<{ label: string; documentation?: string }>;
      }>;
      title?: string;
    }>;
    parseOfficialSystemObjectDatatypePage(html: string, entry: {
      name: string;
      category: string;
      summary: string;
      sourceUrl: string;
    }): {
      baseType?: string;
      documentation?: string;
      events?: string[];
      functions?: string[];
      name: string;
      properties?: string[];
      summary: string;
    };
    parsePowerScriptReservedWordPage(html: string, sourceUrl: string): Array<{
      canBeFunctionName: boolean;
      name: string;
      sourceUrl: string;
    }>;
    buildGeneratedReservedWordEntry(entry: { name: string; canBeFunctionName: boolean; sourceUrl: string }): {
      category: string;
      identifierPolicy?: string;
      name: string;
      reservedWordCanBeFunctionName?: boolean;
      signatures?: Array<{ label: string }>;
      sourceUrl?: string;
      summary: string;
    };
    renderBuilderCall(builderName: string, entry: Record<string, unknown>): string;
  } {
    const scriptPath = resolveGeneratorScriptPath();
    return require(scriptPath);
  }

  test('official catalog generator apunta al layout actual del servidor', async () => {
    const scriptPath = resolveGeneratorScriptPath();
    const content = await fs.readFile(scriptPath, 'utf8');

    assert.match(content, /out\/server\/knowledge\/system\/services\/queryService/);
    assert.match(content, /out\/server\/knowledge\/system\/normalization/);
    assert.match(content, /src\/server\/knowledge\/system\/generated\/generated\.generated\.ts/);
    assert.match(content, /src\/server\/knowledge\/system\/generated\/enumeratedTypes\.generated\.ts/);
    assert.match(content, /src\/server\/knowledge\/system\/generated\/enumeratedValues\.generated\.ts/);
    assert.match(content, /src\/server\/knowledge\/system\/generated\/enumeratedCoverage\.generated\.ts/);
    assert.match(content, /src\/server\/knowledge\/system\/generated\/enumeratedProvenance\.generated\.ts/);
    assert.match(content, /src\/server\/knowledge\/system\/generated\/officialCoverage\.generated\.ts/);
    assert.match(content, /src\/server\/knowledge\/system\/generated\/generatedCompleteness\.generated\.ts/);
    assert.match(content, /src\/server\/parsing\/generatedKeywordLexemes\.generated\.ts/);
    assert.doesNotMatch(content, /out\/powerbuilder\/knowledge/);
    assert.doesNotMatch(content, /src\/powerbuilder\/knowledge\/generated/);
  });

  test('officialCoverage generado publica dominios oficiales relevantes además de events/statements', async () => {
    const coveragePath = path.join(REPO_ROOT, 'src', 'server', 'knowledge', 'system', 'generated', 'officialCoverage.generated.ts');
    const content = await fs.readFile(coveragePath, 'utf8');

    assert.match(content, /"global-functions"/);
    assert.match(content, /"object-functions"/);
    assert.match(content, /"datawindow-functions"/);
    assert.match(content, /"keywords"/);
    assert.match(content, /"reserved-words"/);
    assert.match(content, /"datatypes"/);
    assert.match(content, /"system-object-datatypes"/);
    assert.match(content, /"system-events"/);
    assert.match(content, /"statements"/);
  });

  test('generatedCompleteness generado publica mode complete y dominios oficiales relevantes', async () => {
    const completenessPath = path.join(REPO_ROOT, 'src', 'server', 'knowledge', 'system', 'generated', 'generatedCompleteness.generated.ts');
    const content = await fs.readFile(completenessPath, 'utf8');

    assert.match(content, /PB_GENERATED_COMPLETENESS_MODE = "complete"/);
    assert.match(content, /"global-functions"/);
    assert.match(content, /"object-functions"/);
    assert.match(content, /"datawindow-functions"/);
    assert.match(content, /"keywords"/);
    assert.match(content, /"reserved-words"/);
    assert.match(content, /"datatypes"/);
    assert.match(content, /"system-object-datatypes"/);
    assert.match(content, /"system-events"/);
    assert.match(content, /"statements"/);
  });

  test('keyword lexemes generated reflejan reserved words oficiales relevantes', async () => {
    const lexemesPath = path.join(REPO_ROOT, 'src', 'server', 'parsing', 'generatedKeywordLexemes.generated.ts');
    const content = await fs.readFile(lexemesPath, 'utf8');

    assert.match(content, /"commit"/);
    assert.match(content, /"namespace"/);
    assert.match(content, /"with"/);
  });

  test('enumerated coverage generated publica dominios oficiales de tipos y valores', async () => {
    const coveragePath = path.join(REPO_ROOT, 'src', 'server', 'knowledge', 'system', 'generated', 'enumeratedCoverage.generated.ts');
    const content = await fs.readFile(coveragePath, 'utf8');

    assert.match(content, /"enumerated-types"/);
    assert.match(content, /"enumerated-values"/);
    assert.match(content, /measurement: "lookup-key"/);
    assert.match(content, /measurement: "type-name-value"/);
  });

  test('extractAppliesToLabels prioriza texto real frente a links auxiliares', () => {
    const generator = loadGeneratorScript();
    const labels = generator.extractAppliesToLabels([
      '<div>',
      '  <p><a href="dwmeth_SetItem.html">SetItem</a></p>',
      '  <p>Web DataWindow server component</p>',
      '</div>',
    ].join('\n'));

    assert.deepEqual(labels, ['Web DataWindow server component']);
  });

  test('extractSignatureGroups separa múltiples syntaxes dentro del mismo bloque pre', () => {
    const generator = loadGeneratorScript();
    const groups = generator.extractSignatureGroups([
      '<p><span class="bold"><strong>Syntax</strong></span></p>',
      '<pre class="programlisting">',
      'integer dwcontrol.OLEActivate ( long row, integer column, integer verb )',
      'integer dwcontrol.OLEActivate ( long row, string column, integer verb )',
      '</pre>',
      '<p><span class="bold"><strong>Return value</strong></span></p>',
    ].join('\n'), 'OLEActivate');

    assert.equal(groups.length, 1);
    assert.equal(groups[0].name, 'OLEActivate');
    assert.deepEqual(
      groups[0].signatures.map((signature) => signature.label),
      [
        'integer dwcontrol.OLEActivate ( long row, integer column, integer verb )',
        'integer dwcontrol.OLEActivate ( long row, string column, integer verb )',
      ],
    );
  });

  test('parsePowerScriptPage conserva parámetros estructurados por firma', () => {
    const generator = loadGeneratorScript();
    const entries = generator.parsePowerScriptPage([
      '<h2 class="title">AddItemArray</h2>',
      '<p>Adds a child item of JsonArrayItem type in the JSON generator object.</p>',
      '<p><span class="bold"><strong>Applies to</strong></span></p>',
      '<p>JSONGenerator objects</p>',
      '<p><span class="bold"><strong>Syntax</strong></span></p>',
      '<pre class="programlisting">',
      'long objectname.AddItemArray ( ParentItemHandle )',
      'long objectname.AddItemArray ( ParentItemHandle, Key )',
      'long objectname.AddItemArray ( ParentItemPath )',
      'long objectname.AddItemArray ( ParentItemPath, Key )',
      '</pre>',
      '<p><span class="bold"><strong>Arguments</strong></span></p>',
      '<table><tbody>',
      '<tr><th>Argument</th><th>Description</th></tr>',
      '<tr><td>ParentItemHandle</td><td>Handle of the parent item.</td></tr>',
      '<tr><td>ParentItemPath</td><td>Path to the parent item.</td></tr>',
      '<tr><td>Key</td><td>Name of the child item.</td></tr>',
      '</tbody></table>',
      '<p><span class="bold"><strong>Return value</strong></span></p>',
      '<p>Long. Returns the handle of the new child item.</p>',
    ].join('\n'), 'https://example.test/additemarray');

    assert.equal(entries.length, 1);
    assert.equal(entries[0].returnType, 'Long');
    assert.match(entries[0].returnDocumentation ?? '', /Returns the handle/i);
    assert.deepEqual(entries[0].signatures.map((signature) => signature.parameters ?? []), [
      [{ label: 'ParentItemHandle', documentation: 'Handle of the parent item.' }],
      [
        { label: 'ParentItemHandle', documentation: 'Handle of the parent item.' },
        { label: 'Key', documentation: 'Name of the child item.' },
      ],
      [{ label: 'ParentItemPath', documentation: 'Path to the parent item.' }],
      [
        { label: 'ParentItemPath', documentation: 'Path to the parent item.' },
        { label: 'Key', documentation: 'Name of the child item.' },
      ],
    ]);
    assert.deepEqual(entries[0].signatures.map((signature) => signature.returnType), ['Long', 'Long', 'Long', 'Long']);
  });

  test('parsePowerScriptPage reutiliza tabla anónima bajo Syntax cuando falta Arguments', () => {
    const generator = loadGeneratorScript();
    const entries = generator.parsePowerScriptPage([
      '<h2 class="title">AddItemArray</h2>',
      '<p><span class="bold"><strong>Description</strong></span></p>',
      '<p>Adds a child item of JsonArrayItem type in the JSON generator object.</p>',
      '<p><span class="bold"><strong>Applies to</strong></span></p>',
      '<p>JSONGenerator objects</p>',
      '<p><span class="bold"><strong>Syntax</strong></span></p>',
      '<pre class="programlisting">',
      'objectname.AddItemArray ( ParentItemHandle )',
      'objectname.AddItemArray ( ParentItemHandle, Key )',
      'objectname.AddItemArray ( ParentItemPath )',
      'objectname.AddItemArray ( ParentItemPath, Key )',
      '</pre>',
      '<table><tbody>',
      '<tr><td>objectname</td><td>The name of the JSONGenerator object in which you want to add an item</td></tr>',
      '<tr><td>ParentItemHandle</td><td>A long whose value is the handle of the parent item of JsonArrayItem or JsonObjectItem type</td></tr>',
      '<tr><td>ParentItemPath</td><td>A string whose value is the path of the parent item of JsonArrayItem or JsonObjectItem type</td></tr>',
      '<tr><td>Key</td><td>A string whose value is the key of the child item</td></tr>',
      '</tbody></table>',
      '<p><span class="bold"><strong>Return value</strong></span></p>',
      '<p>Long. Returns the handle of the new child item if it succeeds and -1 if an error occurs.</p>',
    ].join('\n'), 'https://example.test/additemarray-layout-real');

    assert.equal(entries.length, 1);
    assert.deepEqual(entries[0].signatures.map((signature) => signature.parameters ?? []), [
      [{ label: 'ParentItemHandle', documentation: 'A long whose value is the handle of the parent item of JsonArrayItem or JsonObjectItem type' }],
      [
        { label: 'ParentItemHandle', documentation: 'A long whose value is the handle of the parent item of JsonArrayItem or JsonObjectItem type' },
        { label: 'Key', documentation: 'A string whose value is the key of the child item' },
      ],
      [{ label: 'ParentItemPath', documentation: 'A string whose value is the path of the parent item of JsonArrayItem or JsonObjectItem type' }],
      [
        { label: 'ParentItemPath', documentation: 'A string whose value is the path of the parent item of JsonArrayItem or JsonObjectItem type' },
        { label: 'Key', documentation: 'A string whose value is the key of the child item' },
      ],
    ]);
  });

  test('fixture/regression official ApplyTheme congela return y usage notes sin red', () => {
    const generator = loadGeneratorScript();
    const html = loadFixture(path.join('catalog-generator', 'ApplyTheme_func.html'));
    const expected = loadJsonFixture<unknown>(path.join('catalog-generator', 'ApplyTheme_func.expected.json'));

    assert.deepEqual(
      compactPowerScriptEntries(generator.parsePowerScriptPage(html, 'https://example.test/ApplyTheme_func.html')),
      expected,
    );
  });

  test('fixture/regression official SetItemDate conserva obsolete y evita contaminación de appliesTo', () => {
    const generator = loadGeneratorScript();
    const html = loadFixture(path.join('catalog-generator', 'dwmeth_SetItemDate.html'));
    const expected = loadJsonFixture<unknown>(path.join('catalog-generator', 'dwmeth_SetItemDate.expected.json'));

    assert.deepEqual(
      compactDataWindowEntries(generator.parseDataWindowPage(html, 'https://example.test/dwmeth_SetItemDate.html', 'Methods')),
      expected,
    );
  });

  test('fixture/regression official AddItemArray congela signatures y parámetros estructurados sin red', () => {
    const generator = loadGeneratorScript();
    const html = loadFixture(path.join('catalog-generator', 'additemarray_func.html'));
    const expected = loadJsonFixture<unknown>(path.join('catalog-generator', 'additemarray_func.expected.json'));

    assert.deepEqual(
      compactPowerScriptEntries(generator.parsePowerScriptPage(html, 'https://example.test/additemarray_func.html')),
      expected,
    );
  });

  test('fixture/regression official OLEActivate congela las dos signatures DataWindow sin red', () => {
    const generator = loadGeneratorScript();
    const html = loadFixture(path.join('catalog-generator', 'dwmeth_OLEActivate.html'));
    const expected = loadJsonFixture<unknown>(path.join('catalog-generator', 'dwmeth_OLEActivate.expected.json'));

    assert.deepEqual(
      compactDataWindowEntries(generator.parseDataWindowPage(html, 'https://example.test/dwmeth_OLEActivate.html', 'Methods')),
      expected,
    );
  });

  test('fixture/regression official BeginDrag congela syntax groups, event IDs y owner types sin red', () => {
    const generator = loadGeneratorScript();
    const html = loadFixture(path.join('catalog-generator', 'beginDrag_event.html'));
    const expected = loadJsonFixture<unknown>(path.join('catalog-generator', 'beginDrag_event.expected.json'));

    assert.deepEqual(
      compactEventEntries(generator.parsePowerScriptEventPage(html, 'https://example.test/beginDrag_event.html')),
      expected,
    );
  });

  test('fixture/regression official DragDrop congela tres syntax groups y owner mappings sin red', () => {
    const generator = loadGeneratorScript();
    const html = loadFixture(path.join('catalog-generator', 'dragDrop_event.html'));
    const expected = loadJsonFixture<unknown>(path.join('catalog-generator', 'dragDrop_event.expected.json'));

    assert.deepEqual(
      compactEventEntries(generator.parsePowerScriptEventPage(html, 'https://example.test/dragDrop_event.html')),
      expected,
    );
  });

  test('fixture/regression official PDFDocumentProperties congela summary, baseType y miembros sin red', () => {
    const generator = loadGeneratorScript();
    const html = loadFixture(path.join('catalog-generator', 'PDFDocumentProperties_object.html'));
    const expected = loadJsonFixture<unknown>(path.join('catalog-generator', 'PDFDocumentProperties_object.expected.json'));

    assert.deepEqual(
      compactSystemTypeEntry(generator.parseOfficialSystemObjectDatatypePage(html, {
        category: 'Referencia oficial',
        name: 'PDFDocumentProperties',
        sourceUrl: 'https://example.test/PDFDocumentProperties_object.html',
        summary: 'seed',
      })),
      expected,
    );
  });

  test('fixture/regression official reserved words congela asterisk metadata e identifierPolicy sin red', () => {
    const generator = loadGeneratorScript();
    const html = loadFixture(path.join('catalog-generator', 'xREF_80481_Reserved_words.html'));
    const expected = loadJsonFixture<unknown>(path.join('catalog-generator', 'xREF_80481_Reserved_words.expected.json'));
    const actual = generator
      .parsePowerScriptReservedWordPage(html, 'https://example.test/xREF_80481_Reserved_words.html')
      .map((entry) => generator.buildGeneratedReservedWordEntry(entry));

    assert.deepEqual(compactReservedWordEntries(actual), expected);
  });

  test('parseDataWindowPage detecta obsolete fuera del título y preserva risk deprecated', () => {
    const generator = loadGeneratorScript();
    const entries = generator.parseDataWindowPage([
      '<h2 class="title">SetItemDate</h2>',
      '<p>Obsolete method. This method should not be used. Use SetItem instead.</p>',
      '<p><span class="bold"><strong>Applies to</strong></span></p>',
      '<p>DataWindow control</p>',
      '<p><span class="bold"><strong>Syntax</strong></span></p>',
      '<pre class="programlisting">',
      'short dwcontrol.SetItemDate ( long row, string column, string value )',
      '</pre>',
      '<p><span class="bold"><strong>Arguments</strong></span></p>',
      '<table><tbody>',
      '<tr><th>Argument</th><th>Description</th></tr>',
      '<tr><td>row</td><td>Row number.</td></tr>',
      '<tr><td>column</td><td>Column name.</td></tr>',
      '<tr><td>value</td><td>Date value.</td></tr>',
      '</tbody></table>',
      '<p><span class="bold"><strong>Return value</strong></span></p>',
      '<p>Short.</p>',
    ].join('\n'), 'https://example.test/setitemdate', 'Methods');

    assert.equal(entries.length, 1);
    assert.equal(entries[0].obsolete, true);
    assert.match(entries[0].obsoleteMessage ?? '', /Obsolete method/i);
    assert.equal(entries[0].replacement, 'SetItem');
    assert.equal(entries[0].returnType, 'Short');
    assert.equal(entries[0].risk, 'deprecated');
  });

  test('parsePowerScriptEventPage extrae Event ID estructurado por sección', () => {
    const generator = loadGeneratorScript();
    const entries = generator.parsePowerScriptEventPage([
      '<h2 class="title">BeginDrag</h2>',
      '<h4 class="title">Syntax 1</h4>',
      '<p><span class="bold"><strong>Event ID</strong></span></p>',
      '<table><tbody>',
      '<tr><th>Event ID</th><th>Object</th></tr>',
      '<tr><td>pbm_lvnbegindrag</td><td>ListView</td></tr>',
      '</tbody></table>',
      '<p><span class="bold"><strong>Arguments</strong></span></p>',
      '<table><tbody>',
      '<tr><th>Argument</th><th>Description</th></tr>',
      '<tr><td>index</td><td>Index of the item.</td></tr>',
      '</tbody></table>',
      '<h4 class="title">Syntax 2</h4>',
      '<p><span class="bold"><strong>Event ID</strong></span></p>',
      '<table><tbody>',
      '<tr><th>Event ID</th><th>Object</th></tr>',
      '<tr><td>pbm_tvnbegindrag</td><td>TreeView</td></tr>',
      '</tbody></table>',
      '<p><span class="bold"><strong>Arguments</strong></span></p>',
      '<table><tbody>',
      '<tr><th>Argument</th><th>Description</th></tr>',
      '<tr><td>handle</td><td>Handle of the dragged node.</td></tr>',
      '</tbody></table>',
    ].join('\n'), 'https://example.test/begindrag');

    assert.equal(entries.length, 2);
    assert.deepEqual(entries.map((entry) => entry.eventId), ['pbm_lvnbegindrag', 'pbm_tvnbegindrag']);
  });

  test('parseOfficialSystemObjectDatatypePage hidrata baseType y miembros estructurados', () => {
    const generator = loadGeneratorScript();
    const entry = generator.parseOfficialSystemObjectDatatypePage([
      '<h2 class="title">PDFDocumentProperties object</h2>',
      '<p>PDFDocumentProperties is one of the PDF Builder objects and is derived from PDFModel. It gets or sets the properties of the PDF document.</p>',
      '<h3 class="title"><a id="d0e43613"></a>Properties</h3>',
      '<p>PDFDocumentProperties provides the following properties. In addition, it inherits the properties from its parent, <a href="PDFModel_object.html">PDFModel</a>.</p>',
      '<table><tbody>',
      '<tr><td>Application</td><td>String</td><td>Gets or sets the creator of the PDF document.</td></tr>',
      '<tr><td>Author</td><td>String</td><td>Gets or sets the author of the PDF document.</td></tr>',
      '<tr><td>ClassDefinition</td><td>PowerObject</td><td>Contains information about the class definition.</td></tr>',
      '<tr><td>Keywords</td><td>String</td><td>Gets or sets the keywords of the PDF document.</td></tr>',
      '<tr><td>Subject</td><td>String</td><td>Gets or sets the subject of the PDF document.</td></tr>',
      '<tr><td>Title</td><td>String</td><td>Gets or sets the title of the PDF document.</td></tr>',
      '</tbody></table>',
      '<h3 class="title"><a id="d0e43614"></a>Events</h3>',
      '<table><tbody>',
      '<tr><td>Constructor</td><td>Immediately before the Open event occurs in the window.</td></tr>',
      '<tr><td>Destructor</td><td>Immediately after the Close event occurs in the window.</td></tr>',
      '</tbody></table>',
      '<h3 class="title"><a id="d0e43615"></a>Functions</h3>',
      '<table><tbody>',
      '<tr><td>ClassName</td><td>String</td><td>Returns the name assigned to the control.</td></tr>',
      '<tr><td>GetContextService</td><td>Integer</td><td>Creates a reference to a context-specific instance of the specified service.</td></tr>',
      '<tr><td>GetParent</td><td>PowerObject</td><td>Returns a reference to the name of the parent object.</td></tr>',
      '<tr><td>PostEvent</td><td>Boolean</td><td>Adds an event to the end of the message queue for the control.</td></tr>',
      '<tr><td>TriggerEvent</td><td>Integer</td><td>Triggers a specified event in the control and executes the script for the event.</td></tr>',
      '<tr><td>TypeOf</td><td>Object</td><td>Returns the type of the control.</td></tr>',
      '</tbody></table>',
    ].join('\n'), {
      category: 'Referencia oficial',
      name: 'PDFDocumentProperties',
      sourceUrl: 'https://example.test/PDFDocumentProperties_object.html',
      summary: 'Official documented PowerBuilder system object/control datatype PDFDocumentProperties.',
    });

    assert.equal(entry.name, 'PDFDocumentProperties');
    assert.equal(entry.baseType, 'PDFModel');
    assert.match(entry.documentation ?? '', /derived from PDFModel/i);
    assert.deepEqual(entry.properties, ['Application', 'Author', 'ClassDefinition', 'Keywords', 'Subject', 'Title']);
    assert.deepEqual(entry.events, ['Constructor', 'Destructor']);
    assert.deepEqual(entry.functions, ['ClassName', 'GetContextService', 'GetParent', 'PostEvent', 'TriggerEvent', 'TypeOf']);
  });

  test('buildGeneratedReservedWordEntry conserva policy estructural de reserved words con asterisco', () => {
    const generator = loadGeneratorScript();
    const entry = generator.buildGeneratedReservedWordEntry({
      name: 'alias',
      canBeFunctionName: true,
      sourceUrl: 'https://example.test/reserved-words',
    });

    assert.equal(entry.reservedWordCanBeFunctionName, true);
    assert.equal(entry.identifierPolicy, 'allowed-as-function-name');
    assert.match(entry.summary, /nombre de función/i);
  });

  test('renderBuilderCall serializa parámetros, risk y metadata de system types en generated output', () => {
    const generator = loadGeneratorScript();
    const rendered = generator.renderBuilderCall('generatedObjectFunction', {
      baseType: 'PDFModel',
      category: 'Referencia oficial',
      eventId: 'pbm_lvnbegindrag',
      events: ['Constructor', 'Destructor'],
      functions: ['PostEvent', 'TriggerEvent'],
      identifierPolicy: 'allowed-as-function-name',
      name: 'AddItemArray',
      properties: ['Application', 'Author'],
      risk: 'deprecated',
      returnDocumentation: 'Long. Returns the handle of the new child item.',
      returnType: 'Long',
      reservedWordCanBeFunctionName: true,
      signatures: [{
        label: 'long objectname.AddItemArray ( ParentItemHandle, Key )',
        parameters: [
          { label: 'ParentItemHandle', documentation: 'Handle of the parent item.' },
          { label: 'Key', documentation: 'Name of the child item.' },
        ],
        returnType: 'Long',
      }],
      sourceUrl: 'https://example.test/additemarray',
      summary: 'Adds a child item of JsonArrayItem type in the JSON generator object.',
    });

    assert.match(rendered, /eventId:/);
    assert.match(rendered, /identifierPolicy: "allowed-as-function-name"/);
    assert.match(rendered, /parameters:/);
    assert.match(rendered, /ParentItemHandle/);
    assert.match(rendered, /baseType: "PDFModel"/);
    assert.match(rendered, /properties: \["Application", "Author"\]/);
    assert.match(rendered, /functions: \["PostEvent", "TriggerEvent"\]/);
    assert.match(rendered, /events: \["Constructor", "Destructor"\]/);
    assert.match(rendered, /risk: "deprecated"/);
    assert.match(rendered, /returnType: "Long"/);
    assert.match(rendered, /reservedWordCanBeFunctionName: true/);
  });
});