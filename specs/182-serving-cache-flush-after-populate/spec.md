# Spec 182 - Flush tras poblar ServingCache (B071B)

## 1. Resumen

Disparar el flush oportuno de la snapshot persistente cada vez que una feature interactiva puebla ServingCache con un nuevo resultado.

## 2. Problema

Aunque existe persistencia y coordinador dirty, los resultados que se añaden durante hover, definition, signatureHelp o completion todavía no se guardan de vuelta.

## 3. Objetivo

Encadenar `set + markDirty + flushIfDirty` en un helper pequeño y reutilizarlo en los call sites interactivos.

## 4. Alcance

- Añadir helper runtime para poblar ServingCache y disparar flush oportuno.
- Reusar el coordinador dirty ya creado.
- Sustituir los `servingCache.set(...)` interactivos por el helper.

## 5. Fuera de alcance

- Flush tras invalidación o shutdown.
- Cambios en el formato persistido.
- Reescribir los providers interactivos.

## 6. Requisitos

- R1. El helper debe guardar el valor en ServingCache.
- R2. Si hay coordinador, debe marcar dirty y pedir flush.
- R3. El helper debe ser seguro sin coordinador.

## 7. Criterios de aceptacion

- AC1. Los resultados interactivos poblan la caché y disparan flush oportuno.
- AC2. El helper funciona también sin coordinador.
- AC3. Compile y tests del slice quedan en verde.

## 8. Riesgos y notas

- Mantener `set()` duplicado en cuatro puntos complica la evolución de B071B.
- Este slice debe seguir siendo pequeño y centrado en el gesto de población.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md.