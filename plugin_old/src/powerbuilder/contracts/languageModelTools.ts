import { POWERBUILDER_EXTENSION_API_COMMANDS } from '../../publicApiContract';

export interface PowerBuilderLanguageModelToolDescriptor {
    name: string;
    description: string;
    tags: string[];
    inputSchema?: Record<string, unknown>;
    command: string;
    payloadKind?: string;
    acceptsArguments: boolean;
    invocationMessage: string;
}

const semanticTargetInputSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        uri: {
            type: 'string',
            description: 'URI del documento PowerBuilder; si no se indica, usa el editor activo.',
        },
        line: {
            type: 'integer',
            minimum: 0,
            description: 'Línea 0-based de la posición a inspeccionar.',
        },
        character: {
            type: 'integer',
            minimum: 0,
            description: 'Columna 0-based de la posición a inspeccionar.',
        },
    },
};

const semanticBatchInputSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['requests'],
    properties: {
        requests: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    uri: {
                        type: 'string',
                        description: 'URI del documento PowerBuilder.',
                    },
                    line: {
                        type: 'integer',
                        minimum: 0,
                    },
                    character: {
                        type: 'integer',
                        minimum: 0,
                    },
                    label: {
                        type: 'string',
                        description: 'Etiqueta opcional para el item del batch.',
                    },
                },
                required: ['uri', 'line', 'character'],
            },
        },
        stopOnError: {
            type: 'boolean',
            description: 'Si es true, corta el batch en el primer item no generado.',
        },
    },
};

const POWERBUILDER_LANGUAGE_MODEL_TOOL_DESCRIPTORS: readonly PowerBuilderLanguageModelToolDescriptor[] = [
    {
        name: 'powerbuilder-semantic-query',
        description: 'Devuelve una query semántica estructurada para una posición PowerBuilder.',
        tags: ['powerbuilder', 'semantic', 'query'],
        inputSchema: semanticTargetInputSchema,
        command: POWERBUILDER_EXTENSION_API_COMMANDS.runSemanticQuery,
        payloadKind: 'powerbuilder-semantic-query',
        acceptsArguments: true,
        invocationMessage: 'PowerBuilder: ejecutando query semántica estructurada.',
    },
    {
        name: 'powerbuilder-semantic-query-batch',
        description: 'Ejecuta un batch de queries semánticas estructuradas sobre múltiples posiciones PowerBuilder.',
        tags: ['powerbuilder', 'semantic', 'batch'],
        inputSchema: semanticBatchInputSchema,
        command: POWERBUILDER_EXTENSION_API_COMMANDS.runSemanticQueryBatch,
        payloadKind: 'powerbuilder-semantic-query-batch',
        acceptsArguments: true,
        invocationMessage: 'PowerBuilder: ejecutando batch de queries semánticas.',
    },
    {
        name: 'powerbuilder-active-hierarchy-inspection',
        description: 'Inspecciona la jerarquía activa estructurada del símbolo o documento PowerBuilder actual.',
        tags: ['powerbuilder', 'hierarchy', 'inspection'],
        inputSchema: semanticTargetInputSchema,
        command: POWERBUILDER_EXTENSION_API_COMMANDS.runActiveHierarchyInspection,
        payloadKind: 'powerbuilder-active-hierarchy-inspection',
        acceptsArguments: true,
        invocationMessage: 'PowerBuilder: inspeccionando jerarquía activa estructurada.',
    },
    {
        name: 'powerbuilder-ancestor-script-inspection',
        description: 'Localiza el script ancestro estructurado para el callable o posición PowerBuilder actual.',
        tags: ['powerbuilder', 'ancestor', 'script'],
        inputSchema: semanticTargetInputSchema,
        command: POWERBUILDER_EXTENSION_API_COMMANDS.runAncestorScriptInspection,
        payloadKind: 'powerbuilder-ancestor-script-inspection',
        acceptsArguments: true,
        invocationMessage: 'PowerBuilder: inspeccionando script ancestro estructurado.',
    },
    {
        name: 'powerbuilder-build-session-manifest',
        description: 'Devuelve el manifiesto estructurado de la sesión de build y el último target reutilizable.',
        tags: ['powerbuilder', 'build', 'session'],
        command: POWERBUILDER_EXTENSION_API_COMMANDS.runBuildSessionManifest,
        payloadKind: 'powerbuilder-build-session-manifest',
        acceptsArguments: false,
        invocationMessage: 'PowerBuilder: serializando manifiesto de sesión de build.',
    },
] as const;

export function getPowerBuilderLanguageModelToolDescriptors(): PowerBuilderLanguageModelToolDescriptor[] {
    return [...POWERBUILDER_LANGUAGE_MODEL_TOOL_DESCRIPTORS].map(descriptor => ({
        ...descriptor,
        tags: [...descriptor.tags],
        inputSchema: descriptor.inputSchema
            ? JSON.parse(JSON.stringify(descriptor.inputSchema)) as Record<string, unknown>
            : undefined,
    }));
}