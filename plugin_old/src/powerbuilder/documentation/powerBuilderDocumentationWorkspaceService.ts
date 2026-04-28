import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import {
    PowerBuilderObjectDocumentationModel,
    SupportedPowerBuilderDocumentationObjectType,
    analyzePowerBuilderObjectDocumentation,
    renderPowerBuilderObjectDocumentationMarkdown,
} from './powerBuilderDocumentationGenerator';
import { SymbolIndex } from '../indexing/symbolIndex';
import { WorkspaceIndexer } from '../indexing/workspaceIndexer';
import { PowerBuilderProjectRegistry } from '../workspace/projectRegistry';
import { PbProjectDefinition } from '../workspace/pbProjectModel';

export interface PowerBuilderGeneratedMarkdownFile {
    uri: vscode.Uri;
    relativePath: string;
}

export interface PowerBuilderGeneratedJsonFile {
    uri: vscode.Uri;
    relativePath: string;
}

export interface PowerBuilderExcludedDocumentationObject {
    objectName: string;
    sourcePath: string;
    reason: string;
}

export type GenerateCurrentObjectDocumentationResult =
    | {
        kind: 'generated';
        file: PowerBuilderGeneratedMarkdownFile;
        jsonFile: PowerBuilderGeneratedJsonFile;
        model: PowerBuilderObjectDocumentationModel;
        project?: PbProjectDefinition;
    }
    | {
        kind: 'unsupported';
        reason: string;
    };

export type GenerateCurrentProjectDocumentationResult =
    | {
        kind: 'generated';
        project: PbProjectDefinition;
        objectFiles: PowerBuilderGeneratedMarkdownFile[];
        objectJsonFiles: PowerBuilderGeneratedJsonFile[];
        indexFiles: PowerBuilderGeneratedMarkdownFile[];
        excludedObjects: PowerBuilderExcludedDocumentationObject[];
    }
    | {
        kind: 'no-project';
        reason: string;
    };

export type RegenerateDocumentationIndexesResult =
    | {
        kind: 'generated';
        projects: Array<{
            project: PbProjectDefinition;
            indexFiles: PowerBuilderGeneratedMarkdownFile[];
            excludedObjects: PowerBuilderExcludedDocumentationObject[];
        }>;
    }
    | {
        kind: 'no-projects';
        reason: string;
    };

interface ProjectDocumentationArtifacts {
    project: PbProjectDefinition;
    models: PowerBuilderObjectDocumentationModel[];
    objectFiles: PowerBuilderGeneratedMarkdownFile[];
    objectJsonFiles: PowerBuilderGeneratedJsonFile[];
    indexFiles: PowerBuilderGeneratedMarkdownFile[];
    excludedObjects: PowerBuilderExcludedDocumentationObject[];
}

const OBJECT_ROOT_RELATIVE_DIR = 'docs/generated/powerbuilder/objects';
const INDEX_ROOT_RELATIVE_DIR = 'docs/generated/powerbuilder/indexes';

export class PowerBuilderDocumentationWorkspaceService {
    private readonly index = SymbolIndex.getInstance();
    private readonly workspaceIndexer = new WorkspaceIndexer(this.index);
    private readonly projectRegistry = PowerBuilderProjectRegistry.getInstance();

    async generateDocumentationForCurrentObject(
        document: vscode.TextDocument,
    ): Promise<GenerateCurrentObjectDocumentationResult> {
        const project = await this.resolvePreferredProjectForDocument(document.uri);

        if (project) {
            await this.workspaceIndexer.indexProjectFile(project.uri);
        } else {
            this.index.indexDocument(document);
        }

        const model = analyzePowerBuilderObjectDocumentation(document, this.index, project);

        if (!model) {
            return {
                kind: 'unsupported',
                reason: this.describeUnsupportedDocument(document),
            };
        }

        const commandId = 'powerbuilder.generateDocumentationCurrentObject';
        const generatedAt = new Date();
        const output = this.buildObjectOutputTarget(model, document.uri, project);
        const jsonOutput = this.buildObjectJsonOutputTarget(model, document.uri, project);
        const markdown = renderPowerBuilderObjectDocumentationMarkdown(model, {
            commandId,
            generatedAt,
        });
        const jsonPayload = this.buildObjectDocumentationJsonPayload(model, commandId, generatedAt);

        await this.writeMarkdownFile(output.uri, markdown);
        await this.writeJsonFile(jsonOutput.uri, jsonPayload);

        return {
            kind: 'generated',
            file: output,
            jsonFile: jsonOutput,
            model,
            project,
        };
    }

