# DIAG-01 — No marcar cierres de bloque como código inalcanzable

## 1. Objetivo

Evitar falsos positivos de `SD11` sobre `END IF` y otros cierres estructurales tras `RETURN`.

## 2. Problema

`END IF` se marca como código inalcanzable aunque solo cierra el bloque.

## 3. Evidencia

- Captura donde `END IF` tiene diagnostic `Código inalcanzable`.
- El propio hover lo reconoce como cierre de bloque.

## 4. Alcance

- Revisar analyzer que emite `SD11`.
- Crear helper `isStructuralBlockClosingStatement` o equivalente.
- Excluir cierres estructurales, comentarios y líneas vacías.
- Mantener diagnóstico para statements ejecutables reales tras `RETURN`.

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

- `END IF` después de `RETURN` no emite `SD11`.
- `END CHOOSE`, `END DO`, `END FOR`, `END TRY`, etc. tampoco emiten falso positivo.
- Statement ejecutable tras `RETURN` sí emite `SD11`.

## 8. Validación

```bash
npm test -- --grep "unreachable"
npm test -- --grep "diagnostics"
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
