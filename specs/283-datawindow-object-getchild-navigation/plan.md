# Plan - Spec 283 DataWindow Object/GetChild navigation (B081)

1. Reutilizar `dataWindowPropertyPaths` como único anclaje de resolución semántica para no abrir un segundo motor DataWindow.
2. Añadir entry points mínimos para `.Object.<...>` y `GetChild(...)`, manteniendo el mismo gate de binding `DataObject` y la misma degradación honesta.
3. Validar con tests focales de definition/hover y mover el foco canónico al siguiente bloque pedido por el usuario.