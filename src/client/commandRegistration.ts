import * as path from 'path';
import * as vscode from 'vscode';

import { type ProgressNotification } from '../shared/types';
import {
  buildStatusHealthReport,
  buildStatusStatsReport,
  formatPbAutoBuildRunInline,
  type RuntimeStatusStats,
} from './statusBarPresentation';
import { formatOrcaStatusInline } from './build/orcaDetection';
import { formatPbAutoBuildStatusInline } from './build/pbAutoBuildDetection';

type LocationTarget = {
  uri?: string;
  line?: number;
  character?: number;
};

type ObjectExplorerTarget = { uri?: string } | string;

type StatusMenuAction = vscode.QuickPickItem & {
  command: string;
};

interface ClientCommandRegistration {
  id: string;
  handler: (...args: any[]) => unknown;
}

export interface ClientCommandRegistrationDependencies {
  restartServer(): unknown;
  inspectHierarchy(): unknown;
  refreshCurrentObjectContextPanel(): unknown;
  focusCurrentObjectContextPanel(): unknown;
  openCurrentObjectContextLocation(target?: LocationTarget): unknown;
  refreshDiagnosticsExplainabilityPanel(): unknown;
  focusDiagnosticsExplainabilityPanel(): unknown;
  openDiagnosticsExplainabilityLocation(target?: LocationTarget): unknown;
  refreshObjectExplorer(): unknown;
  focusObjectExplorerOnCurrentProject(): unknown;
  focusObjectExplorerOnCurrentFile(): unknown;
  clearObjectExplorerFocus(): unknown;
  openObjectExplorerObject(target?: ObjectExplorerTarget): unknown;
  openProjectHealthDashboard(): unknown;
  openWorkspaceCheck(): unknown;
  runWorkspaceCheck(request?: unknown): unknown;
  openCurrentObjectCheck(): unknown;
  openObjectCheck(): unknown;
  runObjectCheck(request?: unknown): unknown;
  openCrossProjectSymbolConflicts(): unknown;
  openWorkspaceMigrationAssistant(): unknown;
  openBuildProfileMatrix(): unknown;
  openDependencyGraph(): unknown;
  openCodeMetrics(): unknown;
  openTechnicalDebtReport(): unknown;
  openDataWindowSqlLineage(): unknown;
  runPbAutoBuild(): unknown;
  runLastPbAutoBuild(): unknown;
  runPbAutoBuildWithPicker(): unknown;
  cancelPbAutoBuild(): unknown;
  exportPbAutoBuildCiHelper(): unknown;
  runActiveOrcaScript(): unknown;
  cancelOrcaScript(): unknown;
  exportOrcaStaging(): unknown;
  importOrcaStaging(): unknown;
  regenerateOrcaLibraries(): unknown;
  rebuildOrcaProject(): unknown;
  exportSemanticReproPack(options?: unknown): unknown;
  exportSupportBundle(options?: unknown): unknown;
  exportHealthReport(options?: unknown): unknown;
  runRuntimeSelfTest(): unknown;
  showMemoryBudgets(): unknown;
  showIndexingState(): unknown;
  showProjectRouting(): unknown;
  showSourceOriginConflicts(): unknown;
  validatePersistentCache(): unknown;
  clearSemanticCache(options?: unknown): unknown;
  rebuildWorkspaceIndex(options?: unknown): unknown;
  runSemanticCacheMaintenance(): unknown;
  showSettingsGovernance(): unknown;
  applySettingsProfile(): unknown;
  fetchRuntimeStatusStats(): Promise<RuntimeStatusStats | undefined>;
  updateStatusSnapshot(stats: RuntimeStatusStats | undefined): void;
  getLastProgressNotification(): ProgressNotification;
  getOutputChannel(): vscode.OutputChannel | undefined;
}

export function registerClientCommands(
  context: vscode.ExtensionContext,
  dependencies: ClientCommandRegistrationDependencies,
): void {
  pushRegistrations(context, buildCoreCommands(dependencies));
  pushRegistrations(context, buildPanelCommands(dependencies));
  pushRegistrations(context, buildReportCommands(dependencies));
  pushRegistrations(context, buildStatusCommands(dependencies));
  pushRegistrations(context, buildBuildAndOrcaCommands(dependencies));
  pushRegistrations(context, buildSupportAndMaintenanceCommands(dependencies));
}

