# [010] Tasks — Diagnósticos Semánticos Iniciales

## Preparación

- [x] T1. Definir constante `PB_KEYWORDS` con keywords del lenguaje a excluir
- [x] T2. Definir constante `PB_BUILTIN_TYPES` con tipos primitivos/built-in a excluir
- [x] T3. Crear fixture `test/fixtures/diagnostics-semantic.srw` con casos de prueba representativos

## Implementación core

- [x] T4. Implementar `validateSemantics()` en `features/diagnostics.ts`
  - [x] T4a. Regla SD1: Variables no declaradas (scope local + instancia)
  - [x] T4b. Regla SD2: Funciones/eventos inexistentes (herencia + SystemCatalog)
  - [x] T4c. Regla SD3: Tipos base inexistentes (KB + built-in types)
  - [x] T4d. Regla SD4: Variables locales no usadas (Hint)
  - [x] T4e. Regla SD5: Variables de instancia privadas no usadas (Hint)
- [x] T5. Implementar extracción conservadora de identificadores (llamadas y asignaciones)

## Integración con pipeline

- [x] T6. Modificar `diagnosticScheduler.ts` para aceptar backends semánticos (KB, SystemCatalog, InheritanceGraph)
- [x] T7. Modificar `server.ts` para pasar los backends al scheduler de diagnósticos
- [x] T8. Combinar diagnósticos estructurales y semánticos en la publicación

## Tests

- [x] T9. Tests unitarios para SD1 (variable no declarada / declarada / parámetro)
- [x] T10. Tests unitarios para SD2 (función inexistente / heredada / SystemCatalog)
- [x] T11. Tests unitarios para SD3 (tipo base inexistente / built-in)
- [x] T12. Test de no-falsos-positivos con keywords
- [x] T13. Tests unitarios para SD4 (variable local no usada / usada / parámetro no genera)
- [x] T14. Tests unitarios para SD5 (variable privada no usada / usada / no-privada no genera)

## Validación

- [x] T15. Validar en workspace real con F5 (sin falsos positivos visibles)
- [x] T16. Medir latencia de diagnósticos (< 50ms en archivo típico)
- [x] T17. Compilación limpia (`tsc --noEmit`)

## Documentación

- [x] T18. Actualizar `current-focus.md` (B033 cerrada)
- [x] T19. Actualizar `backlog.md` (B033 cerrada)
- [x] T20. Actualizar `README.md` (añadir diagnósticos semánticos a estado actual)
- [x] T21. Actualizar `roadmap.md` (progreso de Fase 6A)