    async generateDocumentationForCurrentProject(
        document: vscode.TextDocument,
    ): Promise<GenerateCurrentProjectDocumentationResult> {
        const project = await this.resolvePreferredProjectForDocument(document.uri);

        if (!project) {
            return {
                kind: 'no-project',
                reason: 'No se pudo resolver un proyecto PowerBuilder preferido para el archivo activo.',
            };
        }

        const artifacts = await this.generateProjectArtifacts(project, true, 'powerbuilder.generateDocumentationCurrentProject');

        return {
            kind: 'generated',
            project,
            objectFiles: artifacts.objectFiles,
            objectJsonFiles: artifacts.objectJsonFiles,
            indexFiles: artifacts.indexFiles,
            excludedObjects: artifacts.excludedObjects,
        };
    }

    async regenerateDocumentationIndexes(): Promise<RegenerateDocumentationIndexesResult> {
        const projects = await this.workspaceIndexer.indexProjects({ indexSourceFiles: true });

        if (projects.length === 0) {
            return {
                kind: 'no-projects',
                reason: 'No se han detectado proyectos PowerBuilder para regenerar índices.',
            };
        }

        const results: Array<{
            project: PbProjectDefinition;
            indexFiles: PowerBuilderGeneratedMarkdownFile[];
            excludedObjects: PowerBuilderExcludedDocumentationObject[];
        }> = [];

        for (const project of projects.sort((left, right) => sortStrings(left.name, right.name))) {
            const artifacts = await this.generateProjectArtifacts(project, false, 'powerbuilder.regenerateDocumentationIndexes');

            results.push({
                project,
                indexFiles: artifacts.indexFiles,
                excludedObjects: artifacts.excludedObjects,
            });
        }

        return {
            kind: 'generated',
            projects: results,
        };
    }

    private async resolvePreferredProjectForDocument(uri: vscode.Uri): Promise<PbProjectDefinition | undefined> {
        await this.workspaceIndexer.indexProjects({ indexSourceFiles: false });
        return this.workspaceIndexer.getPreferredProjectForSourceFile(uri);
    }

    private async generateProjectArtifacts(
        project: PbProjectDefinition,
        includeObjectFiles: boolean,
        commandId: string,
    ): Promise<ProjectDocumentationArtifacts> {
        await this.workspaceIndexer.indexProjectFile(project.uri);

        const documentUris = this.index.getIndexedUris()
            .filter(uri => this.projectRegistry.isSourceFileInProject(uri, project))
            .sort((left, right) => sortStrings(this.toRelativeWorkspacePath(left), this.toRelativeWorkspacePath(right)));
        const generatedAt = new Date();
        const models: PowerBuilderObjectDocumentationModel[] = [];
        const objectFiles: PowerBuilderGeneratedMarkdownFile[] = [];
        const objectJsonFiles: PowerBuilderGeneratedJsonFile[] = [];
        const excludedObjects: PowerBuilderExcludedDocumentationObject[] = [];

        for (const uri of documentUris) {
            const document = await vscode.workspace.openTextDocument(uri);
            const model = analyzePowerBuilderObjectDocumentation(document, this.index, project);

            if (!model) {
                excludedObjects.push(this.buildExcludedObject(uri));
                continue;
            }

            models.push(model);

            if (!includeObjectFiles) {
                continue;
            }

            const output = this.buildObjectOutputTarget(model, uri, project);
            const jsonOutput = this.buildObjectJsonOutputTarget(model, uri, project);
            const markdown = renderPowerBuilderObjectDocumentationMarkdown(model, {
                commandId,
                generatedAt,
            });
            const jsonPayload = this.buildObjectDocumentationJsonPayload(model, commandId, generatedAt);

            await this.writeMarkdownFile(output.uri, markdown);
            await this.writeJsonFile(jsonOutput.uri, jsonPayload);
            objectFiles.push(output);
            objectJsonFiles.push(jsonOutput);
        }

        const sortedModels = [...models].sort((left, right) => {
            if (left.objectType !== right.objectType) {
                return sortStrings(left.objectType, right.objectType);
            }

            if (left.objectName !== right.objectName) {
                return sortStrings(left.objectName, right.objectName);
            }

            return sortStrings(left.sourcePath, right.sourcePath);
        });
        const indexFiles = await this.writeProjectIndexes(
            project,
            sortedModels,
            excludedObjects,
            generatedAt,
            commandId,
        );

        return {
            project,
            models: sortedModels,
            objectFiles,
            objectJsonFiles,
            indexFiles,
            excludedObjects,
        };
    }

