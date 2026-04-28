import * as vscode from 'vscode';
import {
    PbSemanticEvidence,
    SemanticAmbiguityReason,
    SemanticQueryPrecision,
    SemanticQueryService,
} from '../semantic';
import { getSymbolContextAtPosition } from '../document/documentUtils';
import { SymbolIndex } from '../indexing/symbolIndex';
import { PbSymbol } from '../models/pbSymbol';
import { getInheritanceGraph } from '../semantic/inheritanceGraph';
import { WorkspaceIndexer } from '../workspace/workspaceIndexer';
import { PowerBuilderProjectRegistry } from '../workspace/projectRegistry';
import { PbProjectDefinition, normalizeWorkspaceUriPath } from '../workspace/pbProjectModel';

type ActiveHierarchyScope = 'symbol' | 'document';

type ActiveHierarchyRootRole = 'app-entry' | 'library';

export interface ActiveHierarchyRootInfo {
    role: ActiveHierarchyRootRole;
    path: string;
}

export interface ActiveHierarchyProjectInfo {
    name: string;
    projectPath: string;
    applicationName?: string;
    matchScore: number;
    isPreferred: boolean;
    selectionReason: string;
    activeSourceRoot?: ActiveHierarchyRootInfo;
    effectiveRoots: ActiveHierarchyRootInfo[];
}

export interface ActiveHierarchySymbolInfo {
    name: string;
    kind: PbSymbol['kind'];
    sourcePath: string;
    containerName?: string;
    fileObjectName?: string;
    returnType?: string;
    projectName?: string;
    root?: ActiveHierarchyRootInfo;
    ownerHierarchy: string[];
    inheritanceDistance?: number;
}

export interface ActiveHierarchyRuntimeInfo {
    name: string;
    kind: string;
}

export interface ActiveHierarchyInspectionResult {
    scope: ActiveHierarchyScope;
    requestedWord?: string;
    documentPath: string;
    precision: SemanticQueryPrecision;
    confidence: 'alta' | 'media' | 'baja';
    summary: string;
    preferredProject?: ActiveHierarchyProjectInfo;
    projectMatches: ActiveHierarchyProjectInfo[];
    currentObjectName?: string;
    currentObjectHierarchy: string[];
    effectiveDocumentRoot?: ActiveHierarchyRootInfo;
    primarySymbol?: ActiveHierarchySymbolInfo;
    runtimeSymbol?: ActiveHierarchyRuntimeInfo;
    effectiveTargetRoot?: ActiveHierarchyRootInfo;
    relevantOwnerName?: string;
    relevantOwnerHierarchy: string[];
    candidateSymbols: ActiveHierarchySymbolInfo[];
    reasons: SemanticAmbiguityReason[];
    evidence: PbSemanticEvidence[];
}

export interface ActiveHierarchyGeneratedReport {
    kind: 'generated';
    inspection: ActiveHierarchyInspectionResult;
    markdown: string;
}

export interface ActiveHierarchyUnsupportedReport {
    kind: 'unsupported';
    reason: string;
}

export type ExplainActiveHierarchyResult =
    | ActiveHierarchyGeneratedReport
    | ActiveHierarchyUnsupportedReport;

export class PowerBuilderActiveHierarchyInspectionService {
    private readonly index = SymbolIndex.getInstance();
    private readonly workspaceIndexer = new WorkspaceIndexer(this.index);
    private readonly projectRegistry = PowerBuilderProjectRegistry.getInstance();
    private readonly semanticQueries = new SemanticQueryService(this.index);

