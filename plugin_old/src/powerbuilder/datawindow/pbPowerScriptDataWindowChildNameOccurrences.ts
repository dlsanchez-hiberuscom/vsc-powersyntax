import * as vscode from 'vscode';
import { PB_IDE_SAFE_FILE_EXTENSIONS } from '../../core/config/constants';
import { getConfig } from '../../core/config/extensionConfiguration';
import { isDataWindowUri } from '../../core/utils/powerBuilderFileUtils';
import { PowerBuilderWorkspaceSnapshotStore } from '../../core/utils/powerBuilderWorkspaceSnapshotStore';
import { isValidPbIdentifierName } from '../grammar/pbIdentifier';
import { SymbolIndex } from '../indexing/symbolIndex';
import { PbDataWindowParser } from './pbDataWindowParser';
import {
    findPowerScriptDataWindowChildLiteralAtPosition,
    findPowerScriptDataWindowChildLiteralOccurrences,
    resolvePowerScriptDataWindowChildCompletionAtPosition,
    resolveVerifiedDataWindowChildLinks,
    VerifiedDataWindowChildLink,
} from './pbPowerScriptDataWindowChildren';
import {
    findPowerScriptDataWindowPropertyLiteralAtPosition,
    findPowerScriptDataWindowPropertyLiteralOccurrences,
    resolvePowerScriptDataWindowPropertyCompletionAtPosition,
} from './pbPowerScriptDataWindowProperties';
import {
    PowerScriptDataWindowCandidateCache,
    PowerScriptDataWindowLinkCandidate,
} from './pbPowerScriptDataWindowLinks';

interface DataWindowReportChildTarget {
    range: vscode.Range;
    declarationRange: vscode.Range;
    placeholder: string;
    parentCandidate: PowerScriptDataWindowLinkCandidate;
    child: VerifiedDataWindowChildLink;
}

interface PowerScriptDataWindowReportChildTargetResolution {
    target?: DataWindowReportChildTarget;
    blockedReason?: string;
}

export interface PowerScriptDataWindowReportChildRenameTarget {
    canRename: boolean;
    range?: vscode.Range;
    placeholder?: string;
    reason?: string;
}

export async function providePowerScriptDataWindowReportChildReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    includeDeclaration: boolean,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<vscode.Location[] | undefined> {
    const resolution = await resolveReportChildTargetAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
    );

    if (!resolution.target) {
        return resolution.blockedReason ? [] : undefined;
    }

    const scriptLocations = await collectLinkedReportScriptLocations(
        resolution.target.parentCandidate,
        resolution.target.child.childName,
        index,
        parser,
        snapshotStore,
    );
    const painterLocations = includeDeclaration
        ? [new vscode.Location(resolution.target.parentCandidate.uri, resolution.target.declarationRange)]
        : [];

    return dedupeLocations([
        ...scriptLocations,
        ...painterLocations,
    ]);
}

export async function preparePowerScriptDataWindowReportChildRename(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<PowerScriptDataWindowReportChildRenameTarget | undefined> {
    const resolution = await resolveReportChildTargetAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
    );

    if (!resolution.target) {
        return resolution.blockedReason
            ? {
                canRename: false,
                reason: resolution.blockedReason,
            }
            : undefined;
    }

    return {
        canRename: true,
        range: resolution.target.range,
        placeholder: resolution.target.placeholder,
    };
}

export async function providePowerScriptDataWindowReportChildRenameEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string,
    index: SymbolIndex = SymbolIndex.getInstance(),
    parser: PbDataWindowParser = new PbDataWindowParser(),
    snapshotStore: PowerBuilderWorkspaceSnapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance(),
): Promise<vscode.WorkspaceEdit | undefined> {
    const trimmedNewName = newName.trim();

    if (!trimmedNewName || !isValidPbIdentifierName(trimmedNewName)) {
        return undefined;
    }

    const resolution = await resolveReportChildTargetAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
    );

    if (!resolution.target) {
        return undefined;
    }

    const scriptLocations = await collectLinkedReportScriptLocations(
        resolution.target.parentCandidate,
        resolution.target.child.childName,
        index,
        parser,
        snapshotStore,
    );
    const edit = new vscode.WorkspaceEdit();

    for (const location of scriptLocations) {
        edit.replace(location.uri, location.range, trimmedNewName);
    }

    edit.replace(
        resolution.target.parentCandidate.uri,
        resolution.target.declarationRange,
        trimmedNewName,
    );

    return edit;
}

