# Spec: PB-SEMANTIC-P2-BUILD-SOURCE-METADATA-01

## 1. Identificación
- **ID:** PB-SEMANTIC-P2-BUILD-SOURCE-METADATA-01
- **Título:** Separación de Artefactos de Build y Modelos Fuente Semánticos
- **Estado:** Done
- **Prioridad:** P2
- **Área:** Arquitectura, Workspace

## 2. Objetivo
Fijar un contrato arquitectónico estricto que distinga el "fuente semántico editable" (archivos de código que el usuario puede mutar y que el LS debe parsear) de los artefactos que son puramente resultados de build (como `.pbd`), metadatos orquestadores (como `.pblmeta`) y archivos de sincronización ORCA.

## 3. Decisiones y Detalles de Implementación

### 3.1 Artefactos Build-Only (`.pbd`)
- **Decisión:** Totalmente excluidos del *ServingCache* y *DocumentCache* de la capa LSP.
- **Razón:** Un archivo `.pbd` (PowerBuilder Dynamic Library) es un binario compilado destinado a distribución o linking en runtime, no un contenedor de código fuente manipulable interactivamente.
- **Estado Actual:** El módulo de descubrimiento de archivos los ignora o los cataloga como artefactos cerrados sin intentar abrirlos o indexarlos para proveer diagnósticos.

### 3.2 Metadata y Sincronización ORCA (`.pblmeta` y staging)
- **Decisión:** Clasificados como **Integración Exclusiva de Build/Sync**.
- **Razón:** El archivo `.pblmeta` mantiene mapeos y hashes para facilitar las importaciones/exportaciones incrementales de ORCAScript, pero *no* dicta la semántica nativa del código de la clase descrita.
- **Estado Actual:** Los parsers existentes (e.g. `src/server/workspace/pblmeta.ts`) actúan solamente como agentes de I/O para el proceso de *build/refresh*. Las entidades del catálogo extraen su "Source Origin" real desde los `.srw`/`.srf`/`.sru` puros, sin mezclar heurísticas sacadas del meta-fichero.

## 4. Criterios de Aceptación Cumplidos
- `sourceOrigin` asume con rigurosidad que el código fuente PowerScript es la autoridad absoluta.
- El servidor de lenguajes garantiza 0 colisiones o sobreescrituras en el caché causadas por archivos auxiliares de construcción.
- El contrato previene escenarios "round-trip unsafe".
