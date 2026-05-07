# Spec: PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01 y PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01

## 1. Identificación
- **ID:** PB-SEMANTIC-P2-NATIVE-METADATA-CONTRACT-01 (Absorbe PB-ARCH-P2-NATIVE-METADATA-SUBMODEL-01)
- **Título:** Contrato de Metadata para Interop Nativo, PBX y PBNI
- **Estado:** Done
- **Prioridad:** P2
- **Área:** Semántica, Interoperabilidad Nativa

## 2. Objetivo
Fijar una metadata mínima defendible para funciones externas e interoperabilidad nativa, dejando completamente explícitos los límites de no soporte profundo para el ABI, manejo de "bitness" (32-bit vs 64-bit), y el puente PBNI (PowerBuilder Native Interface).

## 3. Decisiones y Detalles de Implementación

### 3.1 Funciones Externas (external) y RPCFUNC
- **Decisión:** Soportado como **Clasificación y Metadata Superficial**.
- **Razón:** El parser extrae la declaración (`LIBRARY`, `ALIAS FOR`) a nivel de firma para proveer *hovers* y auto-completado base. Sin embargo, no validamos en tiempo real si la DLL física existe en el sistema del usuario, ni si el puntero ALIAS encaja con los bytes esperados.
- **Estado Actual:** Reportes y dependencias listan llamadas nativas (identificando `ref`, tipos y librerías). Diagnostic warnings no se emitirán por incompatibilidad C++ vs PowerBuilder. 

### 3.2 REF, longptr y Bitness
- **Decisión:** **Reporting only**.
- **Razón:** El LS puede advertir conversiones dudosas de `long` a `longptr` bajo reglas genéricas de PowerScript, pero no ejecuta análisis de flujo nativo dependiente de la arquitectura para garantizar *memory safety* de llamadas P/Invoke a Win32 o custom DLLs. 
- **Estado Actual:** El tipo `longptr` es un keyword regular. El chequeo de variables `REF` se mantiene en el paso de validación estándar de argumentos, sin *checks* de desbordamiento de memoria externa.

### 3.3 Metadatos PBNI y PBX
- **Decisión:** Degradado a **Needs official confirmation (Fuera de Scope)**.
- **Razón:** La importación de objetos C++ empaquetados en un `.pbx` genera código que no está expuesto directamente en el IDE de forma transparente, requiriendo introspección de binarios (`PBX_GetDescription`).
- **Estado Actual:** El submodelo nativo ignora activamente extensiones de PBNI. Se asume que el compilador final (PBAutoBuild) será la autoridad que reportará cualquier error de integración PBNI.

## 4. Criterios de Aceptación Cumplidos
- La arquitectura traza claramente el límite entre un "declaration parsing" y "ABI validation", optando por lo primero.
- Las vistas interactivas (Hovers) solo proyectan lo declarado en el archivo sin reclamar certidumbre nativa.
- Evitamos sobreprometer cobertura en las docs técnicas.
