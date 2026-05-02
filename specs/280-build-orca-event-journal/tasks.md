# Tasks - Spec 280 Build and ORCA event journal (B197)

## 1. Preparación

- [x] T1. Confirmar que el hueco real era persistencia reutilizable del `RuntimeJournal`, no un segundo logger aislado.

## 2. Implementación

- [x] T2. Añadir un store persistente de `build|legacy` conectado al `RuntimeJournal` por observer.
- [x] T3. Exponer la URI del journal persistente en `showStats` y enriquecer eventos build/ORCA con contexto útil.

## 3. Validación

- [x] T4. Añadir tests de persistencia/restore/ring buffer y revalidar runners build/ORCA.

## 4. Cierre

- [x] T5. Alinear docs/specs y mover el foco a `B199`.