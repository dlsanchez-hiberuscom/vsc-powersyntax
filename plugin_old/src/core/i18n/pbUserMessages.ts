export const PB_USER_MESSAGES = {
    commands: {
        reindexingWorkspace: 'PowerBuilder: reindexando el espacio de trabajo...',
        goToSymbolPlaceholder: 'Ir al símbolo de PowerBuilder...',
        semanticNavigateInspecting: 'PowerBuilder: preparando navegación semántica premium...',
        semanticNavigateFilterPlaceholder: 'Selecciona filtros semánticos opcionales para acotar símbolos...',
        semanticNavigateNoMatches: 'PowerBuilder: no hay símbolos que cumplan los filtros semánticos actuales.',
        showObjectInfoNoActiveEditor: 'No hay ningún editor PowerBuilder activo.',
        exportDataWindowManifestNoActiveEditor: 'No hay ningún editor DataWindow activo.',
        explainActiveHierarchyInspecting: 'PowerBuilder: inspeccionando la jerarquía activa...',
        showInheritanceHierarchyInspecting: 'PowerBuilder: construyendo la jerarquía de herencia...',
        findAncestorScriptInspecting: 'PowerBuilder: localizando el script ancestro...',
        buildCurrentProjectInspecting: 'PowerBuilder: compilando el proyecto actual con PBAutoBuild...',
        rebuildLastProjectInspecting: 'PowerBuilder: recompilando el último proyecto con PBAutoBuild...',
        buildCurrentProjectNoActiveEditor: 'No hay un editor PowerBuilder o .pbproj activo para resolver el proyecto actual.',
        buildProblemsCleared: 'PowerBuilder: problemas de build limpiados.',
        buildNoPreviousSession: 'No hay una compilación previa en esta sesión.',
        experimentalDataWindowIdeDisabled:
            'Las funciones IDE para archivos .srd están desactivadas por seguridad. Activa powerbuilder.datawindow.experimentalIde.enabled para habilitarlas de forma experimental.',
    },

    codeActions: {
        insertEndIf: 'Insertar "END IF"',
        insertNext: 'Insertar "NEXT"',
        insertLoop: 'Insertar "LOOP"',
        insertEndTry: 'Insertar "END TRY"',
        insertEndChoose: 'Insertar "END CHOOSE"',
        replaceObsoleteRuntimeFunction: 'Reemplazar función obsoleta del runtime',
    },

    completion: {
        builtinFunction: 'Función integrada',
    },

    explorer: {
        open: 'Abrir',
    },

    hover: {
        inContainer: 'en',
        forwardPrototype: 'Prototipo forward',
        definedIn: 'Definido en',
    },

    statusBar: {
        indexingWorkspace: 'PowerBuilder: indexando espacio de trabajo...',
        clickToReindexWorkspace: 'PowerBuilder: haz clic para reindexar el espacio de trabajo',
        dataWindowExperimentalDisabled:
            'PowerBuilder: las funciones IDE de DataWindow están desactivadas por seguridad',
    },

    logs: {
        extensionActivating: 'La extensión de PowerBuilder se está activando...',
        extensionActivated: 'La extensión de PowerBuilder se ha activado.',
        initialWorkspaceIndexingStarted: 'Se ha iniciado la indexación inicial del espacio de trabajo PowerBuilder.',
        initialWorkspaceIndexingCompleted: 'Se ha completado la indexación inicial del espacio de trabajo PowerBuilder.',
        initialWorkspaceIndexingDeferred:
            'La indexación inicial completa del espacio de trabajo PowerBuilder se ha diferido al segundo plano para priorizar el arranque.',
    },
};

export function formatIndexedSummaryEs(symbolCount: number, fileCount: number): string {
    return `PowerBuilder: indexados ${symbolCount} símbolos en ${fileCount} archivos.`;
}

export function formatObjectInfoEs(args: {
    fileName: string;
    typeCount: number;
    functionCount: number;
    eventCount: number;
    variableCount: number;
}): string {
    return [
        `Archivo: ${args.fileName}`,
        `Tipos/Estructuras: ${args.typeCount}`,
        `Funciones/Subrutinas: ${args.functionCount}`,
        `Eventos: ${args.eventCount}`,
        `Variables/Constantes: ${args.variableCount}`,
    ].join('\n');
}

export function formatDataWindowObjectInfoEs(args: {
    fileName: string;
    objectName: string;
    bandNames: string[];
    tableColumnCount: number;
    textCount: number;
    displayColumnCount: number;
    retrieveStatement?: string;
}): string {
    return [
        `Archivo: ${args.fileName}`,
        `DataWindow: ${args.objectName}`,
        `Bandas: ${args.bandNames.join(', ') || 'ninguna'}`,
        `Columnas de tabla: ${args.tableColumnCount}`,
        `Textos: ${args.textCount}`,
        `Columnas visuales: ${args.displayColumnCount}`,
        `Retrieve: ${args.retrieveStatement ?? 'sin retrieve detectado'}`,
    ].join('\n');
}

