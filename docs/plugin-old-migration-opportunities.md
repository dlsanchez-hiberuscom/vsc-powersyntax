# Plugin Old Migration Opportunities

## Propósito

Registrar como debe consultarse `plugin_old` sin portarlo por inercia.

## Regla base

- `plugin_old` es referencia historica, no fuente de verdad.
- Solo debe consultarse cuando backlog, spec o una auditoria pidan comparar comportamiento previo.
- Ninguna heuristica de `plugin_old` debe copiarse al runtime actual sin validacion y documentacion propia.

## Fuentes historicas actuales

- `plugin_old/src/`
- `plugin_old/syntaxes/`
- `plugin_old/docs_old.zip`
- entradas historicas relevantes de `docs/done-log.md`

## Cierre

Si una heuristica historica se adopta, la decision debe vivir en la spec activa y en el documento propietario del area tocada.