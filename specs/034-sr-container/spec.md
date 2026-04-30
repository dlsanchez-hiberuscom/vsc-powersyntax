# Spec 034 — SR* container parser (B113)

## 1. Motivación

Los archivos `.sra/.srw/.sru/.srm/.srf` siguen una estructura contenedora
estable (forward, global type, type variables, forward prototypes, on
create/destroy, callables). Reconocerla con seguridad es base para hover,
diagnostics y futuros parsers ricos.

## 2. Alcance

- `src/server/parsing/srContainerParser.ts`:
  - `parseSrContainer(content: string): SrContainer`.
  - `SrContainer` con campos:
    - `forwardLine?: number`
    - `globalType?: { name: string; baseType: string; line: number }`
    - `typeVariablesRange?: SectionRange`
    - `forwardPrototypesRange?: SectionRange`
    - `onCreateLine?: number`
    - `onDestroyLine?: number`

### Fuera de alcance

- Parsing de cuerpos de funciones.

## 3. Criterios de aceptación

1. Detecta `forward`, `global type w_main from window`, `type variables`, `forward prototypes`, `on create`, `on destroy`.
2. Tests cubren un fixture sintético.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B113).
