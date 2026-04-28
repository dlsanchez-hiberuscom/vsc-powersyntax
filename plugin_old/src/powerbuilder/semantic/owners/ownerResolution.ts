import * as vscode from 'vscode';
import {
    OwnerExpressionSegment,
    parseOwnerExpressionSegments,
} from '../../document/documentUtils';
import { SymbolIndex } from '../../indexing/symbolIndex';
import { PbSymbol } from '../../models/pbSymbol';
import {
    PbSemanticAmbiguityReason,
    PbSemanticEvidence,
} from '../contracts';
import { getInheritanceGraph } from '../inheritanceGraph';
import {
    PbResolutionContext,
    SemanticOwnerResolutionResult,
} from '../ranking/contracts';
import {
    areSameCallable,
    getContainingCallableSymbol,
    isCallableScopedSymbol,
    isCallableSymbol,
    normalizeIdentifier,
} from '../ranking/shared';
import {
    filterSymbolsVisibleFromPosition,
    filterToHighestVariableMemberScope,
} from '../visibility/symbolVisibility';

export type OwnerTypingPrecision = 'exact' | 'compatible' | 'blocked';

export type OwnerTypingKind =
    | 'explicit-typed-owner'
    | 'explicit-owner-chain'
    | 'typed-this'
    | 'typed-super'
    | 'typed-parent'
    | 'implicit-current-object'
    | 'inherited-owner-match'
    | 'blocked-any-owner'
    | 'blocked-owner-ambiguity'
    | 'blocked-owner-unresolved';

export interface OwnerTypingAssessment {
    precision: OwnerTypingPrecision;
    kind: OwnerTypingKind;
    seedTypeNames: string[];
    resolvedTypeNames: string[];
    reasons: PbSemanticAmbiguityReason[];
    evidence: PbSemanticEvidence[];
}

export function resolveOwnerResolution(
    context: PbResolutionContext,
    index: SymbolIndex,
    uri: vscode.Uri,
    position?: vscode.Position,
): SemanticOwnerResolutionResult {
    const resolvedOwnerTypeNames = getEffectiveOwnerTypeNames(
        context,
        index,
        uri,
        position,
    );

    return {
        rawOwner: normalizeIdentifier(context.qualifiedOwner),
        hasExplicitOwner: !!normalizeIdentifier(
            context.qualifiedOwnerExpression ?? context.qualifiedOwner,
        ),
        resolvedOwnerTypeNames,
        resolvedOwnerNames: expandTypeHierarchyNames(
            resolvedOwnerTypeNames,
            index,
        )
            .map(typeName => normalizeIdentifier(typeName))
            .filter((typeName): typeName is string => !!typeName),
        implicitOwnerNames: position
            ? getImplicitOwnerNames(index, uri, position)
            : [],
    };
}

