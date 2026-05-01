# Spec 139 — Pipeline de indexacion en dos fases reales (B152)

## 1. Resumen

Separar claramente una fase estructural rapida y una fase semantica enriquecida para entregar valor temprano sin esperar al enriquecimiento completo.

## 2. Problema

El servidor ya dispone de parseo, conocimiento y serving interactivo, pero el pipeline no formaliza todavia una frontera estable entre trabajo barato y trabajo caro por documento o por workspace.

## 3. Objetivo

Definir un pipeline en dos fases con readiness por fase para que el archivo activo y el workspace reciban primero estructura util y despues enriquecimiento semantico progresivo.

## 4. Alcance

- Formalizar structuralPass y enrichedPass.
- Introducir readinessByPass por documento y por contexto.
- Conectar la salida estructural a features que puedan degradar con seguridad.
- Preparar el scheduler y el indexador para tratar ambas fases como trabajo distinto.

## 5. Fuera de alcance

- Latency governor completo.
- Progress model definitivo.
- Checkpoints persistentes.

## 6. Requisitos

- R1. La fase estructural debe ser claramente mas barata que la enriquecida.
- R2. El archivo activo debe poder beneficiarse de la fase estructural inmediatamente.
- R3. Cada fase debe publicar readiness y no exponer estado a medias.
- R4. Las features deben saber si operan en structural-only o enriched-ready.

## 7. Criterios de aceptacion

- AC1. El pipeline separa structuralPass y enrichedPass en codigo y en observabilidad.
- AC2. El archivo activo obtiene valor antes de que acabe el enriquecimiento del workspace.
- AC3. Los tests cubren readiness por fase y degradacion de al menos una feature.
- AC4. B152 queda trazada como base de B123, B125, B134 y B158.

## 8. Riesgos y notas

- Una separacion artificial sin contratos claros no aportara valor real.
- Hay que evitar publicar datos enriquecidos parciales como si fueran definitivos.