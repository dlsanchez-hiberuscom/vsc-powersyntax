# HOVER-AUDIT-01 — Auditoría final end-to-end de hover

## 1. Objetivo

Validar todos los casos finales de hover tras CALLABLE-01, DIAG-01, DW-01, HOVER-01 y HOVER-02.

## 2. Problema

Se necesitan criterios de aceptación globales para garantizar que los fixes no quedan parciales.

## 3. Evidencia

- Problemas reales reportados por usuario.
- Specs anteriores relacionadas.

## 4. Alcance

- Crear matriz de casos de hover.
- Validar formatos visibles.
- Validar ausencia de metadata debug.
- Validar performance/hot path.
- Validar DataWindow/native/custom inheritance.
- Validar diagnostics sin falsos positivos conocidos.

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

- Todos los tipos de hover tienen formato útil.
- Debug separado.
- Performance dentro de budget.
- No quedan falsos positivos conocidos.
- Docs/backlog/done-log alineados.

## 8. Validación

```bash
npm test -- --grep "hover"
npm test -- --grep "definition"
npm test -- --grep "completion"
npm test -- --grep "signatureHelp"
npm test -- --grep "diagnostics"
npm run test:performance:gate
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
