# Spec: PB-ARCH-P1-REFERENCES-STRUCTURAL-CONFIRMATION-01

## 1. Identificación
- **ID:** PB-ARCH-P1-REFERENCES-STRUCTURAL-CONFIRMATION-01
- **Título:** Confirmar references por identidad y pools acotados
- **Estado:** Open
- **Prioridad:** P1
- **Orden recomendado:** 08
- **Área:** Arquitectura, References

## 2. Objetivo
Evitar que las búsquedas de *references* y las acciones de *rename* dependan de fallbacks textuales no acotados que disparan *full scans* del workspace. Garantizar la búsqueda estructural y limitar el fan-out (escala de la búsqueda).

## 3. Principios de Diseño
1. **Identidad Común (Identity Key):** References y Definition operan sobre exactamente el mismo *target identity* dictado por la Facade.
2. **Limitación de Alcance (Caps/Pools):** Nunca realizar un barrido completo del workspace por defecto. Las referencias se agrupan en pools (por proyecto/librería/dependencia).
3. **Truncation Explícito:** Reportar siempre a la capa LSP o interactiva si los resultados exceden los límites seguros, para que la UX refleje la lista truncada.

## 4. Alcance y Tareas
1. **Redactar Spec:** Crear este documento oficial.
2. **Definir Pools de Dependencia:** Restringir index access y reference lookups según constraints del ProjectModel.
3. **Ambiguity Gate en Rename:** Evitar realizar un renombrado si la ambigüedad semántica (falta de target) no está resuelta.

## 5. Criterios de Aceptación
- References y definition coinciden en target.
- Rename falla elegantemente frente a ambigüedades insolubles.
- Los reportes inters de references declaran formalmente el *truncation*.

## 6. Documentación afectada
- `docs/testing.md`
- `docs/performance-budget.md`
- `docs/architecture-status.md`

## 7. Notas de Dependencia
Depende de `PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01`.
