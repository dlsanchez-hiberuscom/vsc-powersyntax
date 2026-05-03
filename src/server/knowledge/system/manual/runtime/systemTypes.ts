import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_RUNTIME_BASE_SYSTEM_OBJECT_DATATYPE_CATEGORIES = [
    'Objetos no visuales',
    'Objetos de sistema',
] as const;

export const PB_MANUAL_CORE_RUNTIME_BASE_SYSTEM_OBJECT_DATATYPES: readonly PbSystemSymbolEntry[] = [
    // — Objetos no visuales —
    systemObjectDatatype({ name: 'ADOResultSet', category: 'Objetos no visuales', summary: 'Result set no visual de ADO.' }),
    systemObjectDatatype({ name: 'BatchDataObjects', category: 'Objetos no visuales', summary: 'Colección no visual para procesar múltiples objetos de datos en batch.' }),
    systemObjectDatatype({ name: 'NonVisualObject', category: 'Objetos no visuales', summary: 'Base de objetos no visuales personalizados.' }),
    systemObjectDatatype({ name: 'DataStore', category: 'Objetos no visuales', summary: 'DataWindow no visual (sin interfaz gráfica).' }),
    systemObjectDatatype({ name: 'ResultSet', category: 'Objetos no visuales', summary: 'Result set no visual interoperable con DataStore y ADO.' }),
    systemObjectDatatype({ name: 'Transaction', category: 'Objetos no visuales', summary: 'Objeto de transacción para conexiones de base de datos.' }),
    systemObjectDatatype({ name: 'Connection', category: 'Objetos no visuales', summary: 'Conexión no visual a servicios o fuentes externas.' }),
    systemObjectDatatype({ name: 'ContextInformation', category: 'Objetos no visuales', summary: 'Contexto no visual para metadata de sesión.' }),
    systemObjectDatatype({ name: 'ContextKeyword', category: 'Objetos no visuales', summary: 'Keyword de contexto no visual para metadatos runtime.' }),
    systemObjectDatatype({ name: 'ErrorLogging', category: 'Objetos no visuales', summary: 'Objeto no visual para logging de errores.' }),
    systemObjectDatatype({ name: 'MLSync', category: 'Objetos no visuales', summary: 'Objeto no visual para sincronización móvil.' }),
    systemObjectDatatype({ name: 'MLSynchronization', category: 'Objetos no visuales', summary: 'Objeto no visual para sincronización móvil avanzada.' }),
    systemObjectDatatype({ name: 'Pipeline', category: 'Objetos no visuales', summary: 'Pipeline no visual para procesos ETL y data movement.' }),
    systemObjectDatatype({ name: 'PowerServerResult', category: 'Objetos no visuales', summary: 'Resultado no visual devuelto por operaciones PowerServer.' }),
    systemObjectDatatype({ name: 'SyncParm', category: 'Objetos no visuales', summary: 'Parámetro no visual para sincronización móvil.' }),
    systemObjectDatatype({ name: 'Timing', category: 'Objetos no visuales', summary: 'Utilidad no visual para medición temporal.' }),
    systemObjectDatatype({ name: 'TransactionServer', category: 'Objetos no visuales', summary: 'Servidor transaccional no visual.' }),
    systemObjectDatatype({ name: 'ULSync', category: 'Objetos no visuales', summary: 'Objeto no visual para sincronización UltraLite.' }),

    // — Objetos de sistema —
    systemObjectDatatype({ name: 'Application', category: 'Objetos de sistema', summary: 'Objeto raíz de la aplicación PowerBuilder.' }),
    systemObjectDatatype({ name: 'PowerObject', category: 'Objetos de sistema', summary: 'Raíz de la jerarquía de tipos PowerBuilder.' }),
    systemObjectDatatype({ name: 'GraphicObject', category: 'Objetos de sistema', summary: 'Base de objetos gráficos.' }),
    systemObjectDatatype({ name: 'DrawObject', category: 'Objetos de sistema', summary: 'Base de objetos de dibujo (línea, rectángulo, etc.).' }),
    systemObjectDatatype({ name: 'Structure', category: 'Objetos de sistema', summary: 'Tipo estructura (agrupación de campos).' }),
    systemObjectDatatype({ name: 'ArrayBounds', category: 'Objetos de sistema', summary: 'Describe los límites declarados de un array PowerBuilder.' }),
    systemObjectDatatype({ name: 'DataWindowChild', category: 'Objetos de sistema', summary: 'Referencia a un DataWindow hijo (DropDownDataWindow).' }),
    systemObjectDatatype({ name: 'DynamicDescriptionArea', category: 'Objetos de sistema', summary: 'Área de descripción para SQL dinámico.' }),
    systemObjectDatatype({ name: 'DynamicStagingArea', category: 'Objetos de sistema', summary: 'Área de staging para SQL dinámico.' }),
    systemObjectDatatype({ name: 'Environment', category: 'Objetos de sistema', summary: 'Información del entorno de ejecución.' }),
    systemObjectDatatype({ name: 'Message', category: 'Objetos de sistema', summary: 'Objeto global para paso de mensajes entre objetos.' }),
];
