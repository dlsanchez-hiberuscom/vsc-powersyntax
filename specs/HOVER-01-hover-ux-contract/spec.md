# HOVER-01 — Rediseñar hover compacto por tipo de símbolo

## 1. Objetivo

Separar hover visible de usuario de metadata interna/debug y aplicar formatos útiles por tipo de símbolo.

## 2. Problema

Hover muestra demasiada información técnica interna y poco valor inmediato para el usuario.

## 3. Evidencia

- Capturas con `Origen`, `Autoridad`, `Fase`, `Confianza`, `Motivo`, `Candidatos`, `Owner real`, etc.

## 4. Alcance

- Implementar renderer/formatter de hover por kind.
- Definir compact/standard/diagnostic/debug.
- Mover trace interno a explain/debug.
- Añadir tests de payload/render para variables, tipos, funciones, DataWindow, SQL, diagnostics y external.

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

- Hover normal no muestra metadata interna.
- Muestra firma/declaración útil.
- Muestra herencia cuando aporta valor.
- Warnings solo si hay riesgo real.
- Debug trace queda accesible fuera del hover normal.

## 8. Validación

```bash
npm test -- --grep "hover"
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
