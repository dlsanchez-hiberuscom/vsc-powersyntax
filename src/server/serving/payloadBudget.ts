import type { InteractiveServingFeature } from '../runtime/interactiveServingStats';

export type InteractivePayloadBudgetFeature = InteractiveServingFeature | 'completion-resolve';

export interface InteractivePayloadBudget {
  budgetBytes: number;
  notes: string;
}

export interface InteractivePayloadBudgetEvaluation {
  feature: InteractivePayloadBudgetFeature;
  payloadBytes: number;
  budgetBytes: number;
  overflowBytes: number;
  withinBudget: boolean;
}

export const INTERACTIVE_PAYLOAD_BUDGETS: Readonly<Record<InteractivePayloadBudgetFeature, InteractivePayloadBudget>> = {
  hover: {
    budgetBytes: 4 * 1024,
    notes: 'Markdown compacto del hover visible en una sola respuesta inicial.',
  },
  completion: {
    budgetBytes: 64 * 1024,
    notes: 'Lista inicial acotada; el detalle caro debe migrar a resolve cuando exista.',
  },
  'completion-resolve': {
    budgetBytes: 4 * 1024,
    notes: 'Detalle diferido por item una vez exista completionItem/resolve.',
  },
  signatureHelp: {
    budgetBytes: 12 * 1024,
    notes: 'Firmas activas y documentación resumida del callable actual.',
  },
  definition: {
    budgetBytes: 4 * 1024,
    notes: 'Ubicaciones y metadata mínima de navegación.',
  },
  references: {
    budgetBytes: 96 * 1024,
    notes: 'Lista de ubicaciones acotada y defendible para navegación interactiva.',
  },
  documentSymbols: {
    budgetBytes: 48 * 1024,
    notes: 'Árbol de símbolos del documento activo, no del workspace completo.',
  },
  semanticTokens: {
    budgetBytes: 256 * 1024,
    notes: 'Carga binaria densa pero estable por documento; debe seguir capada.',
  },
};

export function resolveInteractivePayloadBudgetFeature(
  feature: InteractiveServingFeature
): InteractivePayloadBudgetFeature {
  return feature;
}

export function getInteractivePayloadBudget(feature: InteractivePayloadBudgetFeature): InteractivePayloadBudget {
  return INTERACTIVE_PAYLOAD_BUDGETS[feature];
}

export function evaluateInteractivePayloadBudget(
  feature: InteractivePayloadBudgetFeature,
  payloadBytes: number | undefined
): InteractivePayloadBudgetEvaluation {
  const budget = getInteractivePayloadBudget(feature);
  const normalizedPayload = Math.max(0, Math.round(payloadBytes ?? 0));
  const overflowBytes = Math.max(0, normalizedPayload - budget.budgetBytes);

  return {
    feature,
    payloadBytes: normalizedPayload,
    budgetBytes: budget.budgetBytes,
    overflowBytes,
    withinBudget: overflowBytes === 0,
  };
}