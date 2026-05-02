import * as path from 'path';

import type {
  ApiCurrentObjectContext,
  ApiImpactAnalysis,
  ApiSafeEditPlan,
  ApiSemanticWorkspaceManifest,
  ApiServerStats,
} from '../../shared/publicApi';

export interface SemanticReproEditorDiagnostic {
  message: string;
  severity: string;
  source?: string;
  code?: string;
  startLine: number;
  startCharacter: number;
  endLine: number;
  endCharacter: number;
}

export interface SemanticReproCapturedFile {
  uri: string;
  workspaceRelativePath?: string;
  sourceOrigin?: string;
  reasons: readonly string[];
  content: string;
}

export interface SemanticReproMissingFile {
  uri: string;
  workspaceRelativePath?: string;
  reasons: readonly string[];
  detail: string;
}

export interface SemanticReproPackInput {
  workspaceRootPath: string;
  reproRootPath: string;
  focusUri: string;
  focusWorkspaceRelativePath?: string;
  focusLine?: number;
  focusCharacter?: number;
  focusSymbolName?: string;
  focusObjectName?: string;
  focusSourceOrigin?: string;
  currentObjectContext: ApiCurrentObjectContext;
  impactAnalysis: ApiImpactAnalysis;
  safeEditPlan: ApiSafeEditPlan;
  workspaceManifest: ApiSemanticWorkspaceManifest;
  serverStats: ApiServerStats;
  editorDiagnostics: readonly SemanticReproEditorDiagnostic[];
  capturedFiles: readonly SemanticReproCapturedFile[];
  missingFiles?: readonly SemanticReproMissingFile[];
  generatedAt?: string;
}

export interface SemanticReproPackFile {
  relativePath: string;
  content: string;
}

export interface SemanticReproPackManifest {
  schemaVersion: 1;
  generatedAt: string;
  reproWorkspaceRelativePath: string;
  focus: {
    uri: string;
    workspaceRelativePath?: string;
    line?: number;
    character?: number;
    symbolName?: string;
    objectName?: string;
    sourceOrigin?: string;
  };
  evidence: {
    currentObjectAvailable: boolean;
    impactAvailable: boolean;
    safeEditPlanAvailable: boolean;
    readinessState?: string;
    healthStatus?: string;
  };
  capturedFiles: Array<{
    uri: string;
    workspaceRelativePath?: string;
    exportedRelativePath: string;
    sourceOrigin?: string;
    reasons: string[];
  }>;
  missingFiles: Array<{
    uri: string;
    workspaceRelativePath?: string;
    reasons: string[];
    detail: string;
  }>;
}

export interface SemanticReproPackBundle {
  reproWorkspaceRelativePath: string;
  manifest: SemanticReproPackManifest;
  files: readonly SemanticReproPackFile[];
}

export function suggestSemanticReproDirectoryName(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'semantic-repro-pack';
}

export function buildSemanticReproPackBundle(input: SemanticReproPackInput): SemanticReproPackBundle {
  const reproWorkspaceRelativePath = ensureNonEmptyPosixPath(
    path.relative(input.workspaceRootPath, input.reproRootPath)
  );
  const generatedAt = input.generatedAt ?? new Date().toISOString();

  const capturedFiles = input.capturedFiles.map((file, index) => {
    const exportedRelativePath = buildCapturedFileRelativePath(file, index);
    return {
      ...file,
      exportedRelativePath,
    };
  });

  const manifest: SemanticReproPackManifest = {
    schemaVersion: 1,
    generatedAt,
    reproWorkspaceRelativePath,
    focus: {
      uri: input.focusUri,
      ...(input.focusWorkspaceRelativePath ? { workspaceRelativePath: input.focusWorkspaceRelativePath } : {}),
      ...(typeof input.focusLine === 'number' ? { line: input.focusLine } : {}),
      ...(typeof input.focusCharacter === 'number' ? { character: input.focusCharacter } : {}),
      ...(input.focusSymbolName ? { symbolName: input.focusSymbolName } : {}),
      ...(input.focusObjectName ? { objectName: input.focusObjectName } : {}),
      ...(input.focusSourceOrigin ? { sourceOrigin: input.focusSourceOrigin } : {}),
    },
    evidence: {
      currentObjectAvailable: input.currentObjectContext.available,
      impactAvailable: input.impactAnalysis.available,
      safeEditPlanAvailable: input.safeEditPlan.available,
      ...(input.workspaceManifest.readiness.state ? { readinessState: input.workspaceManifest.readiness.state } : {}),
      ...(input.serverStats.health?.status ? { healthStatus: input.serverStats.health.status } : {}),
    },
    capturedFiles: capturedFiles.map((file) => ({
      uri: file.uri,
      ...(file.workspaceRelativePath ? { workspaceRelativePath: file.workspaceRelativePath } : {}),
      exportedRelativePath: file.exportedRelativePath,
      ...(file.sourceOrigin ? { sourceOrigin: file.sourceOrigin } : {}),
      reasons: [...file.reasons],
    })),
    missingFiles: (input.missingFiles ?? []).map((file) => ({
      uri: file.uri,
      ...(file.workspaceRelativePath ? { workspaceRelativePath: file.workspaceRelativePath } : {}),
      reasons: [...file.reasons],
      detail: file.detail,
    })),
  };

  return {
    reproWorkspaceRelativePath,
    manifest,
    files: [
      {
        relativePath: 'manifest.json',
        content: `${JSON.stringify(manifest, null, 2)}\n`,
      },
      {
        relativePath: 'README.md',
        content: buildReadme(manifest),
      },
      {
        relativePath: 'current-object-context.json',
        content: `${JSON.stringify(input.currentObjectContext, null, 2)}\n`,
      },
      {
        relativePath: 'impact-analysis.json',
        content: `${JSON.stringify(input.impactAnalysis, null, 2)}\n`,
      },
      {
        relativePath: 'safe-edit-plan.json',
        content: `${JSON.stringify(input.safeEditPlan, null, 2)}\n`,
      },
      {
        relativePath: 'semantic-workspace-manifest.json',
        content: `${JSON.stringify(input.workspaceManifest, null, 2)}\n`,
      },
      {
        relativePath: 'server-stats.json',
        content: `${JSON.stringify(input.serverStats, null, 2)}\n`,
      },
      {
        relativePath: 'editor-diagnostics.json',
        content: `${JSON.stringify(input.editorDiagnostics, null, 2)}\n`,
      },
      ...capturedFiles.map((file) => ({
        relativePath: file.exportedRelativePath,
        content: file.content,
      })),
    ],
  };
}