    private async writeProjectIndexes(
        project: PbProjectDefinition,
        models: readonly PowerBuilderObjectDocumentationModel[],
        excludedObjects: readonly PowerBuilderExcludedDocumentationObject[],
        generatedAt: Date,
        commandId: string,
    ): Promise<PowerBuilderGeneratedMarkdownFile[]> {
        const targets = this.buildIndexTargets(project, models, excludedObjects, generatedAt, commandId);

        for (const target of targets) {
            await this.writeMarkdownFile(target.uri, target.markdown);
        }

        return targets.map(target => ({
            uri: target.uri,
            relativePath: target.relativePath,
        }));
    }

    private buildIndexTargets(
        project: PbProjectDefinition,
        models: readonly PowerBuilderObjectDocumentationModel[],
        excludedObjects: readonly PowerBuilderExcludedDocumentationObject[],
        generatedAt: Date,
        commandId: string,
    ): Array<PowerBuilderGeneratedMarkdownFile & { markdown: string }> {
        const projectSegment = sanitizeSegment(project.name);
        const workspaceFolder = this.getWorkspaceFolderForUri(project.uri);
        const indexRootRelativePath = `${INDEX_ROOT_RELATIVE_DIR}/${projectSegment}`;
        const indexRootAbsolutePath = path.join(workspaceFolder.uri.fsPath, ...indexRootRelativePath.split('/'));
        const generatedAtText = generatedAt.toISOString();
        const objectLinks = new Map<string, string>();

        for (const model of models) {
            const objectTarget = this.buildObjectOutputTarget(model, model.sourceUri, project);
            const relativeLink = path.posix.relative(indexRootRelativePath, objectTarget.relativePath);
            objectLinks.set(model.objectName, relativeLink || path.posix.basename(objectTarget.relativePath));
        }

        const metadataLines = [
            '',
            '## Metadatos de generación',
            `- Fecha: \`${generatedAtText}\``,
            `- Comando usado: \`${commandId}\``,
            `- Proyecto: \`${project.name}\``,
        ].join('\n');

        const projectIndexMarkdown = [
            `# ${project.name} — Project Index`,
            '## Resumen',
            `- Objetos documentados: ${models.length}`,
            `- Objetos excluidos: ${excludedObjects.length}`,
            `- Tipos cubiertos: ${renderObjectTypeCounts(models)}`,
            '',
            '## Objetos documentados',
            renderProjectIndexTable(models, objectLinks),
            '',
            '## Exclusiones conservadoras',
            renderExcludedObjects(excludedObjects),
            metadataLines,
        ].join('\n');
        const objectsByTypeMarkdown = [
            `# ${project.name} — Objects by Type`,
            ...renderObjectsByType(models, objectLinks),
            metadataLines,
        ].join('\n\n');
        const inheritanceIndexMarkdown = [
            `# ${project.name} — Inheritance Index`,
            renderInheritanceIndex(models, objectLinks),
            metadataLines,
        ].join('\n\n');
        const publicApiIndexMarkdown = [
            `# ${project.name} — Public API Index`,
            renderPublicApiIndex(models, objectLinks),
            metadataLines,
        ].join('\n\n');
        const dependenciesIndexMarkdown = [
            `# ${project.name} — Dependencies Index`,
            renderDependenciesIndex(models, objectLinks),
            metadataLines,
        ].join('\n\n');
        const eventScriptsIndexMarkdown = [
            `# ${project.name} — Event Scripts Index`,
            renderEventScriptsIndex(models, objectLinks),
            metadataLines,
        ].join('\n\n');

        return [
            {
                uri: vscode.Uri.file(path.join(indexRootAbsolutePath, 'project-index.md')),
                relativePath: `${indexRootRelativePath}/project-index.md`,
                markdown: projectIndexMarkdown,
            },
            {
                uri: vscode.Uri.file(path.join(indexRootAbsolutePath, 'objects-by-type.md')),
                relativePath: `${indexRootRelativePath}/objects-by-type.md`,
                markdown: objectsByTypeMarkdown,
            },
            {
                uri: vscode.Uri.file(path.join(indexRootAbsolutePath, 'inheritance-index.md')),
                relativePath: `${indexRootRelativePath}/inheritance-index.md`,
                markdown: inheritanceIndexMarkdown,
            },
            {
                uri: vscode.Uri.file(path.join(indexRootAbsolutePath, 'public-api-index.md')),
                relativePath: `${indexRootRelativePath}/public-api-index.md`,
                markdown: publicApiIndexMarkdown,
            },
            {
                uri: vscode.Uri.file(path.join(indexRootAbsolutePath, 'dependencies-index.md')),
                relativePath: `${indexRootRelativePath}/dependencies-index.md`,
                markdown: dependenciesIndexMarkdown,
            },
            {
                uri: vscode.Uri.file(path.join(indexRootAbsolutePath, 'event-scripts-index.md')),
                relativePath: `${indexRootRelativePath}/event-scripts-index.md`,
                markdown: eventScriptsIndexMarkdown,
            },
        ];
    }

