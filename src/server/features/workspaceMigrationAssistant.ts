import {
  type ApiWorkspaceMigrationAssistant,
  type ApiWorkspaceMigrationAssistantRequest,
  type ApiWorkspaceMigrationRecommendation,
} from '../../shared/publicApi';
import type { WorkspaceMode, WorkspaceState } from '../workspace/workspaceState';

type WorkspaceMigrationTargetMode = NonNullable<ApiWorkspaceMigrationAssistant['targetMode']>;
type WorkspaceMigrationPriority = ApiWorkspaceMigrationRecommendation['priority'];
type WorkspaceMigrationCategory = ApiWorkspaceMigrationRecommendation['category'];

const DEFAULT_MAX_RECOMMENDATIONS = 8;

function clamp(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.trunc(value));
}

function compareRecommendationPriority(
  left: ApiWorkspaceMigrationRecommendation,
  right: ApiWorkspaceMigrationRecommendation,
): number {
  const priorityOrder = (priority: WorkspaceMigrationPriority): number => {
    switch (priority) {
      case 'high':
        return 0;
      case 'medium':
        return 1;
      default:
        return 2;
    }
  };

  const priorityDelta = priorityOrder(left.priority) - priorityOrder(right.priority);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const categoryDelta = left.category.localeCompare(right.category);
  if (categoryDelta !== 0) {
    return categoryDelta;
  }

  return left.title.localeCompare(right.title);
}

function dedupeRecommendations(
  recommendations: ApiWorkspaceMigrationRecommendation[],
): ApiWorkspaceMigrationRecommendation[] {
  const seen = new Set<string>();
  const unique: ApiWorkspaceMigrationRecommendation[] = [];
  for (const recommendation of recommendations) {
    if (seen.has(recommendation.id)) {
      continue;
    }
    seen.add(recommendation.id);
    unique.push(recommendation);
  }
  return unique;
}

function deriveTargetMode(
  currentMode: WorkspaceMode,
  preferredTargetMode: WorkspaceMigrationTargetMode | undefined,
): WorkspaceMigrationTargetMode | undefined {
  if (preferredTargetMode) {
    return preferredTargetMode;
  }

  switch (currentMode) {
    case 'solution':
      return 'solution';
    case 'workspace':
      return 'workspace';
    case 'mixed':
    case 'pbl-only':
      return 'solution';
    default:
      return undefined;
  }
}

function createRecommendation(
  id: string,
  priority: WorkspaceMigrationPriority,
  category: WorkspaceMigrationCategory,
  title: string,
  detail: string,
  evidence: string[],
  actions: string[],
): ApiWorkspaceMigrationRecommendation {
  return {
    id,
    priority,
    category,
    title,
    detail,
    evidence,
    actions,
  };
}

