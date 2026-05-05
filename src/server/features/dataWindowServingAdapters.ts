import { CompletionItem, Hover, Location, ParameterInformation, Position, SignatureInformation } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import type { HotContextCache } from '../knowledge/HotContextCache';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import type { ActiveDocumentServingSnapshot } from '../serving/activeDocumentServingSnapshot';
import { providePowerScriptDataWindowColumnDefinition, providePowerScriptDataWindowColumnHover } from './dataWindowColumnAccess';
import {
  createDataWindowFastContext,
  isConfidentDataWindowBinding,
  type DataWindowFastContext,
} from './dataWindowFastContext';
import { provideDataWindowLegacyDefinition, provideDataWindowLegacyHover } from './dataWindowLegacySafeMode';
import {
  providePowerScriptDataWindowPropertyCompletion,
  providePowerScriptDataWindowPropertyDefinition,
  providePowerScriptDataWindowPropertyHover,
} from './dataWindowPropertyPaths';

export interface DataWindowAdapterContext {
  document: TextDocument;
  position: Position;
  kb: KnowledgeBase;
  graph: InheritanceGraph;
  systemCatalog: SystemCatalog;
  hotContext?: HotContextCache;
  activeSnapshot?: ActiveDocumentServingSnapshot;
}

export interface DataWindowHoverAdapterResult {
  hover: Hover;
  source: 'datawindow-property' | 'datawindow-column';
  fastContext: DataWindowFastContext;
}

export function provideDataWindowHoverAdapter(context: DataWindowAdapterContext): DataWindowHoverAdapterResult | null {
  const receiverName = extractDataWindowReceiverCandidate(context.document, context.position);
  const fastContext = createDataWindowFastContext({
    ...context,
    ...(receiverName ? { receiverName } : {}),
  });

  const legacyHover = provideDataWindowLegacyHover(context.document, context.position);
  if (legacyHover) {
    return { hover: legacyHover, source: 'datawindow-property', fastContext };
  }

  if (fastContext.binding.dynamic) {
    return null;
  }

  const propertyHover = providePowerScriptDataWindowPropertyHover(context.document, context.position, context.kb);
  if (propertyHover) {
    return { hover: propertyHover, source: 'datawindow-property', fastContext };
  }

  const columnHover = isConfidentDataWindowBinding(fastContext.binding)
    ? providePowerScriptDataWindowColumnHover(context.document, context.position, context.kb)
    : null;
  return columnHover ? { hover: columnHover, source: 'datawindow-column', fastContext } : null;
}

export function provideDataWindowDefinitionAdapter(context: DataWindowAdapterContext): Location | null {
  const receiverName = extractDataWindowReceiverCandidate(context.document, context.position);
  const fastContext = createDataWindowFastContext({
    ...context,
    ...(receiverName ? { receiverName } : {}),
  });

  const legacyDefinition = provideDataWindowLegacyDefinition(context.document, context.position, context.kb);
  if (legacyDefinition) {
    return legacyDefinition;
  }
  if (fastContext.binding.dynamic) {
    return null;
  }

  return providePowerScriptDataWindowPropertyDefinition(context.document, context.position, context.kb)
    ?? (isConfidentDataWindowBinding(fastContext.binding)
      ? providePowerScriptDataWindowColumnDefinition(context.document, context.position, context.kb)
      : null);
}

export function provideDataWindowCompletionAdapter(context: DataWindowAdapterContext): CompletionItem[] | null {
  const receiverName = extractDataWindowReceiverCandidate(context.document, context.position);
  if (!receiverName) {
    return null;
  }

  const fastContext = createDataWindowFastContext({ ...context, receiverName });
  if (fastContext.binding.dynamic) {
    return null;
  }

  return providePowerScriptDataWindowPropertyCompletion(context.document, context.position, context.kb);
}

export function buildLinkedDataWindowRetrieveSignatureAdapter(context: DataWindowAdapterContext, qualifier: string): SignatureInformation | null {
  const fastContext = createDataWindowFastContext({ ...context, receiverName: qualifier });
  if (!isConfidentDataWindowBinding(fastContext.binding) || fastContext.binding.retrieveArguments.length === 0) {
    return null;
  }

  const parameters = fastContext.binding.retrieveArguments.map((argument) =>
    ParameterInformation.create(
      argument.label,
      `Argumento de retrieve '${argument.name}' (${argument.type}) del DataWindow '${fastContext.dataObjectName}'.`
    )
  );

  return SignatureInformation.create(
    `Retrieve(${fastContext.binding.retrieveArguments.map((argument) => argument.label).join(', ')})`,
    `Retrieve del DataWindow '${fastContext.dataObjectName}' enlazado por DataObject.`,
    ...parameters
  );
}

function extractDataWindowReceiverCandidate(document: TextDocument, position: Position): string | undefined {
  const line = getLinePrefix(document, position);
  const propertyOrCall = /\b([A-Za-z_][\w$#%\-]*)\s*(?:\.\s*(?:Object\b|Describe\s*\(|Modify\s*\(|GetChild\s*\(|GetItem[A-Za-z]*\s*\(|SetItem[A-Za-z]*\s*\())/i.exec(line);
  return propertyOrCall?.[1];
}

function getLinePrefix(document: TextDocument, position: Position): string {
  const start = Position.create(position.line, 0);
  return document.getText({ start, end: position });
}