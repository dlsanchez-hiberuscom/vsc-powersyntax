# Plan - Spec 295 ORCA packaging policy behind feature flag (B195)

## 1. Enfoque técnico

No abrir packaging legacy real. El cierre correcto de `B195` es una policy explícita, visible y alineada con la arquitectura: `ORCA` conserva export/import/regenerate/rebuild, pero `EXE/PBD/DLL` queda fuera de superficie hasta que exista un feature flag dedicado y defendible.

## 2. Pasos

1. Formalizar la policy en la capability snapshot ORCA.
2. Proyectarla en status/stats/dashboard.
3. Cubrirla con tests unitarios y smoke ORCA.
4. Alinear documentación viva y mover foco a `B251`.

## 3. Riesgos

- sugerir accidentalmente que el feature flag ya existe cuando no existe;
- contaminar `PBAutoBuild` con semantics de packaging legacy;
- dejar la policy visible en unas surfaces y oculta en otras.

## 4. Validación

- `npm run build:test`
- unit focal sobre `orcaDetection`, `statusBarPresentation` y `projectHealthDashboard`
- smoke `ORCA legacy`

## 5. Resultado ejecutado

1. `orcaTooling.packagingPolicy` deja explícita la no exposición del packaging ORCA.
2. El cliente muestra esa decisión en surfaces read-only existentes.
3. El foco canónico pasa a `B251`.