export function getOwnerTypingAssessmentAtPosition(
    context: PbResolutionContext,
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
    primarySymbol?: PbSymbol,
): OwnerTypingAssessment | undefined {
    const resolution = resolveOwnerResolution(context, index, uri, position);

    if (!resolution.hasExplicitOwner) {
        if (resolution.implicitOwnerNames.length === 0) {
            return undefined;
        }

        return {
            precision: 'compatible',
            kind: 'implicit-current-object',
            seedTypeNames: [],
            resolvedTypeNames: resolution.implicitOwnerNames,
            reasons: [],
            evidence: [buildOwnerTypingEvidence(
                'implicit-owner',
                'compatible',
                `El binding depende del objeto implícito actual y su jerarquía visible (${resolution.implicitOwnerNames.join(', ')}).`,
            )],
        };
    }

    if (resolution.resolvedOwnerTypeNames.length === 0) {
        const anyOwner = resolution.rawOwner
            ? hasAnyTypedOwnerReference(resolution.rawOwner, index, uri, position)
            : false;
        const detail = anyOwner
            ? `El owner explícito ${formatOwnerDisplay(context)} está tipado como Any y no puede elevarse a typing fuerte.`
            : `El owner explícito ${formatOwnerDisplay(context)} no tiene evidencia estática suficiente para elevar el typing.`;

        return buildBlockedOwnerTypingAssessment(
            anyOwner ? 'blocked-any-owner' : 'blocked-owner-unresolved',
            anyOwner ? 'any-owner' : 'owner-type-unresolved',
            detail,
        );
    }

    if (resolution.resolvedOwnerTypeNames.length > 1) {
        return buildBlockedOwnerTypingAssessment(
            'blocked-owner-ambiguity',
            'owner-type-ambiguous',
            `El owner explícito ${formatOwnerDisplay(context)} sigue resolviendo a múltiples tipos semilla (${resolution.resolvedOwnerTypeNames.join(', ')}).`,
            resolution.resolvedOwnerTypeNames,
            resolution.resolvedOwnerNames,
        );
    }

    const seedTypeName = resolution.resolvedOwnerTypeNames[0];
    const normalizedSeedTypeName = normalizeIdentifier(seedTypeName);
    const primaryOwnerNames = primarySymbol
        ? getNormalizedOwnerNames(primarySymbol)
        : [];
    const directSeedMatch = !!normalizedSeedTypeName
        && primaryOwnerNames.includes(normalizedSeedTypeName);
    const inheritedMatch = primaryOwnerNames.length > 0
        && !directSeedMatch
        && resolution.resolvedOwnerNames.some(ownerName => primaryOwnerNames.includes(ownerName));
    const precision: OwnerTypingPrecision = inheritedMatch
        ? 'compatible'
        : 'exact';

    return {
        precision,
        kind: getOwnerTypingKind(context, inheritedMatch),
        seedTypeNames: [seedTypeName],
        resolvedTypeNames: resolution.resolvedOwnerNames,
        reasons: [],
        evidence: [buildOwnerTypingEvidence(
            'owner-match',
            precision,
            inheritedMatch
                ? `El owner ${formatOwnerDisplay(context)} se resolvió a ${seedTypeName}, pero el símbolo primario se publica a través de herencia demostrable.`
                : `El owner ${formatOwnerDisplay(context)} se resolvió con un tipo semilla único (${seedTypeName}).`,
        )],
    };
}

export function getResolvedOwnerNames(
    context: PbResolutionContext,
    index: SymbolIndex,
    uri: vscode.Uri,
    position?: vscode.Position,
): string[] {
    return resolveOwnerResolution(context, index, uri, position).resolvedOwnerNames;
}

export function getImplicitOwnerNamesAtPosition(
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
): string[] {
    return getImplicitOwnerNames(index, uri, position);
}

function buildBlockedOwnerTypingAssessment(
    kind: Extract<OwnerTypingKind, 'blocked-any-owner' | 'blocked-owner-ambiguity' | 'blocked-owner-unresolved'>,
    code: Extract<PbSemanticAmbiguityReason['code'], 'any-owner' | 'owner-type-ambiguous' | 'owner-type-unresolved'>,
    detail: string,
    seedTypeNames: string[] = [],
    resolvedTypeNames: string[] = [],
): OwnerTypingAssessment {
    return {
        precision: 'blocked',
        kind,
        seedTypeNames,
        resolvedTypeNames,
        reasons: [{ code, detail }],
        evidence: [buildOwnerTypingEvidence('owner-match', 'blocked', detail)],
    };
}

function buildOwnerTypingEvidence(
    kind: PbSemanticEvidence['kind'],
    precision: OwnerTypingPrecision,
    detail: string,
): PbSemanticEvidence {
    return {
        kind,
        precision,
        detail,
    };
}

