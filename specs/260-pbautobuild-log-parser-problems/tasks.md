# Tasks - Spec 260 PBAutoBuild log parser and Problems Panel integration (B184)

## 1. Preparación

- [x] T1. Confirmar el formato mínimo fiable de la salida/log de PBAutoBuild que se va a soportar.
- [x] T2. Definir la surface separada de problemas de build para no pisar diagnósticos semánticos.

## 2. Implementación

- [x] T3. Implementar parser puro y resumen estructurado de issues.
- [x] T4. Resolver issues a archivos/objetos fiables y publicarlos en Problems Panel.

## 3. Validación

- [x] T5. Añadir tests del parser con errores, warnings y categorías.
- [x] T6. Añadir tests del wiring básico de publicación/limpieza de problemas.

## 4. Cierre

- [x] T7. Alinear docs y cerrar `B184` solo si los problemas de build aparecen sin inventar ubicaciones.