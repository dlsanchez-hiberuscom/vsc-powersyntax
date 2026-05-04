# Tasks — Spec 410

## Estado

- done

## Tasks

- [x] Ampliar la smoke instalada del VSIX con defaults de settings del paquete.
- [x] Mantener activación, comandos, descriptor/API pública y handshake mínimo con runtime/LSP dentro de la misma smoke instalada.
- [x] Añadir un contrato unitario que congele el alcance del self-verification del paquete.
- [x] Revalidar la smoke instalada real del VSIX.
- [x] Reejecutar `release:verify` para registrar el estado real del lane completo.
- [x] Alinear docs canónicas y artefactos de backlog/foco/done-log.

## Riesgos residuales registrados

- `release:verify` sigue bloqueado por fallos globales preexistentes ajenos a `B315` en catálogo y arquitectura.
- El self-verification del VSIX sigue reutilizando la misma smoke instalada; cualquier cobertura adicional debe seguir sobre ese rail y no abrir un segundo harness paralelo.
