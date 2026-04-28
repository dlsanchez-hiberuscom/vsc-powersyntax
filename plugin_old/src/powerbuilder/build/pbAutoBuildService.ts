import * as childProcess from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { Logger } from '../../core/logging/logger';
import { findIdeSafePowerBuilderFilesInRoots } from '../../core/utils/powerBuilderFileUtils';
import { SymbolIndex } from '../indexing/symbolIndex';
import { buildPbAutoBuildArgs, getPbBuildTargetKind, isPbBuildTargetUri } from './buildTargetUtils';
import { PbProjectParser } from '../workspace/pbProjectParser';
import { PbProjectDefinition } from '../workspace/pbProjectModel';
import { PowerBuilderProjectRegistry } from '../workspace/projectRegistry';

const DEFAULT_PBAUTOBUILD_CANDIDATES = [
    'C:/Program Files (x86)/Appeon/PowerBuilder 25.0/pbautobuild250.exe',
    'C:/Program Files/Appeon/PowerBuilder 25.0/pbautobuild250.exe',
    'C:/Program Files (x86)/Appeon/PowerBuilder 2025/pbautobuild250.exe',
    'C:/Program Files/Appeon/PowerBuilder 2025/pbautobuild250.exe',
];

const BUILD_DIAGNOSTIC_COLLECTION_NAME = 'powerbuilder-build';
const BUILD_DIAGNOSTIC_SOURCE = 'PBAutoBuild';
export const PBAUTOBUILD_LAST_TARGET_STORAGE_KEY = 'powerbuilder.build.lastTarget';

export const pbAutoBuildProcessAdapter = {
    spawn(
        executablePath: string,
        args: readonly string[],
        options: childProcess.SpawnOptionsWithoutStdio,
    ): childProcess.ChildProcessWithoutNullStreams {
        return childProcess.spawn(executablePath, [...args], options);
    },
};

export interface PbAutoBuildIssue {
    severity: vscode.DiagnosticSeverity;
    message: string;
    category: string;
    objectName?: string;
    libraryPath?: string;
    compilerCode?: string;
    nativeCode?: string;
    rawLine: string;
}

export interface PbAutoBuildCategorySummary {
    category: string;
    issueCount: number;
    errorCount: number;
    warningCount: number;
}

export interface PbAutoBuildLibrarySummary {
    libraryPath: string;
    issueCount: number;
    errorCount: number;
    warningCount: number;
    objectNames: string[];
}

export interface PbAutoBuildParsedOutput {
    issues: PbAutoBuildIssue[];
    rawLines: string[];
    summary: PbAutoBuildIssueSummary;
}

export interface PbAutoBuildProjectBuildResult {
    project: PbProjectDefinition;
    executablePath: string;
    args: string[];
    exitCode: number;
    output: string;
    issues: PbAutoBuildIssue[];
    diagnostics: Map<string, vscode.Diagnostic[]>;
    summary: PbAutoBuildIssueSummary;
    capturedAt?: string;
}

export interface PbAutoBuildIssueSummary {
    errorCount: number;
    warningCount: number;
    fatalCount: number;
    issueCount: number;
    categories: PbAutoBuildCategorySummary[];
    libraries: PbAutoBuildLibrarySummary[];
}

type PbAutoBuildLastTargetSource = 'session' | 'workspace-state';

interface PersistedPbAutoBuildLastTarget {
    uri: string;
    storedAt: string;
}

export interface PbAutoBuildLastTargetSnapshot {
    uri: string;
    name: string;
    kind: 'project' | 'workspace' | 'solution' | 'target-file';
    storedAt: string;
    source: PbAutoBuildLastTargetSource;
}

export interface PbAutoBuildSessionSnapshot {
    lastTarget?: PbAutoBuildLastTargetSnapshot;
}

interface ResolvedBuildTarget {
    uri: vscode.Uri;
    range: vscode.Range;
}

export class PowerBuilderAutoBuildService {
    private readonly collection = vscode.languages.createDiagnosticCollection(BUILD_DIAGNOSTIC_COLLECTION_NAME);
    private readonly projectRegistry = PowerBuilderProjectRegistry.getInstance();
    private readonly symbolIndex = SymbolIndex.getInstance();
    private readonly projectParser = new PbProjectParser();
    private lastBuildResult?: PbAutoBuildProjectBuildResult;
    private lastBuildProjectUri?: vscode.Uri;
    private lastBuildTarget?: PbAutoBuildLastTargetSnapshot;

