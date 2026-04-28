import * as vscode from 'vscode';
import { isExcludedRootUri } from '../../core/config/extensionConfiguration';
import { PbProjectDefinition, normalizeWorkspaceUriPath } from './pbProjectModel';

export class PowerBuilderProjectRegistry {
    private static instance: PowerBuilderProjectRegistry;

    private readonly projectsByUri = new Map<string, PbProjectDefinition>();

    static getInstance(): PowerBuilderProjectRegistry {
        if (!PowerBuilderProjectRegistry.instance) {
            PowerBuilderProjectRegistry.instance = new PowerBuilderProjectRegistry();
        }

        return PowerBuilderProjectRegistry.instance;
    }

    clear(): void {
        this.projectsByUri.clear();
    }

    setProject(project: PbProjectDefinition): void {
        this.projectsByUri.set(project.uri.toString(), project);
    }

    removeProject(uri: vscode.Uri): PbProjectDefinition | undefined {
        const key = uri.toString();
        const previousProject = this.projectsByUri.get(key);

        this.projectsByUri.delete(key);
        return previousProject;
    }

    getProjects(): PbProjectDefinition[] {
        return Array.from(this.projectsByUri.values());
    }

    getProject(uri: vscode.Uri): PbProjectDefinition | undefined {
        return this.projectsByUri.get(uri.toString());
    }

    getProjectSourceRoots(project: PbProjectDefinition): vscode.Uri[] {
        const roots: vscode.Uri[] = [];
        const seen = new Set<string>();

        const addRoot = (uri: vscode.Uri | undefined): void => {
            if (!uri) {
                return;
            }

            const key = normalizeWorkspaceUriPath(uri);

            if (key && !seen.has(key)) {
                seen.add(key);
                roots.push(uri);
            }
        };

        addRoot(project.appEntryUri);

        for (const libraryUri of project.libraryUris) {
            addRoot(libraryUri);
        }

        return roots;
    }

    getProjectSourceRootKeys(project: PbProjectDefinition): string[] {
        return this.getProjectSourceRoots(project).map(rootUri =>
            normalizeWorkspaceUriPath(rootUri),
        );
    }

    getEffectiveProjectSourceRoots(project: PbProjectDefinition): vscode.Uri[] {
        return this.getProjectSourceRoots(project).filter(rootUri => !isExcludedRootUri(rootUri));
    }

    getEffectiveProjectSourceRootKeys(project: PbProjectDefinition): string[] {
        return this.getEffectiveProjectSourceRoots(project).map(rootUri =>
            normalizeWorkspaceUriPath(rootUri),
        );
    }

    getRetainedProjectRootKeys(): Set<string> {
        const keys = new Set<string>();

        for (const project of this.projectsByUri.values()) {
            for (const rootKey of this.getEffectiveProjectSourceRootKeys(project)) {
                keys.add(rootKey);
            }
        }

        return keys;
    }

    getRemovedProjectRoots(
        previousProject?: PbProjectDefinition,
        currentProject?: PbProjectDefinition,
    ): vscode.Uri[] {
        if (!previousProject) {
            return [];
        }

        const currentRootKeys = new Set(
            (currentProject ? this.getEffectiveProjectSourceRoots(currentProject) : [])
                .map(rootUri => normalizeWorkspaceUriPath(rootUri)),
        );

        return this.getEffectiveProjectSourceRoots(previousProject).filter(rootUri =>
            !currentRootKeys.has(normalizeWorkspaceUriPath(rootUri)),
        );
    }

    findProjectsForSourceFile(uri: vscode.Uri): PbProjectDefinition[] {
        const matches: Array<{
            project: PbProjectDefinition;
            matchLength: number;
        }> = [];

        for (const project of this.projectsByUri.values()) {
            const longestMatch = this.getProjectMatchScoreForSourceFile(
                uri,
                project,
            );

            if (longestMatch > 0) {
                matches.push({
                    project,
                    matchLength: longestMatch,
                });
            }
        }

        return matches
            .sort((left, right) => {
                if (right.matchLength !== left.matchLength) {
                    return right.matchLength - left.matchLength;
                }

                return left.project.name.localeCompare(right.project.name);
            })
            .map(match => match.project);
    }

    getPreferredProjectForSourceFile(
        uri: vscode.Uri,
    ): PbProjectDefinition | undefined {
        return this.findProjectsForSourceFile(uri)[0];
    }

    isSourceFileInProject(
        uri: vscode.Uri,
        project: PbProjectDefinition,
    ): boolean {
        return this.getProjectMatchScoreForSourceFile(uri, project) > 0;
    }

    getProjectMatchScoreForSourceFile(
        uri: vscode.Uri,
        project: PbProjectDefinition,
    ): number {
        const sourcePath = normalizeWorkspaceUriPath(uri);
        const appEntryPath = project.appEntryUri
            ? normalizeWorkspaceUriPath(project.appEntryUri)
            : undefined;
        const effectiveRoots = this.getEffectiveProjectSourceRoots(project);

        let best = 0;

        for (const rootUri of effectiveRoots) {
            const rootPath = normalizeWorkspaceUriPath(rootUri);

            if (!rootPath || !this.isPathWithinRoot(sourcePath, rootPath)) {
                continue;
            }

            const score = rootPath.length + (
                appEntryPath === rootPath && !isExcludedRootUri(rootUri)
                    ? 1000
                    : 0
            );
            best = Math.max(best, score);
        }

        return best;
    }

    sortUrisByProjectPreference(
        uris: vscode.Uri[],
        project: PbProjectDefinition,
    ): vscode.Uri[] {
        return [...uris].sort((left, right) => {
            const leftScore = this.getProjectMatchScoreForSourceFile(left, project);
            const rightScore = this.getProjectMatchScoreForSourceFile(right, project);

            if (rightScore !== leftScore) {
                return rightScore - leftScore;
            }

            return (left.fsPath || left.path).localeCompare(right.fsPath || right.path);
        });
    }

    isUriWithinAnyRoot(
        uri: vscode.Uri,
        roots: readonly vscode.Uri[],
    ): boolean {
        const sourcePath = normalizeWorkspaceUriPath(uri);

        return roots.some(rootUri => {
            const rootPath = normalizeWorkspaceUriPath(rootUri);
            return this.isPathWithinRoot(sourcePath, rootPath);
        });
    }

    isUriWithinRootKeys(uri: vscode.Uri, rootKeys: ReadonlySet<string>): boolean {
        const sourcePath = normalizeWorkspaceUriPath(uri);

        for (const rootKey of rootKeys) {
            if (this.isPathWithinRoot(sourcePath, rootKey)) {
                return true;
            }
        }

        return false;
    }

    private isPathWithinRoot(sourcePath: string, rootPath: string): boolean {
        return sourcePath === rootPath || sourcePath.startsWith(`${rootPath}/`);
    }
}