import * as vscode from 'vscode';
import { SymbolIndex } from '../indexing/symbolIndex';
import { listSystemGlobalFunctions, resolveSystemGlobalFunction } from '../knowledge/services/queryService';
import { PbSymbol } from '../models/pbSymbol';
import { PowerScriptDocumentModelCache } from '../document/powerScriptDocumentModel';
import { PbProjectDefinition, normalizeWorkspaceUriPath } from '../workspace/pbProjectModel';

export type SupportedPowerBuilderDocumentationObjectType =
    | 'application'
    | 'menu'
    | 'nonvisualobject'
    | 'userobject'
    | 'window';

export type PowerBuilderDocumentationConfidence = 'alta' | 'media' | 'baja';

export interface PowerBuilderDocumentationGenerationOptions {
    commandId: string;
    generatedAt?: Date;
    generatorVersion?: string;
}

export interface PowerBuilderDocumentationMemberSummary {
    name: string;
    typeName?: string;
    access?: string;
    scope: 'instance' | 'shared' | 'global' | 'constant';
}

export interface PowerBuilderDocumentationParameterSummary {
    name: string;
    typeName?: string;
}

export interface PowerBuilderDocumentationCallableSummary {
    name: string;
    kind: 'function' | 'subroutine' | 'event';
    access?: string;
    returnType?: string;
    signature?: string;
    parameters: PowerBuilderDocumentationParameterSummary[];
    implementationKind?: string;
    isExternal?: boolean;
    externalLibraryName?: string;
}

export interface PowerBuilderObjectDocumentationModel {
    objectName: string;
    objectType: SupportedPowerBuilderDocumentationObjectType;
    sourceUri: vscode.Uri;
    sourcePath: string;
    projectName?: string;
    libraryName?: string;
    directBaseType?: string;
    inheritanceChain: string[];
    directDescendants: string[];
    summary: string;
    inferredRole: string;
    confidence: PowerBuilderDocumentationConfidence;
    eventImplementations: PowerBuilderDocumentationCallableSummary[];
    publicCallables: PowerBuilderDocumentationCallableSummary[];
    protectedCallables: PowerBuilderDocumentationCallableSummary[];
    privateCallables: PowerBuilderDocumentationCallableSummary[];
    instanceMembers: PowerBuilderDocumentationMemberSummary[];
    sharedMembers: PowerBuilderDocumentationMemberSummary[];
    globalMembers: PowerBuilderDocumentationMemberSummary[];
    constants: PowerBuilderDocumentationMemberSummary[];
    highlightedMembers: Array<{ name: string; typeName?: string }>;
    typeDependencies: string[];
    globalFunctionDependencies: string[];
    notes: string[];
}

interface GlobalFunctionDependencyScan {
    dependencies: string[];
    notes: string[];
}

const SUPPORTED_OBJECT_TYPES = new Set<SupportedPowerBuilderDocumentationObjectType>([
    'application',
    'menu',
    'nonvisualobject',
    'userobject',
    'window',
]);

const PRIMITIVE_TYPE_NAMES = new Set([
    'any',
    'blob',
    'boolean',
    'byte',
    'char',
    'date',
    'datetime',
    'decimal',
    'double',
    'integer',
    'int',
    'long',
    'longlong',
    'real',
    'string',
    'time',
    'uint',
    'ulong',
    'unsignedinteger',
    'unsignedlong',
    'void',
]);

const TYPE_QUALIFIERS = new Set([
    'ref',
    'readonly',
]);

const CONTROL_FLOW_CALL_TOKENS = new Set([
    'call',
    'catch',
    'close',
    'create',
    'destroy',
    'elseif',
    'if',
    'loop',
    'open',
    'return',
    'throw',
    'while',
]);

