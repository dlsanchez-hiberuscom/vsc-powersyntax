import { PbSystemSymbolEntry } from '../../types';
import { pronoun } from '../common';

export const PB_MANUAL_CORE_PRONOUN_CATEGORIES = [
    'Object reference',
] as const;

export const PB_MANUAL_CORE_PRONOUNS: readonly PbSystemSymbolEntry[] = [
    pronoun({
        name: 'This',
        category: 'Object reference',
        summary: 'Reference to the current object.',
        manualOverlay: { mode: 'override', reason: 'Hardening This pronoun documentation.', evidence: ['manual-core:language:pronouns:this'] }
    }),
    pronoun({
        name: 'Super',
        category: 'Object reference',
        summary: 'Reference to the immediate ancestor of the current object.',
        manualOverlay: { mode: 'override', reason: 'Hardening Super pronoun documentation.', evidence: ['manual-core:language:pronouns:super'] }
    }),
    pronoun({
        name: 'Parent',
        category: 'Object reference',
        summary: 'Reference to the immediate visual container of the control.',
        manualOverlay: { mode: 'override', reason: 'Hardening Parent pronoun documentation.', evidence: ['manual-core:language:pronouns:parent'] }
    }),
    pronoun({
        name: 'ParentWindow',
        category: 'Object reference',
        summary: 'Reference to the window that contains the active menu.',
        manualOverlay: { mode: 'override', reason: 'Hardening ParentWindow pronoun documentation.', evidence: ['manual-core:language:pronouns:parentwindow'] }
    }),
];
