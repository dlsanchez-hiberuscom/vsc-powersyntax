# Plan - Spec 178 Parseo de epoch en clave de ServingCache (B071B)

## 1. Resumen tecnico

Añadir un helper puro en ServingCache para extraer la parte `kbVersion` de la clave estable generada por `makeKey`.

## 2. Estado actual

- `makeKey()` ya serializa `kbVersion`.
- No existe ninguna API para leerlo de vuelta.

## 3. Diseno propuesto

- Implementar un parser pequeño sobre el formato actual.
- Mantenerlo interno a ServingCache y exportarlo como helper reutilizable.

## 4. Impacto en rendimiento

- Neutro salvo en llamadas explícitas de persist/restore.

## 5. Riesgos tecnicos

- Parser frágil si depende de posiciones incorrectas de los separadores.
- Falsos positivos en claves mal formadas.

## 6. Estrategia de validacion

- npm run test:unit -- --grep "kbVersionFromKey"
- npm run compile
- npm run test:unit

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md