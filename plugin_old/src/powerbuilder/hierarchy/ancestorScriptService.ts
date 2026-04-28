import * as vscode from 'vscode';
import { SymbolIndex } from '../indexing/symbolIndex';
import { PbSymbol } from '../models/pbSymbol';
import { getInheritanceGraph } from '../semantic/inheritanceGraph';
import { WorkspaceIndexer } from '../workspace/workspaceIndexer';
import { PowerBuilderProjectRegistry } from '../workspace/projectRegistry';

type AncestorScriptPrecision = 'exact' | 'blocked';

interface AncestorScriptReason {
    code: string;
    detail: string;
}

export interface AncestorScriptTypeInfo {
    name: string;
    sourcePath?: string;
    projectName?: string;
    linkTarget?: string;
}

export interface AncestorScriptSymbolInfo {
    name: string;
    kind: PbSymbol['kind'];
    ownerName?: string;
    ownerType?: AncestorScriptTypeInfo;
    sourcePath: string;
    projectName?: string;
    signature?: string;
    access?: string;
    parameterCount?: number;
    implementationKind?: string;
    inheritanceDistance?: number;
    linkTarget: string;
}

export interface AncestorScriptInspectionResult {
    documentPath: string;
    precision: AncestorScriptPrecision;
    currentObject?: AncestorScriptTypeInfo;
    directAncestor?: AncestorScriptTypeInfo;
    currentObjectHierarchy: string[];
    currentObjectHierarchyTypes: AncestorScriptTypeInfo[];
    inspectedAncestorTypes: AncestorScriptTypeInfo[];
    currentScript?: AncestorScriptSymbolInfo;
    ancestorScript?: AncestorScriptSymbolInfo;
    relationship: string;
    summary: string;
    reasons: AncestorScriptReason[];
}

export interface AncestorScriptGeneratedReport {
    kind: 'generated';
    inspection: AncestorScriptInspectionResult;
    markdown: string;
}

export interface AncestorScriptUnsupportedReport {
    kind: 'unsupported';
    reason: string;
}

export type FindAncestorScriptResult =
    | AncestorScriptGeneratedReport
    | AncestorScriptUnsupportedReport;

export class PowerBuilderAncestorScriptService {
    private readonly index = SymbolIndex.getInstance();
    private readonly workspaceIndexer = new WorkspaceIndexer(this.index);
    private readonly projectRegistry = PowerBuilderProjectRegistry.getInstance();

