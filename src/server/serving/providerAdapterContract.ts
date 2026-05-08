/**
 * Contrato declarativo de adaptadores de proveedor LSP.
 *
 * Define el carril, presupuesto, política de cancelación y resultado degradado
 * para cada feature de proveedor. allowsFullScan es siempre false para
 * garantizar que ningún proveedor haga escaneado completo en hot paths.
 */

export type ProviderFeature =
  | 'hover'
  | 'completion'
  | 'completion-resolve'
  | 'signatureHelp'
  | 'definition'
  | 'references'
  | 'documentSymbols'
  | 'semanticTokens'
  | 'rename'
  | 'linkedEditing'
  | 'codeActions'
  | 'codeLens'
  | 'workspaceSymbols';

export type ProviderLane = 'immediate' | 'interactive' | 'near' | 'background';

export type ProviderCancelPolicy =
  | 'cancel-on-new-request'
  | 'deduplicate'
  | 'queue';

export type ProviderDegradedResult =
  | 'empty'
  | 'stale'
  | 'structural-only'
  | 'not-supported';

export interface ProviderAdapterContract {
  feature: ProviderFeature;
  lane: ProviderLane;
  budgetMs: number;
  cacheFeature?: string;
  staleGuard: boolean;
  cancelPolicy: ProviderCancelPolicy;
  degradedResult: ProviderDegradedResult;
  requiresFacade: boolean;
  readonly allowsFullScan: false;
}

export const PROVIDER_ADAPTER_CONTRACTS: Record<ProviderFeature, ProviderAdapterContract> = {
  hover: {
    feature: 'hover',
    lane: 'interactive',
    budgetMs: 150,
    cacheFeature: 'hover',
    staleGuard: true,
    cancelPolicy: 'cancel-on-new-request',
    degradedResult: 'stale',
    requiresFacade: true,
    allowsFullScan: false,
  },
  completion: {
    feature: 'completion',
    lane: 'interactive',
    budgetMs: 300,
    cacheFeature: 'completion',
    staleGuard: true,
    cancelPolicy: 'cancel-on-new-request',
    degradedResult: 'stale',
    requiresFacade: true,
    allowsFullScan: false,
  },
  'completion-resolve': {
    feature: 'completion-resolve',
    lane: 'interactive',
    budgetMs: 100,
    cacheFeature: 'completion-resolve',
    staleGuard: false,
    cancelPolicy: 'deduplicate',
    degradedResult: 'empty',
    requiresFacade: false,
    allowsFullScan: false,
  },
  signatureHelp: {
    feature: 'signatureHelp',
    lane: 'interactive',
    budgetMs: 150,
    cacheFeature: 'signatureHelp',
    staleGuard: true,
    cancelPolicy: 'cancel-on-new-request',
    degradedResult: 'stale',
    requiresFacade: true,
    allowsFullScan: false,
  },
  definition: {
    feature: 'definition',
    lane: 'interactive',
    budgetMs: 200,
    cacheFeature: 'definition',
    staleGuard: true,
    cancelPolicy: 'cancel-on-new-request',
    degradedResult: 'empty',
    requiresFacade: true,
    allowsFullScan: false,
  },
  references: {
    feature: 'references',
    lane: 'near',
    budgetMs: 400,
    cacheFeature: 'references',
    staleGuard: true,
    cancelPolicy: 'cancel-on-new-request',
    degradedResult: 'empty',
    requiresFacade: true,
    allowsFullScan: false,
  },
  documentSymbols: {
    feature: 'documentSymbols',
    lane: 'interactive',
    budgetMs: 100,
    cacheFeature: 'documentSymbols',
    staleGuard: false,
    cancelPolicy: 'deduplicate',
    degradedResult: 'stale',
    requiresFacade: false,
    allowsFullScan: false,
  },
  semanticTokens: {
    feature: 'semanticTokens',
    lane: 'interactive',
    budgetMs: 200,
    cacheFeature: 'semanticTokens',
    staleGuard: true,
    cancelPolicy: 'cancel-on-new-request',
    degradedResult: 'stale',
    requiresFacade: false,
    allowsFullScan: false,
  },
  rename: {
    feature: 'rename',
    lane: 'near',
    budgetMs: 500,
    staleGuard: true,
    cancelPolicy: 'cancel-on-new-request',
    degradedResult: 'not-supported',
    requiresFacade: true,
    allowsFullScan: false,
  },
  linkedEditing: {
    feature: 'linkedEditing',
    lane: 'interactive',
    budgetMs: 150,
    staleGuard: false,
    cancelPolicy: 'cancel-on-new-request',
    degradedResult: 'empty',
    requiresFacade: true,
    allowsFullScan: false,
  },
  codeActions: {
    feature: 'codeActions',
    lane: 'near',
    budgetMs: 300,
    staleGuard: false,
    cancelPolicy: 'queue',
    degradedResult: 'empty',
    requiresFacade: false,
    allowsFullScan: false,
  },
  codeLens: {
    feature: 'codeLens',
    lane: 'background',
    budgetMs: 600,
    staleGuard: false,
    cancelPolicy: 'deduplicate',
    degradedResult: 'empty',
    requiresFacade: false,
    allowsFullScan: false,
  },
  workspaceSymbols: {
    feature: 'workspaceSymbols',
    lane: 'near',
    budgetMs: 400,
    staleGuard: false,
    cancelPolicy: 'cancel-on-new-request',
    degradedResult: 'empty',
    requiresFacade: false,
    allowsFullScan: false,
  },
};

/**
 * Valida un contrato de adaptador y retorna lista de errores encontrados.
 */
export function validateProviderAdapterContract(contract: ProviderAdapterContract): string[] {
  const errors: string[] = [];
  if (contract.budgetMs <= 0) {
    errors.push(`budgetMs debe ser positivo en feature '${contract.feature}'`);
  }
  if (contract.allowsFullScan !== false) {
    errors.push(`allowsFullScan debe ser false en feature '${contract.feature}'`);
  }
  return errors;
}

/**
 * Retorna el contrato para una feature dada, lanzando si no existe.
 */
export function getProviderContract(feature: ProviderFeature): ProviderAdapterContract {
  const contract = PROVIDER_ADAPTER_CONTRACTS[feature];
  if (!contract) {
    throw new Error(`No existe contrato de adaptador para feature '${feature}'`);
  }
  return contract;
}
