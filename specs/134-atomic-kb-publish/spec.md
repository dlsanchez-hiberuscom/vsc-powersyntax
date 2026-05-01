# Spec 134 — Publicacion atomica del Knowledge Base y de los indices (B165)

## 1. Resumen

Separar construccion y publicacion del estado semantico global para que las features no observen mezclas de conocimiento viejo y nuevo.

## 2. Problema

KnowledgeBase, caches y servicios interactivos pueden quedar expuestos a ventanas de inconsistencia cuando el estado del workspace cambia mientras el pipeline sigue construyendo piezas nuevas.

## 3. Objetivo

Definir un staged semantic state y una operacion de publish atomico con rollback seguro cuando la nueva version no sea valida.

## 4. Alcance

- Introducir un estado de staging para indices y conocimiento compartido.
- Establecer una operacion atomicPublishSwap para la transicion del estado visible.
- Modelar rollbackOnInvalidPublish y degradacion segura cuando una publicacion falle.
- Preparar el consumo desde server.ts y las features interactivas para leer solo estado publicado.

## 5. Fuera de alcance

- Versionado semantico interno del workspace.
- Caches de resultados por query.
- Persistencia del estado publicado.

## 6. Requisitos

- R1. Ninguna feature interactiva debe mezclar estructuras antiguas y nuevas durante una actualizacion.
- R2. El publish debe ser todo o nada a nivel de KnowledgeBase e indices principales.
- R3. Si la construccion de staging falla, el estado anterior debe seguir sirviendo con coherencia.
- R4. El contrato no debe mover logica pesada al cliente ni degradar la prioridad del archivo activo.

## 7. Criterios de aceptacion

- AC1. Hover, completion y definition nunca leen estado parcialmente actualizado.
- AC2. Existe un flujo explicito de staging, publish y rollback.
- AC3. La validacion cubre al menos un caso de publish valido y otro de rollback.
- AC4. B165 queda enlazada documentalmente con esta spec.

## 8. Riesgos y notas

- El cambio puede tocar wiring delicado en server.ts y en KnowledgeBase.
- Si el staging duplica demasiada memoria, el diseno debe apoyarse en referencias compartidas o snapshots inmutables.