    async showForDocument(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): Promise<FindAncestorScriptResult> {
        if (document.languageId !== 'powerbuilder') {
            return {
                kind: 'unsupported',
                reason: 'No hay ningún editor PowerBuilder activo para localizar el script ancestro.',
            };
        }

        this.index.indexDocument(document, { silent: true });
        await this.workspaceIndexer.indexProjects({ indexSourceFiles: false });

        const projectMatches = this.projectRegistry.findProjectsForSourceFile(document.uri);

        for (const project of projectMatches) {
            await this.workspaceIndexer.indexProjectFile(project.uri);
        }

        this.index.indexDocument(document, { silent: true });

        const preferredProjectName = projectMatches[0]?.name;
        const currentObjectSymbol = this.index.findInnermostTypeAtPosition(document.uri, position)
            ?? this.index.getPrimaryFileObjectSymbol(document.uri);
        const currentObjectName = currentObjectSymbol?.name;
        const inheritanceGraph = getInheritanceGraph(this.index);
        const currentObjectHierarchy = currentObjectName
            ? inheritanceGraph.getTypeHierarchy(currentObjectName)
            : [];
        const inspectedAncestors = currentObjectHierarchy.slice(1);
        const currentObject = currentObjectName
            ? this.toTypeInfoByName(currentObjectName, preferredProjectName)
            : undefined;
        const directAncestor = inspectedAncestors[0]
            ? this.toTypeInfoByName(inspectedAncestors[0], preferredProjectName)
            : undefined;
        const currentObjectHierarchyTypes = this.toHierarchyTypeInfos(
            currentObjectHierarchy,
            preferredProjectName,
        );
        const inspectedAncestorTypes = this.toHierarchyTypeInfos(
            inspectedAncestors,
            preferredProjectName,
        );

        if (!currentObjectName) {
            return this.buildGeneratedReport({
                documentPath: toWorkspacePath(document.uri),
                precision: 'blocked',
                currentObject,
                directAncestor,
                currentObjectHierarchy,
                currentObjectHierarchyTypes,
                inspectedAncestorTypes,
                currentScript: undefined,
                ancestorScript: undefined,
                relationship: 'No se puede publicar una relación heredada porque el documento no expone un objeto actual indexado.',
                summary: 'La búsqueda del script ancestro queda bloqueada porque no existe un objeto PowerBuilder actual con cadena de herencia indexada.',
                reasons: [{
                    code: 'no-current-object',
                    detail: 'No se detecta un objeto raíz PowerBuilder indexado para el documento activo.',
                }],
            });
        }

        const currentCallable = this.index.findInnermostCallableAtPosition(document.uri, position);

        if (!currentCallable) {
            return this.buildGeneratedReport({
                documentPath: toWorkspacePath(document.uri),
                precision: 'blocked',
                currentObject,
                directAncestor,
                currentObjectHierarchy,
                currentObjectHierarchyTypes,
                inspectedAncestorTypes,
                currentScript: undefined,
                ancestorScript: undefined,
                relationship: 'No hay un script actual publicable bajo el cursor; la búsqueda se degrada al objeto actual sin navegar hacia ancestros.',
                summary: `La búsqueda queda bloqueada porque el cursor no cae dentro de un callable implementado de ${currentObjectName}.`,
                reasons: [{
                    code: 'no-callable-context',
                    detail: 'El cursor no está dentro de una función, subrutina o evento implementado del objeto actual.',
                }],
            });
        }

        if (currentCallable.isPrototype) {
            return this.buildGeneratedReport({
                documentPath: toWorkspacePath(document.uri),
                precision: 'blocked',
                currentObject,
                directAncestor,
                currentObjectHierarchy,
                currentObjectHierarchyTypes,
                inspectedAncestorTypes,
                currentScript: this.toScriptInfo(currentCallable, preferredProjectName),
                ancestorScript: undefined,
                relationship: 'La navegación se bloquea porque el contexto actual solo expone un prototype forward y no una implementación ejecutable.',
                summary: `El callable ${currentCallable.name} solo está disponible como prototype en el contexto actual; no se publica un script ancestro navegable.`,
                reasons: [{
                    code: 'prototype-only-context',
                    detail: 'El callable actual procede de forward prototypes y no de una implementación real del script.',
                }],
            });
        }

        const currentCallableOwnerName = this.resolveCallableOwnerName(currentCallable);

        if (
            currentCallableOwnerName &&
            normalizeIdentifier(currentCallableOwnerName) !== normalizeIdentifier(currentObjectName)
        ) {
            return this.buildGeneratedReport({
                documentPath: toWorkspacePath(document.uri),
                precision: 'blocked',
                currentObject,
                directAncestor,
                currentObjectHierarchy,
                currentObjectHierarchyTypes,
                inspectedAncestorTypes,
                currentScript: this.toScriptInfo(currentCallable, preferredProjectName),
                ancestorScript: undefined,
                relationship: 'La navegación se bloquea porque el script actual depende de un owner calificado distinto del objeto raíz del archivo.',
                summary: `El callable ${currentCallable.name} pertenece a ${currentCallableOwnerName} y esta primera entrega no publica Find Ancestor Script para owners calificados o controles anidados.`,
                reasons: [{
                    code: 'qualified-owner-context',
                    detail: `El callable actual pertenece a ${currentCallableOwnerName} y no al objeto raíz ${currentObjectName}.`,
                }],
            });
        }

        const currentScript = this.toScriptInfo(currentCallable, preferredProjectName);

        if (inspectedAncestors.length === 0) {
            return this.buildGeneratedReport({
                documentPath: toWorkspacePath(document.uri),
                precision: 'blocked',
                currentObject,
                directAncestor,
                currentObjectHierarchy,
                currentObjectHierarchyTypes,
                inspectedAncestorTypes,
                currentScript,
                ancestorScript: undefined,
                relationship: `El objeto actual ${currentObjectName} no declara ancestros indexados donde buscar un script heredado.`,
                summary: `La búsqueda queda bloqueada porque ${currentObjectName} no expone una cadena de herencia indexada más allá del propio objeto.`,
                reasons: [{
                    code: 'no-ancestor-type',
                    detail: `El objeto actual ${currentObjectName} no declara un ancestro indexado con evidencia suficiente.`,
                }],
            });
        }

        const ancestorMatch = this.findNearestAncestorScript(
            currentCallable,
            inspectedAncestors,
            preferredProjectName,
        );

        if (!ancestorMatch.symbol) {
            return this.buildGeneratedReport({
                documentPath: toWorkspacePath(document.uri),
                precision: 'blocked',
                currentObject,
                directAncestor,
                currentObjectHierarchy,
                currentObjectHierarchyTypes,
                inspectedAncestorTypes,
                currentScript,
                ancestorScript: undefined,
                relationship: `No se publica un script ancestro porque la cadena ${currentObjectHierarchy.join(' -> ')} no contiene una implementación indexada compatible de ${currentCallable.name}.`,
                summary: `La cadena de ancestros de ${currentObjectName} no ofrece una implementación única y navegable para ${currentCallable.name}.`,
                reasons: ancestorMatch.reasons,
            });
        }

        const ancestorScript = this.toScriptInfo(
            ancestorMatch.symbol,
            preferredProjectName,
            ancestorMatch.distance,
        );
        const ancestorOwnerName = ancestorScript.ownerName ?? inspectedAncestors[ancestorMatch.distance - 1] ?? 'un ancestro indexado';

        return this.buildGeneratedReport({
            documentPath: toWorkspacePath(document.uri),
            precision: 'exact',
            currentObject,
            directAncestor,
            currentObjectHierarchy,
            currentObjectHierarchyTypes,
            inspectedAncestorTypes,
            currentScript,
            ancestorScript,
            relationship: `El script actual ${currentCallable.name} sobrescribe o prolonga la cadena heredada desde ${ancestorOwnerName} a distancia ${ancestorMatch.distance}.`,
            summary: `Se publica navegación exacta desde ${currentCallable.name} hacia su script ancestro más cercano en ${ancestorOwnerName}.`,
            reasons: [],
        });
    }

