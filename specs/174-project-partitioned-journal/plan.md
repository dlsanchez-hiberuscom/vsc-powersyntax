# Plan - Spec 174 Journal persistente particionado por proyecto (B071A)

## 1. Resumen tecnico

Extender cacheStore para dividir journalEntries y secuencias por proyecto, aplicar restore por partición y agregar el resultado final sin perder compatibilidad segura.

## 2. Estado actual

- El checkpoint ya se particiona por proyecto tras `Spec 173`.
- `appendJournalMutation` sigue escribiendo un único `semantic-journal.json` de workspace.
- `load()` todavía aplica un único stream de journal agregado.

## 3. Diseno propuesto

- Introducir journals por proyecto bajo la misma jerarquía de particiones.
- Mantener un journal raíz para huérfanos y eventos sin proyecto.
- Validar y aplicar checkpoints+journals por partición antes de recomponer el estado agregado.

## 4. Impacto en rendimiento

- Debe reducir el trabajo persistente cruzado entre proyectos.
- El coste de I/O adicional debe quedar acotado y justificado por un restore más fino.

## 5. Riesgos tecnicos

- Secuencias locales mal reseteadas tras persistCheckpoint.
- Restore incorrecto si una partición se queda sin journal o con journal corrupto.
- Acoplamiento excesivo con detalles del modelo de proyecto.

## 6. Estrategia de validacion

- npm run test:unit -- --grep "appendJournalMutation particiona journal por proyecto"
- npm run compile
- npm run test:unit
- npm test

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md
- docs/roadmap.md