export function buildWorkspaceMigrationAssistant(
  request: ApiWorkspaceMigrationAssistantRequest | undefined,
  workspaceState: WorkspaceState,
): ApiWorkspaceMigrationAssistant {
  const currentMode = workspaceState.getMode();
  const roots = workspaceState.getRoots();
  const buildSummary = workspaceState.getBuildFileSummary();
  const buildFiles = workspaceState.getBuildFiles();
  const discoveryArtifacts = workspaceState.getDiscoveryArtifactSummary();
  const projectCount = workspaceState.getProjectModel()?.getProjects().length ?? 0;
  const hasOrcaAliases = Object.keys(workspaceState.getLibrarySourceAliases()).length > 0;
  const maxRecommendations = clamp(request?.maxRecommendations, DEFAULT_MAX_RECOMMENDATIONS);
  const targetMode = deriveTargetMode(currentMode, request?.preferredTargetMode);

  if (
    workspaceState.getAllSourceFiles().length === 0
    && roots.workspaces.length === 0
    && roots.targets.length === 0
    && roots.projects.length === 0
    && roots.solutions.length === 0
    && roots.libraries.length === 0
    && buildSummary.total === 0
  ) {
    return {
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      available: false,
      reason: 'No hay roots ni archivos fuente suficientes para construir un plan de migración.',
      currentMode,
      summary: {
        sourceFileCount: 0,
        projectCount: 0,
        buildFilesTotal: 0,
        usableBuildFiles: 0,
        hasLegacyLibraries: false,
        hasMixedMarkers: false,
        hasOrcaAliases: false,
      },
      recommendations: [],
    };
  }

  const recommendations: ApiWorkspaceMigrationRecommendation[] = [];

  if (currentMode === 'pbl-only') {
    recommendations.push(createRecommendation(
      'topology-pbl-only',
      'high',
      'topology',
      'Formalizar la topología canónica del workspace legacy',
      'El workspace está en modo pbl-only: solo hay librerías legacy `.pbl` y falta un marker canónico de workspace o solution para fijar la topología soportada.',
      [
        `legacy-libraries:${roots.libraries.length}`,
        'mode:pbl-only',
      ],
      [
        'Crear `.pbsln` y `.pbproj` canónicos para la migración objetivo, o documentar explícitamente un par `.pbw`/`.pbt` si el equipo sigue en modo workspace.',
        'Asignar las librerías `.pbl` legacy al marker elegido antes de automatizar builds o reportes adicionales.',
      ],
    ));
  }

  if (currentMode === 'mixed') {
    recommendations.push(createRecommendation(
      'topology-mixed-mode',
      'high',
      'topology',
      'Consolidar mixed mode antes de migrar',
      'El workspace convive en mixed mode y mezcla markers `workspace` y `solution`; la migración debe elegir una topología canónica antes de seguir ampliando tooling.',
      [
        `workspaces:${roots.workspaces.length}`,
        `targets:${roots.targets.length}`,
        `solutions:${roots.solutions.length}`,
        `projects:${roots.projects.length}`,
        'mixed-mode',
      ],
      [
        'Elegir `solution` como topología canónica si ya existen `.pbsln/.pbproj` útiles y retirar el routing paralelo de `.pbw/.pbt` cuando deje de ser necesario.',
        'Mantener una sola cadena de markers activa por proyecto para que project routing, build files y surfaces read-only no dependan de ambigüedad topológica.',
      ],
    ));
  }

  if (buildSummary.total === 0) {
    recommendations.push(createRecommendation(
      'build-missing',
      currentMode === 'pbl-only' ? 'medium' : 'high',
      'build',
      'Añadir al menos un build file usable',
      'No existe ningún build file JSON descubierto; la migración seguirá siendo manual hasta que haya una referencia reproducible para el proyecto o solution canónica.',
      [
        'build-files:0',
        `target-mode:${targetMode ?? 'undefined'}`,
      ],
      [
        'Generar un JSON de PBAutoBuild que apunte al marker canónico elegido (`.pbt` o `.pbproj`).',
        'Validar el build file dentro del workspace antes de usarlo como baseline de migración.',
      ],
    ));
  }

  if (buildSummary.ambiguous > 0) {
    const ambiguousFiles = buildFiles.filter((buildFile) => buildFile.status === 'ambiguous').map((buildFile) => buildFile.uri);
    recommendations.push(createRecommendation(
      'build-ambiguous',
      'high',
      'build',
      'Resolver build files ambiguos',
      'Hay build files ambiguos que referencian varios markers utilizables; la migración debe decidir un único proyecto representado por cada JSON antes de automatizar el layout objetivo.',
      [
        `ambiguous-build-files:${buildSummary.ambiguous}`,
        ...ambiguousFiles,
      ],
      [
        'Reducir cada JSON a un único marker canónico (`.pbt` o `.pbproj`) y retirar referencias cruzadas sobrantes.',
        'Volver a validar el estado `usable` del build file después de consolidar la topología.',
      ],
    ));
  }

  if (buildSummary.invalid > 0) {
    const invalidFiles = buildFiles.filter((buildFile) => buildFile.status === 'invalid').map((buildFile) => buildFile.uri);
    recommendations.push(createRecommendation(
      'build-invalid',
      'medium',
      'build',
      'Limpiar build files inválidos',
      'El workspace conserva build files inválidos o incompletos; conviene sanearlos para que la migración no mezcle topología antigua con automatización rota.',
      [
        `invalid-build-files:${buildSummary.invalid}`,
        ...invalidFiles,
      ],
      [
        'Corregir `BuildPlan` y referencias a markers canónicos o retirar los JSON obsoletos del workspace.',
      ],
    ));
  }

  const scmGitDirs = discoveryArtifacts['scm-git-dir']?.count ?? 0;
  const scmSvnDirs = discoveryArtifacts['scm-svn-dir']?.count ?? 0;
  const gitIgnoreFiles = discoveryArtifacts['scm-gitignore-file']?.count ?? 0;
  const gitAttributesFiles = discoveryArtifacts['scm-gitattributes-file']?.count ?? 0;
  const sccFiles = discoveryArtifacts['scm-scc-file']?.count ?? 0;
  if (scmGitDirs > 0 || scmSvnDirs > 0 || gitIgnoreFiles > 0 || gitAttributesFiles > 0 || sccFiles > 0) {
    const samples = [
      ...(discoveryArtifacts['scm-gitignore-file']?.samples ?? []),
      ...(discoveryArtifacts['scm-gitattributes-file']?.samples ?? []),
      ...(discoveryArtifacts['scm-scc-file']?.samples ?? []),
    ].slice(0, 3);
    recommendations.push(createRecommendation(
      'source-control-artifacts',
      'medium',
      'legacy',
      'Tratar los artefactos SCM como governance, no como input semántico',
      'Discovery ya detectó metadata o policy files de source control (`.git`, `.svn`, `.gitignore`, `.gitattributes`, `.scc`). Deben servir para hygiene/versionado, no para inferir topología ni alimentar build/reportes semánticos.',
      [
        `scm-git-dirs:${scmGitDirs}`,
        `scm-svn-dirs:${scmSvnDirs}`,
        `scm-gitignore-files:${gitIgnoreFiles}`,
        `scm-gitattributes-files:${gitAttributesFiles}`,
        `scm-scc-files:${sccFiles}`,
        ...samples,
      ],
      [
        'Mantener `.git` y `.svn` fuera del carril de discovery/indexación y no tratarlos como fuentes del proyecto.',
        'Versionar `.gitignore`/`.gitattributes` solo como policy del repo y revisar los `.scc` legacy antes de migrar o limpiar el workspace.',
      ],
    ));
  }

  const pbArtifactDirs = discoveryArtifacts['artifact-pb-dir']?.count ?? 0;
  const buildArtifactDirs = discoveryArtifacts['artifact-build-dir']?.count ?? 0;
  const backupArtifactDirs = discoveryArtifacts['artifact-backup-dir']?.count ?? 0;
  if (pbArtifactDirs > 0 || buildArtifactDirs > 0 || backupArtifactDirs > 0) {
    recommendations.push(createRecommendation(
      'local-artifact-noise',
      'medium',
      'build',
      'Excluir outputs locales y respaldos del razonamiento de migración',
      'Discovery ignoró carpetas locales `.pb`, `build` o `_backupfiles`; son outputs/respaldo y no deben competir con markers, build files JSON ni source real al evaluar el workspace.',
      [
        `artifact-pb-dirs:${pbArtifactDirs}`,
        `artifact-build-dirs:${buildArtifactDirs}`,
        `artifact-backup-dirs:${backupArtifactDirs}`,
      ],
      [
        'Mantener esas carpetas fuera del versionado y no usarlas como evidencia para topology, build o migration assistant.',
        'Tomar solo `.pbw/.pbt/.pbsln/.pbproj`, build files JSON y source real como inputs canónicos del análisis.',
        'Inspeccionar manualmente el ruido local con `Get-ChildItem -Force -Directory . | Where-Object Name -in @(".pb", "build", "_backupfiles")` antes de archivarlo o retirarlo.',
      ],
    ));
  }

  if (hasOrcaAliases) {
    recommendations.push(createRecommendation(
      'legacy-orca-aliases',
      'medium',
      'legacy',
      'Tratar ORCA staging solo como soporte temporal de migración',
      'El workspace mantiene aliases de librería hacia source exportado por ORCA; la migración debe consolidarse sobre source real y no dejar el staging como layout canónico.',
      [
        `orca-aliases:${Object.keys(workspaceState.getLibrarySourceAliases()).length}`,
        'source-origin-priority',
      ],
      [
        'Aplicar cambios definitivos sobre source real o importarlos de vuelta antes de limpiar el staging.',
        'No usar `orca-staging` como única referencia para cerrar la migración de layout.',
        'Inspeccionar el staging legacy con `Get-ChildItem -Force -Directory . | Where-Object Name -match "orca|staging"` y retirarlo manualmente solo cuando el source real ya sea la referencia canónica.',
      ],
    ));
  }

  if (projectCount === 0 && currentMode !== 'unknown') {
    recommendations.push(createRecommendation(
      'legacy-no-project-model',
      'medium',
      'legacy',
      'Conseguir un project model estable antes de automatizar la migración',
      'El workspace expone roots, pero todavía no materializa proyectos en el model compartido; conviene estabilizar esa topología antes de automatizar siguientes pasos.',
      [
        `mode:${currentMode}`,
        'project-model:0',
      ],
      [
        'Verificar que los markers descubiertos referencian librerías reales y que el routing ya puede materializar proyectos consistentes.',
      ],
    ));
  }

  const normalizedRecommendations = dedupeRecommendations(recommendations)
    .sort(compareRecommendationPriority)
    .slice(0, maxRecommendations);

  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    available: true,
    currentMode,
    ...(targetMode ? { targetMode } : {}),
    summary: {
      sourceFileCount: workspaceState.getAllSourceFiles().length,
      projectCount,
      buildFilesTotal: buildSummary.total,
      usableBuildFiles: buildSummary.usable,
      hasLegacyLibraries: roots.libraries.length > 0,
      hasMixedMarkers: currentMode === 'mixed',
      hasOrcaAliases,
    },
    recommendations: normalizedRecommendations,
  };
}
