# Quickstart — Spec 143 Watcher Backpressure (B169)

## 1. Proposito

Validar que una ola de eventos del filesystem se agrupa, se regula y no rompe el pipeline de indexacion.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Simular una rafaga de cambios sobre varios archivos del workspace.
2. Verificar que los eventos se coalescen y que la cola de intake no crece sin control.
3. Simular un cambio masivo tipo branch switch.
4. Confirmar que se activa massiveChangeMode y que el runtime sigue operativo.

## 4. Resultado esperado

- El intake agrupa ruido redundante.
- El backpressure protege al runtime.
- El archivo activo conserva prioridad incluso en cambios masivos.

## 5. Checklist

- [ ] Existe watcher intake pipeline.
- [ ] Los bursts pequeños y masivos tienen tests.
- [ ] massiveChangeMode evita tormentas operativas.
- [ ] No se bloquea el serving interactivo.