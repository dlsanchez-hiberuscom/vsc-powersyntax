# Spec 383 — B378 AI PowerBuilder context pack and token budget contract

## Estado

- closed

## Relacion backlog

- Backlog item: `B378 — AI PowerBuilder context pack and token budget contract`

## Objetivo

Crear un context pack corto, estable y versionado para tareas IA sobre este repositorio sin duplicar documentacion propietaria ni cargar datasets completos en prompts.

## Alcance

- crear `docs/ai-context/powerbuilder-plugin-context.md`;
- referenciarlo desde documentacion canonica de IA/workflows/SDD/agentes;
- congelar su presencia, headings minimos y referencias con un guard documental automatizado.

## Fuera de alcance

- cambios runtime/LSP;
- herramientas write-enabled nuevas;
- duplicar reglas completas del catalogo, de arquitectura o de DataWindow dentro del pack.

## Criterios de aceptacion

- existe el context pack con headings minimos de B378;
- menciona `workspace-check` y `object-check` como herramientas de entrada read-only;
- deja claro que no se debe cargar `generated/manual/localization` completo en prompts;
- la documentacion canonica referencia el pack;
- un test falla si el archivo desaparece o queda sin referencias.