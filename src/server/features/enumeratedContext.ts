import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import type { PbSystemSymbolEntry } from '../knowledge/system/types';
import { resolveCatalogOwnerTypes } from './dataWindowBindingModel';
import { resolveDocumentQualifierType } from './queryContext';
import {
  extractSignatureContext,
  getSignatureParameterLabel,
  resolveExpectedEnumTypeForParameterLabel,
} from './signatureHelp';

export interface ExpectedEnumCallArgumentContext {
  enumTypeName: string;
  dataWindowContext: boolean;
}

export function matchesEnumeratedPropertyContext(
  entry: PbSystemSymbolEntry,
  propertyName: string,
  ownerType: string | readonly string[],
): boolean {
  if (entry.allowedOnProperties?.length && !entry.allowedOnProperties.some((name) => name.toLowerCase() === propertyName.toLowerCase())) {
    return false;
  }

  if (!entry.allowedOnOwners?.length) {
    return true;
  }

  const explicitOwners = entry.allowedOnOwners.filter((label) => isExplicitOwnerLabel(label));
  if (explicitOwners.length === 0) {
    return true;
  }

  const ownerTypes = Array.isArray(ownerType) ? ownerType : [ownerType];
  const normalizedOwnerTypes = ownerTypes.map((label) => normalizeOwnerLabel(label));
  return explicitOwners.some((label) => normalizedOwnerTypes.includes(normalizeOwnerLabel(label)));
}

export function resolveExpectedEnumTypeForCallArgumentAtPosition(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  graph?: InheritanceGraph,
): string | null {
  return resolveExpectedEnumContextForCallArgumentAtPosition(document, position, kb, systemCatalog, graph)?.enumTypeName ?? null;
}

export function resolveExpectedEnumContextForCallArgumentAtPosition(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  graph?: InheritanceGraph,
): ExpectedEnumCallArgumentContext | null {
  const signatureContext = extractSignatureContext(document, position, systemCatalog);
  if (!signatureContext) {
    return null;
  }

  const systemTargets = resolveSystemTargetsForCallArgument(
    signatureContext.identifier,
    signatureContext.qualifier,
    document,
    position,
    kb,
    systemCatalog,
    graph,
  );
  const enumTypeName = resolveExpectedEnumTypeForCallArgument(systemCatalog, systemTargets, signatureContext.activeParameter);
  if (!enumTypeName) {
    return null;
  }

  return {
    enumTypeName,
    dataWindowContext: systemTargets.some((target) => target.domain === 'datawindow-functions'),
  };
}

function resolveSystemTargetsForCallArgument(
  identifier: string,
  qualifier: string | undefined,
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  systemCatalog: SystemCatalog,
  graph?: InheritanceGraph,
): readonly PbSystemSymbolEntry[] {
  if (qualifier) {
    const ownerType = resolveDocumentQualifierType(document, qualifier, position, kb);
    const ownerTarget = ownerType
      ? systemCatalog.resolveMemberFunctionForOwner(identifier, resolveCatalogOwnerTypes(ownerType, graph))
      : undefined;
    return ownerTarget ? [ownerTarget] : [];
  }

  const globalTarget = systemCatalog.resolveGlobalFunction(identifier);
  if (globalTarget) {
    return [globalTarget];
  }

  return systemCatalog.findSystemSymbol(identifier).filter((entry) => entry.kind === 'callable');
}

function resolveExpectedEnumTypeForCallArgument(
  systemCatalog: SystemCatalog,
  targets: readonly PbSystemSymbolEntry[],
  activeParameter: number,
): string | null {
  for (const target of targets) {
    for (const signature of target.signatures) {
      const parameterLabel = getSignatureParameterLabel(signature.label, activeParameter);
      if (!parameterLabel) {
        continue;
      }

      const enumTypeName = resolveExpectedEnumTypeForParameterLabel(systemCatalog, parameterLabel);
      if (enumTypeName) {
        return enumTypeName;
      }
    }
  }

  return null;
}

function isExplicitOwnerLabel(label: string): boolean {
  const trimmed = label.trim();
  return /^[A-Za-z][\w]*s?$/i.test(trimmed) || /\bobjects?$/i.test(trimmed);
}

function normalizeOwnerLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/\bobjects?\b/g, '')
    .replace(/\bcontrols?\b/g, '')
    .replace(/\s+/g, '')
    .replace(/s$/, '');
}