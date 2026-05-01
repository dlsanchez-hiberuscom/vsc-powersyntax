# Quickstart — Spec 141 Work Budget and Yielding (B123)

## 1. Proposito

Verificar que las tareas largas del servidor ceden de forma cooperativa al agotarse el budget y pueden reanudarse sin perder progreso util.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Arrancar indexacion de fondo sobre un workspace mediano.
2. Observar que el indexador registra yields o replanificaciones al agotar el budget.
3. Ejecutar una consulta interactiva durante el proceso.
4. Confirmar que la consulta responde y que el trabajo de fondo se reanuda despues.

## 4. Resultado esperado

- Ninguna tarea larga monopoliza CPU de forma sostenida.
- El trabajo de fondo se reanuda sin perder progreso util.
- La interactividad del archivo activo mejora.

## 5. Checklist

- [ ] Existen budgets reutilizables.
- [ ] El runtime registra yields o replanificaciones.
- [ ] Los tests cubren reanudacion.
- [ ] Las consultas interactivas no quedan bloqueadas por trabajo largo.