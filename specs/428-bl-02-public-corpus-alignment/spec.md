# Spec 428 — BL-02 Public corpus alignment

## Estado

- done

## Relación backlog

- Backlog item: `BL-02 — Alinear corpus público documentado con estado real`

## Objetivo

Alinear la documentación del corpus público con lo realmente materializado localmente, evitando claims sobre fixtures ausentes y dejando trazado cuáles son opcionales.

## Alcance del corte

- codificar los slots públicos materializados reales del checkout;
- reescribir `test/corpora/README.md` para separar slots materializados de slots opcionales no materializados por defecto;
- cubrir ese contrato con un test unitario documental.

## Validación mínima esperada

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/publicCorpusDocumentation.test.js`

## Fuera de alcance

- clonar nuevos corpus públicos dentro de esta spec;
- abrir gates que dependan de fixtures todavía ausentes.

## Cierre registrado

- `publicCorpusPaths.ts` declara ahora de forma explícita los slots públicos realmente materializados del checkout base y deja `legacy-pbl-dump` como único slot público obligatorio hoy;
- `test/corpora/README.md` separa slots materializados de slots opcionales no materializados por defecto, eliminando claims ambiguos sobre fixtures ausentes;
- un guard unitario evita que la documentación vuelva a promocionar como materializados slots públicos que sigan sin existir en el checkout base.

## Validación ejecutada

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/publicCorpusDocumentation.test.js`