function buildCapturedFileRelativePath(file: SemanticReproCapturedFile, index: number): string {
  if (file.workspaceRelativePath) {
    return `files/workspace/${sanitizeRelativePath(file.workspaceRelativePath)}`;
  }

  const slug = suggestSemanticReproDirectoryName(basenameFromUri(file.uri));
  const extension = path.posix.extname(file.uri.split(/[?#]/, 1)[0]) || '.txt';
  return `files/external/${String(index + 1).padStart(2, '0')}-${slug}${extension}`;
}

function buildReadme(manifest: SemanticReproPackManifest): string {
  const lines = [
    `# Semantic repro pack${manifest.focus.symbolName ? ` - ${manifest.focus.symbolName}` : ''}`,
    '',
    'Este bundle captura el contexto read-only necesario para reabrir un bug semantico sin reconstruir manualmente el entorno en caliente.',
    '',
    '## Punto de partida',
    '',
    `- URI: ${manifest.focus.uri}`,
    ...(manifest.focus.workspaceRelativePath ? [`- Ruta relativa: ${manifest.focus.workspaceRelativePath}`] : []),
    ...(typeof manifest.focus.line === 'number' ? [`- Linea: ${manifest.focus.line}`] : []),
    ...(typeof manifest.focus.character === 'number' ? [`- Caracter: ${manifest.focus.character}`] : []),
    ...(manifest.focus.symbolName ? [`- Simbolo: ${manifest.focus.symbolName}`] : []),
    ...(manifest.focus.objectName ? [`- Objeto: ${manifest.focus.objectName}`] : []),
    ...(manifest.focus.sourceOrigin ? [`- sourceOrigin: ${manifest.focus.sourceOrigin}`] : []),
    '',
    '## Evidencia incluida',
    '',
    `- Current Object Context disponible: ${manifest.evidence.currentObjectAvailable}`,
    `- Impact Analysis disponible: ${manifest.evidence.impactAvailable}`,
    `- Safe Edit Plan disponible: ${manifest.evidence.safeEditPlanAvailable}`,
    ...(manifest.evidence.readinessState ? [`- Readiness: ${manifest.evidence.readinessState}`] : []),
    ...(manifest.evidence.healthStatus ? [`- Salud runtime: ${manifest.evidence.healthStatus}`] : []),
    '',
    '## Archivos capturados',
    '',
    ...manifest.capturedFiles.map((file) => `- ${file.exportedRelativePath} <= ${file.uri} (${file.reasons.join(', ')})`),
    ...(manifest.missingFiles.length > 0
      ? [
        '',
        '## Archivos no capturados',
        '',
        ...manifest.missingFiles.map((file) => `- ${file.uri} (${file.detail})`)
      ]
      : []),
    '',
    '## Artefactos JSON',
    '',
    '- current-object-context.json',
    '- impact-analysis.json',
    '- safe-edit-plan.json',
    '- semantic-workspace-manifest.json',
    '- server-stats.json',
    '- editor-diagnostics.json',
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function sanitizeRelativePath(value: string): string {
  return value
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/\.\.(?:\/|$)/g, 'parent/');
}

function basenameFromUri(uri: string): string {
  const normalized = uri.split(/[?#]/, 1)[0].replace(/\\/g, '/');
  const segments = normalized.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? 'document';
}

function ensureNonEmptyPosixPath(value: string): string {
  const normalized = value.replace(/\\/g, '/');
  return normalized.length > 0 ? normalized : '.';
}