export function analyzePowerBuilderObjectDocumentation(
    document: vscode.TextDocument,
    index: SymbolIndex,
    project?: PbProjectDefinition,
): PowerBuilderObjectDocumentationModel | undefined {
    index.indexDocument(document, { silent: true });

    const rootSymbol = index.getPrimaryFileObjectSymbol(document.uri);

    if (!rootSymbol || rootSymbol.kind !== 'type') {
        return undefined;
    }

    const classification = resolveSupportedObjectType(rootSymbol, index, document.uri);

    if (!classification) {
        return undefined;
    }

    const symbols = index.getSymbolsForFile(document.uri);
    const objectOwnedSymbols = symbols.filter(symbol => symbol.parent === rootSymbol.name);
    const eventImplementations = objectOwnedSymbols
        .filter((symbol): symbol is PbSymbol => symbol.kind === 'event' && !symbol.isPrototype)
        .map(symbol => toCallableSummary(symbol));
    const callableGroups = groupCallableSummaries(
        objectOwnedSymbols.filter((symbol): symbol is PbSymbol =>
            (symbol.kind === 'function' || symbol.kind === 'subroutine') &&
            !symbol.isPrototype,
        ),
    );
    const memberGroups = groupMemberSummaries(
        objectOwnedSymbols.filter((symbol): symbol is PbSymbol =>
            (symbol.kind === 'variable' || symbol.kind === 'constant') &&
            symbol.declarationScope === 'member',
        ),
    );
    const highlightedMembers = objectOwnedSymbols
        .filter(symbol => symbol.kind === 'type' || symbol.kind === 'structure')
        .map(symbol => ({
            name: symbol.name,
            typeName: symbol.baseTypeName,
        }))
        .sort(compareByName);

    const inheritanceChain = uniqueSorted([
        ...index.getAncestorTypeNames(document.uri),
    ]);
    const directDescendants = index.getAllSymbols()
        .filter(symbol =>
            symbol.kind === 'type' &&
            symbol.containerKind === 'file-object' &&
            !symbol.parent &&
            normalizeIdentifier(symbol.baseTypeName) === normalizeIdentifier(rootSymbol.name),
        )
        .map(symbol => symbol.name)
        .sort(sortStrings);

    const typeDependencies = uniqueSorted(
        collectTypeDependencies(rootSymbol, callableGroups, memberGroups, highlightedMembers),
    );
    const globalFunctionScan = collectGlobalFunctionDependencies(document, index, rootSymbol.name, objectOwnedSymbols);
    const sourcePath = getWorkspaceRelativePath(document.uri);
    const libraryName = inferLibraryName(document.uri, project);
    const notes = [
        ...buildDocumentationNotes(classification.inferredFromAncestorChain, project, libraryName),
        ...globalFunctionScan.notes,
    ];
    const summaryContext = buildObjectSummary(
        classification.objectType,
        eventImplementations.length,
        callableGroups.totalCount,
        memberGroups.totalCount,
        highlightedMembers.length,
        classification.inferredFromAncestorChain,
    );

    return {
        objectName: rootSymbol.name,
        objectType: classification.objectType,
        sourceUri: document.uri,
        sourcePath,
        projectName: project?.name,
        libraryName,
        directBaseType: rootSymbol.baseTypeName,
        inheritanceChain,
        directDescendants,
        summary: summaryContext.summary,
        inferredRole: summaryContext.role,
        confidence: summaryContext.confidence,
        eventImplementations,
        publicCallables: callableGroups.publicCallables,
        protectedCallables: callableGroups.protectedCallables,
        privateCallables: callableGroups.privateCallables,
        instanceMembers: memberGroups.instanceMembers,
        sharedMembers: memberGroups.sharedMembers,
        globalMembers: memberGroups.globalMembers,
        constants: memberGroups.constants,
        highlightedMembers,
        typeDependencies,
        globalFunctionDependencies: globalFunctionScan.dependencies,
        notes,
    };
}

export function renderPowerBuilderObjectDocumentationMarkdown(
    model: PowerBuilderObjectDocumentationModel,
    options: PowerBuilderDocumentationGenerationOptions,
): string {
    const generatedAt = (options.generatedAt ?? new Date()).toISOString();
    const generatorVersion = options.generatorVersion ?? 'p2-18-v3';
    const sections = [
        `# ${model.objectName}`,
        renderIdentitySection(model),
        renderQuickMapSection(model),
        renderSummarySection(model),
        renderInheritanceSection(model),
        renderUsefulRelationshipsSection(model),
        renderApiSection(model),
        renderStateSection(model),
        renderDependenciesSection(model),
        renderSemanticNotesSection(model),
        renderGenerationMetadataSection(model, options.commandId, generatedAt, generatorVersion),
    ];

    return sections.join('\n\n');
}

