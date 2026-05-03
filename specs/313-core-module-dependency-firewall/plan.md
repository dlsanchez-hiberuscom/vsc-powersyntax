# Plan - Spec 313 core module dependency firewall (B277)

## 1. Enfoque técnico

No introducir tooling nuevo: reutilizar `architectureImports.test.ts` como punto de anclaje y convertirlo en un escáner de reglas por capa. El borde falsable era claro: si el guard actual solo cubría `knowledge/parsing/utils`, el repo podía seguir reintroduciendo cruces indebidos entre `client`, `runtime`, `features`, `shared` y `build` sin ninguna red de seguridad.

## 2. Pasos

1. Generalizar `architectureImports.test.ts` para recoger imports reales por archivo.
2. Fijar reglas mínimas por capa con allowlist implícita.
3. Añadir el guard de `build/ORCA` frente al hot path semántico interactivo.
4. Validar con compilación y el test arquitectónico focal.
5. Alinear docs y mover el foco a `B273`.

## 3. Riesgos

- convertir el firewall en una lista frágil de strings y no en resolución real de imports;
- prohibir imports legítimos del rail `build/ORCA` y forzar una falsa “pureza” que el diseño actual no sostiene;
- sobrerregular capas no materializadas todavía y crear ruido en vez de protección útil.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/architectureImports.test.js`

## 5. Resultado ejecutado

1. `architectureImports.test.ts` ya protege el firewall mínimo de capas.
2. La regla de `build/ORCA` ya evita imports del hot path semántico interactivo.
3. El foco canónico del repo queda movido a `B273`.