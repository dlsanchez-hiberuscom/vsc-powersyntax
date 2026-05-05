# HOVER-02 — Optimizar hover para cache/hot path y evitar fallback global innecesario

## 1. Objetivo

Asegurar que hover usa contexto activo/cache/serving cache y no dispara fallback global ni scans innecesarios para casos simples.

## 2. Problema

Hover se siente lento y muestra `global-fallback` en casos donde debería resolver por contexto/cache.

## 3. Evidencia

- Captura de hover con `Motivo de resolución: global-fallback`.
- Sensación de lentitud reportada por usuario.

## 4. Alcance

- Auditar ruta de hover.
- Revisar serving cache/hot context.
- Añadir guard anti scans/relecturas globales.
- Medir latencia con tests/performance si existe infraestructura.
- Evitar construir payload debug en hover normal.

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

- Hover de variables locales/miembros/tipos indexados no usa fallback global innecesario.
- Hover reutiliza cache/contexto caliente.
- No se introducen scans completos.
- Performance gate verde.

## 8. Validación

```bash
npm test -- --grep "hover"
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
