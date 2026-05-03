import { PbSystemSymbolEntry } from '../types';
import { systemGlobal } from './common';

export const PB_MANUAL_CORE_SYSTEM_GLOBAL_CATEGORIES = [
    'Transacción',
    'SQL dinámico',
    'Mensajes',
] as const;

export const PB_MANUAL_CORE_SYSTEM_GLOBALS: readonly PbSystemSymbolEntry[] = [
    systemGlobal({
        name: 'SQLCA',
        category: 'Transacción',
        summary: 'Objeto global de transacción por defecto (tipo Transaction). Conecta y gestiona la base de datos.',
        lookupAliases: ['sqlca'],
    }),
    systemGlobal({
        name: 'SQLSA',
        category: 'SQL dinámico',
        summary: 'Objeto global DynamicStagingArea para SQL dinámico formato 3 y 4.',
    }),
    systemGlobal({
        name: 'SQLDA',
        category: 'SQL dinámico',
        summary: 'Objeto global DynamicDescriptionArea para SQL dinámico formato 4.',
    }),
    systemGlobal({
        name: 'Error',
        category: 'Mensajes',
        summary: 'Objeto global de error del sistema. Recibe información cuando ocurre un error no capturado por try/catch.',
    }),
    systemGlobal({
        name: 'Message',
        category: 'Mensajes',
        summary: 'Objeto global para paso de mensajes entre objetos, usado con OpenWithParm, CloseWithReturn, etc.',
    }),
];
