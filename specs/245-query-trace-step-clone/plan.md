# Plan - Spec 245 Query trace step cloning (B157/B136)

## 1. Resumen tecnico

Encapsular el snapshot de la última traza devolviendo clones de cada paso al consultar `getLastTrace()`.

## 2. Estado actual

- el array de pasos se clona;
- las referencias internas de `TraceStep` siguen compartiéndose.

## 3. Diseno propuesto

- anadir un helper `cloneTraceStep()`;
- usarlo dentro de `getLastTrace()`;
- validar que una mutación externa no persiste.

## 4. Impacto en el runtime

- mejora encapsulación de la traza retenida;
- mantiene el contrato observable del snapshot.

## 5. Riesgos tecnicos

- asumir deep clone completo cuando `detail` sigue siendo opaco;
- olvidar el clon en futuras rutas de salida.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/queryTrace"`

## 7. Documentacion a actualizar

- `docs/done-log.md`