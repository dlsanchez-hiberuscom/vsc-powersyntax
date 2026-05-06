import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_RUNTIME_REFLECTION_CATEGORIES = [
  'Reflection',
] as const;

export const PB_MANUAL_CORE_RUNTIME_REFLECTION_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'ClassDefinition', category: 'Reflection', summary: 'Class definition for reflection.' }),
  systemObjectDatatype({ name: 'EnumerationDefinition', category: 'Reflection', summary: 'Enumeration definition for reflection.' }),
  systemObjectDatatype({ name: 'EnumerationItemDefinition', category: 'Reflection', summary: 'Enumeration item for reflection.' }),
  systemObjectDatatype({ name: 'Function_Object', category: 'Reflection', summary: 'Function object for runtime reflection.' }),
  systemObjectDatatype({ name: 'PBDOM_CharacterData', category: 'Reflection', summary: 'DOM character data node.' }),
  systemObjectDatatype({ name: 'PBDOM_Object', category: 'Reflection', summary: 'Base object of the XML DOM in PowerBuilder.' }),
  systemObjectDatatype({ name: 'PBDOM_Text', category: 'Reflection', summary: 'XML DOM text node in PowerBuilder.' }),
  systemObjectDatatype({ name: 'ScriptDefinition', category: 'Reflection', summary: 'Script definition for reflection.' }),
  systemObjectDatatype({ name: 'SimpleTypeDefinition', category: 'Reflection', summary: 'Simple type definition for reflection.' }),
  systemObjectDatatype({ name: 'VariableDefinition', category: 'Reflection', summary: 'Variable definition for reflection.' }),
  systemObjectDatatype({ name: 'VariableCardinalityDefinition', category: 'Reflection', summary: 'Cardinality definition for variables and arrays.' }),
  systemObjectDatatype({ name: 'TypeDefinition', category: 'Reflection', summary: 'Type definition for reflection.' }),
  systemObjectDatatype({ name: 'TypeObject', category: 'Reflection', summary: 'Type object for reflection.' }),
];