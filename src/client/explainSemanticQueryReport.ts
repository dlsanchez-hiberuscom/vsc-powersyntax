import type { ApiExplainSemanticQueryReport } from '../shared/publicApi';

function formatInlineList(values: readonly string[] | undefined): string | undefined {
  if (!values || values.length === 0) {
    return undefined;
  }

  return values.join(', ');
}

export function buildExplainSemanticQueryMarkdown(report: ApiExplainSemanticQueryReport): string {
  const lines: string[] = ['# Explain Semantic Query', ''];

  lines.push(`- Available: ${report.available ? 'yes' : 'no'}`);
  lines.push(`- Resolution: ${report.resolution.state}`);
  lines.push(`- Candidates: ${report.resolution.candidateCount}`);
  lines.push(`- Targets: ${report.resolution.targetCount}`);
  if (report.document?.identifier) {
    lines.push(`- Identifier: ${report.document.identifier}`);
  }
  if (report.resolution.primaryReasonCode) {
    lines.push(`- Primary reason: ${report.resolution.primaryReasonCode}`);
  }
  if (report.resolution.confidence) {
    lines.push(`- Confidence: ${report.resolution.confidence}`);
  }
  lines.push('');

  if (report.reason) {
    lines.push('## Reason', '', report.reason, '');
  }

  if (report.document) {
    lines.push('## Query', '');
    lines.push(`- URI: ${report.document.uri}`);
    lines.push(`- Position: ${report.document.line}:${report.document.character}`);
    if (report.document.qualifier) {
      lines.push(`- Qualifier: ${report.document.qualifier}`);
    }
    if (report.document.currentObject) {
      lines.push(`- Current object: ${report.document.currentObject}`);
    }
    lines.push('');
  }

  lines.push('## Resolution', '');
  lines.push(`- State: ${report.resolution.state}`);
  if (report.resolution.invocationKind) {
    lines.push(`- Invocation kind: ${report.resolution.invocationKind}`);
  }
  if (report.resolution.invocationRisk) {
    lines.push(`- Invocation risk: ${report.resolution.invocationRisk}`);
  }
  if (report.resolution.ambiguityKind) {
    lines.push(`- Ambiguity: ${report.resolution.ambiguityKind}`);
  }
  if (report.resolution.resolvedQualifierType) {
    lines.push(`- Resolved qualifier type: ${report.resolution.resolvedQualifierType}`);
  }
  const evidenceKinds = formatInlineList(report.resolution.evidenceKinds);
  if (evidenceKinds) {
    lines.push(`- Evidence kinds: ${evidenceKinds}`);
  }
  lines.push('');

  if (report.winner) {
    lines.push('## Winner', '');
    lines.push(`- Name: ${report.winner.name}`);
    lines.push(`- Kind: ${report.winner.kind}`);
    lines.push(`- URI: ${report.winner.uri}`);
    if (report.winner.containerName) {
      lines.push(`- Container: ${report.winner.containerName}`);
    }
    if (report.winner.sourceOrigin) {
      lines.push(`- Source origin: ${report.winner.sourceOrigin}`);
    }
    if (report.winner.resolutionKind) {
      lines.push(`- Resolution kind: ${report.winner.resolutionKind}`);
    }
    lines.push('');
  }

  if (report.candidates?.length) {
    lines.push('## Candidates', '');
    for (const candidate of report.candidates) {
      lines.push(`- ${candidate.name} (${candidate.kind})`);
      if (candidate.containerName) {
        lines.push(`  - Container: ${candidate.containerName}`);
      }
      if (candidate.reasonCode) {
        lines.push(`  - Reason: ${candidate.reasonCode}`);
      }
      lines.push(`  - URI: ${candidate.uri}`);
    }
    lines.push('');
  }

  if (report.discards?.length) {
    lines.push('## Discards', '');
    for (const discard of report.discards) {
      lines.push(`- ${discard.kind}: ${discard.summary}`);
      if (discard.detail) {
        lines.push(`  - ${discard.detail}`);
      }
    }
    lines.push('');
  }

  if (report.phases.length) {
    lines.push('## Plan Phases', '');
    for (const phase of report.phases) {
      lines.push(`- ${phase.name}: ${phase.status}`);
      lines.push(`  - ${phase.summary}`);
    }
    lines.push('');
  }

  lines.push('## Cost', '');
  lines.push(`- Approximate: ${report.cost.approximate}`);
  lines.push(`- Trace steps: ${report.cost.traceSteps}`);
  lines.push(`- Candidate count: ${report.cost.candidateCount}`);
  lines.push(`- Discard count: ${report.cost.discardCount}`);
  lines.push('');

  if (report.trace) {
    lines.push('## Trace', '');
    lines.push(`- Label: ${report.trace.label ?? 'unknown'}`);
    lines.push(`- Step count: ${report.trace.stepCount}`);
    const phases = formatInlineList(report.trace.phases);
    if (phases) {
      lines.push(`- Phases: ${phases}`);
    }
    const actions = formatInlineList(report.trace.actions);
    if (actions) {
      lines.push(`- Actions: ${actions}`);
    }
    if (report.trace.steps?.length) {
      for (const step of report.trace.steps) {
        lines.push(`- ${step.name}`);
      }
    }
    lines.push('');
  }

  if (report.findings.length) {
    lines.push('## Findings', '');
    for (const finding of report.findings) {
      lines.push(`- [${finding.severity}] ${finding.message}`);
      if (finding.detail) {
        lines.push(`  - ${finding.detail}`);
      }
    }
    lines.push('');
  }

  if (report.recommendedActions.length) {
    lines.push('## Recommended Actions', '');
    for (const action of report.recommendedActions) {
      lines.push(`- ${action}`);
    }
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}