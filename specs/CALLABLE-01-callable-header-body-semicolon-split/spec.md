# CALLABLE-01 — Separar cabecera callable e instrucción inicial tras `;`

## 1. Objetivo

Corregir la detección de callable contenedor para que la cabecera termine en `;` y el texto posterior sea tratado como primera instrucción ejecutable.

## 2. Problema

El hover muestra `Callable contenedor: event pfc_values;call super::...`, contaminando el callable con código del cuerpo.

## 3. Evidencia

- Captura de hover sobre variable local `ls_sqlsyntax`.
- El texto posterior a `;` aparece dentro del callable contenedor.

## 4. Alcance

- Revisar parser/extractor de events/functions/callables.
- Separar header range y body range.
- Añadir fixture con `event pfc_values; call super::pfc_values()`.
- Validar hover/currentObjectContext/local scope.

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

- Callable mostrado no incluye `call super::...`.
- Código posterior a `;` sigue analizándose como statement del cuerpo.
- Hover de variables locales muestra scope correcto.
- No se rompe parsing de eventos/functions normales.

## 8. Validación

```bash
npm test -- --grep "callable"
npm test -- --grep "hover"
npm test -- --grep "currentObjectContext"
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
