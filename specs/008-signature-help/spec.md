# Spec 008 — Ayuda de firmas (Signature Help) base

## 1. Meta

- **Estado:** cerrada históricamente y normalizada por B233
- **Fase del roadmap:** Fase 6 (Diagnósticos y productividad semántica base)
- **Ticket/Backlog:** B028
- **Cierre histórico:** Signature Help quedó implementado sobre `KnowledgeBase`/`semanticQueryService` y hoy se valida con `src/server/features/signatureHelp.ts` y `test/server/unit/signatureHelp.test.ts`.

## 2. Contexto

Con la consolidación de `semanticQueryService` (B021) y de los scopes base (B020), el sistema ya es capaz de resolver a qué definición (función o evento) apunta una invocación, ya sea utilizando variables locales, funciones integradas o de instancia.

La siguiente mejora lógica (Signature Help) consiste en aprovechar esa misma resolución para asistir al desarrollador mientras está escribiendo los argumentos de una función, indicando el tipo de cada parámetro, el nombre y destacando en qué posición de la firma se encuentra el cursor.

## 3. Requisitos (Scope)

1. **Activación de LSP:**
   - La extensión debe registrarse como `signatureHelpProvider` para los caracteres desencadenantes `(` y `,`.
2. **Identificación del Call Target:**
   - Cuando se solicita Signature Help, el LSP debe buscar hacia atrás desde el cursor para encontrar el identificador de la función/evento que se está invocando.
3. **Resolución de Firma:**
   - Debe usar la `KnowledgeBase` (o el catálogo oficial de PowerScript) para recuperar los parámetros de dicho *callable*.
4. **Cálculo de Parámetro Activo:**
   - Debe determinar cuántas comas separan los argumentos escritos hasta la posición del cursor (cuidando anidamientos) para marcar cuál es el `activeParameter` en el cliente.
5. **Formateo Visual:**
   - Debe devolver un `SignatureHelp` objeto compatible con VS Code que muestre de forma legible la firma (e.g. `String Mid(String str, Integer start, Integer length)`).

## 4. Fuera de Alcance (Out of Scope)

- Resolución de firmas para objetos/DataWindows que no pertenezcan al catálogo base ni estén correctamente indexados en el workspace todavía.
- Resoluciones complejas de sobrecargas dinámicas avanzadas (sobrecargas con tipos de datos variables que requieran inferencia de tipos completa) si el modelo de tipos actual no lo soporta. Se mostrará la primera firma que coincida si hay múltiples o todas para que el usuario elija.

## 5. Criterios de Éxito

- Al abrir un paréntesis `(` tras un nombre de función conocida, aparece el tooltip de Signature Help en VS Code.
- Al escribir comas `,`, el parámetro activo resaltado se actualiza de izquierda a derecha.
- Cero regresiones en tiempo de inicio de LSP.
- La funcionalidad queda respaldada por pruebas unitarias automatizadas (`npm run test:unit`).