function getOwnerTypingKind(
    context: PbResolutionContext,
    inheritedMatch: boolean,
): Exclude<OwnerTypingKind, 'implicit-current-object' | 'blocked-any-owner' | 'blocked-owner-ambiguity' | 'blocked-owner-unresolved'> {
    const rawOwner = normalizeIdentifier(context.qualifiedOwner);

    if (inheritedMatch) {
        return 'inherited-owner-match';
    }

    if (rawOwner === 'this') {
        return 'typed-this';
    }

    if (rawOwner === 'super') {
        return 'typed-super';
    }

    if (rawOwner === 'parent') {
        return 'typed-parent';
    }

    return isOwnerExpressionChain(context.qualifiedOwnerExpression)
        ? 'explicit-owner-chain'
        : 'explicit-typed-owner';
}

function isOwnerExpressionChain(ownerExpression?: string): boolean {
    const segments = ownerExpression
        ? parseOwnerExpressionSegments(ownerExpression)
        : undefined;

    return !!segments && segments.length > 1;
}

function formatOwnerDisplay(context: PbResolutionContext): string {
    return context.qualifiedOwnerExpression ?? context.qualifiedOwner ?? 'sin owner';
}

function hasAnyTypedOwnerReference(
    rawOwner: string,
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
): boolean {
    return filterSymbolsVisibleFromPosition(
        index.findSymbolByName(rawOwner),
        index,
        uri,
        position,
    ).some(symbol => {
        const typeReference = symbol.kind === 'variable' || symbol.kind === 'constant'
            ? normalizeTypeReference(symbol.detail)
            : isCallableSymbol(symbol)
                ? normalizeTypeReference(symbol.returnType)
                : undefined;

        return normalizeIdentifier(typeReference) === 'any';
    });
}

export function symbolMatchesOwnerNames(
    symbol: PbSymbol,
    ownerNames: readonly string[],
): boolean {
    if (ownerNames.length === 0) {
        return false;
    }

    const normalizedOwnerNames = getNormalizedOwnerNames(symbol);
    return ownerNames.some(owner => normalizedOwnerNames.includes(owner));
}

export function getNormalizedOwnerNames(symbol: PbSymbol): string[] {
    const values = new Set<string>();

    const candidates = [
        symbol.parent,
        symbol.containerName,
        symbol.fileObjectName,
        symbol.ownerName,
    ];

    for (const candidate of candidates) {
        const normalized = normalizeIdentifier(candidate);

        if (normalized) {
            values.add(normalized);
        }
    }

    return Array.from(values);
}

export function getOwnerDistanceBonus(
    symbol: PbSymbol,
    context: PbResolutionContext,
    index: SymbolIndex,
    uri: vscode.Uri,
    position?: vscode.Position,
): number {
    if (!position) {
        return 0;
    }

    const rawOwner = normalizeIdentifier(context.qualifiedOwner);

    if (!rawOwner) {
        return 0;
    }

    const referenceTypeNames = getReferenceTypeNamesForOwner(
        rawOwner,
        context.qualifiedOwnerExpression,
        context.qualifier,
        index,
        uri,
        position,
    );

    if (referenceTypeNames.length === 0) {
        return 0;
    }

    const ownerDistance = getNearestOwnerDistance(symbol, index, referenceTypeNames);

    if (!Number.isFinite(ownerDistance)) {
        return 0;
    }

    return Math.max(0, 1000 - (ownerDistance * 75));
}

export function getImplicitOwnerDistanceBonus(
    symbol: PbSymbol,
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
): number {
    const currentType = index.findInnermostTypeAtPosition(uri, position);
    const referenceTypeNames = currentType?.name
        ? [currentType.name]
        : index.getPrimaryFileObjectName(uri)
            ? [index.getPrimaryFileObjectName(uri)!]
            : [];

    if (referenceTypeNames.length === 0) {
        return 0;
    }

    const ownerDistance = getNearestOwnerDistance(symbol, index, referenceTypeNames);

    if (!Number.isFinite(ownerDistance)) {
        return 0;
    }

    return Math.max(0, 800 - (ownerDistance * 75));
}

