export type PbAutoBuildLogSeverity = 'error' | 'warning';

export interface PbAutoBuildLogIssue {
  severity: PbAutoBuildLogSeverity;
  category: 'Error' | 'Warning' | 'Fatal';
  message: string;
  objectName?: string;
  libraryPath?: string;
  compilerCode?: string;
  nativeCode?: string;
  rawLine: string;
}

export interface PbAutoBuildLogCategorySummary {
  category: 'Error' | 'Warning' | 'Fatal';
  issueCount: number;
}

export interface PbAutoBuildLogLibrarySummary {
  libraryPath: string;
  issueCount: number;
  objectNames: string[];
}

export interface PbAutoBuildLogIssueSummary {
  errorCount: number;
  warningCount: number;
  fatalCount: number;
  categories: PbAutoBuildLogCategorySummary[];
  libraries: PbAutoBuildLogLibrarySummary[];
}

export interface PbAutoBuildLogParseResult {
  issues: PbAutoBuildLogIssue[];
  rawLines: string[];
  summary: PbAutoBuildLogIssueSummary;
}

export function parsePbAutoBuildLog(text: string): PbAutoBuildLogParseResult {
  const rawLines = text.split(/\r?\n/);
  const issues: PbAutoBuildLogIssue[] = [];

  let currentLibrary: string | undefined;
  let currentObject: string | undefined;

  for (const rawLine of rawLines) {
    const match = /^\s*\d{2}:\d{2}:\d{2}\s+\[(?<level>[^\]]+)\]\s+(?<message>.*)$/.exec(rawLine);
    if (!match?.groups) {
      continue;
    }

    const level = normalizeWhitespace(match.groups.level).toLowerCase();
    const message = normalizeWhitespace(match.groups.message);

    if (level === 'normal') {
      const libraryMatch = /^Library:\s*(.+)$/i.exec(message);
      if (libraryMatch) {
        currentLibrary = libraryMatch[1].trim();
        currentObject = undefined;
        continue;
      }

      const objectMatch = /^Object:\s*(.+)$/i.exec(message);
      if (objectMatch) {
        currentObject = objectMatch[1].trim();
      }
      continue;
    }

    if (level !== 'error' && level !== 'warning') {
      continue;
    }

    const issue = parseIssueMessage(message, rawLine, currentLibrary, currentObject, level as PbAutoBuildLogSeverity);
    if (issue) {
      issues.push(issue);
    }
  }

  return {
    issues,
    rawLines,
    summary: summarizePbAutoBuildLogIssues(issues)
  };
}

export function summarizePbAutoBuildLogIssues(issues: readonly PbAutoBuildLogIssue[]): PbAutoBuildLogIssueSummary {
  let errorCount = 0;
  let warningCount = 0;
  let fatalCount = 0;
  const categories = new Map<'Error' | 'Warning' | 'Fatal', number>();
  const libraries = new Map<string, { issueCount: number; objectNames: Set<string> }>();

  for (const issue of issues) {
    if (issue.category === 'Fatal') {
      fatalCount++;
    } else if (issue.category === 'Warning') {
      warningCount++;
    } else {
      errorCount++;
    }

    categories.set(issue.category, (categories.get(issue.category) ?? 0) + 1);

    if (issue.libraryPath) {
      const entry = libraries.get(issue.libraryPath) ?? { issueCount: 0, objectNames: new Set<string>() };
      entry.issueCount++;
      if (issue.objectName) {
        entry.objectNames.add(issue.objectName);
      }
      libraries.set(issue.libraryPath, entry);
    }
  }

  return {
    errorCount,
    warningCount,
    fatalCount,
    categories: [...categories.entries()]
      .map(([category, issueCount]) => ({ category, issueCount }))
      .sort((left, right) => severityWeight(left.category) - severityWeight(right.category)),
    libraries: [...libraries.entries()]
      .map(([libraryPath, info]) => ({
        libraryPath,
        issueCount: info.issueCount,
        objectNames: [...info.objectNames].sort((left, right) => left.localeCompare(right))
      }))
      .sort((left, right) => left.libraryPath.localeCompare(right.libraryPath))
  };
}

function parseIssueMessage(
  message: string,
  rawLine: string,
  libraryPath: string | undefined,
  objectName: string | undefined,
  severity: PbAutoBuildLogSeverity
): PbAutoBuildLogIssue | undefined {
  const detailedMatch = /^\((?<nativeCode>\d+)\):\s*(?<category>Error|Warning|Fatal)\s*(?<compilerCode>[A-Z]\d+):\s*(?<detail>.+)$/i.exec(message);
  if (detailedMatch?.groups) {
    return {
      severity,
      category: normalizeCategory(detailedMatch.groups.category),
      message: `${detailedMatch.groups.compilerCode}: ${detailedMatch.groups.detail.trim()}`,
      ...(objectName ? { objectName } : {}),
      ...(libraryPath ? { libraryPath } : {}),
      compilerCode: detailedMatch.groups.compilerCode,
      nativeCode: detailedMatch.groups.nativeCode,
      rawLine
    };
  }

  if (/failed to compile/i.test(message)) {
    return undefined;
  }

  return {
    severity,
    category: severity === 'warning' ? 'Warning' : 'Error',
    message,
    ...(objectName ? { objectName } : {}),
    ...(libraryPath ? { libraryPath } : {}),
    rawLine
  };
}

function normalizeCategory(category: string): 'Error' | 'Warning' | 'Fatal' {
  const normalized = normalizeWhitespace(category).toLowerCase();
  if (normalized === 'fatal') {
    return 'Fatal';
  }
  if (normalized === 'warning') {
    return 'Warning';
  }
  return 'Error';
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function severityWeight(category: 'Error' | 'Warning' | 'Fatal'): number {
  if (category === 'Fatal') {
    return 0;
  }
  if (category === 'Error') {
    return 1;
  }
  return 2;
}