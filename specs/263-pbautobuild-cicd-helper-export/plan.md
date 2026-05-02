# Plan - Spec 263 PBAutoBuild CI/CD helper export (B186)

## 1. Enfoque tecnico

Resolver `B186` enteramente en cliente sobre la base ya cerrada del build moderno. El servidor sigue siendo autoridad del catalogo usable y de la ejecucion; el helper export solo empaqueta un perfil ya validado en un bundle neutral y versionable.

## 2. Pasos

1. Crear un builder puro del bundle CI/CD.
2. Registrar un comando cliente para exportarlo desde el perfil recordado o el picker actual.
3. Escribir el bundle bajo `tools/pbautobuild-ci/<perfil>` con rutas relativas al workspace.
4. Validar con unit del builder y smoke del comando visible.

## 3. Riesgos

- embeder paths absolutos locales que hagan el helper no versionable;
- acoplar el output a un proveedor concreto en lugar de dejar un bundle neutral;
- duplicar la seleccion de build file fuera del contrato ya cerrado en `B182-B185`.

## 4. Validacion

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/pbAutoBuildCiHelper.test.js`
- `npm run test:smoke -- --grep "PBAutoBuild"`

## 5. Resultado ejecutado

1. El helper CI/CD se exporta ahora como bundle versionable en `tools/pbautobuild-ci/<perfil>`.
2. El bundle usa rutas relativas, `PB_AUTOBUILD_PATH` y scripts neutrales en vez de YAML acoplado a un proveedor.
3. La UX visible lo expone como comando especifico sin reabrir runner, parser ni health del carril moderno.