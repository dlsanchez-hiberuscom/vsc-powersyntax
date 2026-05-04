# Plan — Spec 383 / B378

## Enfoque

1. Crear el context pack compacto enlazando a documentos propietarios.
2. Añadir referencias minimas desde estrategia, orquestacion, workflows, SDD y catalogo de agentes.
3. Congelar el contrato documental con un unit test pequeño y determinista.
4. Validar con `npm run build:test` y la lane unitaria filtrada para docs/context budget.

## Riesgos

- duplicar reglas largas dentro del pack;
- dejar el pack sin referencias y convertirlo en doc huerfana;
- drift entre el foco activo y el resumen compacto.

## Mitigaciones

- mantener el documento pequeno y con owner docs explicitos;
- crear guard de referencias;
- cerrar B378 alineando backlog/current-focus/done-log despues de validar.