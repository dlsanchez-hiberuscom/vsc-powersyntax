# Corpus grande de pruebas — PFC 2025

## Objetivo

Usar **PFC 2025** como corpus grande y realista para validar:

- carga del plugin,
- arranque del servidor LSP,
- indexación inicial,
- apertura incremental,
- y estabilidad sobre un workspace grande.

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

## Política del repositorio

Este corpus **no debe mezclarse con el código productivo del plugin**.

Se usará como **fixture local controlado** en una carpeta ignorada por Git.

## Estructura local recomendada

```text
fixtures-local/
  pfc/
    2025-Workspace/
    2025-Solution/
```

## Flujo recomendado

1. Clonar o copiar `2025-Workspace` en `fixtures-local/pfc/2025-Workspace`
2. Clonar o copiar `2025-Solution` en `fixtures-local/pfc/2025-Solution`
3. Usar primero `2025-Workspace` como corpus principal de smoke/performance
4. Usar después `2025-Solution` como validación secundaria

## Qué validar con este corpus

### Smoke tests

- el plugin activa correctamente;
- el servidor LSP levanta;
- el archivo activo responde con hover, símbolos y diagnósticos básicos.

### Performance

- tiempo hasta primer servicio útil;
- comportamiento de indexación inicial;
- prioridad del archivo activo;
- estabilidad del servidor con muchos archivos.

## Qué no hacer

- no commitear PFC dentro del repo principal;
- no usar el corpus grande como sustituto de los fixtures pequeños de unit tests;
- no mezclar este corpus con `src/` ni con el código del producto.