function renderIdentitySection(model: PowerBuilderObjectDocumentationModel): string {
    return [
        '## Identidad',
        `- Nombre del objeto: ${inlineCode(model.objectName)}`,
        `- Tipo: ${inlineCode(model.objectType)}`,
        `- Archivo fuente: ${inlineCode(model.sourcePath)}`,
        `- Proyecto: ${inlineCode(model.projectName ?? 'sin proyecto preferido')}`,
        `- Librería: ${inlineCode(model.libraryName ?? 'sin librería preferida')}`,
        `- Ancestro directo: ${inlineCode(model.directBaseType ?? 'sin ancestro declarado')}`,
    ].join('\n');
}

function renderSummarySection(model: PowerBuilderObjectDocumentationModel): string {
    return [
        '## Resumen técnico',
        `- Descripción corta: ${model.summary}`,
        `- Rol técnico inferido: ${model.inferredRole}`,
        `- Nivel de confianza: ${inlineCode(model.confidence)}`,
    ].join('\n');
}

function renderQuickMapSection(model: PowerBuilderObjectDocumentationModel): string {
    const publicSurfaceCount = model.publicCallables.length + model.eventImplementations.length;
    const internalSurfaceCount = model.protectedCallables.length + model.privateCallables.length;
    const stateCount = model.instanceMembers.length + model.sharedMembers.length + model.globalMembers.length + model.constants.length;

    return [
        '## Mapa rápido',
        `- Superficie pública publicada: ${inlineCode(String(publicSurfaceCount))} entrada(s) (${model.publicCallables.length} callable(s) públicos y ${model.eventImplementations.length} evento(s) implementados).`,
        `- Superficie interna publicada: ${inlineCode(String(internalSurfaceCount))} callable(s) no públicos (${model.protectedCallables.length} protegidos y ${model.privateCallables.length} privados).`,
        `- Estado indexado: ${inlineCode(String(stateCount))} miembro(s) (${model.instanceMembers.length} de instancia, ${model.sharedMembers.length} shared, ${model.globalMembers.length} globales y ${model.constants.length} constantes).`,
        `- Relaciones fuertes: ${inlineCode(String(model.typeDependencies.length))} tipo(s) usado(s), ${inlineCode(String(model.globalFunctionDependencies.length))} función(es) global(es) y ${inlineCode(String(model.directDescendants.length))} descendiente(s) directo(s).`,
        `- Miembros destacados: ${formatInlineCodeList(model.highlightedMembers.map(member => member.name), 'sin miembros destacados detectables con seguridad')}`,
    ].join('\n');
}

function renderInheritanceSection(model: PowerBuilderObjectDocumentationModel): string {
    return [
        '## Herencia',
        `- Ancestro directo: ${inlineCode(model.directBaseType ?? 'sin ancestro declarado')}`,
        `- Cadena básica: ${formatInlineCodeList(model.inheritanceChain, 'sin cadena adicional indexada')}`,
        `- Profundidad heredada indexada: ${inlineCode(String(model.inheritanceChain.length))}`,
        `- Descendientes directos: ${formatInlineCodeList(model.directDescendants, 'sin descendientes directos con evidencia fuerte')}`,
    ].join('\n');
}

function renderUsefulRelationshipsSection(model: PowerBuilderObjectDocumentationModel): string {
    return [
        '## Relaciones útiles',
        `- Eventos visibles: ${formatInlineCodeList(model.eventImplementations.map(callable => callable.name), 'sin scripts de evento visibles con evidencia fuerte')}`,
        `- API pública prioritaria: ${formatInlineCodeList(model.publicCallables.map(callable => callable.name), 'sin callables públicos indexados')}`,
        `- Dependencias tipadas más útiles: ${formatInlineCodeList(model.typeDependencies, 'sin tipos relevantes publicados con evidencia fuerte')}`,
        `- Funciones globales relevantes: ${formatInlineCodeList(model.globalFunctionDependencies, 'sin funciones globales relevantes publicables')}`,
        `- Controles o tipos anidados: ${renderHighlightedMembersInline(model.highlightedMembers)}`,
    ].join('\n');
}

