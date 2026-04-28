import { buildSystemSymbolIndexes } from '../knowledge/indexes/buildIndexes';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../knowledge/registry/registry';
import {
    listSystemDataWindowEvents,
    listSystemDataWindowFunctions,
    listSystemEvents,
    listSystemGlobalFunctions,
    listSystemObjectEvents,
    listSystemObjectFunctions,
    listSystemStatements,
    listSystemSymbols,
} from '../knowledge/services/queryService';

export const PB_SYSTEM_GLOBAL_FUNCTIONS = listSystemGlobalFunctions();
export const PB_SYSTEM_OBJECT_FUNCTIONS = listSystemObjectFunctions();
export const PB_SYSTEM_DATAWINDOW_FUNCTIONS = listSystemDataWindowFunctions();
export const PB_SYSTEM_OBJECT_EVENTS = listSystemObjectEvents();
export const PB_SYSTEM_DATAWINDOW_EVENTS = listSystemDataWindowEvents();
export const PB_SYSTEM_EVENTS = listSystemEvents();
export const PB_SYSTEM_STATEMENTS = listSystemStatements();
export const PB_SYSTEM_SYMBOLS = listSystemSymbols();

const GLOBAL_FUNCTION_INDEXES = buildSystemSymbolIndexes(PB_SYSTEM_GLOBAL_FUNCTIONS);
const OBJECT_FUNCTION_INDEXES = buildSystemSymbolIndexes(PB_SYSTEM_OBJECT_FUNCTIONS);
const DATAWINDOW_FUNCTION_INDEXES = buildSystemSymbolIndexes(PB_SYSTEM_DATAWINDOW_FUNCTIONS);
const OBJECT_EVENT_INDEXES = buildSystemSymbolIndexes(PB_SYSTEM_OBJECT_EVENTS);
const DATAWINDOW_EVENT_INDEXES = buildSystemSymbolIndexes(PB_SYSTEM_DATAWINDOW_EVENTS);
const EVENT_INDEXES = buildSystemSymbolIndexes(PB_SYSTEM_EVENTS);
const STATEMENT_INDEXES = buildSystemSymbolIndexes(PB_SYSTEM_STATEMENTS);

export const PB_SYSTEM_SYMBOLS_BY_NAME = PB_SYSTEM_SYMBOL_REGISTRY.indexes.byLookupKey;
export const PB_SYSTEM_GLOBAL_FUNCTIONS_BY_NAME = GLOBAL_FUNCTION_INDEXES.byLookupKey;
export const PB_SYSTEM_OBJECT_FUNCTIONS_BY_NAME = OBJECT_FUNCTION_INDEXES.byLookupKey;
export const PB_SYSTEM_DATAWINDOW_FUNCTIONS_BY_NAME = DATAWINDOW_FUNCTION_INDEXES.byLookupKey;
export const PB_SYSTEM_OBJECT_EVENTS_BY_NAME = OBJECT_EVENT_INDEXES.byLookupKey;
export const PB_SYSTEM_DATAWINDOW_EVENTS_BY_NAME = DATAWINDOW_EVENT_INDEXES.byLookupKey;
export const PB_SYSTEM_EVENTS_BY_NAME = EVENT_INDEXES.byLookupKey;
export const PB_SYSTEM_STATEMENTS_BY_NAME = STATEMENT_INDEXES.byLookupKey;