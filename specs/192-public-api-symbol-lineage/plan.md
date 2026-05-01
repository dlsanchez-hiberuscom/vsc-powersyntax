# Plan - Spec 192 Public API symbol lineage (B109/B172)

## 1. Resumen tecnico

Extender `shared/publicApi.ts` con un tipo `ApiSymbolLineage` y un mapper puro `toApiSymbol()` para fijar la forma exportable.

## 2. Estado actual

- `ApiSymbol` solo exporta posición y clase base del símbolo.
- `B172` ya entrega lineage dentro del core.
- no existe aún un adaptador estable al contrato público.

## 3. Diseno propuesto

- `ApiSymbol.lineage?` opcional y estable.
- `toApiSymbol()` normaliza y copia defensivamente solo campos públicos.

## 4. Validacion

- npm run test:unit -- --grep "publicApi"
- npm run compile
- npm test