    async explainForDocument(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): Promise<ExplainActiveHierarchyResult> {
        if (document.languageId !== 'powerbuilder') {
            return {
                kind: 'unsupported',
                reason: 'No hay ningún editor PowerBuilder activo para inspeccionar la jerarquía activa.',
            };
        }

        this.index.indexDocument(document, { silent: true });
        await this.workspaceIndexer.indexProjects({ indexSourceFiles: false });

        const initialProjectMatches = this.projectRegistry.findProjectsForSourceFile(document.uri);

        for (const project of initialProjectMatches) {
            await this.workspaceIndexer.indexProjectFile(project.uri);
        }

        this.index.indexDocument(document, { silent: true });

        const context = getSymbolContextAtPosition(document, position);
        const projectMatches = this.projectRegistry.findProjectsForSourceFile(document.uri);
        const preferredProject = projectMatches[0];
        const currentObjectName = this.index.findInnermostTypeAtPosition(document.uri, position)?.name
            ?? this.index.getPrimaryFileObjectName(document.uri);
        const inheritanceGraph = getInheritanceGraph(this.index);
        const currentObjectHierarchy = currentObjectName
            ? inheritanceGraph.getTypeHierarchy(currentObjectName)
            : [];
        const effectiveDocumentRoot = preferredProject
            ? this.resolveEffectiveRoot(preferredProject, document.uri)
            : undefined;

        if (!context) {
            const inspection = this.buildInspectionResult({
                scope: 'document',
                requestedWord: undefined,
                document,
                precision: 'blocked',
                projectMatches,
                preferredProject,
                currentObjectName,
                currentObjectHierarchy,
                effectiveDocumentRoot,
                primarySymbol: undefined,
                runtimeSymbol: undefined,
                candidateSymbols: [],
                reasons: [{
                    code: 'no-context',
                    detail: 'No hay símbolo resoluble bajo el cursor; la inspección se degrada al documento actual.',
                }],
                evidence: [],
            });

            return {
                kind: 'generated',
                inspection,
                markdown: renderActiveHierarchyMarkdown(inspection),
            };
        }

        const callResult = this.semanticQueries.resolveCallAtPosition({
            document,
            position,
            context,
        });
        const primarySymbolInfo = callResult.primarySymbol
            ? this.toSymbolInfo(callResult.primarySymbol, currentObjectName)
            : undefined;
        const candidateSymbols = this.toUniqueSymbolInfos(callResult.symbols, currentObjectName);
        const effectiveTargetRoot = primarySymbolInfo?.root;
        const relevantOwnerName = this.resolveRelevantOwnerName(callResult.primarySymbol);
        const relevantOwnerHierarchy = relevantOwnerName
            ? inheritanceGraph.getTypeHierarchy(relevantOwnerName)
            : [];

        const inspection = this.buildInspectionResult({
            scope: 'symbol',
            requestedWord: context.word,
            document,
            precision: callResult.precision,
            projectMatches,
            preferredProject,
            currentObjectName,
            currentObjectHierarchy,
            effectiveDocumentRoot,
            primarySymbol: primarySymbolInfo,
            runtimeSymbol: callResult.systemEntry
                ? {
                    name: callResult.systemEntry.name,
                    kind: callResult.systemEntry.kind,
                }
                : undefined,
            effectiveTargetRoot,
            relevantOwnerName,
            relevantOwnerHierarchy,
            candidateSymbols,
            reasons: callResult.reasons,
            evidence: callResult.evidence,
        });

        return {
            kind: 'generated',
            inspection,
            markdown: renderActiveHierarchyMarkdown(inspection),
        };
    }

