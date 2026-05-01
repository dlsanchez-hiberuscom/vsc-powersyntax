# Quickstart — Spec 136 Semantic Diff Engine (B170)

## 1. Proposito

Validar que el servidor distingue cambios sin impacto semantico de cambios que deben invalidar o reindexar mas alla del documento editado.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Abrir un archivo y modificar solo comentarios o espacios.
2. Verificar que el diff clasifica el cambio como no semantic change o impacto minimo.
3. Cambiar una firma, una visibilidad o una relacion de herencia.
4. Verificar que el diff sube el nivel de impacto y deja evidencia reutilizable para invalidacion.

## 4. Resultado esperado

- Cambios inocuos no disparan recomputacion ampliada.
- Cambios de simbolos o firma producen impacto semantico mas alto.
- El diff deja una salida consistente para etapas posteriores.

## 5. Checklist

- [ ] Existe diffImpactLevel documentado y testeado.
- [ ] El fast path cubre cambios inocuos frecuentes.
- [ ] Los tests distinguen formato frente a cambios de simbolos.
- [ ] No se degrada la respuesta del archivo activo.