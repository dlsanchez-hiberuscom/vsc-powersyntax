# DW-01 — Resolver funciones nativas DataWindow en descendants custom

## 1. Objetivo

Aplicar catálogo nativo DataWindow a variables cuyo tipo custom hereda transitivamente de `datawindow`.

## 2. Problema

`idw_requestor : u_dw` no reconoce `GetColumnName()` aunque `u_dw` hereda de `datawindow`.

## 3. Evidencia

- Captura sobre `public u_dw idw_requestor`.
- Llamada `idw_requestor.GetColumnName()` sin soporte semántico nativo DataWindow.

## 4. Alcance

- Revisar ancestor resolution.
- Detectar system ancestor `datawindow`.
- Conectar descendants custom con owner type DataWindow del system catalog.
- Aplicar a hover/completion/signatureHelp/definition.
- Añadir fixture `u_dw from datawindow`.

## 5. Fuera de alcance

- Rewrites masivos del motor semántico.
- Cambios no relacionados con el bug/spec.
- Scans globales en hot path.
- Cierre sin tests ni evidencia.

## 6. Diseño / Plan

1. Localizar implementación actual y tests relacionados.
2. Añadir fixture mínimo que reproduzca el problema.
3. Corregir la causa raíz con el menor impacto posible.
4. Añadir test anti-regresión.
5. Revisar docs afectadas.
6. Ejecutar validación.

## 7. Criterios de aceptación

- `u_dw -> datawindow` reconocido.
- `GetColumnName()` resuelto como función DataWindow nativa.
- Completion y signatureHelp ofrecen funciones DataWindow.
- No hay hardcode de `u_dw`; solución genérica.

## 8. Validación

```bash
npm test -- --grep "datawindow"
npm test -- --grep "hover"
npm test -- --grep "completion"
npm test -- --grep "signatureHelp"
npm run test:docs:drift
```

## 9. Documentación afectada

- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/hover/hover-ux-contract.md` si aplica
- `docs/done-log.md` solo al cierre real

## 10. Riesgos

- Regresión en hot path.
- Cambio accidental en resolución semántica no relacionada.
- Tests insuficientes sobre corpus PFC/legacy.
