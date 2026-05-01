# Quickstart — Spec 152 Cache Schema Migrations (B168)

## 1. Proposito

Comprobar que el runtime detecta la version del schema persistente y decide de forma segura si migrar, invalidar o reconstruir la cache.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Generar una cache persistente con una version conocida del schema.
2. Simular una nueva version del runtime con schema compatible y verificar la migracion o reutilizacion segura.
3. Simular una incompatibilidad fuerte y verificar que el runtime invalida o reconstruye en lugar de reutilizar datos peligrosos.
4. Confirmar que el journal protege la migracion ante fallos intermedios.

## 4. Resultado esperado

- La cache persistente siempre se interpreta con version explicita.
- El runtime elige una salida segura en cada caso.
- No se reutiliza estado incompatible entre versiones del motor.

## 5. Checklist

- [ ] Existe manifest con schemaVersion.
- [ ] El arranque decide entre migrate, invalidate o rebuild.
- [ ] Los tests cubren compatibilidad e incompatibilidad.
- [ ] El journal protege las migraciones o descartes persistentes.