function renderApiSection(model: PowerBuilderObjectDocumentationModel): string {
    return [
        '## API del objeto',
        `- Resumen de API: ${model.eventImplementations.length} evento(s), ${model.publicCallables.length} callable(s) públicos, ${model.protectedCallables.length} protegido(s) y ${model.privateCallables.length} privado(s).`,
        '### Eventos implementados / sobrescritos',
        renderCallableTable(model.eventImplementations),
        '### Callables públicos',
        renderCallableTable(model.publicCallables),
        '### Callables protegidos',
        renderCallableTable(model.protectedCallables),
        '### Callables privados',
        renderCallableTable(model.privateCallables),
    ].join('\n\n');
}

function renderStateSection(model: PowerBuilderObjectDocumentationModel): string {
    return [
        '## Estado interno',
        '### Variables de instancia',
        renderMemberTable(model.instanceMembers),
        '### Variables shared',
        renderMemberTable(model.sharedMembers),
        '### Variables global',
        renderMemberTable(model.globalMembers),
        '### Constantes relevantes',
        renderMemberTable(model.constants),
        '### Miembros destacados',
        renderHighlightedMembers(model.highlightedMembers),
    ].join('\n\n');
}

function renderDependenciesSection(model: PowerBuilderObjectDocumentationModel): string {
    return [
        '## Dependencias y relaciones',
        `- Ancestros relevantes: ${formatInlineCodeList(model.inheritanceChain, 'sin ancestros adicionales indexados')}`,
        `- Objetos y tipos usados con evidencia fuerte: ${formatInlineCodeList(model.typeDependencies, 'sin tipos declarados relevantes con evidencia fuerte')}`,
        `- Funciones globales relevantes: ${formatInlineCodeList(model.globalFunctionDependencies, 'sin evidencia fuerte suficiente para publicar funciones globales relevantes')}`,
        `- Miembros destacados y composición: ${renderHighlightedMembersInline(model.highlightedMembers)}`,
    ].join('\n');
}

function renderSemanticNotesSection(model: PowerBuilderObjectDocumentationModel): string {
    return [
        '## Observaciones semánticas',
        ...((model.notes.length > 0)
            ? model.notes.map(note => `- ${note}`)
            : ['- No se registran ambigüedades fuertes adicionales en la salida v2.']),
    ].join('\n');
}

function renderGenerationMetadataSection(
    model: PowerBuilderObjectDocumentationModel,
    commandId: string,
    generatedAt: string,
    generatorVersion: string,
): string {
    return [
        '## Metadatos de generación',
        `- Fecha: ${inlineCode(generatedAt)}`,
        `- Comando usado: ${inlineCode(commandId)}`,
        `- Cobertura o confianza: ${inlineCode(model.confidence)}`,
        `- Versión del generador: ${inlineCode(generatorVersion)}`,
    ].join('\n');
}

function renderCallableTable(callables: readonly PowerBuilderDocumentationCallableSummary[]): string {
    if (callables.length === 0) {
        return 'Sin entradas con evidencia fuerte.';
    }

    const header = '| Nombre | Firma | Retorno | Parámetros | Notas |';
    const separator = '|---|---|---|---|---|';
    const rows = callables.map(callable => {
        const parameters = callable.parameters.length > 0
            ? callable.parameters.map(parameter => `${parameter.name}: ${parameter.typeName ?? 'sin tipo'}`).join('; ')
            : 'sin parámetros';
        const notes = [
            callable.kind,
            callable.isExternal && callable.externalLibraryName
                ? `externa ${callable.externalLibraryName}`
                : undefined,
            callable.implementationKind,
        ].filter((value): value is string => !!value).join(' · ');

        return `| ${escapeTableCell(callable.name)} | ${escapeTableCell(callable.signature ?? 'sin firma')} | ${escapeTableCell(callable.returnType ?? 'sin retorno')} | ${escapeTableCell(parameters)} | ${escapeTableCell(notes || 'sin notas')} |`;
    });

    return [header, separator, ...rows].join('\n');
}

