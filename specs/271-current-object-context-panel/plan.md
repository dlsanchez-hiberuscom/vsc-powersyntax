# Plan - Spec 271 Current Object Context Panel (B215)

## 1. Enfoque técnico

Resolver `B215` mayoritariamente en cliente, ampliando solo `currentObjectContext` con `visibleVariables` para que la UX no necesite scans ni RPCs adicionales. El panel debe seguir al editor activo y limitarse a proyectar contratos read-only ya cerrados.

## 2. Pasos

1. Ampliar `currentObjectContext` con variables visibles sobre scope activo + member closure.
2. Construir un modelo puro de panel con secciones navegables y degradación honesta.
3. Registrar la vista `powerbuilderCurrentObjectContext` y comandos de foco/refresco/apertura segura.
4. Validar el contrato ampliado, el modelo puro y el foco visible sobre el archivo activo.
5. Actualizar docs canónicas y mover el foco a `B188`.

## 3. Riesgos

- duplicar resolución de variables fuera del backbone semántico ya existente;
- poblar la vista con refreshes demasiado caros o listeners redundantes;
- ofrecer acciones contextuales que aparenten edición o semántica adicional no soportada.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/currentObjectContext.test.js out/test/server/unit/currentObjectContextPanelModel.test.js`
- `npm run test:smoke -- --grep "Current Object Context del archivo activo"`

## 5. Resultado ejecutado

1. El usuario entiende el objeto activo desde un panel persistente read-only.
2. La vista reutiliza `currentObjectContext` ampliado en vez de abrir otro motor o endpoint ad hoc.
3. `B188` pasa a ser el siguiente foco arquitectónico.