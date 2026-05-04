import { describeExplainableDiagnostic } from './explainDiagnosticReport';

export interface DiagnosticsExplainabilityLocationTarget {
  uri: string;
  line?: number;
  character?: number;
}

export interface ExplainableDiagnosticInput {
  uri: string;
  message: string;
  code?: string;
  severity?: 'error' | 'warning' | 'info' | 'hint';
  line: number;
  character: number;
  source?: string;
}

export interface DiagnosticsExplainabilityPanelSectionNode {
  type: 'section';
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  children: DiagnosticsExplainabilityPanelNode[];
}

export interface DiagnosticsExplainabilityPanelItemNode {
  type: 'item';
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
  target?: DiagnosticsExplainabilityLocationTarget;
}

export type DiagnosticsExplainabilityPanelNode = DiagnosticsExplainabilityPanelSectionNode | DiagnosticsExplainabilityPanelItemNode;

export interface DiagnosticsExplainabilityPanelModel {
  message?: string;
  roots: DiagnosticsExplainabilityPanelNode[];
  focusNodeId?: string;
}

function createItem(
  id: string,
  label: string,
  description?: string,
  tooltip?: string,
  target?: DiagnosticsExplainabilityLocationTarget,
): DiagnosticsExplainabilityPanelItemNode {
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
  children: DiagnosticsExplainabilityPanelNode[],
  description?: string,
  tooltip?: string,
): DiagnosticsExplainabilityPanelSectionNode {
  return {
    type: 'section',
    id,
    label,
    ...(description ? { description } : {}),
    ...(tooltip ? { tooltip } : {}),
    children,
  };
}

export function buildDiagnosticsExplainabilityPanelModel(diagnostics: readonly ExplainableDiagnosticInput[]): DiagnosticsExplainabilityPanelModel {
  if (diagnostics.length === 0) {
    return {
      message: 'No hay diagnostics publicados para el archivo activo.',
      roots: [],
    };
  }

  const roots = diagnostics.map((diagnostic, index) => {
    const explanation = describeExplainableDiagnostic({
      code: diagnostic.code,
      message: diagnostic.message,
    });
    const locationTarget = {
      uri: diagnostic.uri,
      line: diagnostic.line,
      character: diagnostic.character,
    };

    return createSection(
      `diagnostic:${index}`,
      diagnostic.message,
      [
        createItem(`diagnostic:${index}:code`, 'Code', diagnostic.code ?? 'sin código', explanation.title, locationTarget),
        createItem(`diagnostic:${index}:severity`, 'Severity', diagnostic.severity ?? 'unknown', diagnostic.source, locationTarget),
        createItem(
          `diagnostic:${index}:why`,
          'Why',
          explanation.whyItMatters ?? explanation.summary,
          explanation.summary,
          locationTarget,
        ),
        createSection(
          `diagnostic:${index}:next-steps`,
          'Next steps',
          explanation.recommendedActions.map((step, stepIndex) => createItem(`diagnostic:${index}:next-step:${stepIndex}`, step)),
          `${explanation.recommendedActions.length}`,
        ),
        createItem(
          `diagnostic:${index}:location`,
          'Location',
          `${diagnostic.line + 1}:${diagnostic.character + 1}`,
          `${diagnostic.uri}:${diagnostic.line + 1}:${diagnostic.character + 1}`,
          locationTarget,
        ),
      ],
      [diagnostic.code, diagnostic.severity].filter((part): part is string => Boolean(part)).join(' · '),
      explanation.title,
    );
  });

  return {
    message: `${diagnostics.length} diagnostic(s) explicables en el archivo activo.`,
    roots,
    focusNodeId: roots[0]?.id,
  };
}

export function findDiagnosticsExplainabilityNodeById(
  roots: readonly DiagnosticsExplainabilityPanelNode[],
  nodeId: string | undefined,
): DiagnosticsExplainabilityPanelNode | undefined {
  if (!nodeId) {
    return undefined;
  }

  const queue = [...roots];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    if (current.id === nodeId) {
      return current;
    }
    if (current.type === 'section') {
      queue.push(...current.children);
    }
  }

  return undefined;
}