import { PbSystemSymbolEntry } from '../../types';
import { systemGlobal } from '../common';

export const PB_MANUAL_CORE_SYSTEM_GLOBAL_CATEGORIES = [
    'Transaction',
    'Dynamic SQL',
    'Messages',
] as const;

export const PB_MANUAL_CORE_SYSTEM_GLOBALS: readonly PbSystemSymbolEntry[] = [
    systemGlobal({
        name: 'SQLCA',
        category: 'Transaction',
        summary: 'Default global transaction object (Transaction type). Connects to and manages the database.',
        lookupAliases: ['sqlca'],
        signatures: [{ label: 'SQLCA : Transaction' }],
        valueType: 'Transaction',
        risk: 'legacy',
    }),
    systemGlobal({
        name: 'SQLSA',
        category: 'Dynamic SQL',
        summary: 'Global DynamicStagingArea object for Format 3 and 4 dynamic SQL.',
        signatures: [{ label: 'SQLSA : DynamicStagingArea' }],
        valueType: 'DynamicStagingArea',
        risk: 'legacy',
    }),
    systemGlobal({
        name: 'SQLDA',
        category: 'Dynamic SQL',
        summary: 'Global DynamicDescriptionArea object for Format 4 dynamic SQL.',
        signatures: [{ label: 'SQLDA : DynamicDescriptionArea' }],
        valueType: 'DynamicDescriptionArea',
        risk: 'legacy',
    }),
    systemGlobal({
        name: 'Error',
        category: 'Messages',
        summary: 'Global system error object. Receives information when an error not caught by try/catch occurs.',
        signatures: [{ label: 'Error : Error' }],
        valueType: 'Error',
        risk: 'dynamic',
    }),
    systemGlobal({
        name: 'Message',
        category: 'Messages',
        summary: 'Global object for message passing between objects, used with OpenWithParm, CloseWithReturn, etc.',
        signatures: [{ label: 'Message : Message' }],
        valueType: 'Message',
        risk: 'dynamic',
    }),
];

