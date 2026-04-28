export interface FeatureEntry {
    id: string;
    enabled: boolean;
    description: string;
}

export const FEATURE_MANIFEST: FeatureEntry[] = [
    {
        id: 'commands',
        enabled: true,
        description: 'Comandos de la extensión para reindexado, navegación visible, jerarquía, documentación y build',
    },
    {
        id: 'diagnostics',
        enabled: true,
        description: 'Análisis de diagnósticos conservadores para bloques, SQL simple, write-only, shadowing y ambigüedad real de llamadas',
    },
    {
        id: 'diagnostics-panel',
        enabled: true,
        description: 'Panel workspace-wide de diagnósticos agrupados por proyecto y objeto',
    },
    {
        id: 'hover',
        enabled: true,
        description: 'Información contextual al pasar el ratón sobre símbolos y funciones',
    },
    {
        id: 'definition',
        enabled: true,
        description: 'Ir a definición de tipos, funciones y eventos',
    },
    {
        id: 'references',
        enabled: true,
        description: 'Buscar todas las referencias de un símbolo',
    },
    {
        id: 'rename',
        enabled: true,
        description: 'Renombrar símbolos en todo el espacio de trabajo',
    },
    {
        id: 'linked-editing',
        enabled: true,
        description: 'Edición enlazada para parámetros y locales con target semántico seguro',
    },
    {
        id: 'symbols',
        enabled: true,
        description: 'Símbolos del documento y del espacio de trabajo',
    },
    {
        id: 'completion',
        enabled: true,
        description: 'Autocompletado de palabras clave, tipos y símbolos',
    },
    {
        id: 'signature-help',
        enabled: true,
        description: 'Ayuda de firma para funciones del sistema y callables indexados',
    },
    {
        id: 'inlay-hints',
        enabled: true,
        description: 'Inlay hints conservadores para parámetros de callables owner-aware estables',
    },
    {
        id: 'formatting',
        enabled: true,
        description: 'Formateo conservador de documento, rango, on-type y guardado con casing fino y guardrails sobre SQL embebido',
    },
    {
        id: 'folding',
        enabled: true,
        description: 'Regiones de plegado de código',
    },
    {
        id: 'semantic-tokens',
        enabled: true,
        description: 'Resaltado semántico de código',
    },
    {
        id: 'codelens',
        enabled: true,
        description: 'CodeLens contextuales para relaciones y resúmenes locales verificables',
    },
    {
        id: 'code-actions',
        enabled: true,
        description: 'Acciones rápidas y correcciones automáticas',
    },
    {
        id: 'explorer',
        enabled: true,
        description: 'Árbol de objetos PowerBuilder',
    },
    {
        id: 'status-bar',
        enabled: true,
        description: 'Indicador en la barra de estado con información del índice',
    },
];