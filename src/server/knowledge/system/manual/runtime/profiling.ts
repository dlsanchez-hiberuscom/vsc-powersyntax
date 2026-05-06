import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_RUNTIME_PROFILING_CATEGORIES = [
  'Profiling and Tracing',
] as const;

export const PB_MANUAL_CORE_RUNTIME_PROFILING_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'ProfileCall', category: 'Profiling and Tracing', summary: 'Call trace within the profiling subsystem.' }),
  systemObjectDatatype({ name: 'ProfileClass', category: 'Profiling and Tracing', summary: 'Profiled class within the profiling subsystem.' }),
  systemObjectDatatype({ name: 'ProfileLine', category: 'Profiling and Tracing', summary: 'Profiled line within the profiling subsystem.' }),
  systemObjectDatatype({ name: 'ProfileRoutine', category: 'Profiling and Tracing', summary: 'Profiled routine within the profiling subsystem.' }),
  systemObjectDatatype({ name: 'Profiling', category: 'Profiling and Tracing', summary: 'Non-visual object for runtime profiling.' }),
  systemObjectDatatype({ name: 'TraceActivityNode', category: 'Profiling and Tracing', summary: 'Activity node within a trace capture.' }),
  systemObjectDatatype({ name: 'TraceBeginEnd', category: 'Profiling and Tracing', summary: 'Start and end of activity trace.' }),
  systemObjectDatatype({ name: 'TraceError', category: 'Profiling and Tracing', summary: 'Error trace produced by the runtime.' }),
  systemObjectDatatype({ name: 'TraceESQL', category: 'Profiling and Tracing', summary: 'ESQL trace within a profiling session.' }),
  systemObjectDatatype({ name: 'TraceFile', category: 'Profiling and Tracing', summary: 'Trace persisted in a file.' }),
  systemObjectDatatype({ name: 'TraceGarbageCollect', category: 'Profiling and Tracing', summary: 'Runtime garbage collection trace.' }),
  systemObjectDatatype({ name: 'TraceLine', category: 'Profiling and Tracing', summary: 'Executed line trace.' }),
  systemObjectDatatype({ name: 'TraceObject', category: 'Profiling and Tracing', summary: 'Trace associated with a runtime object.' }),
  systemObjectDatatype({ name: 'TraceRoutine', category: 'Profiling and Tracing', summary: 'Trace associated with a routine.' }),
  systemObjectDatatype({ name: 'TraceTree', category: 'Profiling and Tracing', summary: 'Non-visual runtime trace tree.' }),
  systemObjectDatatype({ name: 'TraceTreeError', category: 'Profiling and Tracing', summary: 'Error node within the trace tree.' }),
  systemObjectDatatype({ name: 'TraceTreeESQL', category: 'Profiling and Tracing', summary: 'ESQL node within the trace tree.' }),
  systemObjectDatatype({ name: 'TraceTreeGarbageCollect', category: 'Profiling and Tracing', summary: 'Garbage collection node within the trace tree.' }),
  systemObjectDatatype({ name: 'TraceTreeLine', category: 'Profiling and Tracing', summary: 'Line node within the trace tree.' }),
  systemObjectDatatype({ name: 'TraceTreeNode', category: 'Profiling and Tracing', summary: 'Base node of the trace tree.' }),
  systemObjectDatatype({ name: 'TraceTreeObject', category: 'Profiling and Tracing', summary: 'Object node within the trace tree.' }),
  systemObjectDatatype({ name: 'TraceTreeRoutine', category: 'Profiling and Tracing', summary: 'Routine node within the trace tree.' }),
  systemObjectDatatype({ name: 'TraceTreeUser', category: 'Profiling and Tracing', summary: 'User node within the trace tree.' }),
  systemObjectDatatype({ name: 'TraceUser', category: 'Profiling and Tracing', summary: 'Trace associated with user activity.' }),
];