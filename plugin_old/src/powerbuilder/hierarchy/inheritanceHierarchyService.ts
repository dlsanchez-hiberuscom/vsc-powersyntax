import * as vscode from 'vscode';
import {
    ActiveHierarchyGeneratedReport,
    ActiveHierarchySymbolInfo,
    PowerBuilderActiveHierarchyInspectionService,
} from './activeHierarchyInspectionService';
import {
    PbSemanticEvidence,
    SemanticAmbiguityReason,
    SemanticQueryPrecision,
} from '../semantic';
import { SymbolIndex } from '../indexing/symbolIndex';
import { PbSymbol } from '../models/pbSymbol';
import { getInheritanceGraph } from '../semantic/inheritanceGraph';
import { PowerBuilderProjectRegistry } from '../workspace/projectRegistry';

type InheritanceHierarchyScope = 'symbol' | 'document';

type InheritanceHierarchyFocusSource = 'current-object' | 'symbol-owner';

export interface InheritanceHierarchyTypeInfo {
    name: string;
    kind: 'type' | 'structure';
    sourcePath?: string;
    projectName?: string;
    baseTypeName?: string;
    linkTarget?: string;
}

export interface InheritanceHierarchyInspectionResult {
    scope: InheritanceHierarchyScope;
    requestedWord?: string;
    documentPath: string;
    precision: SemanticQueryPrecision;
    summary: string;
    currentObject?: InheritanceHierarchyTypeInfo;
    currentObjectName?: string;
    currentObjectHierarchy: string[];
    currentObjectHierarchyTypes: InheritanceHierarchyTypeInfo[];
    focusSource?: InheritanceHierarchyFocusSource;
    focusType?: InheritanceHierarchyTypeInfo;
    directAncestor?: InheritanceHierarchyTypeInfo;
    focusHierarchy: string[];
    focusHierarchyTypes: InheritanceHierarchyTypeInfo[];
    relationship: string;
    directDescendants: InheritanceHierarchyTypeInfo[];
    primarySymbol?: ActiveHierarchySymbolInfo;
    reasons: SemanticAmbiguityReason[];
    evidence: PbSemanticEvidence[];
}

export interface InheritanceHierarchyGeneratedReport {
    kind: 'generated';
    inspection: InheritanceHierarchyInspectionResult;
    markdown: string;
}

export interface InheritanceHierarchyUnsupportedReport {
    kind: 'unsupported';
    reason: string;
}

export type ShowInheritanceHierarchyResult =
    | InheritanceHierarchyGeneratedReport
    | InheritanceHierarchyUnsupportedReport;

export class PowerBuilderInheritanceHierarchyService {
    private readonly activeHierarchyService = new PowerBuilderActiveHierarchyInspectionService();
    private readonly index = SymbolIndex.getInstance();
    private readonly projectRegistry = PowerBuilderProjectRegistry.getInstance();

    async showForDocument(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): Promise<ShowInheritanceHierarchyResult> {
        const activeHierarchy = await this.activeHierarchyService.explainForDocument(document, position);

        if (activeHierarchy.kind !== 'generated') {
            return activeHierarchy;
        }

        return this.buildGeneratedReport(activeHierarchy);
    }