function getEffectiveOwnerNames(
    context: PbResolutionContext,
    index: SymbolIndex,
    uri: vscode.Uri,
    position?: vscode.Position,
): string[] {
    return expandTypeHierarchyNames(
        getEffectiveOwnerTypeNames(context, index, uri, position),
        index,
    )
        .map(typeName => normalizeIdentifier(typeName))
        .filter((typeName): typeName is string => !!typeName);
}

function getEffectiveOwnerTypeNames(
    context: PbResolutionContext,
    index: SymbolIndex,
    uri: vscode.Uri,
    position?: vscode.Position,
): string[] {
    const rawOwner = normalizeIdentifier(context.qualifiedOwner);
    const ownerExpression = context.qualifiedOwnerExpression?.trim();

    if (ownerExpression && position) {
        const resolvedExpressionTypeNames = resolveOwnerExpressionSeedTypeNames(
            ownerExpression,
            context.qualifier,
            index,
            uri,
            position,
        );

        if (resolvedExpressionTypeNames.length > 0) {
            return resolvedExpressionTypeNames
                .map(typeName => normalizeIdentifier(typeName))
                .filter((typeName): typeName is string => !!typeName);
        }
    }

    if (!rawOwner) {
        return [];
    }

    const result = new Set<string>();

    if (rawOwner === 'this') {
        const currentType = position
            ? index.findInnermostTypeAtPosition(uri, position)
            : undefined;
        const currentTypeName = currentType?.name ?? index.getPrimaryFileObjectName(uri);

        if (currentTypeName) {
            result.add(currentTypeName);
        }

        return Array.from(result);
    }

    if (rawOwner === 'super') {
        const ancestorNames = position
            ? getAncestorNamesFromPosition(index, uri, position)
            : index.getAncestorTypeNames(uri);

        if (ancestorNames[0]) {
            result.add(ancestorNames[0]);
        }

        return Array.from(result);
    }

    if (rawOwner === 'parent' && position) {
        const currentType = index.findInnermostTypeAtPosition(uri, position);

        if (currentType?.parent) {
            result.add(currentType.parent);
        }

        return Array.from(result);
    }

    const explicitAncestorTypeNames =
        context.qualifier === '::' && position
            ? getExplicitAncestorTypeNames(rawOwner, index, uri, position)
            : [];

    if (explicitAncestorTypeNames.length > 0) {
        explicitAncestorTypeNames.forEach(typeName => result.add(typeName));

        return Array.from(result);
    }

    for (const typeName of resolveOwnerTypeNames(
        rawOwner,
        index,
        uri,
        position,
        getInheritanceGraph(index),
    )) {
        const normalizedTypeName = normalizeIdentifier(typeName);

        if (normalizedTypeName) {
            result.add(normalizedTypeName);
        }
    }

    return Array.from(result);
}

function getImplicitOwnerNames(
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
): string[] {
    const inheritanceGraph = getInheritanceGraph(index);
    const currentType = index.findInnermostTypeAtPosition(uri, position);
    const names = currentType?.name
        ? inheritanceGraph.getTypeHierarchy(currentType.name)
        : index.getPrimaryFileObjectName(uri)
            ? inheritanceGraph.getTypeHierarchy(index.getPrimaryFileObjectName(uri)!)
            : [];

    return names
        .map(name => normalizeIdentifier(name))
        .filter((name): name is string => !!name);
}

function resolveOwnerTypeNames(
    rawOwner: string,
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position | undefined,
    inheritanceGraph: ReturnType<typeof getInheritanceGraph>,
): string[] {
    const result = new Set<string>();

    for (const typeName of collectOwnerTypeCandidates(
        rawOwner,
        index,
        uri,
        position,
    )) {
        for (const hierarchyTypeName of inheritanceGraph.getTypeHierarchy(typeName)) {
            if (normalizeIdentifier(hierarchyTypeName)) {
                result.add(hierarchyTypeName);
            }
        }
    }

    return Array.from(result);
}