async function resolveReportChildTargetAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
): Promise<PowerScriptDataWindowReportChildTargetResolution> {
    if (!getConfig().dataWindowExperimentalIdeEnabled) {
        return {};
    }

    return isDataWindowUri(document.uri)
        ? resolvePainterReportChildTargetAtPosition(document, position, parser, snapshotStore)
        : resolveScriptReportChildTargetAtPosition(document, position, index, parser, snapshotStore);
}

async function resolvePainterReportChildTargetAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
): Promise<PowerScriptDataWindowReportChildTargetResolution> {
    const declaration = findReportNameDeclarationAtPosition(document, position);

    if (!declaration) {
        return {};
    }

    const parentCandidate = createDataWindowCandidate(document, parser);
    const child = await resolveVerifiedReportChildByName(
        document.uri,
        parentCandidate,
        declaration.childName,
        parser,
        snapshotStore,
    );

    if (!child) {
        return {
            blockedReason: 'El report child no es verificable con evidencia fuerte.',
        };
    }

    return {
        target: {
            range: declaration.range,
            declarationRange: declaration.range,
            placeholder: child.childName,
            parentCandidate,
            child,
        },
    };
}

async function resolveScriptReportChildTargetAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    index: SymbolIndex,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
): Promise<PowerScriptDataWindowReportChildTargetResolution> {
    const candidateCache: PowerScriptDataWindowCandidateCache = new Map();
    const childLiteral = findPowerScriptDataWindowChildLiteralAtPosition(document, position, false);

    if (childLiteral) {
        const childContext = await resolvePowerScriptDataWindowChildCompletionAtPosition(
            document,
            position,
            index,
            parser,
            snapshotStore,
        );

        if (!childContext?.candidate) {
            return childContext
                ? { blockedReason: buildReportChildBlockedReason(childContext.reason) }
                : {};
        }

        const child = await resolveVerifiedReportChildByName(
            document.uri,
            childContext.candidate,
            childLiteral.childName,
            parser,
            snapshotStore,
            candidateCache,
        );

        if (!child) {
            return {};
        }

        const declarationRange = findReportDeclarationRange(
            childContext.candidate.document,
            child.childName,
        );

        if (!declarationRange) {
            return {
                blockedReason: 'El report child no tiene una declaración local segura en el painter.',
            };
        }

        return {
            target: {
                range: childLiteral.range,
                declarationRange,
                placeholder: child.childName,
                parentCandidate: childContext.candidate,
                child,
            },
        };
    }

    const propertyLiteral = findPowerScriptDataWindowPropertyLiteralAtPosition(document, position, false);

    if (!propertyLiteral) {
        return {};
    }

    const childScope = parseChildScopedPropertyPath(propertyLiteral.propertyPath);

    if (!childScope) {
        return {};
    }

    const propertyContext = await resolvePowerScriptDataWindowPropertyCompletionAtPosition(
        document,
        position,
        index,
        parser,
        snapshotStore,
    );

    if (!propertyContext?.candidate) {
        return propertyContext
            ? { blockedReason: buildReportChildBlockedReason(propertyContext.reason) }
            : {};
    }

    if (!propertyContext.properties?.some(property => property.path.toLowerCase() === propertyLiteral.propertyPath.trim().toLowerCase())) {
        return {};
    }

    const child = await resolveVerifiedReportChildByName(
        document.uri,
        propertyContext.candidate,
        childScope.childName,
        parser,
        snapshotStore,
        candidateCache,
    );

    if (!child) {
        return {};
    }

    const declarationRange = findReportDeclarationRange(
        propertyContext.candidate.document,
        child.childName,
    );

    if (!declarationRange) {
        return {
            blockedReason: 'El report child no tiene una declaración local segura en el painter.',
        };
    }

    return {
        target: {
            range: buildChildNamePropertyRange(propertyLiteral.propertyRange, child.childName),
            declarationRange,
            placeholder: child.childName,
            parentCandidate: propertyContext.candidate,
            child,
        },
    };
}

