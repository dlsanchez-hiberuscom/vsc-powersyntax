import * as vscode from 'vscode';

import { type ProgressNotification } from '../shared/types';
import {
  buildStatusHealthReport,
  buildStatusStatsReport,
  type RuntimeStatusStats,
} from './statusBarPresentation';
import { buildStatusMenuActions, type StatusMenuAction } from './statusMenuActions';

type LocationTarget = {
  uri?: string;
  line?: number;
  character?: number;
};

type ObjectExplorerTarget = { uri?: string } | string;

interface ClientCommandRegistration {
  id: string;
  handler: (...args: any[]) => unknown;
}

const LEGACY_CLIENT_COMMAND_PREFIX = 'vscPowerSyntax.';
const CANONICAL_CLIENT_COMMAND_PREFIX = 'powerbuilder.';

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
  openExtensionUpgradeCompatibilityCheck(): unknown;
  runWorkspaceCheck(request?: unknown): unknown;
  openCurrentObjectCheck(): unknown;
  openObjectCheck(): unknown;
  runObjectCheck(request?: unknown): unknown;
  openExplainDiagnostic(): unknown;
  openExplainSemanticQuery(): unknown;
  runExplainDiagnostic(request?: unknown): unknown;
  runAiTaskContextBundle(request?: unknown): unknown;
  openExplainSystemSymbol(): unknown;
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
  const expanded: ClientCommandRegistration[] = [];
  const seen = new Set<string>();
  for (const registration of registrations) {
    const ids = registration.id.startsWith(LEGACY_CLIENT_COMMAND_PREFIX)
      ? [`${CANONICAL_CLIENT_COMMAND_PREFIX}${registration.id.slice(LEGACY_CLIENT_COMMAND_PREFIX.length)}`, registration.id]
      : [registration.id];

    for (const id of ids) {
      if (seen.has(id)) {
        continue;
      }
      seen.add(id);
      expanded.push({ id, handler: registration.handler });
    }
  }

  context.subscriptions.push(
    ...expanded.map(({ id, handler }) => vscode.commands.registerCommand(id, handler)),
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
      id: 'powerbuilder.explainDiagnostic',
      handler: (request?: unknown) => dependencies.runExplainDiagnostic(request),
    },
    {
      id: 'powerbuilder.exportAiTaskContextBundle',
      handler: (request?: unknown) => dependencies.runAiTaskContextBundle(request),
    },
    {
      id: 'vscPowerSyntax.openWorkspaceCheck',
      handler: () => dependencies.openWorkspaceCheck(),
    },
    {
      id: 'vscPowerSyntax.openExtensionUpgradeCompatibilityCheck',
      handler: () => dependencies.openExtensionUpgradeCompatibilityCheck(),
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
      id: 'vscPowerSyntax.openExplainDiagnostic',
      handler: () => dependencies.openExplainDiagnostic(),
    },
    {
      id: 'vscPowerSyntax.openExplainSemanticQuery',
      handler: () => dependencies.openExplainSemanticQuery(),
    },
    {
      id: 'vscPowerSyntax.openExplainSystemSymbol',
      handler: () => dependencies.openExplainSystemSymbol(),
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

        const selection = await vscode.window.showQuickPick<StatusMenuAction>(buildStatusMenuActions(stats), {
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