    private buildInspectionResult(args: {
        scope: ActiveHierarchyScope;
        requestedWord?: string;
        document: vscode.TextDocument;
        precision: SemanticQueryPrecision;
        projectMatches: PbProjectDefinition[];
        preferredProject?: PbProjectDefinition;
        currentObjectName?: string;
        currentObjectHierarchy: string[];
        effectiveDocumentRoot?: ActiveHierarchyRootInfo;
        primarySymbol?: ActiveHierarchySymbolInfo;
        runtimeSymbol?: ActiveHierarchyRuntimeInfo;
        effectiveTargetRoot?: ActiveHierarchyRootInfo;
        relevantOwnerName?: string;
        relevantOwnerHierarchy?: string[];
        candidateSymbols: ActiveHierarchySymbolInfo[];
        reasons: SemanticAmbiguityReason[];
        evidence: PbSemanticEvidence[];
    }): ActiveHierarchyInspectionResult {
        const preferredProjectInfo = args.preferredProject
            ? this.toProjectInfo(args.preferredProject, args.document.uri, true, args.projectMatches)
            : undefined;
        const projectMatches = args.projectMatches.map(project =>
            this.toProjectInfo(project, args.document.uri, args.preferredProject?.uri.toString() === project.uri.toString(), args.projectMatches),
        );
        const confidence = mapPrecisionToConfidence(args.precision);
        const summary = buildInspectionSummary({
            scope: args.scope,
            requestedWord: args.requestedWord,
            precision: args.precision,
            preferredProject: preferredProjectInfo,
            effectiveDocumentRoot: args.effectiveDocumentRoot,
            primarySymbol: args.primarySymbol,
            runtimeSymbol: args.runtimeSymbol,
            reasons: args.reasons,
            currentObjectName: args.currentObjectName,
            relevantOwnerName: args.relevantOwnerName,
        });

        return {
            scope: args.scope,
            requestedWord: args.requestedWord,
            documentPath: toWorkspacePath(args.document.uri),
            precision: args.precision,
            confidence,
            summary,
            preferredProject: preferredProjectInfo,
            projectMatches,
            currentObjectName: args.currentObjectName,
            currentObjectHierarchy: args.currentObjectHierarchy,
            effectiveDocumentRoot: args.effectiveDocumentRoot,
            primarySymbol: args.primarySymbol,
            runtimeSymbol: args.runtimeSymbol,
            effectiveTargetRoot: args.effectiveTargetRoot,
            relevantOwnerName: args.relevantOwnerName,
            relevantOwnerHierarchy: args.relevantOwnerHierarchy ?? [],
            candidateSymbols: args.candidateSymbols,
            reasons: args.reasons,
            evidence: args.evidence,
        };
    }

    private toProjectInfo(
        project: PbProjectDefinition,
        documentUri: vscode.Uri,
        isPreferred: boolean,
        allMatches: readonly PbProjectDefinition[],
    ): ActiveHierarchyProjectInfo {
        const matchScore = this.projectRegistry.getProjectMatchScoreForSourceFile(documentUri, project);
        const activeSourceRoot = this.resolveEffectiveRoot(project, documentUri);
        const competingScores = allMatches.map(candidate =>
            this.projectRegistry.getProjectMatchScoreForSourceFile(documentUri, candidate),
        );
        const highestScore = Math.max(...competingScores, 0);
        const topScoreCount = competingScores.filter(score => score === highestScore).length;

        return {
            name: project.name,
            projectPath: toWorkspacePath(project.uri),
            applicationName: project.applicationName,
            matchScore,
            isPreferred,
            selectionReason: buildProjectSelectionReason({
                isPreferred,
                matchScore,
                activeSourceRoot,
                topScoreCount,
            }),
            activeSourceRoot,
            effectiveRoots: this.projectRegistry.getEffectiveProjectSourceRoots(project)
                .map(rootUri => this.toRootInfo(project, rootUri)),
        };
    }

    private toSymbolInfo(
        symbol: PbSymbol,
        currentObjectName?: string,
    ): ActiveHierarchySymbolInfo {
        const project = this.projectRegistry.getPreferredProjectForSourceFile(symbol.uri);
        const relevantOwnerName = this.resolveRelevantOwnerName(symbol);
        const ownerHierarchy = relevantOwnerName
            ? getInheritanceGraph(this.index).getTypeHierarchy(relevantOwnerName)
            : [];
        const inheritanceDistance = currentObjectName && relevantOwnerName
            ? getInheritanceGraph(this.index).getTypeDistance(currentObjectName, relevantOwnerName)
            : Number.POSITIVE_INFINITY;

        return {
            name: symbol.name,
            kind: symbol.kind,
            sourcePath: toWorkspacePath(symbol.uri),
            containerName: symbol.containerName,
            fileObjectName: symbol.fileObjectName,
            returnType: symbol.returnType,
            projectName: project?.name,
            root: project
                ? this.resolveEffectiveRoot(project, symbol.uri)
                : undefined,
            ownerHierarchy,
            inheritanceDistance: Number.isFinite(inheritanceDistance)
                ? inheritanceDistance
                : undefined,
        };
    }

    private toUniqueSymbolInfos(
        symbols: readonly PbSymbol[],
        currentObjectName?: string,
    ): ActiveHierarchySymbolInfo[] {
        const seen = new Set<string>();
        const result: ActiveHierarchySymbolInfo[] = [];

        for (const symbol of symbols) {
            const key = [
                symbol.uri.toString(),
                symbol.name,
                symbol.kind,
                symbol.range.start.line,
                symbol.range.start.character,
                symbol.signature ?? '',
            ].join('|');

            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            result.push(this.toSymbolInfo(symbol, currentObjectName));
        }

        return result;
    }