    private buildGeneratedReport(
        inspection: AncestorScriptInspectionResult,
    ): AncestorScriptGeneratedReport {
        return {
            kind: 'generated',
            inspection,
            markdown: renderAncestorScriptMarkdown(inspection),
        };
    }

    private findNearestAncestorScript(
        currentCallable: PbSymbol,
        ancestors: readonly string[],
        preferredProjectName?: string,
    ): { symbol?: PbSymbol; distance: number; reasons: AncestorScriptReason[] } {
        for (let indexPosition = 0; indexPosition < ancestors.length; indexPosition += 1) {
            const ancestorName = ancestors[indexPosition];
            const rawCandidates = this.index.findImplementationSymbols(currentCallable.name)
                .filter(candidate => this.isAncestorScriptCandidate(candidate, currentCallable, ancestorName));

            if (rawCandidates.length === 0) {
                continue;
            }

            const scopedCandidates = this.filterCandidatesByProject(rawCandidates, preferredProjectName);
            const effectiveCandidates = scopedCandidates.length > 0
                ? scopedCandidates
                : rawCandidates;
            const uniqueCandidates = dedupeCallableCandidates(effectiveCandidates);

            if (uniqueCandidates.length === 1) {
                return {
                    symbol: uniqueCandidates[0],
                    distance: indexPosition + 1,
                    reasons: [],
                };
            }

            return {
                symbol: undefined,
                distance: indexPosition + 1,
                reasons: [{
                    code: 'ambiguous-ancestor-script',
                    detail: `Se detectaron ${uniqueCandidates.length} implementaciones candidatas de ${currentCallable.name} en ${ancestorName}; la navegación se bloquea por ambigüedad.`,
                }],
            };
        }

        return {
            symbol: undefined,
            distance: 0,
            reasons: [{
                code: 'no-ancestor-script',
                detail: `No hay ninguna implementación indexada de ${currentCallable.name} en la cadena ancestro del objeto actual.`,
            }],
        };
    }

