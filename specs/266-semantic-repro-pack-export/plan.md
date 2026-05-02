# Plan - Spec 266 Semantic repro pack export (B175)

## 1. Enfoque tecnico

Resolver `B175` enteramente en cliente. El servidor ya publica suficiente contexto read-only; el trabajo nuevo es empaquetarlo de forma reproducible y trazable sin abrir otro endpoint ni duplicar semántica.

## 2. Pasos

1. Crear un builder puro del repro pack.
2. Añadir un comando cliente para exportarlo desde el editor activo.
3. Capturar snapshots JSON y archivos relacionados del workspace.
4. Validar con unit del builder y smoke de exportación real.
5. Actualizar docs canónicas y mover el foco a `B232`.

## 3. Riesgos

- capturar demasiado poco contexto y dejar el repro pack inútil;
- capturar demasiada superficie y convertir el pack en un volcado inmanejable;
- reintroducir lógica semántica en cliente en lugar de reutilizar las surfaces ya cerradas.

## 4. Validacion

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/semanticReproPack.test.js`
- `npm run test:smoke -- --grep "semantic-repro-pack"`

## 5. Resultado ejecutado

1. El cliente exporta un bundle reproducible desde el editor activo.
2. El pack reutiliza `currentObjectContext`, `impactAnalysis`, `safeEditPlan`, `semanticWorkspaceManifest` y `serverStats` en vez de reconstruir semántica.
3. El siguiente foco natural pasa a `B232`.