    private resolveRelevantOwnerName(symbol?: PbSymbol): string | undefined {
        if (!symbol) {
            return undefined;
        }

        if (symbol.kind === 'type' || symbol.kind === 'structure') {
            return symbol.name;
        }

        return symbol.fileObjectName
            ?? symbol.ownerName
            ?? symbol.parent
            ?? symbol.containerName;
    }

    private resolveEffectiveRoot(
        project: PbProjectDefinition,
        uri: vscode.Uri,
    ): ActiveHierarchyRootInfo | undefined {
        const sourcePath = normalizeWorkspaceUriPath(uri);
        const roots = this.projectRegistry.getEffectiveProjectSourceRoots(project)
            .map(rootUri => ({
                rootUri,
                normalizedPath: normalizeWorkspaceUriPath(rootUri),
            }))
            .filter(root => sourcePath === root.normalizedPath || sourcePath.startsWith(`${root.normalizedPath}/`))
            .sort((left, right) => right.normalizedPath.length - left.normalizedPath.length);
        const best = roots[0]?.rootUri;

        return best
            ? this.toRootInfo(project, best)
            : undefined;
    }

    private toRootInfo(
        project: PbProjectDefinition,
        rootUri: vscode.Uri,
    ): ActiveHierarchyRootInfo {
        return {
            role: project.appEntryUri && normalizeWorkspaceUriPath(project.appEntryUri) === normalizeWorkspaceUriPath(rootUri)
                ? 'app-entry'
                : 'library',
            path: toWorkspacePath(rootUri),
        };
    }
}

export function renderActiveHierarchyMarkdown(
    inspection: ActiveHierarchyInspectionResult,
): string {
    return [
        '# Jerarquía activa',
        renderSummarySection(inspection),
        renderProjectSection(inspection),
        renderRootsSection(inspection),
        renderInheritanceSection(inspection),
        renderResolutionSection(inspection),
    ].join('\n\n');
}

function renderSummarySection(inspection: ActiveHierarchyInspectionResult): string {
    return [
        '## Resumen',
        `- Archivo: ${inlineCode(inspection.documentPath)}`,
        `- Alcance inspeccionado: ${inlineCode(inspection.scope)}`,
        `- Símbolo solicitado: ${inlineCode(inspection.requestedWord ?? 'sin símbolo resoluble')}`,
        `- Precisión: ${inlineCode(inspection.precision)}`,
        `- Confianza: ${inlineCode(inspection.confidence)}`,
        `- Lectura rápida: ${inspection.summary}`,
    ].join('\n');
}

function renderProjectSection(inspection: ActiveHierarchyInspectionResult): string {
    const preferredProject = inspection.preferredProject
        ? [
            `- Proyecto preferido: ${inlineCode(inspection.preferredProject.name)}`,
            `- Archivo del proyecto: ${inlineCode(inspection.preferredProject.projectPath)}`,
            `- Motivo resumido: ${inspection.preferredProject.selectionReason}`,
        ]
        : ['- Proyecto preferido: sin proyecto preferido resoluble para el documento actual.'];

    return [
        '## Proyecto preferido',
        ...preferredProject,
        '',
        '### Proyectos coincidentes',
        renderProjectTable(inspection.projectMatches),
    ].join('\n');
}

function renderRootsSection(inspection: ActiveHierarchyInspectionResult): string {
    return [
        '## Librerías y roots efectivas',
        `- Root activa del documento: ${formatRootInline(inspection.effectiveDocumentRoot, 'sin root efectiva resoluble')}`,
        `- Root activa del destino resuelto: ${formatRootInline(inspection.effectiveTargetRoot, 'sin destino indexado en una root efectiva del proyecto actual')}`,
        `- Roots efectivas del proyecto preferido: ${formatRootList(inspection.preferredProject?.effectiveRoots ?? [], 'sin roots efectivas publicables')}`,
    ].join('\n');
}