function renderMemberTable(members: readonly PowerBuilderDocumentationMemberSummary[]): string {
    if (members.length === 0) {
        return 'Sin entradas con evidencia fuerte.';
    }

    const header = '| Nombre | Tipo | Scope | Acceso |';
    const separator = '|---|---|---|---|';
    const rows = members.map(member =>
        `| ${escapeTableCell(member.name)} | ${escapeTableCell(member.typeName ?? 'sin tipo')} | ${escapeTableCell(member.scope)} | ${escapeTableCell(member.access ?? 'sin modificador')} |`,
    );

    return [header, separator, ...rows].join('\n');
}

function renderHighlightedMembers(members: readonly { name: string; typeName?: string }[]): string {
    if (members.length === 0) {
        return 'Sin miembros destacados detectables con seguridad.';
    }

    return members
        .map(member => `- ${inlineCode(member.name)} (${inlineCode(member.typeName ?? 'sin tipo base')})`)
        .join('\n');
}

function renderHighlightedMembersInline(members: readonly { name: string; typeName?: string }[]): string {
    if (members.length === 0) {
        return 'sin miembros destacados detectables con seguridad';
    }

    return members
        .map(member => `${inlineCode(member.name)} (${inlineCode(member.typeName ?? 'sin tipo base')})`)
        .join(', ');
}

function groupCallableSummaries(symbols: readonly PbSymbol[]) {
    const callables = symbols
        .map(symbol => toCallableSummary(symbol))
        .sort(compareByName);
    const publicCallables: PowerBuilderDocumentationCallableSummary[] = [];
    const protectedCallables: PowerBuilderDocumentationCallableSummary[] = [];
    const privateCallables: PowerBuilderDocumentationCallableSummary[] = [];

    for (const callable of callables) {
        const visibility = normalizeCallableVisibility(callable.access);

        if (visibility === 'protected') {
            protectedCallables.push(callable);
            continue;
        }

        if (visibility === 'private') {
            privateCallables.push(callable);
            continue;
        }

        publicCallables.push(callable);
    }

    return {
        publicCallables,
        protectedCallables,
        privateCallables,
        totalCount: callables.length,
    };
}

function groupMemberSummaries(symbols: readonly PbSymbol[]) {
    const instanceMembers: PowerBuilderDocumentationMemberSummary[] = [];
    const sharedMembers: PowerBuilderDocumentationMemberSummary[] = [];
    const globalMembers: PowerBuilderDocumentationMemberSummary[] = [];
    const constants: PowerBuilderDocumentationMemberSummary[] = [];

    for (const symbol of [...symbols].sort(compareByName)) {
        const member = toMemberSummary(symbol);

        if (member.scope === 'constant') {
            constants.push(member);
            continue;
        }

        if (member.scope === 'shared') {
            sharedMembers.push(member);
            continue;
        }

        if (member.scope === 'global') {
            globalMembers.push(member);
            continue;
        }

        instanceMembers.push(member);
    }

    return {
        instanceMembers,
        sharedMembers,
        globalMembers,
        constants,
        totalCount: symbols.length,
    };
}

