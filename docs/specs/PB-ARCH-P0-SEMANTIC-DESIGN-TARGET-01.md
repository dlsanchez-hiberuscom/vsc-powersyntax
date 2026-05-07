# Spec: PB-ARCH-P0-SEMANTIC-DESIGN-TARGET-01

## 1. Identificación
- **ID:** PB-ARCH-P0-SEMANTIC-DESIGN-TARGET-01
- **Título:** Formalización de Target de Diseño Semántico
- **Estado:** Open
- **Prioridad:** P0
- **Orden recomendado:** 01
- **Área:** Arquitectura, Semántica

## 2. Objetivo
Formalizar la especificación arquitectónica para el diseño objetivo semántico del plugin PowerBuilder 2025. El propósito es establecer a `docs/semantic-design-target.md` como la fuente unificada de verdad sobre el futuro diseño semántico y asegurar que esté referenciada por toda la documentación owner de arquitectura.

## 3. Principios de Diseño
Esta spec impone que la arquitectura semántica respete los siguientes principios:
1. **No "Big-Bang":** Las migraciones y refactorizaciones semánticas deben ser incrementales. `SemanticQueryResult` funcionará primero como un envelope sobre la información existente (`ResolvedTargetInfo`).
2. **No "Parallel Store":** Cualquier modelo de cache semántica nueva (ej. `PublishedSemanticSnapshot`) actuará como una proyección readonly o contrato sobre `KnowledgeBase.publishedState`, no como una base de datos de estado paralela a la actual.
3. **Strict Cache Invalidation:** La invalidación iniciará con un contrato event-driven con tests y métricas, en lugar de intentar orquestar un coordinador de caché masivo desde el día 1.
4. **DataWindow Separación:** La lógica semántica de DataWindow y SQL dinámico/embebido no se tratará con el mismo path crítico que PowerScript, sino como un *advisory submodel*.

## 4. Alcance y Tareas
1. **Redacción de Spec:** Crear este documento para que sirva de punto de anclaje de todos los contratos semánticos.
2. **Vinculación (Linking):** Garantizar que `docs/architecture.md`, `docs/architecture-status.md`, y `docs/architecture-implementation-map.md` apunten de forma inequívoca al target document.
3. **Backlog:** Dar de alta esta spec en `docs/backlog.md` dentro de la sección activa.
4. **Validación de Integridad:** Ejecutar pruebas de drift documental y pruebas rápidas de ownership arquitectónico.

## 5. Criterios de Aceptación
- [ ] La especificación está redactada y registrada como archivo MD en la ruta estándar.
- [ ] El ítem existe y está enlazado en `docs/backlog.md`.
- [ ] Los documentos owner referencian adecuadamente la fuente unificada.
- [ ] `npm run test:docs:drift` pasa sin errores documentales.
- [ ] `npm run test:architecture:rapid` confirma que no hay violaciones de ownership en las carpetas core.

## 6. Documentación afectada
- `docs/backlog.md`
- `docs/architecture.md`
- `docs/architecture-status.md`
- `docs/architecture-implementation-map.md`
- `docs/current-focus.md`

## 7. Notas de Dependencia
El cierre de esta spec habilita el inicio de `PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01`.
