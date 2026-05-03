import type { Diagnostic } from 'vscode-languageserver/node';

export const DIAGNOSTIC_CODES = {
  sd2UnresolvedCallable: 'SD2',
  sd3MissingBaseType: 'SD3',
  sd4UnusedLocal: 'SD4',
  sd5UnusedPrivateInstance: 'SD5',
  sd6Shadowing: 'SD6',
  sd7ObsoleteFunction: 'SD7',
  sd8DuplicateDeclaration: 'SD8',
  sd9OrphanReturn: 'SD9',
  sd10OrphanLoopControl: 'SD10',
  sd11UnreachableAfterReturn: 'SD11',
  sd12UnbalancedParens: 'SD12',
  sd13MissingReturn: 'SD13',
  enumValueContextMismatch: 'enum-value-context-mismatch',
  dataObjectNotFound: 'dataobject-not-found',
  dataObjectAmbiguous: 'dataobject-ambiguous',
  dataObjectDynamic: 'dataobject-dynamic',
  dataWindowPropertyPathUnresolved: 'datawindow-property-path-unresolved',
  dataWindowExpressionDependencyUnresolved: 'datawindow-expression-dependency-unresolved',
  retrieveArityMismatch: 'retrieve-arity-mismatch',
  transactionBindingMissing: 'transaction-binding-missing',
  transactionBindingUnknown: 'transaction-binding-unknown',
  transactionBindingDynamic: 'transaction-binding-dynamic',
  nativeDependency: 'native-dependency'
} as const;

export function getDiagnosticCode(diagnostic: Pick<Diagnostic, 'code' | 'source'>): string | undefined {
  const explicitCode = diagnostic.code;
  if (typeof explicitCode === 'string' || typeof explicitCode === 'number') {
    return String(explicitCode);
  }

  const source = diagnostic.source ?? '';
  const separatorIndex = source.lastIndexOf(':');
  if (separatorIndex < 0 || separatorIndex >= source.length - 1) {
    return undefined;
  }

  return source.slice(separatorIndex + 1);
}

export function withDiagnosticCode(diagnostic: Diagnostic, code: string): Diagnostic {
  return {
    ...diagnostic,
    code,
  };
}