    private buildGeneratedReport(
        activeHierarchy: ActiveHierarchyGeneratedReport,
    ): InheritanceHierarchyGeneratedReport {
        const inspection = activeHierarchy.inspection;
        const inheritanceGraph = getInheritanceGraph(this.index);
        const focusTypeName = inspection.relevantOwnerName ?? inspection.currentObjectName;
        const focusSource: InheritanceHierarchyFocusSource | undefined = inspection.relevantOwnerName
            ? 'symbol-owner'
            : inspection.currentObjectName
                ? 'current-object'
                : undefined;
        const focusHierarchy = focusTypeName
            ? inheritanceGraph.getTypeHierarchy(focusTypeName)
            : [];
        const directAncestorName = focusHierarchy[1];
        const preferredProjectName = inspection.preferredProject?.name;
        const currentObject = inspection.currentObjectName
            ? this.toTypeInfoByName(inspection.currentObjectName, preferredProjectName)
            : undefined;
        const focusType = focusTypeName
            ? this.toTypeInfoByName(focusTypeName, preferredProjectName)
            : undefined;
        const directAncestor = directAncestorName
            ? this.toTypeInfoByName(directAncestorName, preferredProjectName)
            : undefined;
        const currentObjectHierarchyTypes = this.toHierarchyTypeInfos(
            inspection.currentObjectHierarchy,
            preferredProjectName,
        );
        const focusHierarchyTypes = this.toHierarchyTypeInfos(
            focusHierarchy,
            preferredProjectName,
        );
        const directDescendants = focusTypeName
            ? this.toUniqueTypeInfos(
                inheritanceGraph.getDirectDerivedTypes(focusTypeName),
                preferredProjectName,
            )
            : [];
        const relationship = this.buildRelationshipSummary(
            inspection.currentObjectName,
            focusTypeName,
            inspection.primarySymbol,
        );
        const hierarchyInspection: InheritanceHierarchyInspectionResult = {
            scope: inspection.scope,
            requestedWord: inspection.requestedWord,
            documentPath: inspection.documentPath,
            precision: inspection.precision,
            summary: this.buildSummary(
                inspection.currentObjectName,
                focusTypeName,
                directAncestorName,
                inspection.precision,
                inspection.primarySymbol,
                inspection.reasons,
            ),
            currentObject,
            currentObjectName: inspection.currentObjectName,
            currentObjectHierarchy: inspection.currentObjectHierarchy,
            currentObjectHierarchyTypes,
            focusSource,
            focusType,
            directAncestor,
            focusHierarchy,
            focusHierarchyTypes,
            relationship,
            directDescendants,
            primarySymbol: inspection.primarySymbol,
            reasons: inspection.reasons,
            evidence: inspection.evidence,
        };

        return {
            kind: 'generated',
            inspection: hierarchyInspection,
            markdown: renderInheritanceHierarchyMarkdown(hierarchyInspection),
        };
    }

    private toUniqueTypeInfos(
        symbols: readonly PbSymbol[],
        preferredProjectName?: string,
    ): InheritanceHierarchyTypeInfo[] {
        const seen = new Set<string>();
        const result: InheritanceHierarchyTypeInfo[] = [];

        for (const symbol of symbols) {
            const info = this.toTypeInfoFromSymbol(symbol, preferredProjectName);
            const key = [
                info.name.toLowerCase(),
                info.sourcePath ?? '',
                info.projectName ?? '',
            ].join('|');

            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            result.push(info);
        }

        return result;
    }

    private toHierarchyTypeInfos(
        hierarchy: readonly string[],
        preferredProjectName?: string,
    ): InheritanceHierarchyTypeInfo[] {
        return hierarchy.map(typeName => this.toTypeInfoByName(typeName, preferredProjectName));
    }

    private toTypeInfoByName(
        typeName: string,
        preferredProjectName?: string,
    ): InheritanceHierarchyTypeInfo {
        const symbol = this.pickTypeSymbol(typeName, preferredProjectName);

        return symbol
            ? this.toTypeInfoFromSymbol(symbol, preferredProjectName)
            : {
                name: typeName,
                kind: 'type',
            };
    }

