import type {
  ApiCurrentObjectContext,
  ApiCurrentObjectDiagnostic,
  ApiCurrentObjectContextSymbol,
  ApiEmbeddedSqlAnchor,
  ApiCurrentObjectReference,
  ApiCurrentObjectRelatedFile,
  ApiCurrentObjectVisibleVariable,
} from '../shared/publicApi';

export interface ContextPanelLocationTarget {
  uri: string;
  line?: number;
  character?: number;
}

export interface CurrentObjectContextPanelSectionNode {
  type: 'section';
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  children: CurrentObjectContextPanelNode[];
}

export interface CurrentObjectContextPanelItemNode {
  type: 'item';
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  target?: ContextPanelLocationTarget;
}

export type CurrentObjectContextPanelNode = CurrentObjectContextPanelSectionNode | CurrentObjectContextPanelItemNode;

export interface CurrentObjectContextPanelModel {
  message?: string;
  roots: CurrentObjectContextPanelNode[];
  focusNodeId?: string;
  objectName?: string;
}

function basenameFromUri(uri: string | undefined): string {
  if (!uri) {
    return 'sin dato';
  }

  const normalized = uri.replace(/\/+$/, '');
  const segment = normalized.slice(normalized.lastIndexOf('/') + 1);
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function normalizeObjectKind(kind: string | undefined, uri: string | undefined): string {
  if (kind && kind.trim() && kind.toLowerCase() !== 'type') {
    return kind;
  }

  const normalizedUri = (uri ?? '').toLowerCase();
  if (normalizedUri.endsWith('.sra')) return 'Application';
  if (normalizedUri.endsWith('.srw')) return 'Window';
  if (normalizedUri.endsWith('.sru')) return 'UserObject';
  if (normalizedUri.endsWith('.srm')) return 'Menu';
  if (normalizedUri.endsWith('.srd')) return 'DataWindow';
  if (normalizedUri.endsWith('.srf')) return 'Function';
  if (normalizedUri.endsWith('.srs')) return 'Structure';
  if (normalizedUri.endsWith('.srp')) return 'Pipeline';
  return kind ?? 'Unknown';
}

function createItem(
  id: string,
  label: string,
  description?: string,
  tooltip?: string,
  target?: ContextPanelLocationTarget,
): CurrentObjectContextPanelItemNode {
  return {
    type: 'item',
    id,
    label,
    ...(description ? { description } : {}),
    ...(tooltip ? { tooltip } : {}),
    ...(target ? { target } : {}),
  };
}

function createSection(
  id: string,
  label: string,
  children: CurrentObjectContextPanelNode[],
  description?: string,
  tooltip?: string,
): CurrentObjectContextPanelSectionNode {
  return {
    type: 'section',
    id,
    label,
    ...(description ? { description } : {}),
    ...(tooltip ? { tooltip } : {}),
    children,
  };
}

function mapVariable(variable: ApiCurrentObjectVisibleVariable, index: number): CurrentObjectContextPanelItemNode {
  return createItem(
    `variable:${index}:${variable.name}`,
    variable.name,
    [variable.datatype, variable.scope, variable.relation].filter((part): part is string => Boolean(part)).join(' · '),
    [
      `Variable: ${variable.name}`,
      ...(variable.datatype ? [`Tipo: ${variable.datatype}`] : []),
      ...(variable.scope ? [`Scope: ${variable.scope}`] : []),
      ...(variable.relation ? [`Relación: ${variable.relation}`] : []),
      ...(variable.declaredIn ? [`Declarada en: ${variable.declaredIn}`] : []),
      ...(variable.sourceOrigin ? [`Source origin: ${variable.sourceOrigin}`] : []),
    ].join('\n'),
    {
      uri: variable.uri,
      line: variable.line,
      character: variable.character,
    },
  );
}

function mapSymbol(symbol: ApiCurrentObjectContextSymbol, section: string, index: number): CurrentObjectContextPanelItemNode {
  return createItem(
    `${section}:${index}:${symbol.name}`,
    symbol.name,
    [symbol.signature, symbol.relation, symbol.sourceOrigin].filter((part): part is string => Boolean(part)).join(' · '),
    [
      `${section}: ${symbol.name}`,
      ...(symbol.signature ? [`Signature: ${symbol.signature}`] : []),
      ...(symbol.declaredIn ? [`Declarado en: ${symbol.declaredIn}`] : []),
      ...(symbol.relation ? [`Relación: ${symbol.relation}`] : []),
      ...(symbol.implementationKind ? [`Kind: ${symbol.implementationKind}`] : []),
      ...(symbol.sourceOrigin ? [`Source origin: ${symbol.sourceOrigin}`] : []),
    ].join('\n'),
    {
      uri: symbol.uri,
      line: symbol.line,
      character: symbol.character,
    },
  );
}

function mapDiagnostic(diagnostic: ApiCurrentObjectDiagnostic, index: number, uri: string | undefined): CurrentObjectContextPanelItemNode {
  return createItem(
    `diagnostic:${index}`,
    diagnostic.message,
    [diagnostic.code, diagnostic.severity].filter((part): part is string => Boolean(part)).join(' · '),
    [
      diagnostic.message,
      ...(diagnostic.code ? [`Code: ${diagnostic.code}`] : []),
      ...(diagnostic.severity ? [`Severity: ${diagnostic.severity}`] : []),
      `Posición: ${diagnostic.line + 1}:${diagnostic.character + 1}`,
    ].join('\n'),
    uri
      ? {
        uri,
        line: diagnostic.line,
        character: diagnostic.character,
      }
      : undefined,
  );
}

function mapReference(reference: ApiCurrentObjectReference, index: number): CurrentObjectContextPanelItemNode {
  return createItem(
    `reference:${index}:${reference.identifier}`,
    reference.identifier,
    [reference.target.name, reference.confidence, reference.reasonCode].filter((part): part is string => Boolean(part)).join(' · '),
    [
      `Referencia: ${reference.identifier}`,
      `Target: ${reference.target.name}`,
      ...(reference.qualifier ? [`Qualifier: ${reference.qualifier}`] : []),
      ...(reference.reasonCode ? [`Reason: ${reference.reasonCode}`] : []),
      ...(reference.invocationKind ? [`Invocation: ${reference.invocationKind}`] : []),
      ...(reference.invocationRisk ? [`Risk: ${reference.invocationRisk}`] : []),
    ].join('\n'),
    {
      uri: reference.target.uri,
      line: reference.target.line,
      character: reference.target.character,
    },
  );
}

function mapRelatedFile(file: ApiCurrentObjectRelatedFile, index: number): CurrentObjectContextPanelItemNode {
  return createItem(
    `related-file:${index}:${file.role}`,
    basenameFromUri(file.uri),
    file.role,
    `Archivo relacionado (${file.role}): ${file.uri}`,
    { uri: file.uri },
  );
}

function mapEmbeddedSqlAnchor(
  anchor: ApiEmbeddedSqlAnchor,
  index: number,
  uri: string | undefined,
): CurrentObjectContextPanelItemNode {
  return createItem(
    `embedded-sql:${index}:${anchor.keyword}:${anchor.startLine}`,
    `${anchor.keyword} ${anchor.startLine + 1}-${anchor.endLine + 1}`,
    [anchor.confidence, anchor.transactionTarget].filter((part): part is string => Boolean(part)).join(' · '),
    [
      `SQL embebido: ${anchor.keyword}`,
      `Líneas: ${anchor.startLine + 1}-${anchor.endLine + 1}`,
      `Confidence: ${anchor.confidence}`,
      ...(anchor.transactionTarget ? [`Transacción: ${anchor.transactionTarget}`] : []),
      `Preview: ${anchor.preview}`,
    ].join('\n'),
    uri
      ? {
        uri,
        line: anchor.startLine,
        character: 0,
      }
      : undefined,
  );
}

export function buildCurrentObjectContextPanelModel(context: ApiCurrentObjectContext): CurrentObjectContextPanelModel {
  if (!context.available || !context.objectInfo) {
    return {
      message: context.reason ?? 'No hay contexto disponible para el objeto activo.',
      roots: [],
    };
  }

  const objectName = context.objectInfo.globalType ?? basenameFromUri(context.objectInfo.uri);
  const summaryItems: CurrentObjectContextPanelNode[] = [
    createItem(
      'summary:object',
      objectName,
      normalizeObjectKind(context.objectInfo.objectKind, context.objectInfo.uri),
      [
        `Objeto: ${objectName}`,
        `Kind: ${normalizeObjectKind(context.objectInfo.objectKind, context.objectInfo.uri)}`,
        ...(context.objectInfo.baseType ? [`Base: ${context.objectInfo.baseType}`] : []),
        ...(context.objectInfo.sectionKind ? [`Section: ${context.objectInfo.sectionKind}`] : []),
      ].join('\n'),
      { uri: context.objectInfo.uri },
    ),
    createItem('summary:project', 'Proyecto', context.projectContext?.name ?? context.objectInfo.project ?? 'sin proyecto', undefined, context.objectInfo.project ? { uri: context.objectInfo.project } : undefined),
    createItem('summary:library', 'Librería', basenameFromUri(context.objectInfo.library), context.objectInfo.library),
    createItem('summary:origin', 'Source origin', context.objectInfo.sourceOrigin ?? 'unknown'),
    createItem('summary:readiness', 'Readiness', context.objectInfo.readiness ?? context.evidence?.readiness ?? 'unknown'),
  ];

  const roots: CurrentObjectContextPanelNode[] = [
    createSection('section:summary', 'Resumen', summaryItems, `${objectName} · ${normalizeObjectKind(context.objectInfo.objectKind, context.objectInfo.uri)}`),
  ];

  if (context.frameworkKnowledgeConflict) {
    const frameworkItems: CurrentObjectContextPanelNode[] = [
      createItem('framework-knowledge:state', 'Policy', context.frameworkKnowledgeConflict.state, context.frameworkKnowledgeConflict.summary),
      createItem('framework-knowledge:reason', 'Reason', context.frameworkKnowledgeConflict.reasonCode, context.frameworkKnowledgeConflict.summary),
      createItem('framework-knowledge:packs', 'Packs', context.frameworkKnowledgeConflict.packs.map((pack) => pack.title).join(', ')),
      createItem('framework-knowledge:owners', 'Owner types', context.frameworkKnowledgeConflict.matchedOwnerTypes.join(', ')),
      createItem('framework-knowledge:confidence', 'Confidence', context.frameworkKnowledgeConflict.confidence),
    ].filter((item) => item.description);

    if (frameworkItems.length > 0) {
      roots.push(createSection('section:framework-knowledge', 'Framework knowledge', frameworkItems, `${context.frameworkKnowledgeConflict.packs.length} pack(s)`));
    }
  }

  if ((context.ancestorChain?.length ?? 0) > 0) {
    roots.push(createSection(
      'section:ancestors',
      'Ancestros',
      context.ancestorChain!.map((ancestor, index) => createItem(
        `ancestor:${index}:${ancestor.name}`,
        ancestor.name,
        ancestor.isSystemType ? 'system type' : ancestor.sourceOrigin,
        [
          `Ancestro: ${ancestor.name}`,
          ...(ancestor.sourceOrigin ? [`Source origin: ${ancestor.sourceOrigin}`] : []),
          ...(ancestor.isSystemType ? ['Tipo nativo del runtime'] : []),
        ].join('\n'),
        ancestor.uri ? { uri: ancestor.uri } : undefined,
      )),
      `${context.ancestorChain!.length}`,
    ));
  }

  if ((context.visibleVariables?.length ?? 0) > 0) {
    roots.push(createSection(
      'section:variables',
      'Variables visibles',
      context.visibleVariables!.map(mapVariable),
      `${context.visibleVariables!.length}`,
    ));
  }

  const memberChildren: CurrentObjectContextPanelNode[] = [];
  if ((context.members?.functions.length ?? 0) > 0) {
    memberChildren.push(createSection('section:members:functions', 'Functions', context.members!.functions.map((item, index) => mapSymbol(item, 'Function', index)), `${context.members!.functions.length}`));
  }
  if ((context.members?.events.length ?? 0) > 0) {
    memberChildren.push(createSection('section:members:events', 'Events', context.members!.events.map((item, index) => mapSymbol(item, 'Event', index)), `${context.members!.events.length}`));
  }
  if ((context.members?.prototypes.length ?? 0) > 0) {
    memberChildren.push(createSection('section:members:prototypes', 'Prototypes', context.members!.prototypes.map((item, index) => mapSymbol(item, 'Prototype', index)), `${context.members!.prototypes.length}`));
  }
  if (memberChildren.length > 0) {
    roots.push(createSection('section:members', 'Members', memberChildren, `${memberChildren.length} grupos`));
  }

  if ((context.diagnostics?.items.length ?? 0) > 0) {
    roots.push(createSection(
      'section:diagnostics',
      'Diagnostics',
      context.diagnostics!.items.map((item, index) => mapDiagnostic(item, index, context.uri)),
      `${context.diagnostics!.total}`,
    ));
  }

  if ((context.dataWindowBindings?.length ?? 0) > 0) {
    roots.push(createSection(
      'section:datawindow',
      'DataWindow bindings',
      context.dataWindowBindings!.map((binding, index) => createItem(
        `dw:${index}:${binding.targetName}`,
        binding.targetName,
        [binding.dataObject ?? binding.state, `${binding.retrieveArguments.length} args`].join(' · '),
        [
          `Target: ${binding.targetName}`,
          `State: ${binding.state}`,
          ...(binding.dataObject ? [`DataObject: ${binding.dataObject}`] : []),
          ...(binding.retrieveArguments.length > 0 ? [`Args: ${binding.retrieveArguments.map((argument) => `${argument.name}:${argument.type}`).join(', ')}`] : []),
        ].join('\n'),
        binding.targetUri ? { uri: binding.targetUri } : undefined,
      )),
      `${context.dataWindowBindings!.length}`,
    ));
  }

  if ((context.embeddedSqlAnchors?.length ?? 0) > 0) {
    roots.push(createSection(
      'section:embedded-sql',
      'Embedded SQL',
      context.embeddedSqlAnchors!.map((anchor, index) => mapEmbeddedSqlAnchor(anchor, index, context.uri)),
      `${context.embeddedSqlAnchors!.length}`,
    ));
  }

  if ((context.referencedSymbols?.length ?? 0) > 0) {
    roots.push(createSection(
      'section:references',
      'Referenced symbols',
      context.referencedSymbols!.map(mapReference),
      `${context.referencedSymbols!.length}`,
    ));
  }

  if ((context.relatedFiles?.length ?? 0) > 0) {
    roots.push(createSection(
      'section:related-files',
      'Related files',
      context.relatedFiles!.map(mapRelatedFile),
      `${context.relatedFiles!.length}`,
    ));
  }

  if (context.evidence) {
    const evidenceItems: CurrentObjectContextPanelNode[] = [
      createItem('evidence:readiness', 'Readiness', context.evidence.readiness),
      createItem('evidence:reason', 'Primary reason', context.evidence.primaryReasonCode),
      createItem('evidence:confidence', 'Resolution confidence', context.evidence.resolutionConfidence),
      createItem('evidence:invocation', 'Invocation', [context.evidence.invocationKind, context.evidence.invocationRisk].filter((part): part is string => Boolean(part)).join(' · ')),
      createItem('evidence:target-count', 'Target count', context.evidence.targetCount != null ? String(context.evidence.targetCount) : undefined),
      createItem('evidence:kinds', 'Evidence kinds', context.evidence.evidenceKinds.join(', ')),
    ].filter((item) => item.description);

    if (evidenceItems.length > 0) {
      roots.push(createSection('section:evidence', 'Evidence', evidenceItems, `${evidenceItems.length}`));
    }
  }

  return {
    roots,
    focusNodeId: 'summary:object',
    objectName,
  };
}

export function findCurrentObjectContextPanelNodeById(
  roots: readonly CurrentObjectContextPanelNode[],
  nodeId: string | undefined,
): CurrentObjectContextPanelNode | undefined {
  if (!nodeId) {
    return undefined;
  }

  const stack = [...roots];
  while (stack.length > 0) {
    const current = stack.shift();
    if (!current) {
      continue;
    }
    if (current.id === nodeId) {
      return current;
    }
    if (current.type === 'section') {
      stack.unshift(...current.children);
    }
  }

  return undefined;
}