export function getSymbolKindLabelEs(kind: string): string {
    switch (kind) {
        case 'type':
            return 'tipo';
        case 'structure':
            return 'estructura';
        case 'function':
            return 'función';
        case 'subroutine':
            return 'subrutina';
        case 'event':
            return 'evento';
        case 'variable':
            return 'variable';
        case 'constant':
            return 'constante';
        case 'global-function':
            return 'función global';
        default:
            return kind;
    }
}

export function formatSymbolDetailEs(kind: string, parent?: string): string {
    const kindLabel = getSymbolKindLabelEs(kind);

    if (!parent) {
        return kindLabel;
    }

    return `${kindLabel} en ${parent}`;
}

export function formatHoverDefinedInEs(filePath: string, lineNumber: number): string {
    return `${PB_USER_MESSAGES.hover.definedIn} ${filePath}:${lineNumber}`;
}

export function formatCannotRenameEs(symbolName: string, detail?: string): string {
    const normalizedDetail = detail?.trim();

    return normalizedDetail
        ? `No se puede renombrar '${symbolName}': ${normalizedDetail}`
        : `No se puede renombrar '${symbolName}': símbolo ambiguo, no indexado o no seguro para renombrado.`;
}

export function formatUnableEvaluateWorkspaceHasPowerBuilderFilesEs(error: unknown): string {
    return `No se pudo evaluar el contexto workspaceHasPowerBuilderFiles: ${String(error)}`;
}

export function formatInitialWorkspaceIndexingFailedEs(error: unknown): string {
    return `La indexación inicial del espacio de trabajo PowerBuilder ha fallado: ${String(error)}`;
}

export function formatInitialWorkspaceIndexingDurationEs(durationMs: number): string {
    return `La indexación inicial del espacio de trabajo PowerBuilder ha tardado ${durationMs} ms.`;
}

export function formatFeatureDisabledEs(featureId: string): string {
    return `Funcionalidad [${featureId}] desactivada; se omite su registro.`;
}

export function formatNoRegisterFunctionForFeatureEs(featureId: string): string {
    return `No existe una función de registro para la funcionalidad [${featureId}].`;
}

export function formatFeatureRegisteredEs(featureId: string): string {
    return `Funcionalidad [${featureId}] registrada.`;
}

export function formatFeatureRegisterFailedEs(featureId: string): string {
    return `No se pudo registrar la funcionalidad [${featureId}]:`;
}

export function formatIndexingWorkspaceEs(fileCount: number): string {
    return `Indexando ${fileCount} archivos PowerBuilder...`;
}

export function formatIndexedWorkspaceEs(symbolCount: number, fileCount: number): string {
    return `Indexados ${symbolCount} símbolos en ${fileCount} archivos.`;
}

export function formatUnableIndexFileEs(uri: string, error: unknown): string {
    return `No se pudo indexar el archivo [${uri}]: ${String(error)}`;
}

export function formatStatusBarTextEs(
    symbolCount: number,
    fileCount: number,
    projectName?: string,
): string {
    const symbolLabel = symbolCount === 1 ? 'símbolo' : 'símbolos';
    const fileLabel = fileCount === 1 ? 'archivo' : 'archivos';
    const projectPrefix = projectName?.trim()
        ? `${projectName.trim()} · `
        : '';

    return `PB: ${projectPrefix}${symbolCount} ${symbolLabel} · ${fileCount} ${fileLabel}`;
}

export function formatStatusBarTooltipEs(
    symbolCount: number,
    fileCount: number,
    args?: {
        projectName?: string;
        rootLabels?: string[];
    },
): string {
    const symbolLabel = symbolCount === 1 ? 'símbolo' : 'símbolos';
    const fileLabel = fileCount === 1 ? 'archivo' : 'archivos';
    const rootLabels = args?.rootLabels?.filter(label => label.trim().length > 0) ?? [];
    const lines = [
        `PowerBuilder: ${symbolCount} ${symbolLabel} indexados en ${fileCount} ${fileLabel}.`,
    ];

    if (args?.projectName?.trim()) {
        lines.push(`Proyecto preferido: ${args.projectName.trim()}`);
    }

    if (rootLabels.length > 0) {
        const rootCountLabel = rootLabels.length === 1 ? 'raíz efectiva' : 'raíces efectivas';
        lines.push(`Proyecto: ${rootLabels.length} ${rootCountLabel}`);
        lines.push(`Roots: ${rootLabels.join(', ')}`);
    }

    lines.push(PB_USER_MESSAGES.statusBar.clickToReindexWorkspace);

    return lines.join('\n');
}

export function formatReplaceObsoleteRuntimeFunctionEs(legacyName: string, replacement: string): string {
    return `Reemplazar '${legacyName}' por '${replacement}'`;
}