function renderInheritanceSection(inspection: ActiveHierarchyInspectionResult): string {
    return [
        '## Herencia relevante',
        `- Objeto actual: ${inlineCode(inspection.currentObjectName ?? 'sin objeto raíz indexado')}`,
        `- Jerarquía actual: ${formatTypeHierarchy(inspection.currentObjectHierarchy, 'sin jerarquía indexada adicional')}`,
        `- Owner relevante del destino: ${inlineCode(inspection.relevantOwnerName ?? 'sin owner relevante publicable')}`,
        `- Jerarquía relevante: ${formatTypeHierarchy(inspection.relevantOwnerHierarchy, 'sin jerarquía relevante adicional')}`,
    ].join('\n');
}

function renderResolutionSection(inspection: ActiveHierarchyInspectionResult): string {
    const primarySymbolLines = inspection.primarySymbol
        ? [
            `- Símbolo primario: ${inlineCode(inspection.primarySymbol.name)} (${inlineCode(inspection.primarySymbol.kind)}) en ${inlineCode(inspection.primarySymbol.sourcePath)}`,
            `- Proyecto del símbolo primario: ${inlineCode(inspection.primarySymbol.projectName ?? 'sin proyecto preferido para el símbolo')}`,
            `- Root del símbolo primario: ${formatRootInline(inspection.primarySymbol.root, 'sin root efectiva resoluble')}`,
            `- Distancia de herencia relevante: ${inlineCode(formatDistance(inspection.primarySymbol.inheritanceDistance))}`,
        ]
        : ['- Símbolo primario: no hay candidato primario seguro en este contexto.'];
    const runtimeLines = inspection.runtimeSymbol
        ? [`- Runtime integrado: ${inlineCode(inspection.runtimeSymbol.name)} (${inlineCode(inspection.runtimeSymbol.kind)})`] 
        : [];

    return [
        '## Resolución y degradación',
        ...primarySymbolLines,
        ...runtimeLines,
        '',
        '### Razones',
        renderReasonList(inspection.reasons, 'Sin razones adicionales; el contexto es resoluble con la evidencia actual.'),
        '',
        '### Evidencia',
        renderEvidenceList(inspection.evidence, 'Sin evidencia adicional publicable.'),
        '',
        '### Candidatos considerados',
        renderCandidateTable(inspection.candidateSymbols),
    ].join('\n');
}

function renderProjectTable(projects: readonly ActiveHierarchyProjectInfo[]): string {
    if (projects.length === 0) {
        return 'Sin proyectos PowerBuilder coincidentes para el documento actual.';
    }

    return [
        '| Proyecto | Score | Preferido | Root activa | Nota |',
        '|---|---|---|---|---|',
        ...projects.map(project =>
            `| ${escapeTableCell(project.name)} | ${project.matchScore} | ${project.isPreferred ? 'sí' : 'no'} | ${escapeTableCell(formatRootPlain(project.activeSourceRoot, 'sin root activa'))} | ${escapeTableCell(project.selectionReason)} |`,
        ),
    ].join('\n');
}

