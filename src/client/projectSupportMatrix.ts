import type { ApiSemanticWorkspaceManifest } from '../shared/publicApi';
import type { SourceOrigin } from '../shared/sourceOrigin';
import type { RuntimeStatusStats } from './statusBarPresentation';

export type ProjectSupportMatrixEntryKey =
  | 'workspace'
  | 'solution'
  | 'target-pbt'
  | 'pbl-only-legacy'
  | 'source-plain-text'
  | 'orca-staging'
  | 'datawindow-srd'
  | 'pbautobuild'
  | 'powerserver-powerclient-build-files';

export type ProjectSupportLevel = 'supported' | 'read-only' | 'conditional';
export type ProjectSupportStatus = 'active' | 'present' | 'available' | 'unavailable';

export interface ProjectSupportMatrixEntry {
  key: ProjectSupportMatrixEntryKey;
  label: string;
  supportLevel: ProjectSupportLevel;
  status: ProjectSupportStatus;
  detail: string;
  limitations: string;
}

export interface ProjectSupportMatrix {
  schemaVersion: '1.0.0';
  currentMode?: string;
  items: readonly ProjectSupportMatrixEntry[];
}

function hasSourceOrigin(
  sourceOriginSummary: Partial<Record<SourceOrigin, number>> | undefined,
  sourceOrigin: SourceOrigin,
): boolean {
  return (sourceOriginSummary?.[sourceOrigin] ?? 0) > 0;
}

function describeBuildFiles(stats?: RuntimeStatusStats): string {
  const buildFiles = stats?.buildFiles;
  if (!buildFiles) {
    return 'sin inventario de build files publicado';
  }

  const fragments = [
    typeof buildFiles.total === 'number' ? `${buildFiles.total} total` : undefined,
    typeof buildFiles.usable === 'number' ? `${buildFiles.usable} utilizables` : undefined,
    typeof buildFiles.invalid === 'number' ? `${buildFiles.invalid} inválidos` : undefined,
    typeof buildFiles.ambiguous === 'number' ? `${buildFiles.ambiguous} ambiguos` : undefined,
  ].filter((fragment): fragment is string => Boolean(fragment));

  return fragments.length > 0
    ? fragments.join(' · ')
    : 'inventario vacío';
}

function createEntry(
  key: ProjectSupportMatrixEntryKey,
  label: string,
  supportLevel: ProjectSupportLevel,
  status: ProjectSupportStatus,
  detail: string,
  limitations: string,
): ProjectSupportMatrixEntry {
  return {
    key,
    label,
    supportLevel,
    status,
    detail,
    limitations,
  };
}

