# Tasks — Spec 145 Indexer State Surface (B126)

## 1. Preparacion

- [x] T1. Inventariar contadores y estados ya expuestos por scheduler, server y projectStatus.
- [x] T2. Definir el contrato minimo del snapshot de estado del indexador.

## 2. Implementacion

- [x] T3. Implementar la fuente unica de estado del indexador.
- [x] T4. Alimentar colas, trabajo actual, invalidaciones y cancelaciones.
- [x] T5. Conectar projectStatus o una salida equivalente a esa fuente unica.

## 3. Validacion

- [x] T6. Anadir tests del snapshot de estado.
- [x] T7. Ejecutar compilacion TypeScript.
- [x] T8. Ejecutar pruebas de integracion con la superficie de status.

## 4. Cierre

- [x] T9. Reflejar trazabilidad documental de B126.
- [x] T10. Registrar campos diferidos si alguna metrica no puede exponerse aun con coste aceptable.
