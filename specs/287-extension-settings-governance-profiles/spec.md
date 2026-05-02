# Spec 287 - Extension settings governance and profiles (B244)

**Estado:** cerrada y validada.

## 1. Resumen

Ordenar la gobernanza de configuracion y perfiles de la extension para que las surfaces read-only, legacy rails y automatizacion publica tengan defaults claros, validacion coherente y perfiles reutilizables.

## 2. Estado real actual

`B244` queda `Closed`: `src/client/settingsGovernance.ts`, `src/shared/publicApi.ts` y `src/client/extension.ts` publican perfiles, reglas de gobernanza y surfaces observables para settings clave del producto y de los carriles read-only/legacy.

## 3. Objetivo

Reducir ambiguedad operativa y fijar una capa de configuracion coherente antes de seguir ampliando panels, tooling y release.

## 4. Alcance

- definir perfiles y reglas de gobernanza para settings sensibles;
- normalizar surfaces read-only y legacy bajo defaults coherentes;
- exponer la informacion necesaria por API publica;
- degradar seguro ante configuraciones incompletas o restrictivas.

## 5. Fuera de alcance

- rediseño completo del sistema de configuracion de VS Code;
- nuevos settings semanticos fuera del bloque activo;
- politicas remotas o multiusuario.

## 6. Criterios de aceptacion

- AC1. Existen perfiles/gobernanza para settings relevantes del producto.
- AC2. La extension y la API publica observan la misma fuente de verdad de configuracion.
- AC3. Los perfiles degradan seguro y no fuerzan activacion o trabajo pesado extra.
- AC4. La base queda lista para surfaces de usuario y para el cierre de release.

## 7. Documentacion afectada

- `README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/roadmap.md`

## 8. Validacion requerida

- `npm run build:test`
- `npm run test:unit -- --grep "unit/settingsGovernance"`

## 9. Cierre registrado

- `src/client/settingsGovernance.ts` concentra perfiles y reglas de gobernanza.
- `src/client/extension.ts` y `src/shared/publicApi.ts` exponen la surface observable correspondiente.
- `test/server/unit/settingsGovernance.test.ts` fija la semantica de perfiles y degradacion segura.