function collectTypeDependencies(
    rootSymbol: PbSymbol,
    callableGroups: {
        publicCallables: readonly PowerBuilderDocumentationCallableSummary[];
        protectedCallables: readonly PowerBuilderDocumentationCallableSummary[];
        privateCallables: readonly PowerBuilderDocumentationCallableSummary[];
    },
    memberGroups: {
        instanceMembers: readonly PowerBuilderDocumentationMemberSummary[];
        sharedMembers: readonly PowerBuilderDocumentationMemberSummary[];
        globalMembers: readonly PowerBuilderDocumentationMemberSummary[];
        constants: readonly PowerBuilderDocumentationMemberSummary[];
    },
    highlightedMembers: readonly { name: string; typeName?: string }[],
): string[] {
    const references = new Set<string>();
    const callables = [
        ...callableGroups.publicCallables,
        ...callableGroups.protectedCallables,
        ...callableGroups.privateCallables,
    ];
    const members = [
        ...memberGroups.instanceMembers,
        ...memberGroups.sharedMembers,
        ...memberGroups.globalMembers,
        ...memberGroups.constants,
    ];

    for (const reference of extractTypeReferences(rootSymbol.baseTypeName)) {
        references.add(reference);
    }

    for (const callable of callables) {
        for (const reference of extractTypeReferences(callable.returnType)) {
            references.add(reference);
        }

        for (const parameter of callable.parameters) {
            for (const reference of extractTypeReferences(parameter.typeName)) {
                references.add(reference);
            }
        }
    }

    for (const member of members) {
        for (const reference of extractTypeReferences(member.typeName)) {
            references.add(reference);
        }
    }

    for (const highlightedMember of highlightedMembers) {
        for (const reference of extractTypeReferences(highlightedMember.typeName)) {
            references.add(reference);
        }
    }

    references.delete(rootSymbol.name);

    return [...references];
}

