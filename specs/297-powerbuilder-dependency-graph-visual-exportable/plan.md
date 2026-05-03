# Plan - Spec 297 powerbuilder dependency graph visual exportable (B252)

## 1. Enfoque técnico

Reutilizar el backbone ya publicado: snapshots semánticos, `KnowledgeBase` con reverse dependencies, routing del workspace y la API pública endurecida. El grafo correcto es inmediato, read-only y exportable, no una engine nueva ni un rescan completo.

## 2. Pasos

1. Crear el builder server-side del grafo inmediato.
2. Exponerlo por contrato público y tool bridge read-only.
3. Añadir un comando cliente para abrir Mermaid en Markdown preview.
4. Cubrir contrato y comportamiento con unit + smoke.
5. Alinear documentación viva y mover el foco a `B253`.

## 3. Riesgos

- fingir precisión transitive/global que la base actual no sostiene;
- resolver como única una dependencia realmente ambigua entre proyectos;
- contaminar la activación del cliente con trabajo pesado que debería seguir en demanda.

## 4. Validación

- `npm run build:test`
- unit focal sobre `dependencyGraph` y `publicApi`
- smoke de extensión sobre método, tool bridge y comando visual

## 5. Resultado ejecutado

1. El servidor publica un grafo inmediato defendible sobre surfaces ya indexadas.
2. La API pública v2.5.0 y el tool `dependency-graph` exponen el payload estable.
3. El cliente abre el diagrama Mermaid y el foco canónico pasa a `B253`.
