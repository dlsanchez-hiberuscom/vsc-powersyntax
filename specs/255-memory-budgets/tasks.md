# Tasks - Spec 255 Memory budgets de caché e índice (B070)

## 1. Preparacion

- [x] T1. Confirmar las capas y métricas ya disponibles para estimación de memoria.
- [x] T2. Definir budgets explícitos y contrato del reporte.

## 2. Implementacion

- [x] T3. Implementar el cálculo unificado de budgets de memoria.
- [x] T4. Integrarlo en stats/health/status.
- [x] T5. Mantener el cálculo fuera del hot path interactivo.

## 3. Validacion

- [x] T6. Añadir tests focalizados del reporte y consumers.
- [x] T7. Ejecutar validación proporcional.

## 4. Documentacion

- [x] T8. Actualizar docs canónicas afectadas.
- [x] T9. Mover `B070` a done-log solo si los budgets quedan definidos, medidos y vigilados.