function pushRegistrations(
  context: vscode.ExtensionContext,
  registrations: readonly ClientCommandRegistration[],
): void {
  context.subscriptions.push(
    ...registrations.map(({ id, handler }) => vscode.commands.registerCommand(id, handler)),
  );
}

function buildCoreCommands(
  dependencies: ClientCommandRegistrationDependencies,
): readonly ClientCommandRegistration[] {
  return [
    {
      id: 'vscPowerSyntax.restartServer',
      handler: () => dependencies.restartServer(),
    },
    {
      id: 'vscPowerSyntax.inspectHierarchy',
      handler: () => dependencies.inspectHierarchy(),
    },
  ];
}

function buildPanelCommands(
  dependencies: ClientCommandRegistrationDependencies,
): readonly ClientCommandRegistration[] {
  return [
    {
      id: 'vscPowerSyntax.refreshCurrentObjectContextPanel',
      handler: () => dependencies.refreshCurrentObjectContextPanel(),
    },
    {
      id: 'vscPowerSyntax.focusCurrentObjectContextPanel',
      handler: () => dependencies.focusCurrentObjectContextPanel(),
    },
    {
      id: 'vscPowerSyntax.openCurrentObjectContextLocation',
      handler: (target?: LocationTarget) => dependencies.openCurrentObjectContextLocation(target),
    },
    {
      id: 'vscPowerSyntax.refreshDiagnosticsExplainabilityPanel',
      handler: () => dependencies.refreshDiagnosticsExplainabilityPanel(),
    },
    {
      id: 'vscPowerSyntax.focusDiagnosticsExplainabilityPanel',
      handler: () => dependencies.focusDiagnosticsExplainabilityPanel(),
    },
    {
      id: 'vscPowerSyntax.openDiagnosticsExplainabilityLocation',
      handler: (target?: LocationTarget) => dependencies.openDiagnosticsExplainabilityLocation(target),
    },
    {
      id: 'vscPowerSyntax.refreshObjectExplorer',
      handler: () => dependencies.refreshObjectExplorer(),
    },
    {
      id: 'vscPowerSyntax.focusObjectExplorerOnCurrentProject',
      handler: () => dependencies.focusObjectExplorerOnCurrentProject(),
    },
    {
      id: 'vscPowerSyntax.focusObjectExplorerOnCurrentFile',
      handler: () => dependencies.focusObjectExplorerOnCurrentFile(),
    },
    {
      id: 'vscPowerSyntax.clearObjectExplorerFocus',
      handler: () => dependencies.clearObjectExplorerFocus(),
    },
    {
      id: 'vscPowerSyntax.openObjectExplorerObject',
      handler: (target?: ObjectExplorerTarget) => dependencies.openObjectExplorerObject(target),
    },
  ];
}

function buildReportCommands(
  dependencies: ClientCommandRegistrationDependencies,
): readonly ClientCommandRegistration[] {
  return [
    {
      id: 'powerbuilder.checkWorkspace',
      handler: (request?: unknown) => dependencies.runWorkspaceCheck(request),
    },
    {
      id: 'powerbuilder.checkCurrentObject',
      handler: (request?: unknown) => dependencies.runObjectCheck(request),
    },
    {
      id: 'powerbuilder.checkObject',
      handler: (request?: unknown) => dependencies.runObjectCheck(request),
    },
    {
      id: 'vscPowerSyntax.openWorkspaceCheck',
      handler: () => dependencies.openWorkspaceCheck(),
    },
    {
      id: 'vscPowerSyntax.openCurrentObjectCheck',
      handler: () => dependencies.openCurrentObjectCheck(),
    },
    {
      id: 'vscPowerSyntax.openObjectCheck',
      handler: () => dependencies.openObjectCheck(),
    },
    {
      id: 'vscPowerSyntax.openProjectHealthDashboard',
      handler: () => dependencies.openProjectHealthDashboard(),
    },
    {
      id: 'vscPowerSyntax.openCrossProjectSymbolConflicts',
      handler: () => dependencies.openCrossProjectSymbolConflicts(),
    },
    {
      id: 'vscPowerSyntax.openWorkspaceMigrationAssistant',
      handler: () => dependencies.openWorkspaceMigrationAssistant(),
    },
    {
      id: 'vscPowerSyntax.openBuildProfileMatrix',
      handler: () => dependencies.openBuildProfileMatrix(),
    },
    {
      id: 'vscPowerSyntax.openDependencyGraph',
      handler: () => dependencies.openDependencyGraph(),
    },
    {
      id: 'vscPowerSyntax.openCodeMetrics',
      handler: () => dependencies.openCodeMetrics(),
    },
    {
      id: 'vscPowerSyntax.openTechnicalDebtReport',
      handler: () => dependencies.openTechnicalDebtReport(),
    },
    {
      id: 'vscPowerSyntax.openDataWindowSqlLineage',
      handler: () => dependencies.openDataWindowSqlLineage(),
    },
  ];
}

