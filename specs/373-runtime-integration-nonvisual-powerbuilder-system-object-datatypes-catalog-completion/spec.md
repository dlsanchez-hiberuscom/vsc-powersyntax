# Spec 373: Runtime, integration and nonvisual PowerBuilder system object datatypes catalog completion

## Status

Closed.

## Backlog mapping

- B359 — Runtime, integration and nonvisual system object datatypes catalog completion.

## Objective

Cerrar los rails curados `manual/runtime/` y `manual/integration/` del catálogo PowerBuilder, completando tipos runtime/nonvisual modernos, integración HTTP/REST/OAuth/JSON, PDF, correo, profiling/trazas, reflexión, OLE no visual, objetos de sistema y errores sin remezclarlos con el carril visual ya fijado en `B358`.

## Implemented scope

- `src/server/knowledge/system/manual/runtime/` queda consolidado en slices estables (`systemTypes.ts`, `errors.ts`, `reflection.ts`, `ole.ts`, `mail.ts`, `profiling.ts`) y `src/server/knowledge/system/manual/integration/` hace lo mismo para `json.ts`, `http.ts`, `rest.ts`, `oauth.ts`, `pdf.ts`, `filesystem.ts`, `compression.ts`, `crypto.ts` y `dotnet.ts`.
- El backlog completo de tipos B359 queda curado desde `manual-core`, incluyendo gaps explícitos en profiling/trazas (`TraceTreeRoutine`, `TraceTreeObject`, `TraceTreeUser`, etc.), correo (`SMTPClient`, `MailFileDescription`, `MailMessage`), integración moderna (`ResourceResponse`, `RESTClient`, `Inet`) y PDF (`PDFPage`, `PDFTableOfContents`, `PDFDocumentProperties`, `PDFWatermark`, etc.).
- `src/server/parsing/grammar.ts` alinea `PB_BUILTIN_TYPES` para tipos runtime/integration representativos y `test/server/unit/runtimeCatalogDatatypes.test.ts` fija la lista completa B359 como `manual-core`, la clasificación representativa por categoría y la exclusión del extractor noise que solo debe seguir siendo owner-type generado.
- `docs/architecture.md`, `docs/testing.md`, `docs/rules-catalog.md`, `docs/powerbuilder-2025-vscode-plugin-technical-guide.md`, `docs/roadmap.md`, `docs/backlog.md`, `docs/current-focus.md` y `docs/done-log.md` quedan alineados con el cierre de B359 y el paso del foco hacia `B360`.

## Out of scope

- Reabrir el carril visual cerrado en `B358`.
- Introducir nuevos dominios, factories o cambios breaking del modelo enumerado (`B360`).
- Cambiar el query hot path endurecido en `B365`.
- Añadir reglas diagnósticas nuevas fuera de la ampliación del catálogo runtime/integration.

## Acceptance evidence

- La lista completa de tipos B359 resuelve desde `manual-core` como `system-type`.
- Tipos representativos (`HTTPClient`, `JSONParser`, `PDFDocument`, `PDFPage`, `SMTPClient`, `MimeMessage`, `TraceTreeRoutine`, `BatchDataObjects`, `ResourceResponse`, `DataStore`, `Transaction`) resuelven con categorías coherentes.
- El extractor noise listado en B359 no se publica como datatype.
- El split de `B358` permanece intacto: `Application` sigue en runtime/system y `OLEControl`/`OLECustomControl` no vuelven al carril nonvisual.
- `completion`, `hover` y `signatureHelp` no regresan tras la expansión del catálogo runtime/integration.

## Validation

```bash
npm run test:unit -- --grep "runtimeCatalogDatatypes|catalogV2"
npm run test:unit -- --grep "catalog|systemCatalog|catalogV2|catalogConsistency|nativeAncestors|ownerTypes"
npm run test:unit -- --grep "completion|hover|signatureHelp"
```