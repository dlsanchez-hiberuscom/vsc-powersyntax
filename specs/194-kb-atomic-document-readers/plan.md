# Plan - Spec 194 KB atomic document readers (B165)

## 1. Resumen tecnico

Extender la validacion de publicacion atomica de `KnowledgeBase` para cubrir tambien las lecturas documentales publicadas.

## 2. Estado actual

- El modelo de staging/publicacion atomica ya existia.
- La prueba visible cubria sobre todo `findDefinition()`.
- Faltaba demostrar coherencia en `getEntitiesByUri()`, `getScopeAt()` y `getDocumentSnapshot()`.

## 3. Diseno propuesto

- Ampliar los tests de `KnowledgeBase` durante `beginBatchUpdate()`.
- Verificar pre-commit, post-commit y rollback en surfaces documentales.
- Mantener intacto el protocolo de publish del runtime.

## 4. Impacto en el runtime

- Cierra `B165` con evidencia ejecutable del boundary documental.
- Refuerza la confianza de las features interactivas que leen estado publicado.

## 5. Riesgos tecnicos

- Asumir atomicidad solo en lectura global y no en readers por documento.
- Introducir tests acoplados a detalles internos en lugar de al contrato publicado.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/knowledgeBase"`
- `npm run compile`
- `npm run test:unit`

## 7. Documentacion a actualizar

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/done-log.md`
- `docs/roadmap.md`