function resolveOwnerExpressionTypeNames(
    ownerExpression: string,
    qualifier: '.' | '::' | undefined,
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
): string[] {
    return expandTypeHierarchyNames(
        resolveOwnerExpressionSeedTypeNames(
            ownerExpression,
            qualifier,
            index,
            uri,
            position,
        ),
        index,
    );
}

function resolveOwnerExpressionSeedTypeNames(
    ownerExpression: string,
    qualifier: '.' | '::' | undefined,
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
): string[] {
    const segments = parseOwnerExpressionSegments(ownerExpression);

    if (!segments || segments.length === 0) {
        return [];
    }

    let currentTypeNames = resolveOwnerExpressionSegmentTypeNames(
        segments[0],
        qualifier,
        index,
        uri,
        position,
    );

    if (currentTypeNames.length === 0) {
        return [];
    }

    for (const segment of segments.slice(1)) {
        currentTypeNames = resolveOwnerExpressionSegmentTypeNames(
            segment,
            '.',
            index,
            uri,
            position,
            currentTypeNames,
        );

        if (currentTypeNames.length === 0) {
            return [];
        }
    }

    return currentTypeNames;
}

function resolveOwnerExpressionSegmentTypeNames(
    segment: OwnerExpressionSegment,
    qualifier: '.' | '::' | undefined,
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
    currentTypeNames?: readonly string[],
): string[] {
    if (segment.expression) {
        return resolveOwnerExpressionTypeNames(
            segment.expression,
            qualifier,
            index,
            uri,
            position,
        );
    }

    return currentTypeNames
        ? resolveChainedOwnerSegmentTypeNames(
            segment.name,
            segment.kind,
            currentTypeNames,
            index,
            uri,
            position,
        )
        : resolveOwnerExpressionBaseTypeNames(
            segment.name,
            qualifier,
            index,
            uri,
            position,
        );
}

function resolveOwnerExpressionBaseTypeNames(
    rawOwner: string,
    qualifier: '.' | '::' | undefined,
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
): string[] {
    if (qualifier === '::') {
        const explicitAncestorTypeNames = getExplicitAncestorTypeNames(
            rawOwner,
            index,
            uri,
            position,
        );

        if (explicitAncestorTypeNames.length > 0) {
            return explicitAncestorTypeNames;
        }
    }

    if (rawOwner === 'this') {
        const currentType = index.findInnermostTypeAtPosition(uri, position);
        return currentType?.name ? [currentType.name] : [];
    }

    if (rawOwner === 'super') {
        const currentType = index.findInnermostTypeAtPosition(uri, position);
        return currentType?.baseTypeName ? [currentType.baseTypeName] : [];
    }

    if (rawOwner === 'parent') {
        const currentType = index.findInnermostTypeAtPosition(uri, position);
        return currentType?.parent ? [currentType.parent] : [];
    }

    return collectOwnerTypeCandidates(rawOwner, index, uri, position);
}

function resolveChainedOwnerSegmentTypeNames(
    segmentName: string,
    segmentKind: 'member' | 'call',
    currentTypeNames: readonly string[],
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
): string[] {
    const ownerNames = expandTypeHierarchyNames(currentTypeNames, index)
        .map(typeName => normalizeIdentifier(typeName))
        .filter((typeName): typeName is string => !!typeName);

    if (ownerNames.length === 0) {
        return [];
    }

    const matchingCandidates = filterSymbolsVisibleFromPosition(
        index.findSymbolByName(segmentName),
        index,
        uri,
        position,
    ).filter(symbol => {
        if (isCallableScopedSymbol(symbol)) {
            return false;
        }

        if (!symbolMatchesOwnerNames(symbol, ownerNames)) {
            return false;
        }

        return segmentKind === 'call'
            ? isCallableSymbol(symbol)
            : symbol.kind === 'variable' || symbol.kind === 'constant';
    });

    if (matchingCandidates.length === 0) {
        return [];
    }

    const orderedCandidates = segmentKind === 'call'
        ? matchingCandidates
        : filterToHighestVariableMemberScope(matchingCandidates);
    const typeNames = new Set<string>();

    for (const candidate of orderedCandidates) {
        const typeName = getResolvableTypeName(candidate);

        if (typeName) {
            typeNames.add(typeName);
        }
    }

    return Array.from(typeNames);
}

