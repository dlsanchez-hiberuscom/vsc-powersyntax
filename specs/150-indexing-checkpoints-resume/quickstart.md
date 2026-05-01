# Quickstart — Spec 150 Indexing Checkpoints and Resume (B155)

## 1. Proposito

Verificar que el servidor persiste checkpoints utiles del pipeline y puede reanudar un workspace con seguridad en la siguiente sesion.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Abrir un workspace y dejar que avance discovery, parse y enrich hasta un punto estable.
2. Confirmar que el runtime escribe un checkpoint valido.
3. Cerrar y reabrir el workspace.
4. Verificar que el motor carga el checkpoint, recupera readiness util y reencola solo trabajo necesario.

## 4. Resultado esperado

- El arranque posterior aprovecha el checkpoint.
- El servidor descarta checkpoints incompatibles con seguridad.
- El resume no publica estado incierto ni incompleto.

## 5. Checklist

- [ ] Existe formato de checkpoint validable.
- [ ] El runtime carga checkpoints compatibles.
- [ ] Los tests cubren resume y descarte seguro.
- [ ] La reapertura mejora frente a cold indexing.