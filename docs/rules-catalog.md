# Rules Catalog — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento gobierna las reglas diagnósticas del plugin.

Cada regla debe tener:

- ID estable;
- severidad por defecto;
- readiness mínima;
- confidence mínima;
- alcance;
- riesgo de falso positivo;
- pruebas asociadas.

---

## 2. Plantilla de regla

```md
## PB-XXX-000 — Nombre de la regla

- **Estado:** draft | active | deprecated
- **Severidad default:** info | warning | error
- **Readiness mínima:** structural-only | nearby-semantic-ready | project-semantic-ready | workspace-semantic-ready
- **Confidence mínima:** low | medium | high
- **Aplica a:** ...
- **Falso positivo esperado:** bajo | medio | alto
- **Tests:** ...
- **Docs relacionadas:** ...
```

---

## 3. Reglas estructurales SR*

## 3.0 IDs implementados actualmente

La implementación actual conserva IDs históricos `SD*` y `dataobject-*` en código/tests. Los IDs `PB-*` de este catálogo gobiernan la taxonomía objetivo, pero no deben presentarse como contrato emitido hasta cerrar `B232`.

IDs visibles actuales:

- `SD2` / `PowerScript:SD2` — estructura PowerScript no balanceada o bloque genérico inválido.
- `SD3` / `PowerScript:SD3` — referencia o ancestro no resuelto cuando readiness/confidence lo permiten.
- `SD8` — declaración duplicada.
- `SD9` — keyword de flujo huérfana.
- `SD10` — `exit`/`continue` fuera de contexto válido.
- `SD11` — código inalcanzable.
- `SD12` — paréntesis no balanceados.
- `SD13` — retorno faltante en función con return type.
- `dataobject-not-found`, `dataobject-ambiguous`, `dataobject-dynamic`, `retrieve-arity-mismatch` — familia DataWindow/DataObject actual.

Regla: cualquier renombrado hacia `PB-*` requiere compatibilidad o alias y spec propia; no cambiar IDs diagnósticos como edición documental.

## PB-STRUCT-001 — Forward type does not match global type

- **Estado:** draft
- **Severidad default:** warning
- **Readiness mínima:** structural-only
- **Confidence mínima:** medium
- **Aplica a:** `.sra`, `.srw`, `.sru`, `.srm`, `.srf`
- **Falso positivo esperado:** medio en legacy exportado parcialmente
- **Tests:** container parser fixtures

## PB-STRUCT-002 — Prototype without implementation

- **Estado:** draft
- **Severidad default:** warning
- **Readiness mínima:** structural-only
- **Confidence mínima:** medium
- **Aplica a:** functions/events con prototypes
- **Falso positivo esperado:** medio en código parcial

## PB-STRUCT-003 — Prototype signature differs from implementation

- **Estado:** draft
- **Severidad default:** warning
- **Readiness mínima:** structural-only
- **Confidence mínima:** high
- **Aplica a:** prototypes + implementations

---

## 4. Reglas de símbolos

## PB-SYM-001 — Unresolved symbol

- **Estado:** draft
- **Severidad default:** warning
- **Readiness mínima:** project-semantic-ready
- **Confidence mínima:** high
- **Aplica a:** references, calls, member access
- **Falso positivo esperado:** alto si hay dynamic calls o external/native dependencies

## PB-SYM-002 — Shadowing

- **Estado:** active
- **Severidad default:** warning
- **Readiness mínima:** nearby-semantic-ready
- **Confidence mínima:** high
- **Aplica a:** local/shared/global/instance resolution

## PB-SYM-003 — Unused variable

- **Estado:** active
- **Severidad default:** warning
- **Readiness mínima:** nearby-semantic-ready
- **Confidence mínima:** medium
- **Aplica a:** local variables y parámetros según contexto

---

## 5. Reglas DataWindow

## PB-DW-001 — DataWindow not found

- **Estado:** active
- **Severidad default:** warning
- **Readiness mínima:** nearby-semantic-ready
- **Confidence mínima:** medium
- **Aplica a:** `DataObject = "d_xxx"` cuando no existe un `.srd` único indexado

## PB-DW-002 — Retrieve argument count mismatch

- **Estado:** active
- **Severidad default:** warning
- **Readiness mínima:** nearby-semantic-ready
- **Confidence mínima:** high
- **Aplica a:** `dw_1.Retrieve(...)`, `lds.Retrieve(...)` cuando el `DataObject` literal enlaza con un `.srd` único y la aridad no coincide con `arguments=(...)`

## PB-DW-003 — DataObject assignment cannot be resolved

- **Estado:** active
- **Severidad default:** info
- **Readiness mínima:** nearby-semantic-ready
- **Confidence mínima:** low
- **Aplica a:** `DataObject` dinámico o literal ambiguo, cuando el binding no permite navegación ni serving fiable hacia un `.srd`

---

## 6. Reglas PBL/ORCA

## PB-PBL-001 — Staging source is stale

- **Estado:** draft
- **Severidad default:** error
- **Readiness mínima:** project-semantic-ready
- **Confidence mínima:** high

## PB-PBL-002 — Import blocked by fingerprint mismatch

- **Estado:** draft
- **Severidad default:** error
- **Readiness mínima:** project-semantic-ready
- **Confidence mínima:** high

---

## 7. Reglas externas

## PB-PBNI-001 — Native PBX dependency detected

- **Estado:** draft
- **Severidad default:** info
- **Readiness mínima:** structural-only
- **Confidence mínima:** medium

## PB-WEB-001 — JavaScript bridge detected

- **Estado:** draft
- **Severidad default:** info
- **Readiness mínima:** structural-only
- **Confidence mínima:** medium

## PB-HTTP-001 — Possible hardcoded credential/token

- **Estado:** draft
- **Severidad default:** warning
- **Readiness mínima:** structural-only
- **Confidence mínima:** medium
