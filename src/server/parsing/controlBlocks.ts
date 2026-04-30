/**
 * Control-block tracker (Spec 063).
 *
 * Detecta los rangos de bloques de control PowerScript dentro del cuerpo
 * de funciones/eventos: `if/then ... end if`, `for ... next`,
 * `do ... loop [while|until expr]`, `choose case ... end choose`,
 * `try ... catch ... finally ... end try`.
 *
 * Pensado para alimentar análisis posteriores (SD4 anidado, shadowing fino,
 * future formatter) sin recomputarlos en cada feature.
 *
 * Notas de robustez:
 *  - Trabaja sobre `strippedLines` para ignorar comentarios y strings.
 *  - Soporta IF multi-línea con continuación `&` (línea lógica).
 *  - `loop while expr` / `loop until expr` cierran un único bloque do.
 *
 * @module parsing/controlBlocks
 */

export type ControlBlockKind = 'if' | 'for' | 'do' | 'choose-case' | 'try';

export interface ControlBlockRange {
  kind: ControlBlockKind;
  startLine: number;
  endLine: number;
}

const RE = {
  if: /^if\b.*\bthen\s*$/i,
  for: /^for\b/i,
  do: /^do\b/i,
  chooseCase: /^choose\s+case\b/i,
  try: /^try\b/i,
  endIf: /^end\s+if\b/i,
  next: /^next\b/i,
  loop: /^loop\b/i,
  endChoose: /^end\s+choose\b/i,
  endTry: /^end\s+try\b/i
};

/**
 * Recorre un fragmento de líneas (`strippedLines.slice(start, end+1)`) y
 * devuelve los rangos de bloques de control detectados, manteniendo el
 * sistema de `&`-continuaciones para no abrir/cerrar IF a destiempo.
 */
export function scanControlBlocks(
  strippedLines: string[],
  start: number,
  end: number
): ControlBlockRange[] {
  const out: ControlBlockRange[] = [];
  const stack: Array<{ kind: ControlBlockKind; line: number }> = [];

  let cont = '';
  let contStart = -1;

  for (let i = start; i <= end; i++) {
    const raw = strippedLines[i] ?? '';
    const trimmed = raw.trim();
    if (!trimmed && !cont) continue;

    if (trimmed.endsWith('&')) {
      if (contStart < 0) contStart = i;
      cont += (cont ? ' ' : '') + trimmed.replace(/&\s*$/, '').trim();
      continue;
    }

    let line: string;
    let logicalStart: number;
    if (cont) {
      line = (cont + ' ' + trimmed).trim().toLowerCase().replace(/\s+/g, ' ');
      logicalStart = contStart;
      cont = '';
      contStart = -1;
    } else {
      line = trimmed;
      logicalStart = i;
    }

    // Cierres
    if (RE.endIf.test(line)) {
      popUntil(stack, 'if', i, out);
      continue;
    }
    if (RE.next.test(line)) {
      popUntil(stack, 'for', i, out);
      continue;
    }
    if (RE.loop.test(line)) {
      popUntil(stack, 'do', i, out);
      continue;
    }
    if (RE.endChoose.test(line)) {
      popUntil(stack, 'choose-case', i, out);
      continue;
    }
    if (RE.endTry.test(line)) {
      popUntil(stack, 'try', i, out);
      continue;
    }

    // Aperturas
    if (RE.if.test(line)) {
      stack.push({ kind: 'if', line: logicalStart });
      continue;
    }
    if (RE.for.test(line)) {
      stack.push({ kind: 'for', line: logicalStart });
      continue;
    }
    if (RE.do.test(line)) {
      stack.push({ kind: 'do', line: logicalStart });
      continue;
    }
    if (RE.chooseCase.test(line)) {
      stack.push({ kind: 'choose-case', line: logicalStart });
      continue;
    }
    if (RE.try.test(line)) {
      stack.push({ kind: 'try', line: logicalStart });
      continue;
    }
  }

  // Cualquier bloque sin cerrar se cierra contra `end` (no se reporta como error
  // aquí; eso lo hace `validateStructure`).
  while (stack.length) {
    const top = stack.pop()!;
    out.push({ kind: top.kind, startLine: top.line, endLine: end });
  }

  return out;
}

function popUntil(
  stack: Array<{ kind: ControlBlockKind; line: number }>,
  kind: ControlBlockKind,
  closeLine: number,
  out: ControlBlockRange[]
): void {
  for (let j = stack.length - 1; j >= 0; j--) {
    if (stack[j].kind === kind) {
      const opened = stack.splice(j, 1)[0];
      out.push({ kind, startLine: opened.line, endLine: closeLine });
      return;
    }
  }
}
