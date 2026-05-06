import type { DocumentationLocale } from '../knowledge/system/localization';

export type PresentationTerminologyLocale = DocumentationLocale;

export type PresentationTerminologyKey =
  | 'function'
  | 'event'
  | 'variable'
  | 'parameter'
  | 'return-value'
  | 'datawindow'
  | 'datastore'
  | 'datawindowchild'
  | 'transaction'
  | 'ancestor'
  | 'override'
  | 'scope'
  | 'source-origin'
  | 'confidence'
  | 'deprecated'
  | 'inferred'
  | 'ambiguous'
  | 'unknown'
  | 'argument'
  | 'local-variable'
  | 'shared-variable'
  | 'global-variable'
  | 'instance-variable'
  | 'inherited'
  | 'inherited-function'
  | 'inherited-event'
  | 'inherited-subroutine'
  | 'inherited-variable'
  | 'subroutine'
  | 'type'
  | 'symbol'
  | 'external-function'
  | 'external-subroutine'
  | 'access-label'
  | 'inherits-label'
  | 'defined-in-label'
  | 'inherited-from-label'
  | 'parameters-label'
  | 'signatures-label'
  | 'returns-label'
  | 'notes-label'
  | 'usage-notes-label'
  | 'applies-to-label'
  | 'values-label'
  | 'category-label'
  | 'numeric-value-label'
  | 'meaning-label'
  | 'risk-of-use-label'
  | 'official-documentation-label'
  | 'obsolete-label'
  | 'risk-safe'
  | 'risk-dynamic'
  | 'risk-deprecated'
  | 'risk-legacy'
  | 'risk-external'
  | 'warning-external-call'
  | 'warning-external-stored-procedure'
  | 'warning-ambiguous-fallback'
  | 'warning-ambiguous-target'
  | 'warning-workspace-fallback'
  | 'warning-low-confidence'
  | 'deprecated-default-message'
  | 'use-instead';

export const PRESENTATION_MINIMUM_TERMS: readonly PresentationTerminologyKey[] = [
  'function',
  'event',
  'variable',
  'parameter',
  'return-value',
  'datawindow',
  'datastore',
  'datawindowchild',
  'transaction',
  'ancestor',
  'override',
  'scope',
  'source-origin',
  'confidence',
  'deprecated',
  'inferred',
  'ambiguous',
  'unknown',
];

const EN_TERMS: Record<PresentationTerminologyKey, string> = {
  function: 'Function',
  event: 'Event',
  variable: 'Variable',
  parameter: 'Parameter',
  'return-value': 'Return value',
  datawindow: 'DataWindow',
  datastore: 'DataStore',
  datawindowchild: 'DataWindowChild',
  transaction: 'Transaction',
  ancestor: 'Ancestor',
  override: 'Override',
  scope: 'Scope',
  'source-origin': 'Source origin',
  confidence: 'Confidence',
  deprecated: 'Deprecated',
  inferred: 'Inferred',
  ambiguous: 'Ambiguous',
  unknown: 'Unknown',
  argument: 'Argument',
  'local-variable': 'Local variable',
  'shared-variable': 'Shared variable',
  'global-variable': 'Global variable',
  'instance-variable': 'Instance variable',
  inherited: 'Inherited',
  'inherited-function': 'Inherited function',
  'inherited-event': 'Inherited event',
  'inherited-subroutine': 'Inherited subroutine',
  'inherited-variable': 'Inherited variable',
  subroutine: 'Subroutine',
  type: 'Type',
  symbol: 'Symbol',
  'external-function': 'External function',
  'external-subroutine': 'External subroutine',
  'access-label': 'Access',
  'inherits-label': 'Inherits',
  'defined-in-label': 'Defined in',
  'inherited-from-label': 'Inherited from',
  'parameters-label': 'Parameters',
  'signatures-label': 'Signatures',
  'returns-label': 'Returns',
  'notes-label': 'Notes',
  'usage-notes-label': 'Usage notes',
  'applies-to-label': 'Applies to',
  'values-label': 'Values',
  'category-label': 'Category',
  'numeric-value-label': 'Numeric value',
  'meaning-label': 'Meaning',
  'risk-of-use-label': 'Usage risk',
  'official-documentation-label': 'Official Appeon Documentation',
  'obsolete-label': 'Obsolete',
  'risk-safe': 'safe',
  'risk-dynamic': 'dynamic',
  'risk-deprecated': 'deprecated',
  'risk-legacy': 'legacy',
  'risk-external': 'external',
  'warning-external-call': 'Warning: external/native call. Runtime behavior is not validated.',
  'warning-external-stored-procedure': 'Warning: external stored procedure declaration. Runtime behavior is not validated.',
  'warning-ambiguous-fallback': 'Warning: ambiguous target resolved through workspace fallback.',
  'warning-ambiguous-target': 'Warning: ambiguous target; multiple candidates match the current context.',
  'warning-workspace-fallback': 'Warning: resolved using workspace fallback; inherited members may be incomplete.',
  'warning-low-confidence': 'Warning: low-confidence resolution.',
  'deprecated-default-message': 'Avoid using this function.',
  'use-instead': 'Use',
};

