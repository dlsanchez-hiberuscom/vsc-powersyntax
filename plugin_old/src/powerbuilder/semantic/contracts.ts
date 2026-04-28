export type PbSemanticPrecision =
    | 'exact'
    | 'compatible'
    | 'heuristic'
    | 'ambiguous'
    | 'blocked';

export type PbSemanticAmbiguityCode =
    | 'no-context'
    | 'dynamic-dispatch'
    | 'ancestor-control'
    | 'ancestor-return-value'
    | 'any-owner'
    | 'no-candidates'
    | 'multiple-candidates'
    | 'no-primary-candidate'
    | 'owner-type-ambiguous'
    | 'owner-type-unresolved'
    | 'invalid-name'
    | 'system-member'
    | 'external-symbol'
    | 'no-occurrences';

export type PbSemanticEvidenceKind =
    | 'declaration'
    | 'symbol-family'
    | 'system-member'
    | 'system-global'
    | 'statement'
    | 'text-prefilter'
    | 'callable-scope'
    | 'project-scope'
    | 'owner-match'
    | 'implicit-owner'
    | 'arity-match'
    | 'candidate-ranking'
    | 'runtime-special';

export interface PbSemanticEvidence {
    kind: PbSemanticEvidenceKind;
    precision: PbSemanticPrecision;
    detail: string;
}

export interface PbSemanticAmbiguityReason {
    code: PbSemanticAmbiguityCode;
    detail: string;
}

export interface PbSemanticQueryBaseResult {
    precision: PbSemanticPrecision;
    reasons: PbSemanticAmbiguityReason[];
    evidence: PbSemanticEvidence[];
}