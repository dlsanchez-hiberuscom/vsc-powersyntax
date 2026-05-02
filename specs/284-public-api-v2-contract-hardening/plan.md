# Plan - Spec 284 Public API v2 contract hardening (B241)

1. Consolidar en `src/shared/publicApi.ts` un descriptor versionado con inventario estable de contratos.
2. Conectar la API exportada del cliente a ese descriptor sin exponer estado mutable.
3. Validar compatibilidad y copias defensivas con tests unitarios y smoke basico.
