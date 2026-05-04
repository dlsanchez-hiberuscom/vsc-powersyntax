# Tasks — Spec 378 Client command registration and lazy view activation

- [x] Crear `src/client/commandRegistration.ts` para centralizar el wiring de comandos del cliente.
- [x] Sustituir el bloque monolítico de `ensureCommandsRegistered()` por un registro por dominios reutilizable.
- [x] Extraer helpers nombrados para jerarquía y paneles que seguían inline en el registro.
- [x] Diferir la creación de `Object Explorer`, `Current Object Context` y `Diagnostics Explainability` mediante `ensure*Controller()`.
- [x] Mantener intactos command IDs, API pública y restart semantics.
- [x] Validar compile, `architectureImports`, activación focal y comandos cliente principales en host real.
- [x] Mover B346 fuera del backlog activo y dejar B356 como foco operativo inmediato.