    private buildObjectOutputTarget(
        model: PowerBuilderObjectDocumentationModel,
        uri: vscode.Uri,
        project: PbProjectDefinition | undefined,
    ): PowerBuilderGeneratedMarkdownFile {
        const workspaceFolder = this.getWorkspaceFolderForUri(uri);
        const projectSegment = sanitizeSegment(project?.name ?? '_workspace');
        const objectSegment = sanitizeSegment(model.objectName);
        const relativePath = `${OBJECT_ROOT_RELATIVE_DIR}/${projectSegment}/${model.objectType}/${objectSegment}.md`;
        const absolutePath = path.join(workspaceFolder.uri.fsPath, ...relativePath.split('/'));

        return {
            uri: vscode.Uri.file(absolutePath),
            relativePath,
        };
    }

    private buildObjectJsonOutputTarget(
        model: PowerBuilderObjectDocumentationModel,
        uri: vscode.Uri,
        project: PbProjectDefinition | undefined,
    ): PowerBuilderGeneratedJsonFile {
        const workspaceFolder = this.getWorkspaceFolderForUri(uri);
        const projectSegment = sanitizeSegment(project?.name ?? '_workspace');
        const objectSegment = sanitizeSegment(model.objectName);
        const relativePath = `${OBJECT_ROOT_RELATIVE_DIR}/${projectSegment}/${model.objectType}/${objectSegment}.json`;
        const absolutePath = path.join(workspaceFolder.uri.fsPath, ...relativePath.split('/'));

        return {
            uri: vscode.Uri.file(absolutePath),
            relativePath,
        };
    }

    private buildObjectDocumentationJsonPayload(
        model: PowerBuilderObjectDocumentationModel,
        commandId: string,
        generatedAt: Date,
    ): {
        kind: 'powerbuilder-object-documentation';
        schemaVersion: 1;
        generatedAt: string;
        generatorVersion: string;
        commandId: string;
        model: Omit<PowerBuilderObjectDocumentationModel, 'sourceUri'> & { sourceUri: string };
    } {
        return {
            kind: 'powerbuilder-object-documentation',
            schemaVersion: 1,
            generatedAt: generatedAt.toISOString(),
            generatorVersion: 'p2-18-v3',
            commandId,
            model: this.serializeDocumentationModel(model),
        };
    }

    private buildExcludedObject(uri: vscode.Uri): PowerBuilderExcludedDocumentationObject {
        const rootSymbol = this.index.getPrimaryFileObjectSymbol(uri);
        const sourcePath = this.toRelativeWorkspacePath(uri);

        if (!rootSymbol) {
            return {
                objectName: path.posix.basename(sourcePath),
                sourcePath,
                reason: 'No se detecta un objeto raíz PowerBuilder indexable en el archivo.',
            };
        }

        return {
            objectName: rootSymbol.name,
            sourcePath,
            reason: `Tipo raíz fuera del v1 soportado o sin cadena suficiente para clasificarlo con seguridad (${rootSymbol.baseTypeName ?? 'sin ancestro declarado'}).`,
        };
    }

    private describeUnsupportedDocument(document: vscode.TextDocument): string {
        return this.buildExcludedObject(document.uri).reason;
    }

    private async writeMarkdownFile(uri: vscode.Uri, markdown: string): Promise<void> {
        await fs.mkdir(path.dirname(uri.fsPath), { recursive: true });
        await fs.writeFile(uri.fsPath, markdown, 'utf8');
    }

    private async writeJsonFile(uri: vscode.Uri, payload: unknown): Promise<void> {
        await fs.mkdir(path.dirname(uri.fsPath), { recursive: true });
        await fs.writeFile(uri.fsPath, JSON.stringify(payload, null, 2), 'utf8');
    }

