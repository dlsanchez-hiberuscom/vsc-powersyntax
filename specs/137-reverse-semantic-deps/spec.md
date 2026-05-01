# Spec 137 — Indice de dependencias semanticas inversas (B153)

## 1. Resumen

Construir un grafo de dependencias semanticas inversas para recomputar solo los documentos realmente impactados por un cambio.

## 2. Problema

Sin una vista explicita de dependencias inversas, el motor tiende a invalidar demasiado o a apoyarse en heuristicas dispersas cuando cambian firmas, visibilidad, herencia o ownership.

## 3. Objetivo

Extraer dependencias semanticas desde snapshots y conocimiento compartido, invertirlas en un grafo consultable y resolver el conjunto minimo de documentos impactados.

## 4. Alcance

- Definir extractSemanticDependencies por documento.
- Construir reverseDependencyGraph.
- Exponer impactedDocumentsResolver para invalidacion y scheduler.
- Integrar dependencias de herencia, library order, ownership y firmas visibles.

## 5. Fuera de alcance

- Politica completa de invalidacion.
- Latency governor.
- Persistencia del grafo.

## 6. Requisitos

- R1. Las dependencias deben derivarse del snapshot canonico y del conocimiento compartido, no de matching textual superficial.
- R2. El grafo debe cubrir al menos herencia, owners, tipo base, firmas visibles y proximidad de proyecto cuando sea estructuralmente conocida.
- R3. impactedDocumentsResolver debe devolver un conjunto estable y explicable de documentos a recomputar.
- R4. La solucion debe reutilizar projectRegistry, InheritanceGraph y libraryOrder cuando ya contienen la relacion canonica.

## 7. Criterios de aceptacion

- AC1. Existe un grafo de dependencias inversas consultable por el motor.
- AC2. Un cambio en herencia, firma o visibilidad devuelve el conjunto impactado esperado en casos base.
- AC3. Los tests cubren al menos una dependencia local y otra cross-file.
- AC4. B153 queda formalizada como base directa de B154 y B122.

## 8. Riesgos y notas

- Un grafo incompleto puede dar falsos negativos peligrosos.
- Un grafo sobredimensionado puede degradar memoria y producir invalidaciones excesivas.