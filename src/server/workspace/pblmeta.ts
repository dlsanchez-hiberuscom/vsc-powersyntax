/**
 * .pblmeta parser (Spec 045 / B131).
 *
 * Formato heurístico: cada línea contiene `<name>.<srx>` (sra/sru/srw/...)
 * con comentarios opcionales tras `;`. Líneas en blanco se ignoran.
 *
 * @module workspace/pblmeta
 */

export interface PblMetaEntry {
  name: string;
  type: string;
  comment?: string;
}

const RE = /^\s*([A-Za-z_][\w$#%-]*)\.(sr[awumf])\s*(?:;\s*(.*))?$/i;

export function parsePblMeta(content: string): PblMetaEntry[] {
  const out: PblMetaEntry[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith(';')) continue;
    const m = RE.exec(line);
    if (!m) continue;
    out.push({
      name: m[1],
      type: m[2].toLowerCase(),
      comment: m[3]?.trim() || undefined
    });
  }
  return out;
}
