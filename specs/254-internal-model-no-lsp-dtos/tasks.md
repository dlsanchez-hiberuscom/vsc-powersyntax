# Tasks - Spec 254 Modelo interno sin DTOs LSP en knowledge/parsing (B228)

## 1. Preparacion

- [x] T1. Confirmar el eje real del acoplamiento (`DocumentSymbol` y tipos de rango/posición en core).
- [x] T2. Definir tipos internos y el borde mapper -> LSP.

## 2. Implementacion

- [x] T3. Migrar `knowledge/parsing/utils` al modelo interno.
- [x] T4. Adaptar `features/documentSymbols` para mapear al DTO LSP.
- [x] T5. Eliminar imports LSP residuales en el core afectado.

## 3. Validacion

- [x] T6. Añadir test arquitectónico de imports y cobertura de `documentSymbols`.
- [x] T7. Ejecutar validación proporcional.

## 4. Documentacion

- [x] T8. Actualizar docs canónicas afectadas.
- [x] T9. Mover `B228` a done-log solo si el core deja de depender de DTOs LSP para estos modelos internos.