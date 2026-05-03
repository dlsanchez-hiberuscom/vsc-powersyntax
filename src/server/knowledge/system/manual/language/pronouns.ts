import { PbSystemSymbolEntry } from '../../types';
import { pronoun } from '../common';

export const PB_MANUAL_CORE_PRONOUN_CATEGORIES = [
    'Referencia de objeto',
] as const;

export const PB_MANUAL_CORE_PRONOUNS: readonly PbSystemSymbolEntry[] = [
    pronoun({ name: 'This', category: 'Referencia de objeto', summary: 'Referencia al objeto actual.' }),
    pronoun({ name: 'Super', category: 'Referencia de objeto', summary: 'Referencia al ancestro inmediato del objeto actual.' }),
    pronoun({ name: 'Parent', category: 'Referencia de objeto', summary: 'Referencia al contenedor visual inmediato del control.' }),
    pronoun({ name: 'ParentWindow', category: 'Referencia de objeto', summary: 'Referencia a la ventana que contiene el menú activo.' }),
];
