# Tasks — Spec 432 / BL-05

- [x] Detectar invocaciones `GetItem*`, `SetItem` y `SetItemStatus` con columna literal bajo un root DataWindow literal.
- [x] Reusar `dataWindowBindingModel` + `dataWindowModel` para definition/hover sin abrir un parser paralelo.
- [x] Mantener caso negativo explícito cuando el `DataObject` sea dinámico o ambiguo.