    private isAncestorScriptCandidate(
        candidate: PbSymbol,
        currentCallable: PbSymbol,
        ancestorName: string,
    ): boolean {
        if (candidate.kind !== currentCallable.kind || candidate.isPrototype) {
            return false;
        }

        if (currentCallable.parameterCount !== undefined && candidate.parameterCount !== undefined) {
            if (currentCallable.parameterCount !== candidate.parameterCount) {
                return false;
            }
        }

        return normalizeIdentifier(this.resolveCallableOwnerName(candidate)) === normalizeIdentifier(ancestorName);
    }

    private filterCandidatesByProject(
        symbols: readonly PbSymbol[],
        preferredProjectName?: string,
    ): PbSymbol[] {
        if (!preferredProjectName) {
            return [...symbols];
        }

        return symbols.filter(symbol => this.projectRegistry.getPreferredProjectForSourceFile(symbol.uri)?.name === preferredProjectName);
    }

    private toHierarchyTypeInfos(
        hierarchy: readonly string[],
        preferredProjectName?: string,
    ): AncestorScriptTypeInfo[] {
        return hierarchy.map(typeName => this.toTypeInfoByName(typeName, preferredProjectName));
    }

    private toTypeInfoByName(
        typeName: string,
        preferredProjectName?: string,
    ): AncestorScriptTypeInfo {
        const symbol = this.pickTypeSymbol(typeName, preferredProjectName);

        return symbol
            ? this.toTypeInfoFromSymbol(symbol, preferredProjectName)
            : {
                name: typeName,
            };
    }

    private toTypeInfoFromSymbol(
        symbol: PbSymbol,
        preferredProjectName?: string,
    ): AncestorScriptTypeInfo {
        const project = this.projectRegistry.getPreferredProjectForSourceFile(symbol.uri);

        return {
            name: symbol.name,
            sourcePath: toWorkspacePath(symbol.uri),
            projectName: project?.name ?? preferredProjectName,
            linkTarget: buildMarkdownFileLinkTarget(symbol),
        };
    }

    private pickTypeSymbol(
        typeName: string,
        preferredProjectName?: string,
    ): PbSymbol | undefined {
        const candidates = this.index.findSymbolByName(typeName).filter(symbol =>
            (symbol.kind === 'type' || symbol.kind === 'structure') &&
            !symbol.parent,
        );

        if (candidates.length === 0) {
            return undefined;
        }

        const scopedCandidates = preferredProjectName
            ? candidates.filter(symbol => this.projectRegistry.getPreferredProjectForSourceFile(symbol.uri)?.name === preferredProjectName)
            : candidates;
        const effectiveCandidates = scopedCandidates.length > 0
            ? scopedCandidates
            : candidates;
        const uniqueCandidates = dedupeCallableCandidates(effectiveCandidates);

        return uniqueCandidates.length === 1
            ? uniqueCandidates[0]
            : undefined;
    }