function expandTypeHierarchyNames(
    typeNames: readonly string[],
    index: SymbolIndex,
): string[] {
    const inheritanceGraph = getInheritanceGraph(index);
    const result = new Set<string>();

    for (const typeName of typeNames) {
        for (const hierarchyTypeName of inheritanceGraph.getTypeHierarchy(typeName)) {
            if (normalizeIdentifier(hierarchyTypeName)) {
                result.add(hierarchyTypeName);
            }
        }
    }

    return Array.from(result);
}

function collectOwnerTypeCandidates(
    rawOwner: string,
    index: SymbolIndex,
    uri: vscode.Uri,
    position?: vscode.Position,
): string[] {
    const candidates = index.findSymbolByName(rawOwner);
    const sameFileCandidates = candidates.filter(symbol => symbol.uri.toString() === uri.toString());
    const visibleSameFileCandidates = position
        ? filterSymbolsVisibleFromPosition(
            sameFileCandidates,
            index,
            uri,
            position,
        )
        : sameFileCandidates;
    const currentCallable = position
        ? index.findInnermostCallableAtPosition(uri, position)
        : undefined;
    const implicitOwnerNames = position
        ? getImplicitOwnerNames(index, uri, position)
        : [];

    const callableScopedCandidates = currentCallable
        ? visibleSameFileCandidates.filter(symbol => {
            if (!isCallableScopedSymbol(symbol)) {
                return false;
            }

            const containingCallable = getContainingCallableSymbol(symbol, index);
            return areSameCallable(containingCallable, currentCallable);
        })
        : [];

    const memberScopedCandidates = filterToHighestVariableMemberScope(visibleSameFileCandidates.filter(symbol =>
        !isCallableScopedSymbol(symbol) &&
        implicitOwnerNames.some(owner =>
            getNormalizedOwnerNames(symbol).includes(owner),
        ),
    ));
    const typeCandidates = candidates.filter(symbol =>
        symbol.kind === 'type' || symbol.kind === 'structure',
    );
    const fallbackCandidates = position
        ? candidates.filter(symbol => symbol.uri.toString() !== uri.toString())
        : candidates;

    const orderedCandidates = callableScopedCandidates.length > 0
        ? callableScopedCandidates
        : memberScopedCandidates.length > 0
            ? memberScopedCandidates
            : visibleSameFileCandidates.length > 0
                ? filterToHighestVariableMemberScope(visibleSameFileCandidates)
                : typeCandidates.length > 0
                    ? typeCandidates
                    : fallbackCandidates;

    const typeNames = new Set<string>();

    for (const candidate of orderedCandidates) {
        const typeName = getResolvableTypeName(candidate);

        if (typeName) {
            typeNames.add(typeName);
        }
    }

    return Array.from(typeNames);
}

function getResolvableTypeName(symbol: PbSymbol): string | undefined {
    if (symbol.kind === 'type' || symbol.kind === 'structure') {
        return symbol.name;
    }

    if (symbol.kind === 'variable' || symbol.kind === 'constant') {
        return normalizeStaticallyResolvableTypeReference(symbol.detail);
    }

    if (isCallableSymbol(symbol)) {
        return normalizeStaticallyResolvableTypeReference(symbol.returnType);
    }

    return undefined;
}

function normalizeStaticallyResolvableTypeReference(
    detail?: string,
): string | undefined {
    const normalizedTypeName = normalizeTypeReference(detail);

    return normalizeIdentifier(normalizedTypeName) === 'any'
        ? undefined
        : normalizedTypeName;
}

