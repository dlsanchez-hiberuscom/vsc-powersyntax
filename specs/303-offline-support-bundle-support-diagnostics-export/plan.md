# Plan - Spec 303 offline support bundle / support diagnostics export (B258)

## 1. Enfoque técnico

Reutilizar el carril read-only ya cerrado para `semantic repro packs`, `showStats`, `health`, manifest semántico, gobernanza de settings y journal runtime. El soporte offline correcto se construye cliente-side con redacción explícita y sin exportar código bruto por defecto.

## 2. Pasos

1. Crear un builder puro de support bundle saneado apoyado en `ApiServerStats`, manifest reducido, contract/tool inventory y settings gobernados.
2. Exponer un comando cliente para exportarlo bajo `tools/support-bundles`.
3. Cubrir el builder con unit de esquema/redacción y el comando con smoke real.
4. Alinear README, workflows, testing, arquitectura y documentos canónicos de foco/cierre.

## 3. Riesgos

- filtrar rutas locales, ejecutables o artefactos sensibles sin redacción suficiente;
- duplicar un motor nuevo de soporte en servidor en vez de reutilizar surfaces ya publicadas;
- exportar código bruto por defecto y mezclar este bundle con el repro pack semántico de `B175`.

## 4. Validación

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/supportBundle.test.js`
- `npm run test:smoke -- --grep "support-bundle-extension"`

## 5. Resultado ejecutado

1. El producto exporta un support bundle offline reproducible y saneado.
2. El bundle reutiliza contract/tool inventory, diagnostics snapshot, runtime journal y build/ORCA snapshot ya visibles.
3. El foco canónico del repo pasa a `B259`.