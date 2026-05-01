# Quickstart — Spec 138 Invalidation Engine (B154)

## 1. Proposito

Validar que un cambio entra por un motor de invalidacion unico y que el servidor genera un plan explicito de invalidacion y reindexacion selectiva.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Editar un archivo sin impacto semantico y revisar el plan generado.
2. Editar una firma o herencia que afecte a varios archivos.
3. Verificar que el motor invalida caches y programa solo el conjunto impactado.
4. Confirmar que el archivo activo mantiene prioridad durante la reprogramacion.

## 4. Resultado esperado

- Toda invalidacion relevante pasa por buildInvalidationPlan.
- Los no-op no provocan recomputacion innecesaria.
- Los cambios ampliados producen selective reindex plan coherente.

## 5. Checklist

- [ ] classifyChangeKind y buildInvalidationPlan tienen tests.
- [ ] selectiveReindexPlan se usa en el runtime.
- [ ] Las invalidaciones dispersas principales desaparecen del camino critico.
- [ ] No se rompe la latencia del archivo activo.