async function resolveVerifiedReportChildByName(
    sourceUri: vscode.Uri,
    parentCandidate: PowerScriptDataWindowLinkCandidate,
    childName: string,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
    candidateCache: PowerScriptDataWindowCandidateCache = new Map(),
): Promise<VerifiedDataWindowChildLink | undefined> {
    const childLinks = await resolveVerifiedDataWindowChildLinks(
        sourceUri,
        parentCandidate,
        parser,
        snapshotStore,
        candidateCache,
    );

    return childLinks.find(child =>
        child.kind === 'report' &&
        child.childName.toLowerCase() === childName.trim().toLowerCase(),
    );
}

async function collectLinkedReportScriptLocations(
    parentCandidate: PowerScriptDataWindowLinkCandidate,
    reportName: string,
    index: SymbolIndex,
    parser: PbDataWindowParser,
    snapshotStore: PowerBuilderWorkspaceSnapshotStore,
): Promise<vscode.Location[]> {
    const uris = await vscode.workspace.findFiles(buildIdeSafePowerBuilderGlob());
    const candidateCache: PowerScriptDataWindowCandidateCache = new Map();
    const locations: vscode.Location[] = [];

    for (const uri of uris) {
        if (isDataWindowUri(uri)) {
            continue;
        }

        const document = await snapshotStore.getSnapshot(uri);

        if (!document) {
            continue;
        }

        for (const literal of findPowerScriptDataWindowChildLiteralOccurrences(document)) {
            if (literal.childName.toLowerCase() !== reportName.toLowerCase()) {
                continue;
            }

            const childContext = await resolvePowerScriptDataWindowChildCompletionAtPosition(
                document,
                literal.range.start,
                index,
                parser,
                snapshotStore,
            );

            if (childContext?.candidate?.uri.toString() !== parentCandidate.uri.toString()) {
                continue;
            }

            const child = await resolveVerifiedReportChildByName(
                document.uri,
                childContext.candidate,
                reportName,
                parser,
                snapshotStore,
                candidateCache,
            );

            if (!child) {
                continue;
            }

            locations.push(new vscode.Location(document.uri, literal.range));
        }

        for (const literal of findPowerScriptDataWindowPropertyLiteralOccurrences(document)) {
            const childScope = parseChildScopedPropertyPath(literal.propertyPath);

            if (!childScope || childScope.childName.toLowerCase() !== reportName.toLowerCase()) {
                continue;
            }

            const propertyContext = await resolvePowerScriptDataWindowPropertyCompletionAtPosition(
                document,
                literal.propertyRange.start,
                index,
                parser,
                snapshotStore,
            );

            if (
                propertyContext?.candidate?.uri.toString() !== parentCandidate.uri.toString() ||
                !propertyContext.properties?.some(property => property.path.toLowerCase() === literal.propertyPath.trim().toLowerCase())
            ) {
                continue;
            }

            const child = await resolveVerifiedReportChildByName(
                document.uri,
                propertyContext.candidate,
                reportName,
                parser,
                snapshotStore,
                candidateCache,
            );

            if (!child) {
                continue;
            }

            locations.push(new vscode.Location(
                document.uri,
                buildChildNamePropertyRange(literal.propertyRange, reportName),
            ));
        }
    }

    return locations;
}

function createDataWindowCandidate(
    document: vscode.TextDocument,
    parser: PbDataWindowParser,
): PowerScriptDataWindowLinkCandidate {
    return {
        uri: document.uri,
        document,
        parseResult: parser.parseDocument(document),
    };
}

function findReportNameDeclarationAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
): { childName: string; range: vscode.Range } | undefined {
    const lineText = document.lineAt(position.line).text;

    if (!/^\s*report\(/i.test(lineText)) {
        return undefined;
    }

    const attribute = findAttributeValueRange(lineText, 'name');

    if (!attribute) {
        return undefined;
    }

    const range = new vscode.Range(position.line, attribute.start, position.line, attribute.end);

    return range.contains(position)
        ? {
            childName: attribute.value,
            range,
        }
        : undefined;
}

function findReportDeclarationRange(
    document: vscode.TextDocument,
    reportName: string,
): vscode.Range | undefined {
    const normalizedReportName = reportName.trim().toLowerCase();

    for (let line = 0; line < document.lineCount; line++) {
        const lineText = document.lineAt(line).text;

        if (!/^\s*report\(/i.test(lineText)) {
            continue;
        }

        const attribute = findAttributeValueRange(lineText, 'name');

        if (!attribute || attribute.value.toLowerCase() !== normalizedReportName) {
            continue;
        }

        return new vscode.Range(line, attribute.start, line, attribute.end);
    }

    return undefined;
}

function findAttributeValueRange(
    text: string,
    attributeName: string,
): { value: string; start: number; end: number } | undefined {
    const escapedAttributeName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`${escapedAttributeName}\\s*=\\s*`, 'i').exec(text);

    if (!match) {
        return undefined;
    }

    let valueStart = match.index + match[0].length;

    if (valueStart >= text.length) {
        return undefined;
    }

    const delimiter = text[valueStart];

    if (delimiter === '"' || delimiter === '\'') {
        valueStart += 1;
        let valueEnd = valueStart;

        while (valueEnd < text.length && text[valueEnd] !== delimiter) {
            valueEnd++;
        }

        return valueEnd > valueStart
            ? {
                value: text.slice(valueStart, valueEnd),
                start: valueStart,
                end: valueEnd,
            }
            : undefined;
    }

    let valueEnd = valueStart;

    while (valueEnd < text.length && !/[\s)]/.test(text[valueEnd])) {
        valueEnd++;
    }

    return valueEnd > valueStart
        ? {
            value: text.slice(valueStart, valueEnd),
            start: valueStart,
            end: valueEnd,
        }
        : undefined;
}

function parseChildScopedPropertyPath(
    propertyPath: string,
): { childName: string; propertyPath: string } | undefined {
    const trimmedPath = propertyPath.trim();
    const separatorOffset = trimmedPath.indexOf('.');

    if (separatorOffset <= 0 || separatorOffset >= trimmedPath.length - 1) {
        return undefined;
    }

    const childName = trimmedPath.slice(0, separatorOffset).trim();
    const nestedPropertyPath = trimmedPath.slice(separatorOffset + 1).trim();

    if (!childName || !nestedPropertyPath || childName.toLowerCase() === 'datawindow') {
        return undefined;
    }

    return {
        childName,
        propertyPath: nestedPropertyPath.toLowerCase(),
    };
}

function buildChildNamePropertyRange(
    propertyRange: vscode.Range,
    childName: string,
): vscode.Range {
    return new vscode.Range(
        propertyRange.start.line,
        propertyRange.start.character,
        propertyRange.start.line,
        propertyRange.start.character + childName.length,
    );
}

function buildReportChildBlockedReason(reason?: string): string {
    switch (reason) {
        case 'ambiguous-target':
            return 'El report child no se puede renombrar porque el DataWindow padre sigue ambiguo.';
        case 'missing-target':
            return 'El report child no se puede renombrar porque no se encontró un DataWindow padre verificable.';
        case 'missing-dataobject':
            return 'El report child no se puede renombrar porque no se pudo demostrar el DataObject asociado al owner.';
        case 'unverifiable-owner':
            return 'El report child no se puede renombrar porque el owner DataWindow no es verificable con evidencia fuerte.';
        default:
            return 'El report child no se puede renombrar con seguridad.';
    }
}

function buildIdeSafePowerBuilderGlob(): string {
    const extensions = PB_IDE_SAFE_FILE_EXTENSIONS
        .map(extension => extension.replace(/^\./, ''))
        .join(',');

    return `**/*.{${extensions}}`;
}

function dedupeLocations(
    locations: readonly vscode.Location[],
): vscode.Location[] {
    const deduped = new Map<string, vscode.Location>();

    for (const location of locations) {
        const key = [
            location.uri.toString(),
            location.range.start.line,
            location.range.start.character,
            location.range.end.line,
            location.range.end.character,
        ].join(':');

        deduped.set(key, location);
    }

    return Array.from(deduped.values());
}