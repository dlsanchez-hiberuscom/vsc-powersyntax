# Spec: PB-ARCH-P0-SEMANTIC-SOURCE-OF-TRUTH-01

## 1. Identificación
- **ID:** PB-ARCH-P0-SEMANTIC-SOURCE-OF-TRUTH-01
- **Título:** Publicar una sola verdad semántica versionada
- **Estado:** Open
- **Prioridad:** P0
- **Orden recomendado:** 04
- **Área:** Arquitectura, Semántica

## 2. Objetivo
Asegurar que `PublishedSemanticSnapshot` actúe como una proyección inmutable y de solo lectura de `KnowledgeBase.publishedState`. Evitar la fragmentación semántica impidiendo que consumers o DTOs mantengan estados semánticos propios que generen discrepancias o *confidence drift*.

## 3. Principios de Diseño
1. **Un Solo Owner:** Todo constructo de PowerBuilder resuelto semánticamente debe estar validado a través de `KnowledgeBase` (y sus projections); está terminantemente prohibido usar stores paralelos sin declarar.
2. **Inmutabilidad y Epoch:** Cualquier dato servido desde el source of truth hacia los features interactivos se emite de forma readonly, amarrado a un epoch para su invalidación y cacheo de precisión.

## 4. Alcance y Tareas
1. **Redacción de Spec:** Establecer las pautas oficiales en este documento.
2. **Auditoría de Writers/Readers:** Asegurar que `SemanticDocumentSnapshot` y el catálogo usen el path único para publicar resultados y que consumers (como reportes) solo hagan `get*Readonly()`.
3. **Tests de Restitución:** Agregar comprobaciones de publish/restore a `KnowledgeBase`.

## 5. Criterios de Aceptación
- [ ] Ningún proveedor LSP reporta una "verdad semántica" sin owner o source origin.
- [ ] La Facade extrae su modelo del snapshot de forma controlada.
- [ ] Ejecución exitosa de la "cross-surface golden matrix".

## 6. Documentación afectada
- `docs/semantic-design-target.md`
- `docs/symbol-system.md`
- `docs/architecture-status.md`

## 7. Notas de Dependencia
Depende directamente de `PB-ARCH-P0-SEMANTIC-CONFORMANCE-TESTS-01` y su cierre habilita `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01`.