function buildStatusCommands(
  dependencies: ClientCommandRegistrationDependencies,
): readonly ClientCommandRegistration[] {
  return [
    {
      id: 'vscPowerSyntax.showStatusStats',
      handler: async () => {
        const stats = await dependencies.fetchRuntimeStatusStats();
        dependencies.updateStatusSnapshot(stats);
        const outputChannel = dependencies.getOutputChannel();
        outputChannel?.show(true);
        outputChannel?.appendLine(buildStatusStatsReport(stats));
      },
    },
    {
      id: 'vscPowerSyntax.showStatusHealth',
      handler: async () => {
        const stats = await dependencies.fetchRuntimeStatusStats();
        dependencies.updateStatusSnapshot(stats);
        const report = buildStatusHealthReport(dependencies.getLastProgressNotification(), stats);
        const outputChannel = dependencies.getOutputChannel();
        outputChannel?.show(true);
        outputChannel?.appendLine(report);
        void vscode.window
          .showInformationMessage('PowerSyntax: resumen de salud escrito en el canal de salida.', 'Abrir salida')
          .then((selection) => {
            if (selection === 'Abrir salida') {
              outputChannel?.show(true);
            }
          });
      },
    },
    {
      id: 'vscPowerSyntax.openStatusMenu',
      handler: async () => {
        const stats = await dependencies.fetchRuntimeStatusStats();
        dependencies.updateStatusSnapshot(stats);

        const selection = await vscode.window.showQuickPick<StatusMenuAction>([
          {
            label: '$(dashboard) Abrir dashboard de salud',
            description: stats?.health?.summary ?? 'Vista read-only sobre salud, manifest y build del workspace',
            command: 'vscPowerSyntax.openProjectHealthDashboard',
          },
          {
            label: '$(graph) Abrir grafo de dependencias',
            description: vscode.window.activeTextEditor?.document
              ? `${path.basename(vscode.window.activeTextEditor.document.uri.fsPath || vscode.window.activeTextEditor.document.uri.path)} · Mermaid read-only del objeto activo`
              : 'Visualiza el vecindario inmediato de dependencias del objeto o archivo activo',
            command: 'vscPowerSyntax.openDependencyGraph',
          },
          {
            label: '$(pulse) Abrir métricas de código',
            description: 'Reporte read-only con complejidad aproximada, SQL, DataWindow, dependencias externas y footprint build/ORCA',
            command: 'vscPowerSyntax.openCodeMetrics',
          },
          {
            label: '$(search) Abrir deuda técnica y modernización',
            description: 'Hotspots priorizados y recomendaciones read-only sobre legacy, SQL dinámico, sourceOrigin y riesgos ORCA/PBL',
            command: 'vscPowerSyntax.openTechnicalDebtReport',
          },
          {
            label: '$(pulse) Ver salud del runtime',
            description: stats?.readiness?.state ?? 'sin datos',
            command: 'vscPowerSyntax.showStatusHealth',
          },
          {
            label: '$(graph) Ver stats del servidor',
            description: stats?.projectStatus?.summary ?? 'resumen del estado actual',
            command: 'vscPowerSyntax.showStatusStats',
          },
          {
            label: '$(note) Exportar health report',
            description: stats?.health?.summary ?? 'Exporta dashboard, stats y manifest del workspace activo',
            command: 'vscPowerSyntax.exportHealthReport',
          },
          {
            label: '$(checklist) Ejecutar runtime self-test',
            description: 'Chequeo rápido de API, LSP, cache, project model, diagnósticos, build y ORCA',
            command: 'vscPowerSyntax.runRuntimeSelfTest',
          },
          {
            label: '$(flame) Ver memory budgets',
            description: stats?.memory
              ? `${stats.memory.status} · ${(stats.memory.layers?.length ?? 0)} capas con budget visible`
              : 'Presupuesto global y capas de memoria del runtime',
            command: 'vscPowerSyntax.showMemoryBudgets',
          },
          {
            label: '$(sync) Ver estado de indexación',
            description: stats?.indexer?.phase
              ? `${stats.indexer.phase}${typeof stats.indexer.current === 'number' && typeof stats.indexer.total === 'number' ? ` · ${stats.indexer.current}/${stats.indexer.total}` : ''}`
              : stats?.readiness?.state ?? 'Readiness e indexer del runtime',
            command: 'vscPowerSyntax.showIndexingState',
          },
          {
            label: '$(source-control) Ver project routing',
            description: stats?.workspace?.activeProject?.name
              ? `${stats.workspace.activeProject.name} · routing del archivo y topología activa`
              : 'Routing del archivo activo y resumen de proyectos detectados',
            command: 'vscPowerSyntax.showProjectRouting',
          },
          {
            label: '$(warning) Ver conflictos de sourceOrigin',
            description: 'Conflictos cross-project donde compiten varios sourceOrigin preferidos',
            command: 'vscPowerSyntax.showSourceOriginConflicts',
          },
          {
            label: stats?.buildRunner?.state === 'running' ? '$(debug-stop) Cancelar PBAutoBuild' : '$(tools) Ejecutar PBAutoBuild',
            description: [
              stats?.buildProfile?.label,
              stats?.buildHealth?.summary,
              formatPbAutoBuildStatusInline(stats?.buildTooling),
              formatPbAutoBuildRunInline(stats?.buildRunner),
            ].filter((part): part is string => Boolean(part)).join(' · ') || 'Usa el build file utilizable del proyecto activo',
            command: stats?.buildRunner?.state === 'running'
              ? 'vscPowerSyntax.cancelPbAutoBuild'
              : 'vscPowerSyntax.runPbAutoBuild',
          },
          {
            label: '$(history) Repetir último build frecuente',
            description: stats?.buildProfile?.label ?? 'Usa el último build file ejecutado o te deja elegir uno utilizable',
            command: 'vscPowerSyntax.runLastPbAutoBuild',
          },
          {
            label: '$(list-selection) Elegir build file y ejecutar',
            description: 'Muestra los build files PBAutoBuild utilizables y recuerda el elegido como último build',
            command: 'vscPowerSyntax.runPbAutoBuildWithPicker',
          },
          {
            label: '$(export) Exportar helper CI/CD',
            description: stats?.buildProfile?.label
              ? `${stats.buildProfile.label} · bundle neutral en tools/pbautobuild-ci`
              : 'Genera scripts versionables para CI/CD desde un build file PBAutoBuild utilizable',
            command: 'vscPowerSyntax.exportPbAutoBuildCiHelper',
          },
          {
            label: '$(package) Exportar repro pack semántico',
            description: vscode.window.activeTextEditor?.document
              ? `${path.basename(vscode.window.activeTextEditor.document.uri.fsPath || vscode.window.activeTextEditor.document.uri.path)} · bundle en tools/semantic-repros`
              : 'Captura contexto, impacto, plan seguro y archivos relacionados del editor activo',
            command: 'vscPowerSyntax.exportSemanticReproPack',
          },
          {
            label: '$(archive) Exportar support bundle offline',
            description: 'Exporta estado saneado del runtime, diagnostics, caches, build/ORCA y contrato API sin código bruto por defecto',
            command: 'vscPowerSyntax.exportSupportBundle',
          },
          {
            label: '$(database) Ejecutar mantenimiento de cache semántica',
            description: stats?.persistence?.maintenance?.maintenanceRecommended
              ? 'Compacta journals grandes y limpia workspaces persistidos obsoletos'
              : 'Verifica compactación/retención v2 y limpia workspaces obsoletos si hace falta',
            command: 'vscPowerSyntax.runSemanticCacheMaintenance',
          },
          {
            label: '$(verified) Validar cache persistente',
            description: stats?.persistence?.checkpointUri
              ? 'Comprueba si el checkpoint persistido actual puede reutilizarse sin rebuild'
              : 'Verifica si existe un estado persistido reutilizable para este workspace',
            command: 'vscPowerSyntax.validatePersistentCache',
          },
          {
            label: '$(trash) Limpiar cache semántica',
            description: 'Elimina checkpoint y journal persistidos del workspace activo (requiere confirmación)',
            command: 'vscPowerSyntax.clearSemanticCache',
          },
          {
            label: '$(debug-restart) Rebuild workspace index',
            description: 'Reinicia el runtime y relanza discovery/indexación del workspace (requiere confirmación)',
            command: 'vscPowerSyntax.rebuildWorkspaceIndex',
          },
          {
            label: '$(settings-gear) Ver gobernanza de settings',
            description: 'Resume el perfil activo y las divergencias de configuración respecto al contrato recomendado',
            command: 'vscPowerSyntax.showSettingsGovernance',
          },
          {
            label: '$(symbol-enum) Aplicar perfil de settings',
            description: 'Aplica en el workspace uno de los perfiles gobernados del producto',
            command: 'vscPowerSyntax.applySettingsProfile',
          },
          {
            label: '$(comment-discussion) Abrir explainability de diagnostics',
            description: 'Explica los diagnostics del archivo activo con código, causa probable y siguientes pasos',
            command: 'vscPowerSyntax.focusDiagnosticsExplainabilityPanel',
          },
          {
            label: stats?.orcaRunner?.state === 'running' ? '$(debug-stop) Cancelar ORCA legacy' : '$(tools) Ejecutar ORCA legacy',
            description: [
              formatOrcaStatusInline(stats?.orcaTooling),
              stats?.orcaRunner?.state && stats.orcaRunner.state !== 'idle'
                ? `${stats.orcaRunner.state}${stats.orcaRunner.detail ? ` · ${stats.orcaRunner.detail}` : ''}`
                : undefined,
            ].filter((part): part is string => Boolean(part)).join(' · ') || 'Usa el script activo con un ejecutable ORCA válido',
            command: stats?.orcaRunner?.state === 'running'
              ? 'vscPowerSyntax.cancelOrcaScript'
              : 'vscPowerSyntax.runActiveOrcaScript',
          },
          {
            label: '$(archive) Exportar PBL legacy a ORCA staging',
            description: 'Genera .vsc-powersyntax/orca-export/orca-staging y ejecuta un script pborca-compatible sobre las librerías legacy resueltas por el workspace',
            command: 'vscPowerSyntax.exportOrcaStaging',
          },
          {
            label: '$(cloud-upload) Importar ORCA staging a PBL legacy',
            description: 'Ejecuta preflight, backup y script import-from-staging.orc sobre el último export ORCA persistido del workspace',
            command: 'vscPowerSyntax.importOrcaStaging',
          },
          {
            label: '$(sync) Regenerate librerías legacy vía ORCA',
            description: 'Reutiliza el rail ORCA controlado para regenerar las librerías del último export persistido',
            command: 'vscPowerSyntax.regenerateOrcaLibraries',
          },
          {
            label: '$(tools) Rebuild proyecto legacy vía ORCA',
            description: 'Ejecuta rebuild sobre el target/project legacy persistido por el último export válido',
            command: 'vscPowerSyntax.rebuildOrcaProject',
          },
          {
            label: '$(git-branch) Inspeccionar jerarquía activa',
            description: 'Usa el editor activo para navegación jerárquica',
            command: 'vscPowerSyntax.inspectHierarchy',
          },
          {
            label: '$(debug-restart) Reiniciar servidor',
            description: 'Reinicia el cliente y el servidor LSP',
            command: 'vscPowerSyntax.restartServer',
          },
        ], {
          title: 'VSC PowerSyntax',
          placeHolder: stats?.projectStatus?.summary ?? 'Selecciona una acción de mantenimiento',
        });

        if (!selection) {
          return;
        }

        await vscode.commands.executeCommand(selection.command);
      },
    },
  ];
}