    constructor(
        private readonly workspaceState?: Pick<vscode.Memento, 'get' | 'update'>,
    ) {
        this.restorePersistedLastBuildTarget();
    }

    dispose(): void {
        this.collection.dispose();
    }

    clearDiagnostics(): void {
        this.collection.clear();
    }

    getLastBuildResult(): PbAutoBuildProjectBuildResult | undefined {
        return this.lastBuildResult;
    }

    getSessionSnapshot(): PbAutoBuildSessionSnapshot {
        return {
            lastTarget: this.lastBuildTarget
                ? { ...this.lastBuildTarget }
                : undefined,
        };
    }

    async buildCurrentProject(document: vscode.TextDocument): Promise<PbAutoBuildProjectBuildResult> {
        const project = await this.resolveProjectForDocument(document);

        if (!project) {
            throw new Error('No se pudo resolver un proyecto PowerBuilder para el documento activo.');
        }

        return this.buildProject(project);
    }

    async rebuildLastProject(): Promise<PbAutoBuildProjectBuildResult> {
        if (!this.lastBuildProjectUri) {
            throw new Error('No hay una compilación previa en esta sesión.');
        }

        const project = await this.resolveProjectByUri(this.lastBuildProjectUri);

        if (!project) {
            throw new Error('No se pudo resolver el último proyecto compilado en esta sesión.');
        }

        return this.buildProject(project);
    }

    private async buildProject(project: PbProjectDefinition): Promise<PbAutoBuildProjectBuildResult> {
        const executablePath = await this.resolveExecutablePath();
        const args = buildPbAutoBuildArgs(project.uri);
        const output = await runPbAutoBuildProcess(executablePath, args, project.projectDirectoryUri.fsPath);
        const parsed = parsePbAutoBuildOutput(output.output);
        const effectiveIssues = parsed.issues.length > 0 || output.exitCode === 0
            ? parsed.issues
            : [buildFallbackIssue(output.output, output.exitCode)];
        const summary = summarizePbAutoBuildIssues(effectiveIssues);
        const diagnostics = await this.buildDiagnosticsForProject(project, effectiveIssues);

        this.collection.clear();

        for (const [uriKey, uriDiagnostics] of diagnostics.entries()) {
            this.collection.set(vscode.Uri.parse(uriKey), uriDiagnostics);
        }

        Logger.info(
            `PBAutoBuild: compilado ${project.name} con código ${output.exitCode} usando ${executablePath}.`,
        );

        if (output.output.trim()) {
            Logger.outputChannel.appendLine(output.output.trimEnd());
        }

        const result = {
            project,
            executablePath,
            args,
            exitCode: output.exitCode,
            output: output.output,
            issues: effectiveIssues,
            diagnostics,
            summary,
            capturedAt: new Date().toISOString(),
        };

        this.lastBuildProjectUri = project.uri;
        this.lastBuildResult = result;
        this.lastBuildTarget = createPbAutoBuildLastTargetSnapshot(
            project.uri,
            result.capturedAt ?? new Date().toISOString(),
            'session',
        );
        void this.persistLastBuildTarget(this.lastBuildTarget);

        return result;
    }

    private restorePersistedLastBuildTarget(): void {
        const persistedTarget = this.workspaceState?.get<PersistedPbAutoBuildLastTarget>(
            PBAUTOBUILD_LAST_TARGET_STORAGE_KEY,
        );
        const restoredTarget = restorePbAutoBuildLastTargetSnapshot(persistedTarget);

        if (!restoredTarget) {
            return;
        }

        this.lastBuildProjectUri = vscode.Uri.parse(restoredTarget.uri);
        this.lastBuildTarget = restoredTarget;
    }

