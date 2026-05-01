# Quickstart — Spec 151 Persistent Cache Journal (B167)

## 1. Proposito

Validar que una escritura persistente interrumpida no deja la cache en un estado incierto y que el runtime puede recuperarse de forma segura.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Generar una escritura persistente de checkpoint o cache.
2. Interrumpir el proceso en mitad de la operacion o simular un fallo entre journal y commit final.
3. Reiniciar el servidor.
4. Verificar que el runtime detecta el journal incompleto y recupera un estado seguro.

## 4. Resultado esperado

- No queda cache corrupta silenciosa.
- El runtime puede hacer rollback o recovery de forma explicable.
- La siguiente sesion parte de un estado seguro aunque pierda la ultima escritura incompleta.

## 5. Checklist

- [ ] Existe journal transaccional.
- [ ] El arranque detecta y resuelve estado interrumpido.
- [ ] Los tests cubren recovery tras fallo.
- [ ] La cache persistente no queda en estado incierto.