# Tasks — Spec 140 Semantic Priority Nearby (B122)

## 1. Preparacion

- [x] T1. Identificar relaciones disponibles para calcular cercania semantica.
- [x] T2. Definir el orden minimo obligatorio: activo, ancestros, owners/tipos, proyecto, workspace.

## 2. Implementacion

- [x] T3. Implementar el ranking de cercania semantica.
- [x] T4. Integrar el ranking en el scheduler o indexador.
- [x] T5. Garantizar una cuota de progreso global para evitar starvation.

## 3. Validacion

- [x] T6. Anadir tests de orden por herencia y por proyecto activo.
- [x] T7. Ejecutar compilacion TypeScript.
- [x] T8. Ejecutar tests del scheduler o indexador afectados.

## 4. Cierre

- [x] T9. Reflejar trazabilidad documental de B122.
- [x] T10. Registrar huecos si alguna relacion semantica queda pendiente de B153 o B141.
