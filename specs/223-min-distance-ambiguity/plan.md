# Plan - Spec 223 Ambiguedad de minima distancia (B157)

## 1. Resumen tecnico

Extender el ranking por distancia para devolver también un pequeño resumen de ambigüedad cuando la distancia mínima deja más de un candidato ganador.

## 2. Estado actual

- el ranking ya devuelve ganadores y descartes por distancia;
- si quedan varios ganadores al mínimo, el runtime devuelve varios `targets`, pero no lo explica explícitamente.

## 3. Diseno propuesto

- anadir una variante `distance-ambiguity` a `QueryEvidenceEntry`;
- detectar empates en el conjunto de ganadores del ranking;
- proyectar ese empate a `evidence` sin tocar `targets`.

## 4. Impacto en el runtime

- hace visible la ambigüedad residual del winner path;
- prepara confidence y gates posteriores sin abrir todavía providers.

## 5. Riesgos tecnicos

- marcar como ambiguo un caso que ya quedó desempatado por el ranking;
- duplicar demasiado detalle en el hot path.

## 6. Estrategia de validacion

- `npm run test:unit -- --grep "unit/semanticQueryService"`

## 7. Documentacion a actualizar

- `docs/done-log.md`