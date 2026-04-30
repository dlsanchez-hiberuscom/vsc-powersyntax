# Spec 029 — Statement splitter (B095)

## 1. Motivación

PowerScript permite continuar una sentencia en varias líneas usando `&` al
final de la línea. Las features actuales razonan línea a línea y pierden
contexto en estos casos. Necesitamos segmentar el documento en
**statements lógicos** preservando el rango original.

## 2. Alcance

- Nuevo módulo `src/server/parsing/statementSplitter.ts`:
  - `splitStatements(content: string): LogicalStatement[]`.
  - `LogicalStatement = { text: string; startLine: number; endLine: number; rawLines: string[] }`.
  - Une líneas terminadas en `&` (con o sin trailing whitespace) y separa por `;` solo cuando no estén dentro de strings/comentarios (usa code masking).

### Fuera de alcance

- Parsing semántico de cada statement.

## 3. Criterios de aceptación

1. `a = 1 &\n  + 2` → un solo statement con texto unido y `endLine = 1`.
2. `a; b` → dos statements en la misma línea.
3. `&` dentro de comentario no une.
4. Tests cubren los tres casos.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B095).
