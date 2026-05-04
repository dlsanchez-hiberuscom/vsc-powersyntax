# Plan — Spec 386 / B381

## Enfoque

1. Empezar con un builder puro client-side que normalice request, componga secciones y aplique budget/omissions.
2. Reutilizar surfaces ya cerradas en vez de reabrir parsing, catalog serving o planning semantico.
3. Cablear despues el metodo publico, tool bridge y comando exportable sobre ese builder.
4. Cerrar docs/foco/backlog cuando el contrato quede validado end-to-end.

## Riesgos

- meter demasiada logica de prioridad en `extension.ts` en vez de un builder reusable;
- inflar el bundle hasta romper el presupuesto de tokens;
- duplicar contexto ya representado por `object-check` o `explain-*`.

## Mitigaciones

- aislar el bundle en un builder puro desde el primer corte;
- estimar tokens de forma conservadora y registrar `omissions` explicitamente;
- tratar cada section como reusable primitive con prioridad por `intent`.