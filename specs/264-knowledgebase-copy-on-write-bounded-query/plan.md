# Plan - Spec 264 KnowledgeBase copy-on-write e indices de consulta acotada (B230)

## 1. Enfoque tecnico

Resolver `B230` en el propio `KnowledgeBase`, que es donde hoy se decide el coste real de publicacion y mutacion. El cambio evita el clon profundo del estado publicado y deja las features consumidoras casi intactas, salvo el manifiesto semantico que ya puede aprovechar el conteo acotado por `kind`.

## 2. Pasos

1. Sustituir `cloneState()` por un clon superficial seguro para copy-on-write.
2. Duplicar solo buckets afectados al mutar ids, kinds y dependencias inversas.
3. Reutilizar un indice por `EntityKind` y un total precalculado en consultas/conteos acotados.
4. Añadir cobertura unitaria del nuevo contrato visible y benchmark sintetico incremental.
5. Cerrar documentacion canónica y mover el foco a `B231`.

## 3. Riesgos

- mutar arrays/sets compartidos y romper la atomicidad defensiva al pasar a clon superficial;
- introducir un indice por `kind` que diverja del estado real al reemplazar o borrar documentos;
- fijar un benchmark demasiado optimista o demasiado ruidoso para CI/host compartido.

## 4. Validacion

- `npm run build:test`
- `npx mocha --ui tdd out/test/server/unit/knowledgeBase.test.js out/test/server/performance/knowledgeBase.perf.test.js`
- `npm run test:performance -- --grep "knowledgeBase"`

## 5. Resultado ejecutado

1. `KnowledgeBase` deja de clonar en profundidad todo el estado por mutacion y copia solo buckets tocados.
2. El manifiesto semantico y otros consumers con `kinds` reutilizan conteos/consultas acotadas.
3. La validacion deja trazado funcional y de performance suficiente para cerrar `B230` y pasar a `B231`.