function buildBuildAndOrcaCommands(
  dependencies: ClientCommandRegistrationDependencies,
): readonly ClientCommandRegistration[] {
  return [
    {
      id: 'vscPowerSyntax.runPbAutoBuild',
      handler: () => dependencies.runPbAutoBuild(),
    },
    {
      id: 'vscPowerSyntax.runLastPbAutoBuild',
      handler: () => dependencies.runLastPbAutoBuild(),
    },
    {
      id: 'vscPowerSyntax.runPbAutoBuildWithPicker',
      handler: () => dependencies.runPbAutoBuildWithPicker(),
    },
    {
      id: 'vscPowerSyntax.cancelPbAutoBuild',
      handler: () => dependencies.cancelPbAutoBuild(),
    },
    {
      id: 'vscPowerSyntax.exportPbAutoBuildCiHelper',
      handler: () => dependencies.exportPbAutoBuildCiHelper(),
    },
    {
      id: 'vscPowerSyntax.runActiveOrcaScript',
      handler: () => dependencies.runActiveOrcaScript(),
    },
    {
      id: 'vscPowerSyntax.cancelOrcaScript',
      handler: () => dependencies.cancelOrcaScript(),
    },
    {
      id: 'vscPowerSyntax.exportOrcaStaging',
      handler: () => dependencies.exportOrcaStaging(),
    },
    {
      id: 'vscPowerSyntax.importOrcaStaging',
      handler: () => dependencies.importOrcaStaging(),
    },
    {
      id: 'vscPowerSyntax.regenerateOrcaLibraries',
      handler: () => dependencies.regenerateOrcaLibraries(),
    },
    {
      id: 'vscPowerSyntax.rebuildOrcaProject',
      handler: () => dependencies.rebuildOrcaProject(),
    },
  ];
}

