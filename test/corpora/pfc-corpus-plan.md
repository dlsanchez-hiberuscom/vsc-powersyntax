# Plan operativo del corpus PFC

## Objetivo

Dejar preparado un corpus grande y repetible para pruebas de carga y rendimiento del plugin.

## Corpus principal

- `fixtures-local/pfc/2025-Workspace`

## Corpus secundario

- `fixtures-local/pfc/2025-Solution`

## Orden recomendado de uso

### Fase 1

Usar `2025-Workspace` para:

- primera validación de arranque,
- primera validación de indexación,
- primeras mediciones de tiempo.

### Fase 2

Usar `2025-Solution` para:

- compatibilidad del descubrimiento de proyecto,
- validación de comportamiento en el segundo formato,
- comparación de rendimiento base.

## Métricas mínimas a registrar

- tiempo de activación del plugin,
- tiempo de arranque del servidor,
- tiempo hasta hover sobre archivo activo,
- tiempo hasta document symbols,
- tiempo hasta primer lote de diagnósticos,
- observaciones de memoria/estabilidad si aplica.

## Regla de mantenimiento

Este corpus debe mantenerse fuera del código de producto y solo documentado mediante rutas y README.
