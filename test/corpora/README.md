# Matriz de corpus públicos — PowerBuilder

## Objetivo

Usar corpus públicos y reproducibles para validar:

- carga del plugin,
- arranque del servidor LSP,
- indexación inicial,
- apertura incremental,
- estabilidad sobre workspaces grandes,
- y compatibilidad con fuentes legacy y especializaciones del ecosistema.

La integración mínima actual del ciclo cubre:

- **PFC 2025 Workspace**;
- **PFC 2025 Solution**;
- **legacy PBL dump** como slot de regresión real para fuentes exportadas;
- **STD_FC_OrderEntry** como slot enterprise local no público para discovery/indexación y regresión sobre aplicación real híbrida.

## Repositorios recomendados

### 1. PFC 2025 Workspace

Repositorio recomendado como corpus principal:

- `OpenSourcePFCLibraries/2025-Workspace`

Motivo:

- está publicado como repositorio open source de PFC para **PowerBuilder 2025** en formato **Workspace**;
- encaja muy bien con un escenario real de apertura y análisis de un workspace grande.

### 2. PFC 2025 Solution

Repositorio recomendado como corpus secundario:

- `OpenSourcePFCLibraries/2025-Solution`

Motivo:

- permite validar el plugin también sobre el formato **Solution**;
- sirve para comprobar que el descubrimiento de proyecto funciona bien en ambos formatos.

## Slots públicos materializados actualmente

| Categoría | Repositorios públicos recomendados | Fixture local recomendado | Uso principal |
|---|---|---|---|
| PFC 2025 Workspace | `OpenSourcePFCLibraries/2025-Workspace` | `fixtures-local/pfc/2025-Workspace` | smoke/performance sobre workspace real |
| PFC 2025 Solution | `OpenSourcePFCLibraries/2025-Solution` | `fixtures-local/pfc/2025-Solution` | discovery y extension smoke sobre solution real |
| PBL dump examples | `gmai2006/powerbuilder-pbl-dump`, `rwxce/pb-toolkit`, `Hucxy/PBDWEDIT` | `fixtures-local/public/legacy-pbl-dump` | regresión sobre fuente legacy exportada |

## Slots públicos opcionales no materializados por defecto

Estos slots siguen siendo recomendados para validaciones futuras, pero **no forman parte del checkout local base** ni deben asumirse presentes en tests, docs de performance o workflows repetibles mientras no se materialicen explícitamente.

| Categoría | Repositorios públicos recomendados | Slot local opcional | Uso principal |
|---|---|---|---|
| DataWindow examples | `Appeon/PowerBuilder-Dw2Doc-Example`, `sebkirche/PowerBuilder-DataWindow`, `thansuoi113` DataWindow examples | `fixtures-local/public/datawindow-examples` | parser/links/hover DataWindow |
| ORCA/build examples | `Appeon/PowerBuilder-AutoBuild-Sales-Example`, `zrh535/pborca`, `zhj149/PowerBuilder-ORCA` | `fixtures-local/public/orca-build-examples` | flujos de build y staging separados del hot path |
| Native/PBNI examples | `informaticon/cpp-pbni-framework`, `bruce-armstrong/pbnismtp`, `arnd-schmidt/pbwebview2` | `fixtures-local/public/native-pbni-examples` | detección de dependencias nativas y límites de rename/reference |
| Modern JSON/WebView2 examples | `LEXBLAS/jsonapi`, `Appeon/PowerBuilder-Graph-Example-WebView2`, `lxb320124/pbidea` | `fixtures-local/public/modern-integrations` | JSON, WebView2 y código dinámico |

## Criterios de inclusión

- corpus público y clonable sin credenciales;
- contenido mayoritariamente source-based y útil para el plugin;
- representatividad clara de una categoría PowerBuilder real;
- estructura suficientemente estable para repetir validaciones;
- preparación local documentable sin contaminar `src/`.

## Criterios de exclusión

- mirrors privados o con licencia no verificable;
- dumps binarios sin fuente legible por el plugin;
- ejemplos puramente generados que no aportan comportamiento real;
- corpus que mezclen source real con `orca-staging` sin procedencia clara;
- dependencias que exijan modificar el producto para poder inspeccionarlas.