function buildSupportAndMaintenanceCommands(
  dependencies: ClientCommandRegistrationDependencies,
): readonly ClientCommandRegistration[] {
  return [
    {
      id: 'vscPowerSyntax.exportSemanticReproPack',
      handler: (options?: unknown) => dependencies.exportSemanticReproPack(options),
    },
    {
      id: 'vscPowerSyntax.exportSupportBundle',
      handler: (options?: unknown) => dependencies.exportSupportBundle(options),
    },
    {
      id: 'vscPowerSyntax.exportHealthReport',
      handler: (options?: unknown) => dependencies.exportHealthReport(options),
    },
    {
      id: 'vscPowerSyntax.runRuntimeSelfTest',
      handler: () => dependencies.runRuntimeSelfTest(),
    },
    {
      id: 'vscPowerSyntax.showMemoryBudgets',
      handler: () => dependencies.showMemoryBudgets(),
    },
    {
      id: 'vscPowerSyntax.showIndexingState',
      handler: () => dependencies.showIndexingState(),
    },
    {
      id: 'vscPowerSyntax.showProjectRouting',
      handler: () => dependencies.showProjectRouting(),
    },
    {
      id: 'vscPowerSyntax.showSourceOriginConflicts',
      handler: () => dependencies.showSourceOriginConflicts(),
    },
    {
      id: 'vscPowerSyntax.validatePersistentCache',
      handler: () => dependencies.validatePersistentCache(),
    },
    {
      id: 'vscPowerSyntax.clearSemanticCache',
      handler: (options?: unknown) => dependencies.clearSemanticCache(options),
    },
    {
      id: 'vscPowerSyntax.rebuildWorkspaceIndex',
      handler: (options?: unknown) => dependencies.rebuildWorkspaceIndex(options),
    },
    {
      id: 'vscPowerSyntax.runSemanticCacheMaintenance',
      handler: () => dependencies.runSemanticCacheMaintenance(),
    },
    {
      id: 'vscPowerSyntax.showSettingsGovernance',
      handler: () => dependencies.showSettingsGovernance(),
    },
    {
      id: 'vscPowerSyntax.applySettingsProfile',
      handler: () => dependencies.applySettingsProfile(),
    },
  ];
}