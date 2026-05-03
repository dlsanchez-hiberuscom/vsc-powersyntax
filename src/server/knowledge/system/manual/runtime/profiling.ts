import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_RUNTIME_PROFILING_CATEGORIES = [
  'Profiling y trazas',
] as const;

export const PB_MANUAL_CORE_RUNTIME_PROFILING_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'ProfileCall', category: 'Profiling y trazas', summary: 'Traza de llamada dentro del subsistema de profiling.' }),
  systemObjectDatatype({ name: 'ProfileClass', category: 'Profiling y trazas', summary: 'Clase perfilada dentro del subsistema de profiling.' }),
  systemObjectDatatype({ name: 'ProfileLine', category: 'Profiling y trazas', summary: 'Línea perfilada dentro del subsistema de profiling.' }),
  systemObjectDatatype({ name: 'ProfileRoutine', category: 'Profiling y trazas', summary: 'Rutina perfilada dentro del subsistema de profiling.' }),
  systemObjectDatatype({ name: 'Profiling', category: 'Profiling y trazas', summary: 'Objeto no visual para profiling runtime.' }),
  systemObjectDatatype({ name: 'TraceActivityNode', category: 'Profiling y trazas', summary: 'Nodo de actividad dentro de una captura de trazas.' }),
  systemObjectDatatype({ name: 'TraceBeginEnd', category: 'Profiling y trazas', summary: 'Traza de inicio y fin de actividad.' }),
  systemObjectDatatype({ name: 'TraceError', category: 'Profiling y trazas', summary: 'Traza de error producida por el runtime.' }),
  systemObjectDatatype({ name: 'TraceESQL', category: 'Profiling y trazas', summary: 'Traza ESQL dentro de una sesión de profiling.' }),
  systemObjectDatatype({ name: 'TraceFile', category: 'Profiling y trazas', summary: 'Traza persistida en archivo.' }),
  systemObjectDatatype({ name: 'TraceGarbageCollect', category: 'Profiling y trazas', summary: 'Traza de recolección de basura del runtime.' }),
  systemObjectDatatype({ name: 'TraceLine', category: 'Profiling y trazas', summary: 'Traza de línea ejecutada.' }),
  systemObjectDatatype({ name: 'TraceObject', category: 'Profiling y trazas', summary: 'Traza asociada a un objeto runtime.' }),
  systemObjectDatatype({ name: 'TraceRoutine', category: 'Profiling y trazas', summary: 'Traza asociada a una rutina.' }),
  systemObjectDatatype({ name: 'TraceTree', category: 'Profiling y trazas', summary: 'Árbol no visual de trazas runtime.' }),
  systemObjectDatatype({ name: 'TraceTreeError', category: 'Profiling y trazas', summary: 'Nodo de error dentro del árbol de trazas.' }),
  systemObjectDatatype({ name: 'TraceTreeESQL', category: 'Profiling y trazas', summary: 'Nodo ESQL dentro del árbol de trazas.' }),
  systemObjectDatatype({ name: 'TraceTreeGarbageCollect', category: 'Profiling y trazas', summary: 'Nodo de garbage collection dentro del árbol de trazas.' }),
  systemObjectDatatype({ name: 'TraceTreeLine', category: 'Profiling y trazas', summary: 'Nodo de línea dentro del árbol de trazas.' }),
  systemObjectDatatype({ name: 'TraceTreeNode', category: 'Profiling y trazas', summary: 'Nodo base del árbol de trazas.' }),
  systemObjectDatatype({ name: 'TraceTreeObject', category: 'Profiling y trazas', summary: 'Nodo de objeto dentro del árbol de trazas.' }),
  systemObjectDatatype({ name: 'TraceTreeRoutine', category: 'Profiling y trazas', summary: 'Nodo de rutina dentro del árbol de trazas.' }),
  systemObjectDatatype({ name: 'TraceTreeUser', category: 'Profiling y trazas', summary: 'Nodo de usuario dentro del árbol de trazas.' }),
  systemObjectDatatype({ name: 'TraceUser', category: 'Profiling y trazas', summary: 'Traza asociada a actividad de usuario.' }),
];