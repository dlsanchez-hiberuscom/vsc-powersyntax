# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B198 — Build/ORCA documentation and troubleshooting`

Estado actual: el bloque `B241-B250` queda cerrado, validado y registrado en `specs/284-public-api-v2-contract-hardening` a `specs/293-release-marketplace-readiness`, además de `docs/done-log.md`. Con ese cierre, la siguiente deuda canónica vuelve a ser `B198`, que ya no compite con gaps de plataforma abierta, explainability, performance gate ni release lane.

Trazas paralelas activas que no desplazan ese foco principal:

- `B195`, como decisión pendiente de packaging legacy solo despues de cerrar `B198`.
- mantenimiento verde del bloque `B241-B250`, unicamente si aparece una regresion real.

---

## 2. Por qué es prioritario

Este foco es prioritario porque el siguiente gap real ya no es técnico de plataforma sino de operabilidad/documentacion del carril legacy:

- `B241-B250` ya quedó cerrado con código, tests, specs y documentación viva alineada;
- `B198` es ahora la deuda residual más directa para explicar cuándo usar PBAutoBuild, cuándo usar ORCA y cómo diagnosticar ambos carriles;
- `B195` depende de despejar antes esa deuda operativa/documental.

---

## 3. Trabajo permitido ahora

- documentar el flujo moderno PBAutoBuild y el carril legacy ORCA sobre el estado ya materializado del producto;
- reforzar troubleshooting, criterios de uso y riesgos operativos sin abrir motores nuevos;
- preservar verde el bloque `B241-B250` y el bridge DataWindow ya cerrado mientras se cierra la deuda documental residual;
- mantener `B195` registrada y quieta hasta que `B198` quede despejada.

---

## 4. Trabajo fuera de foco

No abrir salvo causa clara:

- reabrir `B241-B250` sin evidencia de regresion;
- abrir nueva superficie funcional mayor mientras `B198` siga siendo deuda canónica;
- abrir `B195` por delante de `B198` sin justificarlo con bloqueo real.

---

## 5. Criterios de salida del foco actual

- `B198` queda cerrada con guía operativa y troubleshooting alineados al estado real del carril moderno/legacy;
- el bloque `B241-B250` permanece verde y sin reaperturas espurias;
- `B195` queda como siguiente decisión natural y no como deuda mezclada con documentación pendiente.

---

## 6. Siguiente foco natural

1. `B195` — packaging legacy, solo si `B198` queda cerrada sin nueva deuda operativa.
2. mantenimiento verde del bloque `B241-B250` y del backbone DataWindow ya cerrado.

---

## 7. Regla final

Toda integración legacy nueva debe consumir capability/estado compartidos y respetar el mismo principio de aislamiento: no puede invadir el hot path moderno ni duplicar motores ya cerrados del backbone semántico; la deuda documental no justifica reabrir arquitectura ya estable.