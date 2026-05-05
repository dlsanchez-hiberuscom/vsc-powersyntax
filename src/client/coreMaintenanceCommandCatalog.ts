export type CoreMaintenanceCommandKind = 'read-only' | 'confirmable';

export interface CoreMaintenanceCommandModel {
  backlogLabel:
    | 'clear semantic cache'
    | 'export health report'
    | 'export support bundle'
    | 'run runtime self-test'
    | 'show memory budgets'
    | 'show indexing state'
    | 'show project routing'
    | 'show sourceOrigin conflicts'
    | 'rebuild workspace index'
    | 'validate persistent cache';
  command: string;
  title: string;
  kind: CoreMaintenanceCommandKind;
  summary: string;
}

function legacyCommandAlias(command: string): string | undefined {
  return command.startsWith('powerbuilder.')
    ? `vscPowerSyntax.${command.slice('powerbuilder.'.length)}`
    : undefined;
}

const CORE_MAINTENANCE_COMMAND_MODELS: readonly CoreMaintenanceCommandModel[] = [
  {
    backlogLabel: 'clear semantic cache',
    command: 'powerbuilder.clearSemanticCache',
    title: 'PowerSyntax: Limpiar Cache Semántica',
    kind: 'confirmable',
    summary: 'Elimina checkpoint y journal persistidos del workspace activo.'
  },
  {
    backlogLabel: 'export health report',
    command: 'powerbuilder.exportHealthReport',
    title: 'PowerSyntax: Exportar Health Report',
    kind: 'read-only',
    summary: 'Exporta un reporte offline con dashboard, stats y manifest del workspace.'
  },
  {
    backlogLabel: 'export support bundle',
    command: 'powerbuilder.exportSupportBundle',
    title: 'PowerSyntax: Exportar Support Bundle Offline',
    kind: 'read-only',
    summary: 'Empaqueta observabilidad saneada para soporte y troubleshooting offline.'
  },
  {
    backlogLabel: 'run runtime self-test',
    command: 'powerbuilder.runRuntimeSelfTest',
    title: 'PowerSyntax: Ejecutar Runtime Self-Test',
    kind: 'read-only',
    summary: 'Ejecuta un chequeo rápido sobre API, LSP, cache, project model, diagnósticos, build y ORCA.'
  },
  {
    backlogLabel: 'show memory budgets',
    command: 'powerbuilder.showMemoryBudgets',
    title: 'PowerSyntax: Mostrar Memory Budgets',
    kind: 'read-only',
    summary: 'Resume el presupuesto global de memoria y las capas del runtime.'
  },
  {
    backlogLabel: 'show indexing state',
    command: 'powerbuilder.showIndexingState',
    title: 'PowerSyntax: Mostrar Estado de Indexación',
    kind: 'read-only',
    summary: 'Muestra readiness, indexer y scheduler del runtime.'
  },
  {
    backlogLabel: 'show project routing',
    command: 'powerbuilder.showProjectRouting',
    title: 'PowerSyntax: Mostrar Project Routing',
    kind: 'read-only',
    summary: 'Expone el enrutado del archivo activo y la topología de proyectos detectada.'
  },
  {
    backlogLabel: 'show sourceOrigin conflicts',
    command: 'powerbuilder.showSourceOriginConflicts',
    title: 'PowerSyntax: Mostrar Conflictos de sourceOrigin',
    kind: 'read-only',
    summary: 'Resume conflictos cross-project donde compiten varios sourceOrigin.'
  },
  {
    backlogLabel: 'rebuild workspace index',
    command: 'powerbuilder.rebuildWorkspaceIndex',
    title: 'PowerSyntax: Rebuild Workspace Index',
    kind: 'confirmable',
    summary: 'Reinicia el runtime para relanzar discovery e indexación del workspace.'
  },
  {
    backlogLabel: 'validate persistent cache',
    command: 'powerbuilder.validatePersistentCache',
    title: 'PowerSyntax: Validar Cache Persistente',
    kind: 'read-only',
    summary: 'Comprueba si el checkpoint persistido actual puede reutilizarse sin rebuild.'
  }
];

const coreMaintenanceCommandIndex = new Map(
  CORE_MAINTENANCE_COMMAND_MODELS.flatMap((model) => {
    const alias = legacyCommandAlias(model.command);
    return alias
      ? [[model.command, model] as const, [alias, model] as const]
      : [[model.command, model] as const];
  })
);

export function getCoreMaintenanceCommandModels(): readonly CoreMaintenanceCommandModel[] {
  return CORE_MAINTENANCE_COMMAND_MODELS;
}

export function findCoreMaintenanceCommandModel(command: string): CoreMaintenanceCommandModel | undefined {
  return coreMaintenanceCommandIndex.get(command);
}