    private getWorkspaceFolderForUri(uri: vscode.Uri): vscode.WorkspaceFolder {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri) ?? vscode.workspace.workspaceFolders?.[0];

        if (!workspaceFolder) {
            throw new Error('Expected an opened workspace folder to write generated documentation.');
        }

        return workspaceFolder;
    }

    private toRelativeWorkspacePath(uri: vscode.Uri): string {
        return (vscode.workspace.asRelativePath(uri, false) || uri.path).replace(/\\/g, '/');
    }

    private serializeDocumentationModel(
        model: PowerBuilderObjectDocumentationModel,
    ): Omit<PowerBuilderObjectDocumentationModel, 'sourceUri'> & { sourceUri: string } {
        return {
            ...model,
            sourceUri: model.sourceUri.toString(),
        };
    }
}

function renderObjectTypeCounts(models: readonly PowerBuilderObjectDocumentationModel[]): string {
    const counts = new Map<SupportedPowerBuilderDocumentationObjectType, number>();

    for (const model of models) {
        counts.set(model.objectType, (counts.get(model.objectType) ?? 0) + 1);
    }

    if (counts.size === 0) {
        return 'sin objetos soportados';
    }

    return Array.from(counts.entries())
        .sort((left, right) => sortStrings(left[0], right[0]))
        .map(([objectType, count]) => `\`${objectType}\`: ${count}`)
        .join(', ');
}

function renderProjectIndexTable(
    models: readonly PowerBuilderObjectDocumentationModel[],
    objectLinks: ReadonlyMap<string, string>,
): string {
    if (models.length === 0) {
        return 'Sin objetos soportados documentables en este proyecto.';
    }

    const header = '| Objeto | Tipo | Archivo fuente | Documento |';
    const separator = '|---|---|---|---|';
    const rows = models.map(model => {
        const link = objectLinks.get(model.objectName) ?? '';
        return `| ${escapeTableCell(model.objectName)} | ${escapeTableCell(model.objectType)} | ${escapeTableCell(model.sourcePath)} | [${escapeMarkdownLinkLabel(model.objectName)}](${encodeMarkdownLinkTarget(link)}) |`;
    });

    return [header, separator, ...rows].join('\n');
}

function renderObjectsByType(
    models: readonly PowerBuilderObjectDocumentationModel[],
    objectLinks: ReadonlyMap<string, string>,
): string[] {
    const byType = new Map<SupportedPowerBuilderDocumentationObjectType, PowerBuilderObjectDocumentationModel[]>();

    for (const model of models) {
        const bucket = byType.get(model.objectType) ?? [];
        bucket.push(model);
        byType.set(model.objectType, bucket);
    }

    if (byType.size === 0) {
        return ['Sin objetos soportados documentables en este proyecto.'];
    }

    return Array.from(byType.entries())
        .sort((left, right) => sortStrings(left[0], right[0]))
        .map(([objectType, entries]) => [
            `## ${objectType}`,
            ...entries
                .sort((left, right) => sortStrings(left.objectName, right.objectName))
                .map(entry => `- [${escapeMarkdownLinkLabel(entry.objectName)}](${encodeMarkdownLinkTarget(objectLinks.get(entry.objectName) ?? '')}) · ${entry.sourcePath} · ancestro ${entry.directBaseType ?? 'sin ancestro'}`),
        ].join('\n'));
}

function renderInheritanceIndex(
    models: readonly PowerBuilderObjectDocumentationModel[],
    objectLinks: ReadonlyMap<string, string>,
): string {
    if (models.length === 0) {
        return 'Sin objetos soportados documentables en este proyecto.';
    }

    const header = '| Objeto | Tipo | Ancestro directo | Cadena básica | Descendientes directos |';
    const separator = '|---|---|---|---|---|';
    const rows = models.map(model => {
        const link = objectLinks.get(model.objectName) ?? '';
        return `| [${escapeMarkdownLinkLabel(model.objectName)}](${encodeMarkdownLinkTarget(link)}) | ${escapeTableCell(model.objectType)} | ${escapeTableCell(model.directBaseType ?? 'sin ancestro')} | ${escapeTableCell(model.inheritanceChain.join(' -> ') || 'sin cadena adicional')} | ${escapeTableCell(model.directDescendants.join(', ') || 'sin descendientes directos')} |`;
    });

    return [header, separator, ...rows].join('\n');
}

