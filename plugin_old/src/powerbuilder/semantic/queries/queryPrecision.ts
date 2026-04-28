import { PbSymbol } from '../../models/pbSymbol';
import { OwnerTypingAssessment } from '../owners/ownerResolution';
import {
    PbSemanticEvidence,
    PbSemanticEvidenceKind,
    PbSemanticPrecision,
} from '../contracts';
import {
    SemanticAmbiguityReason,
} from './contracts';

interface SemanticPrecisionContext {
    isDynamicDispatch?: boolean;
    isAncestorControlCall?: boolean;
    isAncestorReturnValue?: boolean;
    ownerTyping?: OwnerTypingAssessment;
    qualifiedOwner?: string;
    providedArgumentCount?: number;
}

export function getSemanticQueryPrecision(
    symbols: readonly PbSymbol[],
    primarySymbol: PbSymbol | undefined,
    context?: SemanticPrecisionContext,
): PbSemanticPrecision {
    if (
        context?.isDynamicDispatch ||
        context?.isAncestorControlCall ||
        context?.isAncestorReturnValue
    ) {
        return 'blocked';
    }

    if (context?.ownerTyping?.precision === 'blocked') {
        return 'blocked';
    }

    if (primarySymbol) {
        return context?.ownerTyping?.precision ?? 'exact';
    }

    if (symbols.length > 1) {
        return 'ambiguous';
    }

    if (symbols.length === 1) {
        return 'compatible';
    }

    return 'blocked';
}

export function buildSemanticQueryReasons(
    symbols: readonly PbSymbol[],
    primarySymbol: PbSymbol | undefined,
    context?: SemanticPrecisionContext,
): SemanticAmbiguityReason[] {
    if (!context && symbols.length === 0) {
        return [{
            code: 'no-context',
            detail: 'No hay contexto documental suficiente para resolver el símbolo.',
        }];
    }

    if (context?.isDynamicDispatch) {
        return [{
            code: 'dynamic-dispatch',
            detail: 'La llamada es DYNAMIC y la resolución fuerte se degrada por diseño.',
        }];
    }

    if (context?.isAncestorControlCall) {
        return [{
            code: 'ancestor-control',
            detail: 'Las llamadas CALL al ancestro solo admiten resolución degradada en P0.',
        }];
    }

    if (context?.isAncestorReturnValue) {
        return [{
            code: 'ancestor-return-value',
            detail: 'AncestorReturnValue es una variable generada y solo admite hover explicativo.',
        }];
    }

    if (context?.ownerTyping?.precision === 'blocked') {
        return context.ownerTyping.reasons;
    }

    if (symbols.length === 0) {
        return [{
            code: 'no-candidates',
            detail: 'No se encontraron candidatos semánticos para el símbolo pedido.',
        }];
    }

    if (primarySymbol) {
        return [];
    }

    if (symbols.length > 1) {
        return [{
            code: 'multiple-candidates',
            detail: 'Hay múltiples candidatos compatibles y no existe un primario seguro.',
        }];
    }

    return [{
        code: 'no-primary-candidate',
        detail: 'Existe un único candidato compatible, pero el motor no puede elevarlo a primario seguro.',
    }];
}

export function buildSemanticQueryEvidence(
    symbols: readonly PbSymbol[],
    primarySymbol: PbSymbol | undefined,
    context?: SemanticPrecisionContext,
): PbSemanticEvidence[] {
    if (!context) {
        if (primarySymbol) {
            return [buildSemanticEvidence(
                'symbol-family',
                'exact',
                `Se resolvió un candidato primario seguro para ${primarySymbol.name}.`,
            )];
        }

        if (symbols.length > 1) {
            return [buildSemanticEvidence(
                'candidate-ranking',
                'ambiguous',
                `Persisten ${symbols.length} candidatos compatibles sin un primario demostrable.`,
            )];
        }

        if (symbols.length === 1) {
            return [buildSemanticEvidence(
                'symbol-family',
                'compatible',
                `Existe un único candidato compatible (${symbols[0].name}), pero no uno primario seguro.`,
            )];
        }

        return [];
    }

    if (context.isDynamicDispatch) {
        return [buildSemanticEvidence(
            'runtime-special',
            'blocked',
            'La resolución queda bloqueada porque la llamada es DYNAMIC.',
        )];
    }

    if (context.isAncestorControlCall) {
        return [buildSemanticEvidence(
            'runtime-special',
            'blocked',
            'La resolución queda bloqueada porque la llamada usa CALL al ancestro.',
        )];
    }

    if (context.isAncestorReturnValue) {
        return [buildSemanticEvidence(
            'runtime-special',
            'blocked',
            'AncestorReturnValue no se resuelve como símbolo indexado; solo admite degradación controlada.',
        )];
    }

    if (context.ownerTyping?.precision === 'blocked') {
        return context.ownerTyping.evidence;
    }

    if (primarySymbol) {
        const evidence: PbSemanticEvidence[] = [
            ...(context.ownerTyping?.evidence ?? (context.qualifiedOwner
                ? [buildSemanticEvidence(
                    'owner-match',
                    'exact',
                    `El binding se acotó con owner explícito ${context.qualifiedOwner}.`,
                )]
                : [])),
            buildSemanticEvidence(
                'symbol-family',
                'exact',
                `Se resolvió un candidato primario seguro para ${primarySymbol.name}.`,
            ),
        ];

        if (typeof context.providedArgumentCount === 'number') {
            evidence.push(buildSemanticEvidence(
                'arity-match',
                'compatible',
                `La resolución tuvo en cuenta ${context.providedArgumentCount} argumento(s) suministrados.`,
            ));
        }

        return evidence;
    }

    if (symbols.length > 1) {
        return [buildSemanticEvidence(
            'candidate-ranking',
            'ambiguous',
            `Persisten ${symbols.length} candidatos compatibles sin un primario demostrable.`,
        )];
    }

    if (symbols.length === 1) {
        return [buildSemanticEvidence(
            'symbol-family',
            'compatible',
            `Existe un único candidato compatible (${symbols[0].name}), pero no uno primario seguro.`,
        )];
    }

    return [];
}

export function buildSemanticEvidence(
    kind: PbSemanticEvidenceKind,
    precision: PbSemanticPrecision,
    detail: string,
): PbSemanticEvidence {
    return {
        kind,
        precision,
        detail,
    };
}