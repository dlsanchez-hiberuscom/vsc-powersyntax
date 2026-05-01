# Quickstart — Spec 133 Semantic Snapshot (B151)

## 1. Proposito

Validar rapidamente que el servidor genera y reutiliza un snapshot semantico canonico por documento sin recomponer piezas dispersas.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Abrir un archivo PowerBuilder representativo del corpus.
2. Forzar una consulta de hover o definition sobre simbolos locales y heredados.
3. Verificar en logs o trazas del servidor que el analisis produce un snapshot documental unico con fingerprint e identidad.
4. Editar el archivo sin cambiar semantica relevante y comprobar si el snapshot puede reutilizarse o reemplazarse sin recomputar de mas.

## 4. Resultado esperado

- El documento genera un snapshot completo.
- KnowledgeBase y caches cercanas consumen el snapshot sin recomponer parseo paralelo.
- La respuesta interactiva del archivo activo sigue siendo estable.

## 5. Checklist

- [ ] Existe snapshot canonico por documento.
- [ ] La identidad del snapshot se registra o puede inspeccionarse.
- [ ] Los tests de snapshotIdentity y snapshotMergeOrReplace pasan.
- [ ] No aparecen regresiones inmediatas en hover, completion o definition.