import { PbSystemSymbolEntry } from '../types';
import { systemObjectDatatype } from './common';

export const PB_MANUAL_CORE_SYSTEM_OBJECT_DATATYPE_CATEGORIES = [
    'Objetos visuales',
    'Objetos no visuales',
    'Objetos de sistema',
    'Reflexión',
    'OLE',
    'Errores',
] as const;

export const PB_MANUAL_CORE_SYSTEM_OBJECT_DATATYPES: readonly PbSystemSymbolEntry[] = [
    // — Objetos visuales —
    systemObjectDatatype({ name: 'Window', category: 'Objetos visuales', summary: 'Ventana de la interfaz de usuario.' }),
    systemObjectDatatype({ name: 'Application', category: 'Objetos visuales', summary: 'Objeto raíz de la aplicación PowerBuilder.' }),
    systemObjectDatatype({ name: 'DataWindow', category: 'Objetos visuales', summary: 'Control DataWindow visual.', lookupAliases: ['dw'] }),
    systemObjectDatatype({ name: 'Menu', category: 'Objetos visuales', summary: 'Menú de la interfaz de usuario.' }),

    // — Objetos no visuales —
    systemObjectDatatype({ name: 'NonVisualObject', category: 'Objetos no visuales', summary: 'Base de objetos no visuales personalizados.' }),
    systemObjectDatatype({ name: 'DataStore', category: 'Objetos no visuales', summary: 'DataWindow no visual (sin interfaz gráfica).' }),
    systemObjectDatatype({ name: 'Transaction', category: 'Objetos no visuales', summary: 'Objeto de transacción para conexiones de base de datos.' }),

    // — Objetos de sistema —
    systemObjectDatatype({ name: 'PowerObject', category: 'Objetos de sistema', summary: 'Raíz de la jerarquía de tipos PowerBuilder.' }),
    systemObjectDatatype({ name: 'GraphicObject', category: 'Objetos de sistema', summary: 'Base de objetos gráficos.' }),
    systemObjectDatatype({ name: 'DrawObject', category: 'Objetos de sistema', summary: 'Base de objetos de dibujo (línea, rectángulo, etc.).' }),
    systemObjectDatatype({ name: 'Structure', category: 'Objetos de sistema', summary: 'Tipo estructura (agrupación de campos).' }),
    systemObjectDatatype({ name: 'DataWindowChild', category: 'Objetos de sistema', summary: 'Referencia a un DataWindow hijo (DropDownDataWindow).' }),
    systemObjectDatatype({ name: 'DynamicDescriptionArea', category: 'Objetos de sistema', summary: 'Área de descripción para SQL dinámico.' }),
    systemObjectDatatype({ name: 'DynamicStagingArea', category: 'Objetos de sistema', summary: 'Área de staging para SQL dinámico.' }),
    systemObjectDatatype({ name: 'Environment', category: 'Objetos de sistema', summary: 'Información del entorno de ejecución.' }),
    systemObjectDatatype({ name: 'Message', category: 'Objetos de sistema', summary: 'Objeto global para paso de mensajes entre objetos.' }),
    systemObjectDatatype({ name: 'MailSession', category: 'Objetos de sistema', summary: 'Objeto para envío de correo MAPI.' }),

    // — Reflexión —
    systemObjectDatatype({ name: 'ClassDefinition', category: 'Reflexión', summary: 'Definición de clase para reflexión.' }),
    systemObjectDatatype({ name: 'ScriptDefinition', category: 'Reflexión', summary: 'Definición de script para reflexión.' }),
    systemObjectDatatype({ name: 'VariableDefinition', category: 'Reflexión', summary: 'Definición de variable para reflexión.' }),
    systemObjectDatatype({ name: 'TypeDefinition', category: 'Reflexión', summary: 'Definición de tipo para reflexión.' }),
    systemObjectDatatype({ name: 'TypeObject', category: 'Reflexión', summary: 'Objeto de tipo para reflexión.' }),

    // — OLE —
    systemObjectDatatype({ name: 'OLEObject', category: 'OLE', summary: 'Objeto OLE Automation genérico.' }),
    systemObjectDatatype({ name: 'OLEControl', category: 'OLE', summary: 'Control OLE visual insertable.' }),
    systemObjectDatatype({ name: 'OLECustomControl', category: 'OLE', summary: 'Control OLE ActiveX personalizado.' }),
    systemObjectDatatype({ name: 'OLEStorage', category: 'OLE', summary: 'Almacenamiento OLE Structured Storage.' }),
    systemObjectDatatype({ name: 'OLEStream', category: 'OLE', summary: 'Flujo dentro de un OLE Storage.' }),

    // — Errores —
    systemObjectDatatype({ name: 'Throwable', category: 'Errores', summary: 'Base de excepciones (try/catch/throw).' }),
    systemObjectDatatype({ name: 'Error', category: 'Errores', summary: 'Objeto global de error del sistema.' }),
    systemObjectDatatype({ name: 'RuntimeError', category: 'Errores', summary: 'Error en tiempo de ejecución.' }),
];
