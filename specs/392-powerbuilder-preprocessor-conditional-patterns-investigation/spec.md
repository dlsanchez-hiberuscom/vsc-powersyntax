# Spec 392 — B292 PowerBuilder preprocessor / conditional patterns investigation

## Estado

- done

## Relacion backlog

- Backlog item: `B292 — PowerBuilder preprocessor / conditional patterns investigation`

## Objetivo

Determinar si el repositorio necesita soporte productivo para patrones condicionales/preprocesador PowerBuilder o si debe quedar documentado su descarte explícito por ausencia de evidencia en corpus reales.

## Resultado de cierre

- las búsquedas sobre `fixtures-local/`, `src/server/`, `test/` y `plugin_old/` no encontraron directivas activas de preprocesador (`$if/$endif/#if/#endif/#define`) en código PowerBuilder servido por el producto;
- la única evidencia encontrada en corpus real queda limitada a texto comentado o histórico: copias comentadas de `#define` en `fixtures-local/STD_FC_OrderEntry/std_fc_pb_base.pbl/nc_winsock_master.sru` y la revisión histórica `Removed old #IF WebService code` en `fixtures-local/STD_FC_OrderEntry/std_fc_pb_base.pbl/nc_app_controller_master.sru`;
- no se introduce soporte nuevo de parser/grammar para preprocesador: la decisión cerrada es `descarte explícito hasta que aparezca sintaxis activa defendible en corpus real`;
- `test/server/unit/powerbuilderParserResilienceFuzz.test.ts` fija que esos pseudo-marcadores comentados siguen tratándose como comentario/prosa y no contaminan `logicalStatements` ni disparan ruido estructural.

## Validación ejecutada

- `npm run test:unit -- --grep "unit/powerbuilderParserResilienceFuzz"`

## Fuera de alcance del corte cerrado

- añadir gramática o semántica nueva de preprocesador sin evidencia de corpus;
- modelar macros, branches condicionales o expansión textual hipotética;
- reabrir parser productivo fuera del tratamiento seguro de comentarios ya existente.