    private toScriptInfo(
        symbol: PbSymbol,
        preferredProjectName?: string,
        inheritanceDistance?: number,
    ): AncestorScriptSymbolInfo {
        const project = this.projectRegistry.getPreferredProjectForSourceFile(symbol.uri);
        const ownerName = this.resolveCallableOwnerName(symbol);

        return {
            name: symbol.name,
            kind: symbol.kind,
            ownerName,
            ownerType: ownerName
                ? this.toTypeInfoByName(ownerName, preferredProjectName)
                : undefined,
            sourcePath: toWorkspacePath(symbol.uri),
            projectName: project?.name ?? preferredProjectName,
            signature: symbol.signature,
            access: symbol.access,
            parameterCount: symbol.parameterCount,
            implementationKind: symbol.implementationKind,
            inheritanceDistance,
            linkTarget: buildMarkdownFileLinkTarget(symbol),
        };
    }

    private resolveCallableOwnerName(symbol: PbSymbol): string | undefined {
        return symbol.fileObjectName
            ?? symbol.parent
            ?? symbol.containerName
            ?? symbol.ownerName;
    }
}

export function renderAncestorScriptMarkdown(
    inspection: AncestorScriptInspectionResult,
): string {
    return [
        '# Find Ancestor Script',
        renderSummarySection(inspection),
        renderChainSection(inspection),
        renderComparisonSection(inspection),
        renderResolutionSection(inspection),
    ].join('\n\n');
}

function renderSummarySection(inspection: AncestorScriptInspectionResult): string {
    return [
        '## Resumen',
        `- Archivo: ${inlineCode(inspection.documentPath)}`,
        `- Precisión: ${inlineCode(inspection.precision)}`,
        `- Objeto actual: ${formatTypeReference(inspection.currentObject, 'sin objeto actual indexado')}`,
        `- Script actual: ${formatScriptSummary(inspection.currentScript, 'sin callable actual publicable')}`,
        `- Ancestro directo del objeto: ${formatTypeReference(inspection.directAncestor, 'sin ancestro directo indexado')}`,
        `- Script ancestro: ${formatScriptSummary(inspection.ancestorScript, 'sin script ancestro publicable')}`,
        `- Lectura rápida: ${inspection.summary}`,
    ].join('\n');
}

function renderChainSection(inspection: AncestorScriptInspectionResult): string {
    return [
        '## Cadena inspeccionada',
        `- Jerarquía del objeto: ${formatTypeHierarchy(inspection.currentObjectHierarchyTypes, inspection.currentObjectHierarchy, 'sin jerarquía indexada adicional')}`,
        `- Ancestros inspeccionados: ${formatTypeHierarchy(inspection.inspectedAncestorTypes, inspection.currentObjectHierarchy.slice(1), 'sin ancestros inspeccionables')}`,
        `- Relación publicada: ${inspection.relationship}`,
    ].join('\n');
}

function renderComparisonSection(inspection: AncestorScriptInspectionResult): string {
    const rows: string[] = [];

    if (inspection.currentScript) {
        rows.push(renderScriptRow('actual', inspection.currentScript, 'exacto en el documento activo'));
    }

    if (inspection.ancestorScript) {
        rows.push(renderScriptRow(
            'ancestro',
            inspection.ancestorScript,
            `exacto por cadena heredada${inspection.ancestorScript.inheritanceDistance ? ` a distancia ${inspection.ancestorScript.inheritanceDistance}` : ''}`,
        ));
    }

    return [
        '## Scripts comparados',
        rows.length > 0
            ? [
                '| Rol | Script | Owner | Firma | Archivo | Proyecto | Cobertura |',
                '|---|---|---|---|---|---|---|',
                ...rows,
            ].join('\n')
            : 'Sin scripts publicables para comparar en el contexto actual.',
    ].join('\n');
}

function renderResolutionSection(inspection: AncestorScriptInspectionResult): string {
    return [
        '## Degradación y evidencia',
        '### Lectura de las acciones',
        '- exacto: el callable activo y su script ancestro salen de implementaciones indexadas únicas dentro de la cadena heredada del objeto actual',
        '- blocked: falta contexto callable, falta cadena heredada publicable o aparecen candidatos ambiguos y la navegación se cancela',
        '',
        '### Razones',
        renderReasonList(inspection.reasons, 'Sin razones adicionales; el script ancestro queda publicado con evidencia indexada única.'),
    ].join('\n');
}

