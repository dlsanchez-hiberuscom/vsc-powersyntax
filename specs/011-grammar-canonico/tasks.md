# [011] Tasks — Grammar Canónico

## Fase 1: Creación del Módulo Central
- [x] T1. Crear archivo `src/server/parsing/grammar.ts`
- [x] T2. Definir constantes para identificadores (`PB_IDENTIFIER`, `PB_TYPE_IDENTIFIER`) y espacios (`WS_OPT`, `WS_REQ`)
- [x] T3. Definir constructores de modificadores (`MODIFIER_ACCESS`, `ANY_MODIFIER`)
- [x] T4. Ensamblar las RegExp complejas y exportarlas pre-compiladas
- [x] T5. Migrar `PB_KEYWORDS` de `diagnostics.ts` a `grammar.ts`
- [x] T6. Migrar `PB_BUILTIN_TYPES` de `diagnostics.ts` a `grammar.ts`

## Fase 2: Refactorización de Matchers
- [x] T7. Reemplazar regex en `matchTypeDefinition` / `isTypeDefinitionHeader`
- [x] T8. Reemplazar regex en `matchFunctionImplementationHeader`
- [x] T9. Reemplazar regex en `matchEventImplementationHeader` y `matchOnImplementationHeader`
- [x] T10. Reemplazar regex y refinar control de keywords en `matchVariableDeclaration`

## Fase 3: Refactorización Adicional
- [x] T11. Actualizar `sections.ts` (si emplea regex duplicadas o mejorables con la gramática)
- [x] T12. Actualizar `diagnostics.ts` para que `callRegex` use `PB_IDENTIFIER` desde la gramática. Reutilizar la gramática en el chequeo de cierre de bloques `matchClosingBlock`.

## Fase 4: Pruebas y Limpieza
- [x] T13. Verificar con `npm run test:unit` que no hay regresiones
- [x] T14. Verificar compilación completa (`npm run compile`)
- [x] T15. Actualizar documentación (roadmap y current-focus) para reflejar la terminación de B053