    private async persistLastBuildTarget(target: PbAutoBuildLastTargetSnapshot): Promise<void> {
        if (!this.workspaceState) {
            return;
        }

        try {
            await this.workspaceState.update(PBAUTOBUILD_LAST_TARGET_STORAGE_KEY, {
                uri: target.uri,
                storedAt: target.storedAt,
            } satisfies PersistedPbAutoBuildLastTarget);
        } catch (error) {
            Logger.warn(
                `PBAutoBuild: no se pudo persistir el último target compilado: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    private async resolveProjectForDocument(document: vscode.TextDocument): Promise<PbProjectDefinition | undefined> {
        if (isBuildProjectUri(document.uri)) {
            return this.resolveProjectByUri(document.uri);
        }

        return this.projectRegistry.getPreferredProjectForSourceFile(document.uri);
    }

    private async resolveProjectByUri(uri: vscode.Uri): Promise<PbProjectDefinition | undefined> {
        const cachedProject = this.projectRegistry.getProject(uri);

        if (cachedProject) {
            return cachedProject;
        }

        const extension = path.extname(uri.fsPath || uri.path).toLowerCase();

        try {
            if (extension === '.pbproj') {
                const bytes = await vscode.workspace.fs.readFile(uri);
                const text = new TextDecoder('utf-8').decode(bytes);
                const parsedProject = this.projectParser.parseProjectText(uri, text);

                if (parsedProject) {
                    return parsedProject;
                }
            }

            if (isBuildProjectUri(uri)) {
                return buildAdHocBuildTarget(uri);
            }

            return undefined;
        } catch {
            return isBuildProjectUri(uri)
                ? buildAdHocBuildTarget(uri)
                : undefined;
        }
    }

    private async resolveExecutablePath(): Promise<string> {
        const configuredPath = vscode.workspace
            .getConfiguration('powerbuilder')
            .get<string>('build.pbAutoBuildPath', '')
            .trim();
        const envPath = process.env.PB_AUTOBUILD_PATH?.trim() ?? '';
        const candidates = [
            configuredPath,
            envPath,
            ...DEFAULT_PBAUTOBUILD_CANDIDATES,
        ].filter(candidate => candidate.length > 0);

        for (const candidate of candidates) {
            const normalizedCandidate = path.normalize(candidate);

            try {
                await fs.access(normalizedCandidate);
                return normalizedCandidate;
            } catch {
                // Probar siguiente candidato.
            }
        }

        throw new Error('No se encontró PBAutoBuild250.exe. Configura powerbuilder.build.pbAutoBuildPath o instala PowerBuilder 25.0.');
    }

    private async buildDiagnosticsForProject(
        project: PbProjectDefinition,
        issues: readonly PbAutoBuildIssue[],
    ): Promise<Map<string, vscode.Diagnostic[]>> {
        const diagnostics = new Map<string, vscode.Diagnostic[]>();
        const sourceRoots = this.projectRegistry.getEffectiveProjectSourceRoots(project);
        const projectFiles = sourceRoots.length > 0
            ? await findIdeSafePowerBuilderFilesInRoots(sourceRoots, true)
            : this.symbolIndex.getIndexedUris().filter(uri => !isBuildProjectUri(uri));
        const filesByBaseName = indexUrisByBaseName(projectFiles);

        for (const issue of issues) {
            const target = this.resolveIssueTarget(project, issue, filesByBaseName);

            if (!target) {
                continue;
            }

            const diagnostic = new vscode.Diagnostic(
                target.range,
                issue.message,
                issue.severity,
            );

            diagnostic.source = BUILD_DIAGNOSTIC_SOURCE;

            if (issue.compilerCode || issue.nativeCode) {
                diagnostic.code = [issue.compilerCode, issue.nativeCode]
                    .filter(code => !!code)
                    .join('/');
            }

            const key = target.uri.toString();
            const bucket = diagnostics.get(key) ?? [];
            bucket.push(diagnostic);
            diagnostics.set(key, bucket);
        }

        return diagnostics;
    }

    private resolveIssueTarget(
        project: PbProjectDefinition,
        issue: PbAutoBuildIssue,
        filesByBaseName: ReadonlyMap<string, vscode.Uri[]>,
    ): ResolvedBuildTarget | undefined {
        const objectName = issue.objectName?.trim();

        if (!objectName) {
            return {
                uri: project.uri,
                range: new vscode.Range(0, 0, 0, 0),
            };
        }

        const rawSymbolUris = this.symbolIndex
            .findImplementationSymbols(objectName)
            .map(symbol => symbol.uri);
        const scopedSymbolUris = this.hasProjectRoots(project)
            ? rawSymbolUris.filter(uri => this.projectRegistry.isSourceFileInProject(uri, project))
            : rawSymbolUris;
        const sortedSymbolUris = this.hasProjectRoots(project)
            ? this.projectRegistry.sortUrisByProjectPreference(scopedSymbolUris, project)
            : scopedSymbolUris.sort((left, right) => left.fsPath.localeCompare(right.fsPath));
        const symbolTargetUri = sortedSymbolUris[0];

        if (symbolTargetUri) {
            const primarySymbol = this.symbolIndex
                .getSymbolsForFile(symbolTargetUri)
                .find(symbol => symbol.name.toLowerCase() === objectName.toLowerCase());

            return {
                uri: symbolTargetUri,
                range: primarySymbol?.selectionRange ?? new vscode.Range(0, 0, 0, 0),
            };
        }

        const normalizedObjectName = objectName.toLowerCase();
        const fileTargetUri = filesByBaseName.get(normalizedObjectName)?.[0];

        if (!fileTargetUri) {
            return {
                uri: project.uri,
                range: new vscode.Range(0, 0, 0, 0),
            };
        }

        return {
            uri: fileTargetUri,
            range: new vscode.Range(0, 0, 0, 0),
        };
    }

        private hasProjectRoots(project: PbProjectDefinition): boolean {
            return !!project.appEntryUri || project.libraryUris.length > 0;
        }
}

export function parsePbAutoBuildOutput(text: string): PbAutoBuildParsedOutput {
    const rawLines = text.split(/\r?\n/);
    const issues: PbAutoBuildIssue[] = [];

    let currentLibrary: string | undefined;
    let currentObject: string | undefined;

    for (const rawLine of rawLines) {
        const match = /^\s*\d{2}:\d{2}:\d{2}\s+\[(?<level>[^\]]+)\]\s+(?<message>.*)$/.exec(rawLine);

        if (!match?.groups) {
            continue;
        }

        const level = match.groups.level.trim().toLowerCase();
        const message = normalizeWhitespace(match.groups.message);

        if (level === 'normal') {
            const libraryMatch = /^Library:\s*(.+)$/i.exec(message);

            if (libraryMatch) {
                currentLibrary = libraryMatch[1].trim();
                currentObject = undefined;
                continue;
            }

            const objectMatch = /^Object:\s*(.+)$/i.exec(message);

            if (objectMatch) {
                currentObject = objectMatch[1].trim();
            }

            continue;
        }

        if (level !== 'error' && level !== 'warning') {
            continue;
        }

        const issue = parseIssueMessage(message, rawLine, currentLibrary, currentObject, level);

        if (issue) {
            issues.push(issue);
        }
    }

    return {
        issues,
        rawLines,
        summary: summarizePbAutoBuildIssues(issues),
    };
}

function parseIssueMessage(
    message: string,
    rawLine: string,
    libraryPath: string | undefined,
    objectName: string | undefined,
    level: 'error' | 'warning',
): PbAutoBuildIssue | undefined {
    const detailedMatch = /^\((?<nativeCode>\d+)\):\s*(?<category>Error|Warning|Fatal)\s*(?<compilerCode>[A-Z]\d+):\s*(?<detail>.+)$/i.exec(message);

    if (detailedMatch?.groups) {
        return {
            severity: level === 'warning'
                ? vscode.DiagnosticSeverity.Warning
                : vscode.DiagnosticSeverity.Error,
            message: `${detailedMatch.groups.compilerCode}: ${detailedMatch.groups.detail.trim()}`,
            category: normalizeIssueCategory(detailedMatch.groups.category),
            objectName,
            libraryPath,
            compilerCode: detailedMatch.groups.compilerCode,
            nativeCode: detailedMatch.groups.nativeCode,
            rawLine,
        };
    }

    if (/failed to compile/i.test(message)) {
        return undefined;
    }

    return {
        severity: level === 'warning'
            ? vscode.DiagnosticSeverity.Warning
            : vscode.DiagnosticSeverity.Error,
        message,
        category: level === 'warning' ? 'Warning' : 'Error',
        objectName,
        libraryPath,
        rawLine,
    };
}

function normalizeIssueCategory(category: string): string {
    const normalized = normalizeWhitespace(category).toLowerCase();

    if (normalized === 'fatal') {
        return 'Fatal';
    }

    if (normalized === 'warning') {
        return 'Warning';
    }

    return 'Error';
}

function indexUrisByBaseName(uris: readonly vscode.Uri[]): Map<string, vscode.Uri[]> {
    const byBaseName = new Map<string, vscode.Uri[]>();

    for (const uri of uris) {
        const baseName = path.basename(uri.fsPath, path.extname(uri.fsPath)).toLowerCase();
        const bucket = byBaseName.get(baseName) ?? [];
        bucket.push(uri);
        byBaseName.set(baseName, bucket);
    }

    return byBaseName;
}

function isBuildProjectUri(uri: vscode.Uri): boolean {
    return isPbBuildTargetUri(uri);
}

function buildAdHocBuildTarget(uri: vscode.Uri): PbProjectDefinition {
    const fsPath = uri.fsPath || uri.path;
    const extension = path.extname(fsPath);
    const baseName = path.basename(fsPath, extension);

    return {
        uri,
        name: baseName,
        projectDirectoryUri: vscode.Uri.file(path.dirname(fsPath)),
        libraries: [],
        libraryUris: [],
    };
}

function createPbAutoBuildLastTargetSnapshot(
    uri: vscode.Uri,
    storedAt: string,
    source: PbAutoBuildLastTargetSource,
): PbAutoBuildLastTargetSnapshot {
    const fsPath = uri.fsPath || uri.path;

    return {
        uri: uri.toString(),
        name: path.parse(fsPath).name,
        kind: getPbBuildTargetKind(uri) ?? 'project',
        storedAt,
        source,
    };
}

function restorePbAutoBuildLastTargetSnapshot(
    persistedTarget: PersistedPbAutoBuildLastTarget | undefined,
): PbAutoBuildLastTargetSnapshot | undefined {
    if (!persistedTarget || typeof persistedTarget.uri !== 'string' || typeof persistedTarget.storedAt !== 'string') {
        return undefined;
    }

    try {
        const uri = vscode.Uri.parse(persistedTarget.uri);

        if (!isPbBuildTargetUri(uri)) {
            return undefined;
        }

        return createPbAutoBuildLastTargetSnapshot(uri, persistedTarget.storedAt, 'workspace-state');
    } catch {
        return undefined;
    }
}

function buildFallbackIssue(output: string, exitCode: number): PbAutoBuildIssue {
    const lastRelevantLine = output
        .split(/\r?\n/)
        .map(line => line.trim())
        .reverse()
        .find(line => line.length > 0);

    return {
        severity: vscode.DiagnosticSeverity.Error,
        message: lastRelevantLine
            ? `PBAutoBuild finalizó con código ${exitCode}: ${normalizeWhitespace(lastRelevantLine.replace(/^\d{2}:\d{2}:\d{2}\s+\[[^\]]+\]\s*/i, ''))}`
            : `PBAutoBuild finalizó con código ${exitCode}. Revisa el canal PowerBuilder para más detalle.`,
        category: 'Error',
        rawLine: lastRelevantLine ?? '',
    };
}

function normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

function runPbAutoBuildProcess(
    executablePath: string,
    args: readonly string[],
    cwd: string,
): Promise<{ exitCode: number; output: string }> {
    return new Promise((resolve, reject) => {
        const child = pbAutoBuildProcessAdapter.spawn(executablePath, args, {
            cwd,
            windowsHide: true,
        });

        let output = '';

        child.stdout.on('data', chunk => {
            output += chunk.toString();
        });
        child.stderr.on('data', chunk => {
            output += chunk.toString();
        });
        child.on('error', reject);
        child.on('close', exitCode => {
            resolve({
                exitCode: exitCode ?? -1,
                output,
            });
        });
    });
}

export function summarizePbAutoBuildIssues(
    issues: readonly PbAutoBuildIssue[],
): PbAutoBuildIssueSummary {
    let errorCount = 0;
    let warningCount = 0;
    let fatalCount = 0;
    const categoryBuckets = new Map<string, PbAutoBuildCategorySummary>();
    const libraryBuckets = new Map<string, {
        libraryPath: string;
        issueCount: number;
        errorCount: number;
        warningCount: number;
        objectNames: Set<string>;
    }>();

    for (const issue of issues) {
        if (issue.severity === vscode.DiagnosticSeverity.Warning) {
            warningCount++;
        } else {
            errorCount++;
        }

        if (issue.category.toLowerCase() === 'fatal') {
            fatalCount++;
        }

        const categoryBucket = categoryBuckets.get(issue.category) ?? {
            category: issue.category,
            issueCount: 0,
            errorCount: 0,
            warningCount: 0,
        };

        categoryBucket.issueCount++;

        if (issue.severity === vscode.DiagnosticSeverity.Warning) {
            categoryBucket.warningCount++;
        } else {
            categoryBucket.errorCount++;
        }

        categoryBuckets.set(issue.category, categoryBucket);

        const libraryKey = issue.libraryPath?.trim() || '(sin biblioteca)';
        const libraryBucket = libraryBuckets.get(libraryKey) ?? {
            libraryPath: libraryKey,
            issueCount: 0,
            errorCount: 0,
            warningCount: 0,
            objectNames: new Set<string>(),
        };

        libraryBucket.issueCount++;

        if (issue.severity === vscode.DiagnosticSeverity.Warning) {
            libraryBucket.warningCount++;
        } else {
            libraryBucket.errorCount++;
        }

        if (issue.objectName?.trim()) {
            libraryBucket.objectNames.add(issue.objectName.trim());
        }

        libraryBuckets.set(libraryKey, libraryBucket);
    }

    return {
        errorCount,
        warningCount,
        fatalCount,
        issueCount: errorCount + warningCount,
        categories: [...categoryBuckets.values()]
            .sort((left, right) => compareIssueCategories(left.category, right.category)),
        libraries: [...libraryBuckets.values()]
            .sort((left, right) => {
                if (left.issueCount !== right.issueCount) {
                    return right.issueCount - left.issueCount;
                }

                return left.libraryPath.localeCompare(right.libraryPath);
            })
            .map(bucket => ({
                libraryPath: bucket.libraryPath,
                issueCount: bucket.issueCount,
                errorCount: bucket.errorCount,
                warningCount: bucket.warningCount,
                objectNames: [...bucket.objectNames].sort((left, right) => left.localeCompare(right)),
            })),
    };
}

function compareIssueCategories(left: string, right: string): number {
    const priority = new Map<string, number>([
        ['Fatal', 0],
        ['Error', 1],
        ['Warning', 2],
    ]);

    const leftPriority = priority.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = priority.get(right) ?? Number.MAX_SAFE_INTEGER;

    if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
    }

    return left.localeCompare(right);
}

export function formatPbAutoBuildOutputDocument(
    result: PbAutoBuildProjectBuildResult,
): string {
    const summary = result.summary;
    const categoryLines = summary.categories.length > 0
        ? [
            'Categorias:',
            ...summary.categories.map(category =>
                `- ${category.category}: ${category.issueCount} problema(s) · ${category.errorCount} error(es) · ${category.warningCount} warning(s)`),
            '',
        ]
        : [];
    const libraryLines = summary.libraries.length > 0
        ? [
            'Bibliotecas:',
            ...summary.libraries.map(library => {
                const objectSummary = library.objectNames.length > 0
                    ? ` · objetos: ${library.objectNames.join(', ')}`
                    : '';

                return `- ${library.libraryPath}: ${library.issueCount} problema(s) · ${library.errorCount} error(es) · ${library.warningCount} warning(s)${objectSummary}`;
            }),
            '',
        ]
        : [];

    return [
        `Proyecto: ${result.project.name}`,
        `Comando: ${result.executablePath} ${result.args.join(' ')}`,
        `Resultado: código ${result.exitCode} · ${summary.errorCount} error(es) · ${summary.warningCount} warning(s) · ${summary.fatalCount} fatal(es)`,
        '',
        ...categoryLines,
        ...libraryLines,
        result.output.trim().length > 0
            ? result.output.trimEnd()
            : 'Sin salida capturada de PBAutoBuild.',
    ].join('\n');
}