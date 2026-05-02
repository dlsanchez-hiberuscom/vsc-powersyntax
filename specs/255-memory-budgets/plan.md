# Plan - Spec 255 Memory budgets de caché e índice (B070)

## 1. Enfoque tecnico

Resolver `B070` como surface de observabilidad estructurada: estimar memoria por capa a partir de métricas ya publicadas, fijar budgets explícitos y reusar stats/health/status como consumers.

## 2. Pasos

1. Definir contrato de reporte de memoria y budgets por capa.
2. Calcular estimates para cachés e índice usando señales ya existentes.
3. Integrar el reporte en `showStats`, `runtimeHealth` y status visible.
4. Añadir tests del cálculo y de las señales visibles.
5. Actualizar docs y cerrar `B070` si budgets quedan definidos, medidos y vigilados.

## 3. Riesgos

- estimates demasiado arbitrarios o poco explicables;
- añadir trabajo innecesario a rutas interactivas;
- duplicar señales ya existentes de capacity sin aportar claridad.

## 4. Validacion

- unit del reporte de memoria;
- unit de `runtimeHealth` y `statusBarPresentation` con budgets;
- `npm run build:test`.

## 5. Resultado ejecutado

1. Se definió un reporte unificado de memoria con budgets por capa y estado agregado.
2. El servidor pasó a publicarlo en `showStats`.
3. Health checker y status visible consumen ya ese contrato.
4. Se añadieron tests del cálculo y de las señales visibles.