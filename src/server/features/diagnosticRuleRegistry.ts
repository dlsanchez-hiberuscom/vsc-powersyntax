/**
 * Registro de reglas de diagnóstico con metadatos de tier, dominio, carril y presupuesto.
 *
 * Tier 0-1: pueden ejecutarse sin estado semántico de proyecto completo.
 * Tier 2: requieren KB disponible, interactivos.
 * Tier 3-4: no pueden ejecutarse inline en hot paths open/change.
 *
 * buildDiagnosticsForDocument se mantiene como capa de compatibilidad.
 */

import type { Diagnostic } from 'vscode-languageserver/node';

import { getDiagnosticCode } from '../../shared/diagnosticCodes';

export type DiagnosticTier = 0 | 1 | 2 | 3 | 4;

export type DiagnosticDomain =
  | 'structural'
  | 'syntactic'
  | 'semantic'
  | 'advisory'
  | 'datawindow'
  | 'obsolete';

export type DiagnosticLane = 'immediate' | 'interactive' | 'near' | 'background';

export interface DiagnosticRuleMetadata {
  id: string;
  tier: DiagnosticTier;
  domain: DiagnosticDomain;
  lane: DiagnosticLane;
  budgetMs?: number;
  cap?: number;
  advisory?: boolean;
  sourceOriginPolicy?: string;
  confidenceFloor?: number;
  reasonCode?: string;
}

export class DiagnosticRuleRegistry {
  private readonly rules = new Map<string, DiagnosticRuleMetadata>();

  register(metadata: DiagnosticRuleMetadata): void {
    this.rules.set(metadata.id, metadata);
  }

  lookup(id: string): DiagnosticRuleMetadata | undefined {
    return this.rules.get(id);
  }

  getByTier(tier: DiagnosticTier): DiagnosticRuleMetadata[] {
    return Array.from(this.rules.values()).filter(r => r.tier === tier);
  }

  getAll(): DiagnosticRuleMetadata[] {
    return Array.from(this.rules.values());
  }
}

export const DIAGNOSTIC_RULE_REGISTRY = new DiagnosticRuleRegistry();

export function getDiagnosticRuleMetadata(
  diagnostic: Pick<Diagnostic, 'code' | 'source'> | string | undefined,
  registry: DiagnosticRuleRegistry = DIAGNOSTIC_RULE_REGISTRY,
): DiagnosticRuleMetadata | undefined {
  const code = typeof diagnostic === 'string'
    ? diagnostic
    : diagnostic
      ? getDiagnosticCode(diagnostic)
      : undefined;
  return code ? registry.lookup(code) : undefined;
}

export function collectUnregisteredDiagnosticCodes(
  diagnostics: readonly Pick<Diagnostic, 'code' | 'source'>[],
  registry: DiagnosticRuleRegistry = DIAGNOSTIC_RULE_REGISTRY,
): string[] {
  return [...new Set(
    diagnostics
      .map((diagnostic) => getDiagnosticCode(diagnostic))
      .filter((code): code is string => typeof code === 'string')
      .filter((code) => !registry.lookup(code))
      .sort(),
  )];
}

// Reglas estructurales y sintácticas (Tier 1 - immediate, no requieren KB)
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'SD9', tier: 1, domain: 'structural', lane: 'immediate' });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'SD10', tier: 1, domain: 'structural', lane: 'immediate' });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'SD11', tier: 1, domain: 'syntactic', lane: 'immediate' });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'SD12', tier: 1, domain: 'syntactic', lane: 'immediate' });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'SD13', tier: 1, domain: 'syntactic', lane: 'immediate' });

// Regla obsolete (Tier 1 - immediate)
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'SD7', tier: 1, domain: 'obsolete', lane: 'immediate' });

// Reglas semánticas (Tier 2 - interactive, requieren KB)
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'SD2', tier: 2, domain: 'semantic', lane: 'interactive' });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'SD3', tier: 2, domain: 'semantic', lane: 'interactive' });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'SD4', tier: 2, domain: 'semantic', lane: 'interactive' });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'SD5', tier: 2, domain: 'semantic', lane: 'interactive' });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'SD6', tier: 2, domain: 'semantic', lane: 'interactive' });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'SD8', tier: 2, domain: 'semantic', lane: 'interactive' });

// Reglas semánticas de contexto enumerado
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'enum-value-context-mismatch', tier: 2, domain: 'semantic', lane: 'interactive' });

// Reglas de DataWindow (Tier 2 - interactive)
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'dataobject-not-found', tier: 2, domain: 'datawindow', lane: 'interactive' });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'dataobject-ambiguous', tier: 2, domain: 'datawindow', lane: 'interactive' });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'dataobject-dynamic', tier: 2, domain: 'datawindow', lane: 'interactive', advisory: true });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'datawindow-property-path-unresolved', tier: 2, domain: 'datawindow', lane: 'interactive' });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'datawindow-expression-dependency-unresolved', tier: 2, domain: 'datawindow', lane: 'interactive' });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'retrieve-arity-mismatch', tier: 2, domain: 'datawindow', lane: 'interactive' });

// Reglas semánticas de transacción (Tier 2 - interactive)
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'transaction-binding-missing', tier: 2, domain: 'semantic', lane: 'interactive' });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'transaction-binding-unknown', tier: 2, domain: 'semantic', lane: 'interactive' });
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'transaction-binding-dynamic', tier: 2, domain: 'semantic', lane: 'interactive', advisory: true });

// Reglas advisory (Tier 2 - interactive, advisory: true)
DIAGNOSTIC_RULE_REGISTRY.register({ id: 'native-dependency', tier: 2, domain: 'advisory', lane: 'interactive', advisory: true });