function renderCandidateTable(candidates: readonly ActiveHierarchySymbolInfo[]): string {
    if (candidates.length === 0) {
        return 'Sin candidatos publicables en este contexto.';
    }

    return [
        '| Símbolo | Kind | Archivo | Proyecto | Root | Distancia de herencia |',
        '|---|---|---|---|---|---|',
        ...candidates.map(candidate =>
            `| ${escapeTableCell(candidate.name)} | ${escapeTableCell(candidate.kind)} | ${escapeTableCell(candidate.sourcePath)} | ${escapeTableCell(candidate.projectName ?? 'sin proyecto')} | ${escapeTableCell(formatRootPlain(candidate.root, 'sin root'))} | ${escapeTableCell(formatDistance(candidate.inheritanceDistance))} |`,
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

function buildInspectionSummary(args: {
    scope: ActiveHierarchyScope;
    requestedWord?: string;
    precision: SemanticQueryPrecision;
    preferredProject?: ActiveHierarchyProjectInfo;
    effectiveDocumentRoot?: ActiveHierarchyRootInfo;
    primarySymbol?: ActiveHierarchySymbolInfo;
    runtimeSymbol?: ActiveHierarchyRuntimeInfo;
    reasons: readonly SemanticAmbiguityReason[];
    currentObjectName?: string;
    relevantOwnerName?: string;
}): string {
    const projectSummary = args.preferredProject
        ? `El proyecto preferido actual es ${args.preferredProject.name}.`
        : 'No hay un proyecto preferido resoluble para el documento actual.';
    const rootSummary = args.effectiveDocumentRoot
        ? `La root activa del documento cae en ${formatRootPlain(args.effectiveDocumentRoot, '')}.`
        : 'No hay una root efectiva publicable para el documento.';

    if (args.primarySymbol) {
        const ownerSummary = args.relevantOwnerName
            ? `La herencia relevante pasa por ${args.relevantOwnerName}.`
            : 'No hay owner heredable publicable para el símbolo primario.';

        return `${projectSummary} ${rootSummary} El motor publica ${args.primarySymbol.name} como símbolo primario con precisión ${args.precision}. ${ownerSummary}`.trim();
    }

    if (args.runtimeSymbol) {
        return `${projectSummary} ${rootSummary} La llamada actual se resuelve contra el runtime integrado ${args.runtimeSymbol.name}, así que la jerarquía relevante se apoya en el objeto actual ${args.currentObjectName ?? 'sin objeto raíz indexado'}.`.trim();
    }

    if (args.scope === 'document') {
        return `${projectSummary} ${rootSummary} La inspección se degrada al documento porque no hay símbolo resoluble bajo el cursor.`.trim();
    }

    return `${projectSummary} ${rootSummary} El contexto sigue en ${args.precision} y no hay candidato primario seguro${args.reasons[0] ? `: ${args.reasons[0].detail}` : '.'}`.trim();
}

function buildProjectSelectionReason(args: {
    isPreferred: boolean;
    matchScore: number;
    activeSourceRoot?: ActiveHierarchyRootInfo;
    topScoreCount: number;
}): string {
    if (!args.isPreferred) {
        return 'Coincide con el documento, pero no gana la preferencia actual.';
    }

    if (args.topScoreCount > 1) {
        return 'Empata por score con otro proyecto coincidente; el registro mantiene un orden estable por nombre de proyecto.';
    }

    if (args.activeSourceRoot?.role === 'app-entry') {
        return `Gana por coincidir con el app entry efectivo del documento (score ${args.matchScore}).`;
    }

    if (args.activeSourceRoot?.role === 'library') {
        return `Gana por la root efectiva más específica que contiene el documento (score ${args.matchScore}).`;
    }

    return `Gana por score de preferencia ${args.matchScore}.`;
}

function mapPrecisionToConfidence(precision: SemanticQueryPrecision): 'alta' | 'media' | 'baja' {
    switch (precision) {
        case 'exact':
            return 'alta';
        case 'compatible':
            return 'media';
        default:
            return 'baja';
    }
}

function formatRootInline(root: ActiveHierarchyRootInfo | undefined, fallback: string): string {
    return root
        ? `${inlineCode(root.path)} (${inlineCode(root.role)})`
        : fallback;
}

function formatRootPlain(root: ActiveHierarchyRootInfo | undefined, fallback: string): string {
    return root
        ? `${root.path} (${root.role})`
        : fallback;
}

function formatRootList(roots: readonly ActiveHierarchyRootInfo[], fallback: string): string {
    if (roots.length === 0) {
        return fallback;
    }

    return roots.map(root => `${inlineCode(root.path)} (${inlineCode(root.role)})`).join(', ');
}

function formatTypeHierarchy(hierarchy: readonly string[], fallback: string): string {
    if (hierarchy.length === 0) {
        return fallback;
    }

    return hierarchy.map(inlineCode).join(' -> ');
}

function formatDistance(distance: number | undefined): string {
    if (distance === undefined) {
        return 'sin distancia heredable';
    }

    return String(distance);
}

function toWorkspacePath(uri: vscode.Uri): string {
    return (vscode.workspace.asRelativePath(uri, false) || uri.path).replace(/\\/g, '/');
}

function inlineCode(value: string): string {
    return `\`${value}\``;
}

function escapeTableCell(value: string): string {
    return value.replace(/\|/g, '\\|');
}
