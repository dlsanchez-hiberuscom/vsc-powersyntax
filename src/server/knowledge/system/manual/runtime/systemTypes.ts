import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_RUNTIME_BASE_SYSTEM_OBJECT_DATATYPE_CATEGORIES = [
    'Non-visual objects',
    'System objects',
] as const;

export const PB_MANUAL_CORE_RUNTIME_BASE_SYSTEM_OBJECT_DATATYPES: readonly PbSystemSymbolEntry[] = [
    // — Non-visual objects —
    systemObjectDatatype({ name: 'ADOResultSet', category: 'Non-visual objects', summary: 'Non-visual ADO result set.' }),
    systemObjectDatatype({ name: 'BatchDataObjects', category: 'Non-visual objects', summary: 'Non-visual collection for processing multiple data objects in batch.' }),
    systemObjectDatatype({ name: 'NonVisualObject', category: 'Non-visual objects', summary: 'Base for custom non-visual objects.' }),
    systemObjectDatatype({ name: 'DataStore', category: 'Non-visual objects', summary: 'Non-visual DataWindow (without graphical interface).' }),
    systemObjectDatatype({ name: 'ResultSet', category: 'Non-visual objects', summary: 'Non-visual result set interoperable with DataStore and ADO.' }),
    systemObjectDatatype({ name: 'Transaction', category: 'Non-visual objects', summary: 'Transaction object for database connections.' }),
    systemObjectDatatype({ name: 'Connection', category: 'Non-visual objects', summary: 'Non-visual connection to services or external sources.' }),
    systemObjectDatatype({ name: 'ContextInformation', category: 'Non-visual objects', summary: 'Non-visual context for session metadata.' }),
    systemObjectDatatype({ name: 'ContextKeyword', category: 'Non-visual objects', summary: 'Non-visual context keyword for runtime metadata.' }),
    systemObjectDatatype({ name: 'ErrorLogging', category: 'Non-visual objects', summary: 'Non-visual object for error logging.' }),
    systemObjectDatatype({ name: 'MLSync', category: 'Non-visual objects', summary: 'Non-visual object for mobile synchronization.' }),
    systemObjectDatatype({ name: 'MLSynchronization', category: 'Non-visual objects', summary: 'Non-visual object for advanced mobile synchronization.' }),
    systemObjectDatatype({ name: 'Pipeline', category: 'Non-visual objects', summary: 'Non-visual pipeline for ETL and data movement processes.' }),
    systemObjectDatatype({ name: 'PowerServerResult', category: 'Non-visual objects', summary: 'Non-visual result returned by PowerServer operations.' }),
    systemObjectDatatype({ name: 'SyncParm', category: 'Non-visual objects', summary: 'Non-visual parameter for mobile synchronization.' }),
    systemObjectDatatype({ name: 'Timing', category: 'Non-visual objects', summary: 'Non-visual utility for time measurement.' }),
    systemObjectDatatype({ name: 'TransactionServer', category: 'Non-visual objects', summary: 'Non-visual transaction server.' }),
    systemObjectDatatype({ name: 'ULSync', category: 'Non-visual objects', summary: 'Non-visual object for UltraLite synchronization.' }),

    // — System objects —
    systemObjectDatatype({ name: 'Application', category: 'System objects', summary: 'Root object of the PowerBuilder application.' }),
    systemObjectDatatype({ name: 'PowerObject', category: 'System objects', summary: 'Root of the PowerBuilder type hierarchy.' }),
    systemObjectDatatype({ name: 'GraphicObject', category: 'System objects', summary: 'Base for graphic objects.' }),
    systemObjectDatatype({ name: 'DrawObject', category: 'System objects', summary: 'Base for drawing objects (line, rectangle, etc.).' }),
    systemObjectDatatype({ name: 'Structure', category: 'System objects', summary: 'Structure type (field grouping).' }),
    systemObjectDatatype({ name: 'ArrayBounds', category: 'System objects', summary: 'Describes the declared bounds of a PowerBuilder array.' }),
    systemObjectDatatype({ name: 'DataWindowChild', category: 'System objects', summary: 'Reference to a child DataWindow (DropDownDataWindow).' }),
    systemObjectDatatype({ name: 'DynamicDescriptionArea', category: 'System objects', summary: 'Description area for dynamic SQL.' }),
    systemObjectDatatype({ name: 'DynamicStagingArea', category: 'System objects', summary: 'Staging area for dynamic SQL.' }),
    systemObjectDatatype({ name: 'Environment', category: 'System objects', summary: 'Runtime environment information.' }),
    systemObjectDatatype({ name: 'Message', category: 'System objects', summary: 'Global object for message passing between objects.' }),
];
