# Plan — Spec 152 Cache Schema Migrations (B168)

## 1. Resumen tecnico

Este slice debe apoyarse en la capa persistente introducida por checkpoints y journaling, ligando el schema a la epoch semantica, al modelo topologico y a los metadatos del runtime.

## 2. Estado actual

- Aun no existe persistencia versionada formal del runtime.
- B166 y B167 preparan la necesidad de versionar semantica y robustez de escritura.

## 3. Diseno propuesto

- Definir un manifest persistente con schemaVersion y metadatos clave.
- Implementar decision de arranque: migrate, invalidate o rebuild.
- Mantener migraciones pequenas y orientadas a cambios reales de formato.
- Reusar el journal para que una migracion no deje el almacenamiento en estado incierto.

## 4. Impacto en rendimiento

- Positivo en estabilidad entre versiones y sesiones.
- Riesgo de coste adicional en arranque si la validacion del schema es demasiado pesada.

## 5. Riesgos tecnicos

- Diseñar migraciones sin limites claros.
- No versionar correctamente metadatos clave de topologia o epoch.
- Mezclar esquema persistente con version de producto sin contrato claro.

## 6. Estrategia de validacion

- Tests de manifest y decision de arranque.
- Casos de migracion compatible e invalidacion por incompatibilidad.
- Compilacion TypeScript.

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/roadmap.md
- docs/architecture.md si se formaliza la capa de persistencia versionada