import * as assert from 'assert/strict';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { getNativeAncestorChain } from '../../../src/server/knowledge/system/nativeAncestors';
import { PB_BUILTIN_TYPES } from '../../../src/server/parsing/grammar';

suite('unit/runtimeCatalogDatatypes (B359)', () => {
  let catalog: SystemCatalog;

  const expectedB359Types = [
    'ADOResultSet',
    'ArrayBounds',
    'Application',
    'BatchDataObjects',
    'ClassDefinition',
    'CoderObject',
    'CompressorObject',
    'ContextInformation',
    'ContextKeyword',
    'CrypterObject',
    'DataStore',
    'DataWindowChild',
    'DotNetAssembly',
    'DotNetObject',
    'DynamicDescriptionArea',
    'DynamicStagingArea',
    'Environment',
    'Error',
    'ErrorLogging',
    'Exception',
    'ExtractorObject',
    'HTTPClient',
    'Inet',
    'InternetResult',
    'JSONGenerator',
    'JSONPackage',
    'JSONParser',
    'MailFileDescription',
    'MailMessage',
    'MailRecipient',
    'MailSession',
    'Message',
    'MimeMessage',
    'MLSync',
    'MLSynchronization',
    'OAuthClient',
    'OAuthRequest',
    'OLEObject',
    'OLEStorage',
    'OLEStream',
    'OLETxnObject',
    'PDFAction',
    'PDFActionJavaScript',
    'PDFActionNamed',
    'PDFActionResetForm',
    'PDFAttachment',
    'PDFColor',
    'PDFContent',
    'PDFContext',
    'PDFDocExtractor',
    'PDFDocument',
    'PDFDocumentProperties',
    'PDFFont',
    'PDFFormField',
    'PDFFormFieldCheckBox',
    'PDFFormFieldComboBox',
    'PDFFormFieldGroup',
    'PDFFormFieldListBox',
    'PDFFormFieldPushButton',
    'PDFFormFieldRadioButton',
    'PDFFormFieldRadioButtonGroup',
    'PDFFormFieldText',
    'PDFImage',
    'PDFImportContent',
    'PDFInvisibleContent',
    'PDFModel',
    'PDFMultilineText',
    'PDFPage',
    'PDFRichText',
    'PDFSecurity',
    'PDFSharedText',
    'PDFTableOfContents',
    'PDFTableOfContentsItem',
    'PDFText',
    'PDFTextBlock',
    'PDFTextLayout',
    'PDFVisibleContent',
    'PDFWatermark',
    'Pipeline',
    'PowerObject',
    'PowerServerResult',
    'ProfileCall',
    'ProfileClass',
    'ProfileLine',
    'ProfileRoutine',
    'Profiling',
    'ResourceResponse',
    'RESTClient',
    'ResultSet',
    'RuntimeError',
    'ScriptDefinition',
    'SimpleTypeDefinition',
    'SMTPClient',
    'SyncParm',
    'Throwable',
    'Timing',
    'TokenRequest',
    'TokenResponse',
    'TraceActivityNode',
    'TraceBeginEnd',
    'TraceError',
    'TraceESQL',
    'TraceFile',
    'TraceGarbageCollect',
    'TraceLine',
    'TraceObject',
    'TraceRoutine',
    'TraceTree',
    'TraceTreeError',
    'TraceTreeESQL',
    'TraceTreeGarbageCollect',
    'TraceTreeLine',
    'TraceTreeNode',
    'TraceTreeObject',
    'TraceTreeRoutine',
    'TraceTreeUser',
    'TraceUser',
    'Transaction',
    'TransactionServer',
    'TypeDefinition',
    'ULSync',
    'VariableCardinalityDefinition',
    'VariableDefinition',
    'WSConnection',
  ] as const;

  const rejectedExtractorNoiseTypes = [
    'longhandleofbuttonmenuisassociatedwith',
    'longhandleofitem',
    'longindexofmenuitemclicked',
    'longindexofmenuitemmouseison',
    'longindexofsubmenuitemclicked0indicateseventistriggeredbymainmenu',
    'longindexofsubmenuitemmouseison0indicateseventistriggeredbymainmenu',
  ] as const;

  setup(() => {
    catalog = new SystemCatalog();
  });

  test('todos los tipos del backlog B359 quedan curados en manual-core', () => {
    for (const typeName of expectedB359Types) {
      const dt = catalog.resolveDatatype(typeName);
      assert.ok(dt, `debe resolver ${typeName}`);
      assert.equal(dt?.kind, 'system-type');
      assert.equal(dt?.dataset, 'manual-core', `${typeName} debe quedar curado en manual-core`);
      assert.equal(dt?.name, typeName, `${typeName} debe conservar casing canónico`);
    }
  });

  test('tipos runtime e integration representativos resuelven con categorías coherentes', () => {
    const expected = [
      ['Application', 'Objetos de sistema'],
      ['HTTPClient', 'JSON / HTTP / OAuth / REST'],
      ['JSONParser', 'JSON / HTTP / OAuth / REST'],
      ['BatchDataObjects', 'Objetos no visuales'],
      ['PDFDocument', 'PDF'],
      ['PDFPage', 'PDF'],
      ['SMTPClient', 'Correo'],
      ['MimeMessage', 'Correo'],
      ['TraceTreeRoutine', 'Profiling y trazas'],
      ['ResourceResponse', 'JSON / HTTP / OAuth / REST'],
      ['DataStore', 'Objetos no visuales'],
      ['Transaction', 'Objetos no visuales'],
    ] as const;

    for (const [typeName, category] of expected) {
      const dt = catalog.resolveDatatype(typeName);
      assert.ok(dt, `debe resolver ${typeName}`);
      assert.equal(dt?.kind, 'system-type');
      assert.equal(dt?.category, category);
      assert.equal(PB_BUILTIN_TYPES.has(typeName.toLowerCase()), true, `${typeName} debe vivir también en PB_BUILTIN_TYPES`);
    }
  });

  test('extractor noise no se publica como datatype', () => {
    for (const typeName of rejectedExtractorNoiseTypes) {
      assert.equal(catalog.resolveDatatype(typeName), undefined, `${typeName} no debe exponerse como datatype`);
    }
  });

  test('ancestros nativos base no regresionan en runtime', () => {
    assert.ok(getNativeAncestorChain('Application').includes('powerobject'));
    assert.ok(getNativeAncestorChain('RuntimeError').includes('throwable'));
  });
});