function renderScriptRow(
    role: string,
    symbol: AncestorScriptSymbolInfo,
    coverage: string,
): string {
    return `| ${escapeTableCell(role)} | ${formatScriptReference(symbol, symbol.name)} | ${formatTypeReference(symbol.ownerType, symbol.ownerName ?? 'sin owner')} | ${escapeTableCell(symbol.signature ?? 'sin firma')} | ${escapeTableCell(symbol.sourcePath)} | ${escapeTableCell(symbol.projectName ?? 'sin proyecto')} | ${escapeTableCell(coverage)} |`;
}

function renderReasonList(reasons: readonly AncestorScriptReason[], fallback: string): string {
    if (reasons.length === 0) {
        return fallback;
    }

    return reasons.map(reason => `- ${inlineCode(reason.code)}: ${reason.detail}`).join('\n');
}

function formatTypeHierarchy(
    hierarchyTypes: readonly AncestorScriptTypeInfo[],
    hierarchyNames: readonly string[],
    fallback: string,
): string {
    if (hierarchyTypes.length === 0 && hierarchyNames.length === 0) {
        return fallback;
    }

    if (hierarchyTypes.length > 0) {
        return hierarchyTypes.map(typeInfo => formatTypeReference(typeInfo, typeInfo.name)).join(' -> ');
    }

    return hierarchyNames.map(inlineCode).join(' -> ');
}

function formatTypeReference(
    typeInfo: AncestorScriptTypeInfo | undefined,
    fallback: string,
): string {
    if (!typeInfo) {
        return inlineCode(fallback);
    }

    if (!typeInfo.linkTarget) {
        return inlineCode(typeInfo.name);
    }

    return `[${escapeMarkdownLinkLabel(typeInfo.name)}](${typeInfo.linkTarget})`;
}

function formatScriptReference(
    symbol: AncestorScriptSymbolInfo | undefined,
    fallback: string,
): string {
    if (!symbol) {
        return inlineCode(fallback);
    }

    return `[${escapeMarkdownLinkLabel(symbol.name)}](${symbol.linkTarget}) (${inlineCode(symbol.kind)})`;
}

function formatScriptSummary(
    symbol: AncestorScriptSymbolInfo | undefined,
    fallback: string,
): string {
    if (!symbol) {
        return inlineCode(fallback);
    }

    return `${inlineCode(symbol.name)} (${inlineCode(symbol.kind)})`;
}

function toWorkspacePath(uri: vscode.Uri): string {
    return (vscode.workspace.asRelativePath(uri, false) || uri.path).replace(/\\/g, '/');
}

function buildMarkdownFileLinkTarget(symbol: PbSymbol): string {
    return symbol.uri.with({
        fragment: `L${symbol.selectionRange.start.line + 1},${symbol.selectionRange.start.character + 1}`,
    }).toString();
}

function dedupeCallableCandidates(symbols: readonly PbSymbol[]): PbSymbol[] {
    const seen = new Set<string>();
    const result: PbSymbol[] = [];

    for (const symbol of symbols) {
        const key = [
            symbol.uri.toString(),
            symbol.selectionRange.start.line,
            symbol.selectionRange.start.character,
            symbol.name.toLowerCase(),
            symbol.kind,
            symbol.parameterCount ?? '',
        ].join('|');

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        result.push(symbol);
    }

    return result;
}

function normalizeIdentifier(value: string | undefined): string | undefined {
    const normalized = value?.trim().toLowerCase();
    return normalized && normalized.length > 0
        ? normalized
        : undefined;
}

function inlineCode(value: string): string {
    return `\`${value}\``;
}

function escapeTableCell(value: string): string {
    return value.replace(/\|/g, '\\|');
}

function escapeMarkdownLinkLabel(value: string): string {
    return value.replace(/[\[\]]/g, '');
}