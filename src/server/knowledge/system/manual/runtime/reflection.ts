import { PbSystemSymbolEntry } from '../../types';
import { systemObjectDatatype } from '../common';

export const PB_MANUAL_CORE_RUNTIME_REFLECTION_CATEGORIES = [
  'Reflexión',
] as const;

export const PB_MANUAL_CORE_RUNTIME_REFLECTION_TYPES: readonly PbSystemSymbolEntry[] = [
  systemObjectDatatype({ name: 'ClassDefinition', category: 'Reflexión', summary: 'Definición de clase para reflexión.' }),
  systemObjectDatatype({ name: 'EnumerationDefinition', category: 'Reflexión', summary: 'Definición de enumeración para reflexión.' }),
  systemObjectDatatype({ name: 'EnumerationItemDefinition', category: 'Reflexión', summary: 'Ítem de enumeración para reflexión.' }),
  systemObjectDatatype({ name: 'Function_Object', category: 'Reflexión', summary: 'Objeto de función para reflexión runtime.' }),
  systemObjectDatatype({ name: 'PBDOM_CharacterData', category: 'Reflexión', summary: 'Nodo DOM de datos de carácter.' }),
  systemObjectDatatype({ name: 'PBDOM_Object', category: 'Reflexión', summary: 'Objeto base del DOM XML en PowerBuilder.' }),
  systemObjectDatatype({ name: 'PBDOM_Text', category: 'Reflexión', summary: 'Nodo de texto del DOM XML en PowerBuilder.' }),
  systemObjectDatatype({ name: 'ScriptDefinition', category: 'Reflexión', summary: 'Definición de script para reflexión.' }),
  systemObjectDatatype({ name: 'SimpleTypeDefinition', category: 'Reflexión', summary: 'Definición simple de tipo para reflexión.' }),
  systemObjectDatatype({ name: 'VariableDefinition', category: 'Reflexión', summary: 'Definición de variable para reflexión.' }),
  systemObjectDatatype({ name: 'VariableCardinalityDefinition', category: 'Reflexión', summary: 'Definición de cardinalidad para variables y arrays.' }),
  systemObjectDatatype({ name: 'TypeDefinition', category: 'Reflexión', summary: 'Definición de tipo para reflexión.' }),
  systemObjectDatatype({ name: 'TypeObject', category: 'Reflexión', summary: 'Objeto de tipo para reflexión.' }),
];