function collectGlobalFunctionDependencies(
    document: vscode.TextDocument,
    index: SymbolIndex,
    rootObjectName: string,
    objectOwnedSymbols: readonly PbSymbol[],
): GlobalFunctionDependencyScan {
    const model = PowerScriptDocumentModelCache.getInstance().getModel(document);
    const localCallableNames = new Set(
        objectOwnedSymbols
            .filter(symbol => symbol.kind === 'function' || symbol.kind === 'subroutine' || symbol.kind === 'event')
            .map(symbol => normalizeIdentifier(symbol.name)),
    );
    const dependencies = new Set<string>();
    const notes = new Set<string>();

    for (const statement of model.statements) {
        const trimmed = statement.text.trim();

        if (!trimmed || isDeclarationLikeStatement(trimmed)) {
            continue;
        }

        const matches = [...trimmed.matchAll(/\b([a-zA-Z_$#%][\w$#%`-]*)\s*\(/g)];

        for (const match of matches) {
            const candidateName = match[1];
            const normalizedCandidate = normalizeIdentifier(candidateName);

            if (
                !normalizedCandidate ||
                normalizedCandidate === normalizeIdentifier(rootObjectName) ||
                localCallableNames.has(normalizedCandidate) ||
                CONTROL_FLOW_CALL_TOKENS.has(normalizedCandidate)
            ) {
                continue;
            }

            const indexedGlobalFunctions = index.findImplementationSymbols(candidateName)
                .filter(symbol => symbol.kind === 'global-function');
            const systemGlobalFunction = resolveSystemGlobalFunction(candidateName);

            if (indexedGlobalFunctions.length === 1 && !systemGlobalFunction) {
                dependencies.add(indexedGlobalFunctions[0].name);
                continue;
            }

            if (indexedGlobalFunctions.length > 1 || (indexedGlobalFunctions.length > 0 && systemGlobalFunction)) {
                notes.add(`La llamada ${inlineCode(candidateName)} tiene múltiples candidatas globales; se omite de dependencias para no inducir a error.`);
                continue;
            }

            if (systemGlobalFunction) {
                dependencies.add(systemGlobalFunction.name);
            }
        }
    }

    if (dependencies.size === 0) {
        notes.add('No hay evidencia fuerte suficiente para publicar funciones globales relevantes en esta salida v1.');
    }

    return {
        dependencies: [...dependencies].sort(sortStrings),
        notes: [...notes],
    };
}

function isDeclarationLikeStatement(statement: string): boolean {
    return /^\s*(?:forward\b|global\s+type\b|type\s+(?:variables\b|prototypes\b|[a-zA-Z_$#%])|public\s+function\b|private\s+function\b|protected\s+function\b|function\b|public\s+subroutine\b|private\s+subroutine\b|protected\s+subroutine\b|subroutine\b|event\b|on\b|end\b)/i.test(statement);
}

function resolveSupportedObjectType(
    rootSymbol: PbSymbol,
    index: SymbolIndex,
    uri: vscode.Uri,
): { objectType: SupportedPowerBuilderDocumentationObjectType; inferredFromAncestorChain: boolean } | undefined {
    const chain = [
        rootSymbol.baseTypeName,
        ...index.getAncestorTypeNames(uri),
    ];

    for (let indexPosition = 0; indexPosition < chain.length; indexPosition++) {
        const candidate = normalizeIdentifier(chain[indexPosition]);

        if (!candidate || !SUPPORTED_OBJECT_TYPES.has(candidate as SupportedPowerBuilderDocumentationObjectType)) {
            continue;
        }

        return {
            objectType: candidate as SupportedPowerBuilderDocumentationObjectType,
            inferredFromAncestorChain: indexPosition > 0,
        };
    }

    return undefined;
}

function toCallableSummary(symbol: PbSymbol): PowerBuilderDocumentationCallableSummary {
    return {
        name: symbol.name,
        kind: symbol.kind === 'event' ? 'event' : symbol.kind === 'subroutine' ? 'subroutine' : 'function',
        access: symbol.access,
        returnType: symbol.returnType,
        signature: symbol.signature,
        parameters: (symbol.children ?? [])
            .filter(child => child.declarationScope === 'parameter')
            .map(child => ({
                name: child.name,
                typeName: child.detail,
            }))
            .sort(compareByName),
        implementationKind: symbol.implementationKind,
        isExternal: symbol.isExternal,
        externalLibraryName: symbol.externalLibraryName,
    };
}

function toMemberSummary(symbol: PbSymbol): PowerBuilderDocumentationMemberSummary {
    return {
        name: symbol.name,
        typeName: symbol.detail,
        access: symbol.access,
        scope: resolveMemberScope(symbol),
    };
}

function resolveMemberScope(symbol: PbSymbol): 'instance' | 'shared' | 'global' | 'constant' {
    if (symbol.kind === 'constant') {
        return 'constant';
    }

    const normalizedAccess = normalizeIdentifier(symbol.access);

    if (normalizedAccess === 'shared') {
        return 'shared';
    }

    if (normalizedAccess === 'global') {
        return 'global';
    }

    return 'instance';
}

function normalizeCallableVisibility(access: string | undefined): 'public' | 'protected' | 'private' {
    const normalizedAccess = normalizeIdentifier(access);

    if (
        normalizedAccess === 'protected' ||
        normalizedAccess === 'protectedread' ||
        normalizedAccess === 'protectedwrite'
    ) {
        return 'protected';
    }

    if (
        normalizedAccess === 'private' ||
        normalizedAccess === 'privateread' ||
        normalizedAccess === 'privatewrite'
    ) {
        return 'private';
    }

    return 'public';
}

function buildDocumentationNotes(
    inferredFromAncestorChain: boolean,
    project: PbProjectDefinition | undefined,
    libraryName: string | undefined,
): string[] {
    const notes: string[] = [
        'La navegación y el rename mantienen los guardrails conservadores ya vigentes del índice y del proyecto preferido.',
    ];

    if (inferredFromAncestorChain) {
        notes.push('El tipo funcional del objeto se infiere desde la cadena de herencia indexada y no solo desde el ancestro directo.');
    }

    if (!project) {
        notes.push('No se pudo resolver un proyecto preferido; la salida se genera en modo workspace y puede omitir contexto de librería.');
    } else if (!libraryName) {
        notes.push('El proyecto preferido está resuelto, pero no se ha podido asociar una librería concreta al archivo fuente con evidencia fuerte.');
    }

    return notes;
}

function buildObjectSummary(
    objectType: SupportedPowerBuilderDocumentationObjectType,
    eventCount: number,
    callableCount: number,
    memberCount: number,
    highlightedMemberCount: number,
    inferredFromAncestorChain: boolean,
): { summary: string; role: string; confidence: PowerBuilderDocumentationConfidence } {
    const confidence: PowerBuilderDocumentationConfidence = inferredFromAncestorChain
        ? 'baja'
        : callableCount + eventCount + memberCount > 0
            ? 'media'
            : 'baja';

    switch (objectType) {
        case 'application':
            return {
                summary: `Aplicación PowerBuilder con ${eventCount} evento(s), ${callableCount} callable(s) y ${memberCount} miembro(s) indexados.`,
                role: 'Objeto raíz de aplicación orientado a arranque, ciclo de vida y coordinación global del workspace PowerBuilder.',
                confidence,
            };
        case 'menu':
            return {
                summary: `Menú PowerBuilder con ${highlightedMemberCount} miembro(s) visuales/anidados, ${eventCount} script(s) de evento y ${callableCount} callable(s) indexados.`,
                role: 'Superficie de menú y navegación con scripts asociados a elementos anidados del árbol de menú.',
                confidence,
            };
        case 'nonvisualobject':
            return {
                summary: `Objeto no visual con ${callableCount} callable(s), ${eventCount} evento(s) y ${memberCount} miembro(s) declarados.`,
                role: 'Componente de lógica reutilizable sin superficie visual directa, apoyado en API y estado interno indexados.',
                confidence,
            };
        case 'userobject':
            return {
                summary: `UserObject con ${callableCount} callable(s), ${eventCount} evento(s) y ${highlightedMemberCount} miembro(s) destacados indexados.`,
                role: 'Componente PowerBuilder reutilizable con identidad propia y composición tipada sobre la jerarquía de objetos.',
                confidence,
            };
        case 'window':
        default:
            return {
                summary: `Ventana PowerBuilder con ${eventCount} evento(s), ${callableCount} callable(s), ${memberCount} miembro(s) y ${highlightedMemberCount} control(es) o tipo(s) anidados indexados.`,
                role: 'Objeto visual orientado a interacción y ciclo de vida de ventana, documentado desde símbolos y herencia reales del workspace.',
                confidence,
            };
    }
}

function inferLibraryName(uri: vscode.Uri, project: PbProjectDefinition | undefined): string | undefined {
    if (!project) {
        return undefined;
    }

    const roots = [project.appEntryUri, ...project.libraryUris]
        .filter((candidate): candidate is vscode.Uri => !!candidate)
        .map(rootUri => ({
            rootUri,
            normalizedPath: normalizeWorkspaceUriPath(rootUri),
        }))
        .sort((left, right) => right.normalizedPath.length - left.normalizedPath.length);
    const sourcePath = normalizeWorkspaceUriPath(uri);

    for (const root of roots) {
        if (sourcePath === root.normalizedPath || sourcePath.startsWith(`${root.normalizedPath}/`)) {
            return vscode.workspace.asRelativePath(root.rootUri, false).replace(/\\/g, '/');
        }
    }

    return undefined;
}

function extractTypeReferences(typeName: string | undefined): string[] {
    if (!typeName) {
        return [];
    }

    const tokens = typeName
        .replace(/\[[^\]]*\]/g, '')
        .split(/[^a-zA-Z0-9_$#%`-]+/)
        .map(token => token.trim())
        .filter(token => token.length > 0)
        .filter(token => !TYPE_QUALIFIERS.has(normalizeIdentifier(token)))
        .filter(token => !PRIMITIVE_TYPE_NAMES.has(normalizeIdentifier(token)));

    return uniqueSorted(tokens);
}

function getWorkspaceRelativePath(uri: vscode.Uri): string {
    const relativePath = vscode.workspace.asRelativePath(uri, false);

    return (relativePath || uri.path).replace(/\\/g, '/');
}

function normalizeIdentifier(value: string | undefined): string {
    return value?.trim().toLowerCase() ?? '';
}

function compareByName<T extends { name: string }>(left: T, right: T): number {
    return sortStrings(left.name, right.name);
}

function sortStrings(left: string, right: string): number {
    return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

function uniqueSorted(values: Iterable<string>): string[] {
    return Array.from(new Set(Array.from(values).filter(value => value.trim().length > 0))).sort(sortStrings);
}

function formatInlineCodeList(values: readonly string[], fallback: string): string {
    if (values.length === 0) {
        return fallback;
    }

    return values.map(value => inlineCode(value)).join(', ');
}

function inlineCode(value: string): string {
    return `\`${value}\``;
}

function escapeTableCell(value: string): string {
    return value.replace(/\|/g, '\\|');
}