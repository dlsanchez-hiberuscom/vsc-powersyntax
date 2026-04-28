import {
    PbSystemSymbolEntry,
    PbSystemSymbolHoverPayload,
} from '../types';

function getSystemSymbolRoleLabel(entry: PbSystemSymbolEntry): string {
    if (entry.kind === 'statement') {
        return 'Sentencia PowerScript';
    }

    if (entry.kind === 'event') {
        if (entry.namespace === 'datawindow') {
            return 'Evento de DataWindow';
        }

        return 'Evento del sistema';
    }

    if (entry.namespace === 'datawindow') {
        return 'Método integrado de DataWindow';
    }

    if (entry.namespace === 'object') {
        return 'Método integrado de objeto';
    }

    return 'Función global del sistema';
}

function formatSignatures(entry: PbSystemSymbolEntry): string {
    if (entry.signatures.length === 0) {
        return '';
    }

    if (entry.signatures.length === 1) {
        return `\`${entry.signatures[0].label}\``;
    }

    return [
        'Firmas:',
        ...entry.signatures.map(signature => `- \`${signature.label}\``),
    ].join('\n');
}

function formatObsolete(entry: PbSystemSymbolEntry): string | undefined {
    if (!entry.obsolete) {
        return undefined;
    }

    const sections = ['Obsoleto'];

    if (entry.obsoleteMessage) {
        sections.push(entry.obsoleteMessage);
    }

    if (entry.replacement) {
        sections.push(`Reemplazo recomendado: \`${entry.replacement}\`.`);
    }

    return sections.join('. ');
}

function formatProvenance(entry: PbSystemSymbolEntry): string {
    const sections = [
        entry.provenance.authority,
        entry.provenance.kind,
        entry.provenance.version,
    ].filter(Boolean);

    if (entry.provenance.generatedAt) {
        sections.push(entry.provenance.generatedAt);
    }

    return `Provenance: ${sections.join(' · ')}`;
}

export function formatSystemSymbolCompletionDetail(
    entry: PbSystemSymbolEntry,
): string {
    return `${getSystemSymbolRoleLabel(entry)} · ${entry.category}`;
}

export function formatSystemSymbolSupplementMarkdown(
    entry: PbSystemSymbolEntry,
): string {
    const sections = [
        `${getSystemSymbolRoleLabel(entry)} · ${entry.category}`,
        entry.summary,
    ];

    if (entry.appliesTo?.length) {
        sections.push(`Aplica a: ${entry.appliesTo.join(', ')}`);
    }

    const obsolete = formatObsolete(entry);

    if (obsolete) {
        sections.push(obsolete);
    }

    sections.push(formatProvenance(entry));
    sections.push(`Fuente: ${entry.dataset} · ${entry.source}`);

    return sections.join('\n\n');
}

export function formatSystemSymbolMarkdown(
    entry: PbSystemSymbolEntry,
): string {
    return getSystemSymbolHoverPayload(entry).markdown;
}

export function getSystemSymbolHoverPayload(
    entry: PbSystemSymbolEntry,
): PbSystemSymbolHoverPayload {
    const title = `**${entry.name}**`;
    const signatureMarkdown = formatSignatures(entry) || undefined;
    const supplementMarkdown = formatSystemSymbolSupplementMarkdown(entry);
    const sections = [title];

    if (signatureMarkdown) {
        sections.push(signatureMarkdown);
    }

    sections.push(supplementMarkdown);

    return {
        title,
        signatureMarkdown,
        supplementMarkdown,
        markdown: sections.join('\n\n'),
    };
}
