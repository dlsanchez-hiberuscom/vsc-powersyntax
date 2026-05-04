import type { ApiExplainSystemSymbolReport } from '../shared/publicApi';

function formatInlineList(values: readonly string[] | undefined): string | undefined {
  if (!values || values.length === 0) {
    return undefined;
  }

  return values.join(', ');
}

export function buildExplainSystemSymbolMarkdown(report: ApiExplainSystemSymbolReport): string {
  const lines: string[] = ['# Explain System Symbol', ''];

  lines.push(`- Available: ${report.available ? 'yes' : 'no'}`);
  lines.push(`- Resolution: ${report.resolution.state}`);
  lines.push(`- Candidates: ${report.resolution.candidateCount}`);
  if (report.symbol?.name) {
    lines.push(`- Symbol: ${report.symbol.name}`);
  }
  lines.push('');

  if (report.reason) {
    lines.push('## Reason', '', report.reason, '');
  }

  if (report.symbol) {
    lines.push('## Symbol', '');
    lines.push(`- Name: ${report.symbol.name}`);
    if (report.symbol.kind) {
      lines.push(`- Kind: ${report.symbol.kind}`);
    }
    if (report.symbol.domain) {
      lines.push(`- Domain: ${report.symbol.domain}`);
    }
    const ownerTypes = formatInlineList(report.symbol.ownerTypes);
    if (ownerTypes) {
      lines.push(`- Owner types: ${ownerTypes}`);
    }
    const appliesTo = formatInlineList(report.symbol.appliesTo);
    if (appliesTo) {
      lines.push(`- Applies to: ${appliesTo}`);
    }
    if (report.symbol.authority) {
      lines.push(`- Authority: ${report.symbol.authority}`);
    }
    lines.push('');

    if (report.symbol.summary) {
      lines.push('### Summary', '', report.symbol.summary, '');
    }

    if (report.symbol.documentation) {
      lines.push('### Documentation', '', report.symbol.documentation, '');
    }
  }

  if (report.signatures?.length) {
    lines.push('## Signatures', '');
    for (const signature of report.signatures) {
      lines.push(`- ${signature.label}`);
      if (signature.parameters?.length) {
        for (const parameter of signature.parameters) {
          const parts = [parameter.name];
          if (parameter.type) {
            parts.push(`: ${parameter.type}`);
          }
          if (parameter.documentation) {
            parts.push(` — ${parameter.documentation}`);
          }
          lines.push(`  - ${parts.join('')}`);
        }
      }
    }
    lines.push('');
  }

  if (report.enumInfo) {
    lines.push('## Enum Info', '');
    if (report.enumInfo.enumValueOf) {
      lines.push(`- Enum type: ${report.enumInfo.enumValueOf}`);
    }
    if (typeof report.enumInfo.enumNumericValue === 'number') {
      lines.push(`- Numeric value: ${report.enumInfo.enumNumericValue}`);
    }
    if (report.enumInfo.enumValueMeaning) {
      lines.push(`- Meaning: ${report.enumInfo.enumValueMeaning}`);
    }
    if (report.enumInfo.enumValues?.length) {
      lines.push(`- Values: ${report.enumInfo.enumValues.join(', ')}`);
    }
    lines.push('');
  }

  if (report.candidates?.length) {
    lines.push('## Candidates', '');
    for (const candidate of report.candidates) {
      const parts = [candidate.name];
      if (candidate.kind) {
        parts.push(`(${candidate.kind})`);
      }
      if (candidate.domain) {
        parts.push(`- ${candidate.domain}`);
      }
      lines.push(`- ${parts.join(' ')}`);
      if (candidate.summary) {
        lines.push(`  - ${candidate.summary}`);
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