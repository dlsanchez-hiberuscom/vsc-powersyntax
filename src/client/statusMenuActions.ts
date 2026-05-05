import * as path from 'path';
import * as vscode from 'vscode';

import {
  formatPbAutoBuildRunInline,
  type RuntimeStatusStats,
} from './statusBarPresentation';
import { formatOrcaStatusInline } from './build/orcaDetection';
import { formatPbAutoBuildStatusInline } from './build/pbAutoBuildDetection';

export type StatusMenuAction = vscode.QuickPickItem & {
  command: string;
};

export function buildStatusMenuActions(stats: RuntimeStatusStats | undefined): StatusMenuAction[] {
  return [
    {
      label: '$(dashboard) Abrir dashboard de salud',
      description: stats?.health?.summary ?? 'Vista read-only sobre salud, manifest y build del workspace',
      command: 'powerbuilder.openProjectHealthDashboard',
    },
    {
      label: '$(graph) Abrir grafo de dependencias',
      description: vscode.window.activeTextEditor?.document
        ? `${path.basename(vscode.window.activeTextEditor.document.uri.fsPath || vscode.window.activeTextEditor.document.uri.path)} · Mermaid read-only del objeto activo`
        : 'Visualiza el vecindario inmediato de dependencias del objeto o archivo activo',
      command: 'powerbuilder.openDependencyGraph',
    },
    {
      label: '$(pulse) Abrir métricas de código',
      description: 'Reporte read-only con complejidad aproximada, SQL, DataWindow, dependencias externas y footprint build/ORCA',
      command: 'powerbuilder.openCodeMetrics',
    },
    {
      label: '$(search) Abrir deuda técnica y modernización',
      description: 'Hotspots priorizados y recomendaciones read-only sobre legacy, SQL dinámico, sourceOrigin y riesgos ORCA/PBL',
      command: 'powerbuilder.openTechnicalDebtReport',
    },
    {
      label: '$(pulse) Ver salud del runtime',
      description: stats?.readiness?.state ?? 'sin datos',
      command: 'powerbuilder.showStatusHealth',
    },
    {
      label: '$(graph) Ver stats del servidor',
      description: stats?.projectStatus?.summary ?? 'resumen del estado actual',
      command: 'powerbuilder.showStatusStats',
    },
    {
      label: '$(note) Exportar health report',
      description: stats?.health?.summary ?? 'Exporta dashboard, stats y manifest del workspace activo',
      command: 'powerbuilder.exportHealthReport',
    },
    {
      label: '$(checklist) Ejecutar runtime self-test',
      description: 'Chequeo rápido de API, LSP, cache, project model, diagnósticos, build y ORCA',
      command: 'powerbuilder.runRuntimeSelfTest',
    },
    {
      label: '$(flame) Ver memory budgets',
      description: stats?.memory
        ? `${stats.memory.status} · ${(stats.memory.layers?.length ?? 0)} capas con budget visible`
        : 'Presupuesto global y capas de memoria del runtime',
      command: 'powerbuilder.showMemoryBudgets',
    },
    {
      label: '$(sync) Ver estado de indexación',
      description: stats?.indexer?.phase
        ? `${stats.indexer.phase}${typeof stats.indexer.current === 'number' && typeof stats.indexer.total === 'number' ? ` · ${stats.indexer.current}/${stats.indexer.total}` : ''}`
        : stats?.readiness?.state ?? 'Readiness e indexer del runtime',
      command: 'powerbuilder.showIndexingState',
    },
    {
      label: '$(source-control) Ver project routing',
      description: stats?.workspace?.activeProject?.name
        ? `${stats.workspace.activeProject.name} · routing del archivo y topología activa`
        : 'Routing del archivo activo y resumen de proyectos detectados',
      command: 'powerbuilder.showProjectRouting',
    },
    {
      label: '$(warning) Ver conflictos de sourceOrigin',
      description: 'Conflictos cross-project donde compiten varios sourceOrigin preferidos',
      command: 'powerbuilder.showSourceOriginConflicts',
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
        ? 'powerbuilder.cancelPbAutoBuild'
        : 'powerbuilder.runPbAutoBuild',
    },
    {
      label: '$(history) Repetir último build frecuente',
      description: stats?.buildProfile?.label ?? 'Usa el último build file ejecutado o te deja elegir uno utilizable',
      command: 'powerbuilder.runLastPbAutoBuild',
    },
    {
      label: '$(list-selection) Elegir build file y ejecutar',
      description: 'Muestra los build files PBAutoBuild utilizables y recuerda el elegido como último build',
      command: 'powerbuilder.runPbAutoBuildWithPicker',
    },
    {
      label: '$(export) Exportar helper CI/CD',
      description: stats?.buildProfile?.label
        ? `${stats.buildProfile.label} · bundle neutral en tools/pbautobuild-ci`
        : 'Genera scripts versionables para CI/CD desde un build file PBAutoBuild utilizable',
      command: 'powerbuilder.exportPbAutoBuildCiHelper',
    },
    {
      label: '$(package) Exportar repro pack semántico',
      description: vscode.window.activeTextEditor?.document
        ? `${path.basename(vscode.window.activeTextEditor.document.uri.fsPath || vscode.window.activeTextEditor.document.uri.path)} · bundle en tools/semantic-repros`
        : 'Captura contexto, impacto, plan seguro y archivos relacionados del editor activo',
      command: 'powerbuilder.exportSemanticReproPack',
    },
    {
      label: '$(archive) Exportar support bundle offline',
      description: 'Exporta estado saneado del runtime, diagnostics, caches, build/ORCA y contrato API sin código bruto por defecto',
      command: 'powerbuilder.exportSupportBundle',
    },
    {
      label: '$(database) Ejecutar mantenimiento de cache semántica',
      description: stats?.persistence?.maintenance?.maintenanceRecommended
        ? 'Compacta journals grandes y limpia workspaces persistidos obsoletos'
        : 'Verifica compactación/retención v2 y limpia workspaces obsoletos si hace falta',
      command: 'powerbuilder.runSemanticCacheMaintenance',
    },
    {
      label: '$(verified) Validar cache persistente',
      description: stats?.persistence?.checkpointUri
        ? 'Comprueba si el checkpoint persistido actual puede reutilizarse sin rebuild'
        : 'Verifica si existe un estado persistido reutilizable para este workspace',
      command: 'powerbuilder.validatePersistentCache',
    },
    {
      label: '$(trash) Limpiar cache semántica',
      description: 'Elimina checkpoint y journal persistidos del workspace activo (requiere confirmación)',
      command: 'powerbuilder.clearSemanticCache',
    },
    {
      label: '$(debug-restart) Rebuild workspace index',
      description: 'Reinicia el runtime y relanza discovery/indexación del workspace (requiere confirmación)',
      command: 'powerbuilder.rebuildWorkspaceIndex',
    },
    {
      label: '$(settings-gear) Ver gobernanza de settings',
      description: 'Resume el perfil activo y las divergencias de configuración respecto al contrato recomendado',
      command: 'powerbuilder.showSettingsGovernance',
    },
    {
      label: '$(symbol-enum) Aplicar perfil de settings',
      description: 'Aplica en el workspace uno de los perfiles gobernados del producto',
      command: 'powerbuilder.applySettingsProfile',
    },
    {
      label: '$(comment-discussion) Abrir explainability de diagnostics',
      description: 'Explica los diagnostics del archivo activo con código, causa probable y siguientes pasos',
      command: 'powerbuilder.focusDiagnosticsExplainabilityPanel',
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
        ? 'powerbuilder.cancelOrcaScript'
        : 'powerbuilder.runActiveOrcaScript',
    },
    {
      label: '$(archive) Exportar PBL legacy a ORCA staging',
      description: 'Genera .vsc-powersyntax/orca-export/orca-staging y ejecuta un script pborca-compatible sobre las librerías legacy resueltas por el workspace',
      command: 'powerbuilder.exportOrcaStaging',
    },
    {
      label: '$(cloud-upload) Importar ORCA staging a PBL legacy',
      description: 'Ejecuta preflight, backup y script import-from-staging.orc sobre el último export ORCA persistido del workspace',
      command: 'powerbuilder.importOrcaStaging',
    },
    {
      label: '$(sync) Regenerate librerías legacy vía ORCA',
      description: 'Reutiliza el rail ORCA controlado para regenerar las librerías del último export persistido',
      command: 'powerbuilder.regenerateOrcaLibraries',
    },
    {
      label: '$(tools) Rebuild proyecto legacy vía ORCA',
      description: 'Ejecuta rebuild sobre el target/project legacy persistido por el último export válido',
      command: 'powerbuilder.rebuildOrcaProject',
    },
    {
      label: '$(git-branch) Inspeccionar jerarquía activa',
      description: 'Usa el editor activo para navegación jerárquica',
      command: 'powerbuilder.inspectHierarchy',
    },
    {
      label: '$(debug-restart) Reiniciar servidor',
      description: 'Reinicia el cliente y el servidor LSP',
      command: 'powerbuilder.restartServer',
    },
  ];
}