function normalizeTypeReference(detail?: string): string | undefined {
    const trimmed = detail?.trim();

    if (!trimmed) {
        return undefined;
    }

    const withoutArrays = trimmed.replace(/\[\s*\]/g, '').trim();
    const match = withoutArrays.match(/[a-zA-Z_$#%][\w$#%-]*/);
    return match?.[0];
}

function getReferenceTypeNamesForOwner(
    rawOwner: string,
    ownerExpression: string | undefined,
    qualifier: '.' | '::' | undefined,
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
): string[] {
    const resolvedExpressionTypeNames = ownerExpression
        ? resolveOwnerExpressionTypeNames(
            ownerExpression,
            qualifier,
            index,
            uri,
            position,
        )
        : [];

    if (resolvedExpressionTypeNames.length > 0) {
        return resolvedExpressionTypeNames;
    }

    const currentType = index.findInnermostTypeAtPosition(uri, position);

    if (qualifier === '::') {
        const explicitAncestorTypeNames = getExplicitAncestorTypeNames(
            rawOwner,
            index,
            uri,
            position,
        );

        if (explicitAncestorTypeNames.length > 0) {
            return explicitAncestorTypeNames;
        }
    }

    if (rawOwner === 'this') {
        return currentType?.name ? [currentType.name] : [];
    }

    if (rawOwner === 'super') {
        return currentType?.name ? [currentType.name] : [];
    }

    if (rawOwner === 'parent') {
        return currentType?.parent ? [currentType.parent] : [];
    }

    const inheritanceGraph = getInheritanceGraph(index);

    return collectOwnerTypeCandidates(rawOwner, index, uri, position).filter(typeName =>
        inheritanceGraph.getTypeHierarchy(typeName).length > 0,
    );
}

function getNearestOwnerDistance(
    symbol: PbSymbol,
    index: SymbolIndex,
    referenceTypeNames: string[],
): number {
    const inheritanceGraph = getInheritanceGraph(index);
    const ownerNames = getNormalizedOwnerNames(symbol);
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const referenceTypeName of referenceTypeNames) {
        for (const ownerName of ownerNames) {
            const distance = inheritanceGraph.getTypeDistance(
                referenceTypeName,
                ownerName,
            );

            if (distance < bestDistance) {
                bestDistance = distance;
            }
        }
    }

    return bestDistance;
}

function getAncestorNamesFromPosition(
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
): string[] {
    const currentType = index.findInnermostTypeAtPosition(uri, position);

    if (!currentType?.baseTypeName) {
        return index.getAncestorTypeNames(uri);
    }

    const queue = [currentType.baseTypeName];
    const seen = new Set<string>();
    const result: string[] = [];

    while (queue.length > 0) {
        const currentName = queue.shift();
        const normalizedCurrentName = normalizeIdentifier(currentName);

        if (!normalizedCurrentName || seen.has(normalizedCurrentName)) {
            continue;
        }

        seen.add(normalizedCurrentName);
        result.push(currentName!);

        const nextAncestors = index.findSymbolByName(currentName!).filter(symbol =>
            (symbol.kind === 'type' || symbol.kind === 'structure') &&
            !symbol.parent &&
            !!symbol.baseTypeName,
        );

        for (const nextAncestor of nextAncestors) {
            queue.push(nextAncestor.baseTypeName!);
        }
    }

    return result;
}

function getExplicitAncestorTypeNames(
    rawOwner: string,
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
): string[] {
    const inheritanceGraph = getInheritanceGraph(index);
    const currentType = index.findInnermostTypeAtPosition(uri, position);
    const currentTypeName = currentType?.name ?? index.getPrimaryFileObjectName(uri);

    if (!currentTypeName) {
        return [];
    }

    const currentHierarchy = inheritanceGraph.getTypeHierarchy(currentTypeName);
    const matchedAncestorTypeName = currentHierarchy.find(typeName =>
        normalizeIdentifier(typeName) === rawOwner,
    );

    if (!matchedAncestorTypeName) {
        return [];
    }

    return [matchedAncestorTypeName];
}