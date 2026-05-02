# Plan - Spec 268 Early spec hygiene (B233)

## 1. Enfoque técnico

Resolver `B233` como saneamiento documental local. El objetivo no es reabrir features antiguas, sino darles una forma mínima uniforme y un estado histórico inequívoco para que el árbol `specs/` vuelva a ser confiable.

## 2. Pasos

1. Inventariar specs tempranas incompletas en `001-020`.
2. Añadir los archivos mínimos que faltan (`spec.md`, `plan.md`, `tasks.md`).
3. Marcar el estado histórico explícito de cada carpeta afectada.
4. Actualizar `docs/spec-driven-development.md` y artefactos canónicos de cierre.
5. Revalidar el inventario local.

## 3. Riesgos

- fingir actividad en una spec cerrada al reconstruirle plantilla retroactiva;
- inventar demasiado detalle histórico sin evidencia observable actual;
- dejar fuera otra carpeta incompleta del mismo subconjunto temprano.

## 4. Validación

- auditoría local del inventario `specs/001-020` comprobando presencia de `spec.md`, `plan.md` y `tasks.md` en las carpetas afectadas.

## 5. Resultado ejecutado

1. Las specs tempranas detectadas quedan normalizadas con plantilla mínima.
2. SDD documenta la normalización retroactiva como mecanismo permitido para históricos.
3. `B216` pasa a ser el siguiente foco UX/read-only.