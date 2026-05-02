# Tasks - Spec 253 Formatter server-side y presupuesto de formato (B227)

## 1. Preparacion

- [x] T1. Confirmar dueño técnico del cálculo de formato y la ruta actual en cliente.
- [x] T2. Definir budgets explícitos y contrato request/result server-side.

## 2. Implementacion

- [x] T3. Implementar el formateo server-side con skip por budget.
- [x] T4. Adaptar el provider manual y `formatOnSave` para delegar al servidor.
- [x] T5. Mantener la UX ligera y la degradación explícita en documentos grandes.

## 3. Validacion

- [x] T6. Añadir tests unitarios focalizados del contrato y los budgets.
- [x] T7. Ejecutar validación proporcional incluyendo smoke de formatting.

## 4. Documentacion

- [x] T8. Actualizar docs canónicas afectadas.
- [x] T9. Mover `B227` a done-log solo si el cliente deja de calcular el formato pesado.