## Política del repositorio

Este corpus **no debe mezclarse con el código productivo del plugin**.

Se usará como **fixture local controlado** en una carpeta ignorada por Git.

## Estructura local recomendada

```text
fixtures-local/
  STD_FC_OrderEntry/
  pfc/
    2025-Workspace/
    2025-Solution/
  public/
    legacy-pbl-dump/
```

Slots opcionales no materializados por defecto:

```text
fixtures-local/public/datawindow-examples/
fixtures-local/public/orca-build-examples/
fixtures-local/public/native-pbni-examples/
fixtures-local/public/modern-integrations/
```

## Flujo recomendado

1. Clonar o copiar `2025-Workspace` en `fixtures-local/pfc/2025-Workspace`.
2. Clonar o copiar `2025-Solution` en `fixtures-local/pfc/2025-Solution`.
3. Clonar al menos un dump público de PBL en `fixtures-local/public/legacy-pbl-dump`.
4. Si se dispone de una app enterprise local reproducible, ubicarla en `fixtures-local/STD_FC_OrderEntry` o un slot equivalente fuera de Git.
5. Añadir DataWindow / ORCA-build / native / modern integrations solo cuando la validación del área lo necesite y documentar entonces su materialización real.
6. Mantener estos corpus fuera de Git y documentar localmente commit o tag si se usan para comparar regresiones.

## Qué validar con este corpus

### Smoke tests

- el plugin activa correctamente;
- el servidor LSP levanta;
- el archivo activo responde con hover, símbolos y diagnósticos básicos.
- las fuentes legacy exportadas siguen parseando y produciendo símbolos/diagnósticos estructurales.

### Performance

- tiempo hasta primer servicio útil;
- comportamiento de indexación inicial;
- prioridad del archivo activo;
- estabilidad del servidor con muchos archivos.

## Integración actual en el ciclo

- `npm run test:architecture:rapid` compone el gate corto de refactors arquitectónicos sobre `smoke/pfc-workspace-extension`, `smoke/pfc-solution-extension` y las suites `performance/pfc-*` + `performance/orderentry*`, dejando evidencia JSON en `artifacts/performance/architecture-rapid-gate.json` y degradando a `passed-with-skips`/`skipped` cuando falten corpus locales;
- `test/smoke/pfc-workspace.extension.test.ts` valida la extensión real sobre **PFC 2025 Workspace**;
- `test/smoke/pfc-solution.extension.test.ts` valida la extensión real sobre **PFC 2025 Solution**;
- `test/server/performance/pfc-workspace.smoke.test.ts` y `pfc-workspace.perf.test.ts` validan **PFC 2025 Workspace**;
- `test/server/performance/pfc-solution.smoke.test.ts` mantiene smoke parser/symbols sobre **PFC 2025 Solution**;
- `test/server/performance/enumCatalogCorpusValidation.smoke.test.ts` clasifica uso real de valores con `!` sobre **PFC Solution**, **STD_FC_OrderEntry** y **legacy PBL dump**, dejando el baseline actual `13068 total / 1554 catalogados / 5296 unknown / 6214 false positives / 4 out-of-context / 0 candidates` sin convertir esa evidencia en autoridad de catálogo;
- `test/server/performance/legacy-pbl-dump.smoke.test.ts` introduce regresión básica sobre **legacy PBL dump**;
- `test/server/performance/orderentry.perf.test.ts`, `orderentry.smoke.test.ts` y `orderentry.semantic.test.ts` fijan el slot enterprise local **STD_FC_OrderEntry** como baseline operativo de discovery/indexación, smoke semántica y topología real híbrida con ruido no fuente explícitamente ignorado.

## Qué no hacer

- no commitear PFC dentro del repo principal;
- no commitear corpus públicos auxiliares dentro del repo principal;
- no usar el corpus grande como sustituto de los fixtures pequeños de unit tests;
- no mezclar este corpus con `src/` ni con el código del producto.
