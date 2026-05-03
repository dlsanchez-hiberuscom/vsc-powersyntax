import { PbSystemSymbolEntry } from '../../types';
import { datatype } from '../common';

export const PB_MANUAL_CORE_DATATYPE_CATEGORIES = [
    'Numérico',
    'Texto',
    'Fecha/Hora',
    'Otros',
] as const;

export const PB_MANUAL_CORE_DATATYPES: readonly PbSystemSymbolEntry[] = [
    // — Numérico —
    datatype({ name: 'Integer', category: 'Numérico', summary: 'Entero con signo de 16 bits (−32768 a 32767).', lookupAliases: ['int'] }),
    datatype({ name: 'Long', category: 'Numérico', summary: 'Entero con signo de 32 bits.' }),
    datatype({ name: 'LongLong', category: 'Numérico', summary: 'Entero con signo de 64 bits.' }),
    datatype({ name: 'LongPtr', category: 'Numérico', summary: 'Entero de puntero (32 o 64 bits según plataforma).' }),
    datatype({ name: 'UnsignedInteger', category: 'Numérico', summary: 'Entero sin signo de 16 bits.', lookupAliases: ['uint', 'unsignedint'] }),
    datatype({ name: 'UnsignedLong', category: 'Numérico', summary: 'Entero sin signo de 32 bits.', lookupAliases: ['ulong'] }),
    datatype({ name: 'Decimal', category: 'Numérico', summary: 'Número decimal de precisión fija (hasta 28 dígitos).', lookupAliases: ['dec'] }),
    datatype({ name: 'Double', category: 'Numérico', summary: 'Número de punto flotante de doble precisión.' }),
    datatype({ name: 'Real', category: 'Numérico', summary: 'Número de punto flotante de precisión simple.' }),
    datatype({ name: 'Number', category: 'Numérico', summary: 'Alias genérico para Decimal.' }),
    datatype({ name: 'Byte', category: 'Numérico', summary: 'Entero sin signo de 8 bits (0 a 255).' }),

    // — Texto —
    datatype({ name: 'String', category: 'Texto', summary: 'Cadena de texto Unicode de longitud variable.' }),
    datatype({ name: 'Char', category: 'Texto', summary: 'Carácter Unicode individual.', lookupAliases: ['character'] }),

    // — Fecha/Hora —
    datatype({ name: 'Date', category: 'Fecha/Hora', summary: 'Fecha sin componente de hora.' }),
    datatype({ name: 'Time', category: 'Fecha/Hora', summary: 'Hora sin componente de fecha.' }),
    datatype({ name: 'DateTime', category: 'Fecha/Hora', summary: 'Combinación de fecha y hora.', lookupAliases: ['timestamp'] }),

    // — Otros —
    datatype({ name: 'Boolean', category: 'Otros', summary: 'Tipo lógico: TRUE o FALSE.' }),
    datatype({ name: 'Blob', category: 'Otros', summary: 'Datos binarios de longitud variable (Binary Large Object).' }),
    datatype({ name: 'Any', category: 'Otros', summary: 'Tipo genérico que puede contener cualquier tipo de dato.' }),
];