export function buildProjectSupportMatrix(
  stats?: RuntimeStatusStats,
  manifest?: ApiSemanticWorkspaceManifest,
): ProjectSupportMatrix {
  const currentMode = stats?.workspace?.mode;
  const sourceOriginSummary = manifest?.sourceOriginSummary ?? stats?.workspace?.sourceOrigins;
  const targetCount = manifest?.projects.filter((project) => project.kind === 'target').length ?? 0;
  const dataWindowCount = manifest?.objects.filter(
    (object) => object.objectKind === 'datawindow' || object.uri.toLowerCase().endsWith('.srd'),
  ).length ?? 0;
  const buildToolingStatus = stats?.buildTooling?.status;

  const items: ProjectSupportMatrixEntry[] = [
    createEntry(
      'workspace',
      'PowerBuilder 2025 Workspace',
      'supported',
      currentMode === 'workspace' || currentMode === 'mixed' ? 'active' : 'available',
      currentMode === 'workspace' || currentMode === 'mixed'
        ? `modo actual: ${currentMode}`
        : 'discovery e indexación sobre roots .pbw/.pbt',
      'la topología depende de markers coherentes; el archivo activo sigue teniendo prioridad sobre el background',
    ),
    createEntry(
      'solution',
      'PowerBuilder 2025 Solution',
      'supported',
      currentMode === 'solution' || currentMode === 'mixed' ? 'active' : 'available',
      currentMode === 'solution' || currentMode === 'mixed'
        ? `modo actual: ${currentMode}`
        : 'routing y serving sobre .pbsln/.pbproj cuando existen',
      'las claims de soporte siguen sujetas al routing real del workspace abierto',
    ),
    createEntry(
      'target-pbt',
      'Target .pbt',
      'supported',
      targetCount > 0 ? 'present' : 'available',
      targetCount > 0 ? `${targetCount} target(s) publicados en el manifest` : 'detectable como proyecto kind target',
      'depende del project model ya descubierto; no abre un rail de edición o build implícito',
    ),
    createEntry(
      'pbl-only-legacy',
      'PBL-only legacy',
      'read-only',
      currentMode === 'pbl-only' ? 'active' : 'available',
      currentMode === 'pbl-only'
        ? 'workspace actual en modo pbl-only'
        : 'graph legacy read-only disponible cuando sólo hay roots .pbl',
      'no materializa escritura binaria ni trata la PBL como fuente editable en el hot path',
    ),
    createEntry(
      'source-plain-text',
      'Source plain-text / exportado',
      'read-only',
      hasSourceOrigin(sourceOriginSummary, 'manual-export-source') || hasSourceOrigin(sourceOriginSummary, 'pbl-dump-source')
        ? 'present'
        : 'available',
      hasSourceOrigin(sourceOriginSummary, 'manual-export-source') || hasSourceOrigin(sourceOriginSummary, 'pbl-dump-source')
        ? `source origins: ${[
            hasSourceOrigin(sourceOriginSummary, 'manual-export-source') ? 'manual-export-source' : undefined,
            hasSourceOrigin(sourceOriginSummary, 'pbl-dump-source') ? 'pbl-dump-source' : undefined,
          ].filter((part): part is string => Boolean(part)).join(' · ')}`
        : 'soportado como corpus/export read-only',
      'la topología puede ser parcial y debe degradar con honestidad cuando faltan markers canónicos',
    ),
    createEntry(
      'orca-staging',
      'Staging ORCA',
      'read-only',
      hasSourceOrigin(sourceOriginSummary, 'orca-staging') ? 'present' : 'available',
      hasSourceOrigin(sourceOriginSummary, 'orca-staging')
        ? 'objetos staging presentes en el manifest/source origins'
        : 'export controlado disponible cuando el rail ORCA está configurado',
      'subordinado al source real; no se declara fuente canónica ni sustituye el carril moderno',
    ),
    createEntry(
      'datawindow-srd',
      'DataWindow .srd',
      'read-only',
      dataWindowCount > 0 ? 'present' : 'available',
      dataWindowCount > 0 ? `${dataWindowCount} DataWindow(s) publicados en el manifest` : 'safe mode y lineage disponibles cuando hay .srd resolubles',
      'el soporte sigue acotado a safe mode, lineage y property paths defendibles; no parsea DataWindow como PowerScript general',
    ),
    createEntry(
      'pbautobuild',
      'PBAutoBuild',
      'conditional',
      buildToolingStatus === 'available' ? 'available' : 'unavailable',
      buildToolingStatus === 'available'
        ? `${stats?.buildTooling?.detail ?? 'tooling disponible'} · ${describeBuildFiles(stats)}`
        : stats?.buildTooling?.detail ?? 'tooling no detectado en este entorno',
      'requiere ejecutable y build file JSON utilizable; el runner permanece fuera del hot path interactivo',
    ),
    createEntry(
      'powerserver-powerclient-build-files',
      'Build files PowerServer/PowerClient',
      'read-only',
      'available',
      `discovery/validación sobre el mismo carril JSON de PBAutoBuild · ${describeBuildFiles(stats)}`,
      'se reconocen y validan en modo read-only cuando están presentes; no abren deploy ni ejecución específica desde esta matriz',
    ),
  ];

  return {
    schemaVersion: '1.0.0',
    ...(currentMode ? { currentMode } : {}),
    items,
  };
}