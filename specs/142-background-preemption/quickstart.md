# Quickstart — Spec 142 Background Preemption (B124)

## 1. Proposito

Validar que una tarea de fondo puede cancelarse o ser preemptada cuando llega trabajo interactivo prioritario y que luego puede reanudarse con coherencia.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Iniciar indexacion o diagnosticos de fondo sobre varios archivos.
2. Lanzar una consulta interactiva sobre el archivo activo.
3. Verificar que el scheduler preempta o cancela cooperativamente el trabajo de fondo.
4. Confirmar que la tarea de fondo se reprograma y completa despues sin dejar estado roto.

## 4. Resultado esperado

- La consulta interactiva obtiene prioridad real.
- El trabajo de fondo no rompe atomicidad ni coherencia.
- La reanudacion conserva el progreso seguro ya consolidado.

## 5. Checklist

- [ ] Existen cancellation checks en trabajo de fondo real.
- [ ] El scheduler puede preemptar por prioridad interactiva.
- [ ] Los tests cubren cancelacion y reanudacion.
- [ ] No aparecen estados parciales tras una preempcion.