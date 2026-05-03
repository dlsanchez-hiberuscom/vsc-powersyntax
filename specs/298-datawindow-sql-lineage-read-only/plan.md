# Plan - Spec 298 datawindow SQL lineage read only (B253)

## 1. Enfoque técnico

Reutilizar el backbone DataWindow ya publicado: `DataWindowModel`, bindings `DataObject`, property paths `report/dddw` y la API pública endurecida. El lineage correcto es read-only, recursivo y degradable con honestidad, no un parser nuevo ni una engine paralela.

## 2. Pasos

1. Crear el builder server-side del lineage SQL de DataWindow.
2. Exponerlo por contrato público y tool bridge read-only.
3. Añadir un comando cliente para abrir el árbol en Markdown preview.
4. Cubrir contrato y comportamiento con unit + smoke.
5. Alinear documentación viva y mover el foco a `B254`.

## 3. Riesgos

- fingir precisión donde el binding raíz sea dinámico o el child target sea ambiguo;
- reparsear DataWindow fuera del backbone ya indexado;
- contaminar la activación del cliente con trabajo que debe seguir siendo bajo demanda.

## 4. Validación

- `npm run build:test`
- unit focal sobre `dataWindowSqlLineage` y `publicApi`
- smoke de extensión sobre método, tool bridge y comando visual

## 5. Resultado ejecutado

1. El servidor publica un lineage SQL defendible sobre surfaces ya indexadas.
2. La API pública v2.6.0 y el tool `datawindow-sql-lineage` exponen el payload estable.
3. El cliente abre el Markdown lateral y el foco canónico pasa a `B254`.