function renderPublicApiIndex(
    models: readonly PowerBuilderObjectDocumentationModel[],
    objectLinks: ReadonlyMap<string, string>,
): string {
    const rows = models.flatMap(model => {
        const link = objectLinks.get(model.objectName) ?? '';
        const publicEntries = [
            ...model.publicCallables.map(callable => ({
                objectName: model.objectName,
                objectLink: link,
                callableName: callable.name,
                category: callable.kind,
                signature: callable.signature ?? 'sin firma',
            })),
            ...model.eventImplementations.map(callable => ({
                objectName: model.objectName,
                objectLink: link,
                callableName: callable.name,
                category: 'event',
                signature: callable.signature ?? 'sin firma',
            })),
        ];

        return publicEntries;
    });

    if (rows.length === 0) {
        return 'Sin API pública indexada con evidencia fuerte en este proyecto.';
    }

    const header = '| Objeto | Entrada | Categoría | Firma |';
    const separator = '|---|---|---|---|';
    const contentRows = rows.map(row =>
        `| [${escapeMarkdownLinkLabel(row.objectName)}](${encodeMarkdownLinkTarget(row.objectLink)}) | ${escapeTableCell(row.callableName)} | ${escapeTableCell(row.category)} | ${escapeTableCell(row.signature)} |`,
    );

    return [header, separator, ...contentRows].join('\n');
}

function renderDependenciesIndex(
    models: readonly PowerBuilderObjectDocumentationModel[],
    objectLinks: ReadonlyMap<string, string>,
): string {
    if (models.length === 0) {
        return 'Sin relaciones de dependencias publicables en este proyecto.';
    }

    const header = '| Objeto | Tipo | Tipos relevantes | Funciones globales | Miembros destacados |';
    const separator = '|---|---|---|---|---|';
    const rows = models.map(model => {
        const link = objectLinks.get(model.objectName) ?? '';
        const highlightedMembers = model.highlightedMembers
            .map(member => `${member.name} (${member.typeName ?? 'sin tipo base'})`)
            .join(', ');

        return `| [${escapeMarkdownLinkLabel(model.objectName)}](${encodeMarkdownLinkTarget(link)}) | ${escapeTableCell(model.objectType)} | ${escapeTableCell(model.typeDependencies.join(', ') || 'sin tipos fuertes')} | ${escapeTableCell(model.globalFunctionDependencies.join(', ') || 'sin funciones globales fuertes')} | ${escapeTableCell(highlightedMembers || 'sin miembros destacados')} |`;
    });

    return [header, separator, ...rows].join('\n');
}

function renderEventScriptsIndex(
    models: readonly PowerBuilderObjectDocumentationModel[],
    objectLinks: ReadonlyMap<string, string>,
): string {
    const rows = models.flatMap(model => {
        const link = objectLinks.get(model.objectName) ?? '';

        return model.eventImplementations.map(callable => ({
            objectName: model.objectName,
            objectLink: link,
            eventName: callable.name,
            signature: callable.signature ?? 'sin firma',
            notes: callable.implementationKind ?? 'event',
        }));
    });

    if (rows.length === 0) {
        return 'Sin scripts de evento indexados con evidencia fuerte en este proyecto.';
    }

    const header = '| Objeto | Evento | Firma | Notas |';
    const separator = '|---|---|---|---|';
    const contentRows = rows.map(row =>
        `| [${escapeMarkdownLinkLabel(row.objectName)}](${encodeMarkdownLinkTarget(row.objectLink)}) | ${escapeTableCell(row.eventName)} | ${escapeTableCell(row.signature)} | ${escapeTableCell(row.notes)} |`,
    );

    return [header, separator, ...contentRows].join('\n');
}

function renderExcludedObjects(excludedObjects: readonly PowerBuilderExcludedDocumentationObject[]): string {
    if (excludedObjects.length === 0) {
        return 'Sin exclusiones conservadoras en este proyecto.';
    }

    return [...excludedObjects]
        .sort((left, right) => sortStrings(left.objectName, right.objectName))
        .map(entry => `- \`${entry.objectName}\` en \`${entry.sourcePath}\`: ${entry.reason}`)
        .join('\n');
}

function sanitizeSegment(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '') || '_workspace';
}

function sortStrings(left: string, right: string): number {
    return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

function escapeTableCell(value: string): string {
    return value.replace(/\|/g, '\\|');
}

function escapeMarkdownLinkLabel(value: string): string {
    return value.replace(/[\[\]]/g, '');
}

function encodeMarkdownLinkTarget(target: string): string {
    return target.split('/').map(segment => encodeURIComponent(segment)).join('/');
}