const ES_TERMS: Partial<Record<PresentationTerminologyKey, string>> = {
  function: 'Funcion',
  event: 'Evento',
  variable: 'Variable',
  parameter: 'Parámetro',
  'return-value': 'Valor de retorno',
  datawindow: 'DataWindow',
  datastore: 'DataStore',
  datawindowchild: 'DataWindowChild',
  transaction: 'Transacción',
  ancestor: 'Ancestro',
  override: 'Override',
  scope: 'Alcance',
  'source-origin': 'Origen de fuente',
  confidence: 'Confianza',
  deprecated: 'Obsoleto',
  inferred: 'Inferido',
  ambiguous: 'Ambiguo',
  unknown: 'Desconocido',
  argument: 'Argumento',
  'local-variable': 'Variable local',
  'shared-variable': 'Variable compartida',
  'global-variable': 'Variable global',
  'instance-variable': 'Variable de instancia',
  inherited: 'Heredado',
  'inherited-function': 'Función heredada',
  'inherited-event': 'Evento heredado',
  'inherited-subroutine': 'Subrutina heredada',
  'inherited-variable': 'Variable heredada',
  subroutine: 'Subrutina',
  type: 'Tipo',
  symbol: 'Símbolo',
  'external-function': 'Función externa',
  'external-subroutine': 'Subrutina externa',
  'access-label': 'Acceso',
  'inherits-label': 'Hereda de',
  'defined-in-label': 'Definido en',
  'inherited-from-label': 'Heredado de',
  'parameters-label': 'Parámetros',
  'signatures-label': 'Firmas',
  'returns-label': 'Retorno',
  'notes-label': 'Notas',
  'usage-notes-label': 'Notas de uso',
  'applies-to-label': 'Se aplica a',
  'values-label': 'Valores',
  'category-label': 'Categoría',
  'numeric-value-label': 'Valor numérico',
  'meaning-label': 'Significado',
  'risk-of-use-label': 'Riesgo de uso',
  'official-documentation-label': 'Documentación oficial Appeon',
  'obsolete-label': 'Obsoleto',
  'risk-safe': 'seguro',
  'risk-dynamic': 'dinamico',
  'risk-deprecated': 'obsoleto',
  'risk-legacy': 'legacy',
  'risk-external': 'externo',
  'warning-external-call': 'Advertencia: llamada external/native. El comportamiento en runtime no está validado.',
  'warning-external-stored-procedure': 'Advertencia: declaración de stored procedure externa. El comportamiento en runtime no está validado.',
  'warning-ambiguous-fallback': 'Advertencia: destino ambiguo resuelto mediante workspace fallback.',
  'warning-ambiguous-target': 'Advertencia: destino ambiguo; múltiples candidatos coinciden con el contexto actual.',
  'warning-workspace-fallback': 'Advertencia: resuelto usando workspace fallback; los miembros heredados pueden estar incompletos.',
  'warning-low-confidence': 'Advertencia: resolución de baja confianza.',
  'deprecated-default-message': 'Evita usar esta función.',
  'use-instead': 'Usa',
};

export function resolvePresentationTerminologyLocale(locale?: string): PresentationTerminologyLocale {
  const normalized = locale?.trim().toLowerCase();
  if (normalized?.startsWith('es')) {
    return 'es';
  }
  return 'en';
}

export function getPresentationTerm(
  key: PresentationTerminologyKey,
  locale: DocumentationLocale | string = 'en',
): string {
  const resolvedLocale = typeof locale === 'string'
    ? resolvePresentationTerminologyLocale(locale)
    : locale;

  if (resolvedLocale === 'es') {
    return ES_TERMS[key] ?? EN_TERMS[key];
  }

  return EN_TERMS[key];
}