    private toTypeInfoFromSymbol(
        symbol: PbSymbol,
        preferredProjectName?: string,
    ): InheritanceHierarchyTypeInfo {
        const project = this.projectRegistry.getPreferredProjectForSourceFile(symbol.uri);

        return {
            name: symbol.name,
            kind: symbol.kind === 'structure' ? 'structure' : 'type',
            sourcePath: toWorkspacePath(symbol.uri),
            projectName: project?.name ?? preferredProjectName,
            baseTypeName: symbol.baseTypeName,
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
        const uniqueCandidates = dedupeTypeCandidates(effectiveCandidates);

        return uniqueCandidates.length === 1
            ? uniqueCandidates[0]
            : undefined;
    }

    private buildSummary(
        currentObjectName: string | undefined,
        focusTypeName: string | undefined,
        directAncestorName: string | undefined,
        precision: SemanticQueryPrecision,
        primarySymbol: ActiveHierarchySymbolInfo | undefined,
        reasons: readonly SemanticAmbiguityReason[],
    ): string {
        if (!focusTypeName) {
            return reasons[0]
                ? `La inspección queda en ${precision} porque no hay un tipo enfocable seguro: ${reasons[0].detail}`
                : `La inspección queda en ${precision} porque no hay un tipo enfocable seguro.`;
        }

        if (currentObjectName && currentObjectName !== focusTypeName) {
            return primarySymbol
                ? `El objeto actual ${currentObjectName} se relaciona con el tipo ${focusTypeName} a través del símbolo ${primarySymbol.name}; el ancestro directo del foco es ${directAncestorName ?? 'desconocido'}.`
                : `El objeto actual ${currentObjectName} se relaciona con el tipo ${focusTypeName}; el ancestro directo del foco es ${directAncestorName ?? 'desconocido'}.`;
        }

        return `El foco heredable actual es ${focusTypeName} y su ancestro directo es ${directAncestorName ?? 'desconocido'}.`;
    }

    private buildRelationshipSummary(
        currentObjectName: string | undefined,
        focusTypeName: string | undefined,
        primarySymbol: ActiveHierarchySymbolInfo | undefined,
    ): string {
        if (!currentObjectName || !focusTypeName) {
            return 'No hay una relación heredable publicable entre objeto actual y foco.';
        }

        if (currentObjectName === focusTypeName) {
            return primarySymbol
                ? `El foco coincide con el objeto actual; ${primarySymbol.name} se resuelve dentro de esa misma jerarquía.`
                : 'El foco coincide con el objeto actual.';
        }

        return primarySymbol
            ? `El objeto actual ${currentObjectName} depende de un símbolo heredado desde ${focusTypeName} (${primarySymbol.name}).`
            : `El objeto actual ${currentObjectName} deriva del foco ${focusTypeName}.`;
    }
}

export function renderInheritanceHierarchyMarkdown(
    inspection: InheritanceHierarchyInspectionResult,
): string {
    return [
        '# Jerarquía de herencia',
        renderHierarchySummarySection(inspection),
        renderCurrentContextSection(inspection),
        renderFocusChainSection(inspection),
        renderDirectDescendantsSection(inspection),
        renderHierarchyResolutionSection(inspection),
    ].join('\n\n');
}

function renderHierarchySummarySection(inspection: InheritanceHierarchyInspectionResult): string {
    return [
        '## Resumen',
        `- Archivo: ${inlineCode(inspection.documentPath)}`,
        `- Alcance inspeccionado: ${inlineCode(inspection.scope)}`,
        `- Símbolo solicitado: ${inlineCode(inspection.requestedWord ?? 'sin símbolo resoluble')}`,
        `- Precisión: ${inlineCode(inspection.precision)}`,
        `- Tipo enfocado: ${formatTypeReference(inspection.focusType, 'sin tipo enfocable seguro')}`,
        `- Origen del foco: ${inlineCode(formatFocusSource(inspection.focusSource))}`,
        `- Lectura de la navegación: ${describeNavigationCoverage(inspection)}`,
        `- Lectura rápida: ${inspection.summary}`,
    ].join('\n');
}

function renderCurrentContextSection(inspection: InheritanceHierarchyInspectionResult): string {
    return [
        '## Contexto actual',
        `- Tipo actual: ${formatTypeReference(inspection.currentObject, 'sin objeto actual indexado')} · exacto sobre el documento activo cuando existe índice del archivo`,
        `- Jerarquía del tipo actual: ${formatTypeHierarchy(inspection.currentObjectHierarchyTypes, inspection.currentObjectHierarchy, 'sin jerarquía indexada adicional')}`,
        `- Relación con el foco: ${inspection.relationship}`,
        `- Símbolo primario: ${inspection.primarySymbol
            ? `${inlineCode(inspection.primarySymbol.name)} (${inlineCode(inspection.primarySymbol.kind)})`
            : 'sin símbolo primario seguro'}`,
    ].join('\n');
}

function renderFocusChainSection(inspection: InheritanceHierarchyInspectionResult): string {
    return [
        '## Cadena del foco',
        `- Tipo enfocado: ${formatTypeReference(inspection.focusType, 'sin tipo enfocable seguro')} · ${describeFocusResolution(inspection)}`,
        `- Ancestro directo: ${formatTypeReference(inspection.directAncestor, 'sin ancestro directo indexado')} · ${inspection.directAncestor?.linkTarget ? 'navegable con evidencia indexada' : 'sin target indexado seguro'}`,
        `- Cadena completa: ${formatTypeHierarchy(inspection.focusHierarchyTypes, inspection.focusHierarchy, 'sin cadena heredable publicable')}`,
    ].join('\n');
}

function renderDirectDescendantsSection(inspection: InheritanceHierarchyInspectionResult): string {
    return [
        '## Descendencia inmediata indexada',
        renderDirectDescendantTable(inspection.directDescendants),
    ].join('\n');
}

function renderHierarchyResolutionSection(inspection: InheritanceHierarchyInspectionResult): string {
    return [
        '## Degradación y evidencia',
        '### Lectura de las acciones',
        '- exacto: el foco sale del símbolo primario con precisión exacta y el target tiene archivo indexado único',
        '- contextual: el foco sale del owner relevante compatible o del objeto actual del documento',
        '- solo indexado: la descendencia inmediata sale del índice de tipos y no implica cobertura runtime completa',
        '- sin enlace: el nombre aparece, pero no se publica navegación si no hay target indexado seguro',
        '',
        '### Razones',
        renderReasonList(inspection.reasons, 'Sin razones adicionales; la jerarquía visible queda sustentada por la evidencia actual.'),
        '',
        '### Evidencia',
        renderEvidenceList(inspection.evidence, 'Sin evidencia adicional publicable.'),
    ].join('\n');
}

function renderDirectDescendantTable(descendants: readonly InheritanceHierarchyTypeInfo[]): string {
    if (descendants.length === 0) {
        return 'Sin descendencia inmediata indexada para el foco actual.';
    }

    return [
        '| Tipo | Cobertura | Base directa | Archivo | Proyecto |',
        '|---|---|---|---|---|',
        ...descendants.map(descendant =>
            `| ${formatTypeReference(descendant, descendant.name)} | solo indexado | ${escapeTableCell(descendant.baseTypeName ?? 'sin base')} | ${escapeTableCell(descendant.sourcePath ?? 'sin archivo')} | ${escapeTableCell(descendant.projectName ?? 'sin proyecto')} |`,
        ),
    ].join('\n');
}

function renderReasonList(reasons: readonly SemanticAmbiguityReason[], fallback: string): string {
    if (reasons.length === 0) {
        return fallback;
    }

    return reasons.map(reason =>
        `- ${inlineCode(reason.code)}: ${reason.detail}`,
    ).join('\n');
}

function renderEvidenceList(evidence: readonly PbSemanticEvidence[], fallback: string): string {
    if (evidence.length === 0) {
        return fallback;
    }

    return evidence.map(entry =>
        `- ${inlineCode(entry.kind)} / ${inlineCode(entry.precision)}: ${entry.detail}`,
    ).join('\n');
}

function formatTypeHierarchy(
    hierarchyTypes: readonly InheritanceHierarchyTypeInfo[],
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

function formatFocusSource(source: InheritanceHierarchyFocusSource | undefined): string {
    switch (source) {
        case 'symbol-owner':
            return 'owner relevante del símbolo';
        case 'current-object':
            return 'objeto actual del documento';
        default:
            return 'sin foco publicable';
    }
}

function toWorkspacePath(uri: vscode.Uri): string {
    return (vscode.workspace.asRelativePath(uri, false) || uri.path).replace(/\\/g, '/');
}

function buildMarkdownFileLinkTarget(symbol: PbSymbol): string {
    return symbol.uri.with({
        fragment: `L${symbol.selectionRange.start.line + 1},${symbol.selectionRange.start.character + 1}`,
    }).toString();
}

function dedupeTypeCandidates(symbols: readonly PbSymbol[]): PbSymbol[] {
    const seen = new Set<string>();
    const result: PbSymbol[] = [];

    for (const symbol of symbols) {
        const key = [
            symbol.uri.toString(),
            symbol.selectionRange.start.line,
            symbol.selectionRange.start.character,
            symbol.name.toLowerCase(),
        ].join('|');

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        result.push(symbol);
    }

    return result;
}

function describeNavigationCoverage(inspection: InheritanceHierarchyInspectionResult): string {
    if (!inspection.focusType) {
        return 'sin foco publicable';
    }

    if (inspection.focusSource === 'symbol-owner' && inspection.precision === 'exact') {
        return 'exacto para el foco, contextual para el resto de la jerarquía y solo indexado para descendencia';
    }

    if (inspection.focusSource === 'symbol-owner') {
        return 'contextual para el foco y solo indexado para descendencia';
    }

    return 'contextual desde el objeto actual y solo indexado para descendencia';
}

function describeFocusResolution(inspection: InheritanceHierarchyInspectionResult): string {
    if (!inspection.focusType) {
        return 'sin foco publicable';
    }

    if (inspection.focusSource === 'symbol-owner' && inspection.precision === 'exact') {
        return 'exacto sobre el símbolo primario';
    }

    if (inspection.focusSource === 'symbol-owner') {
        return 'contextual desde el owner relevante';
    }

    return 'contextual desde el objeto actual';
}

function formatTypeReference(
    typeInfo: InheritanceHierarchyTypeInfo | undefined,
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

function inlineCode(value: string): string {
    return `\`${value}\``;
}

function escapeTableCell(value: string): string {
    return value.replace(/\|/g, '\\|');
}

function escapeMarkdownLinkLabel(value: string): string {
    return value.replace(/[\[\]]/g, '');
}