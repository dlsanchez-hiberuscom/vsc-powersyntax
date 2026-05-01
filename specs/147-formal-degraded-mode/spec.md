# Spec 147 — Modo degradado formal (B158)

## 1. Resumen

Formalizar niveles explicitos de disponibilidad semantica para que cada feature sepa cuando degradar, bloquearse o responder con confianza reducida.

## 2. Problema

El proyecto aplica degradaciones parciales en distintos puntos, pero no existe un contrato unificado que diga que nivel semantico tiene el motor y que puede hacer cada feature en cada nivel.

## 3. Objetivo

Definir un modo degradado formal con niveles de disponibilidad semantica y reglas de consumo para hover, completion, definition, references y otras features.

## 4. Alcance

- Formalizar niveles como structural-only, nearby-semantic-ready, project-semantic-ready y workspace-semantic-ready.
- Conectar los niveles al modelo de progreso y readiness.
- Definir contratos de degradacion o bloqueo por feature.
- Evitar precision fingida cuando falte contexto.

## 5. Fuera de alcance

- Confidence gates avanzados por feature.
- Query engine unificado completo.
- UI avanzada de estado.

## 6. Requisitos

- R1. Deben existir niveles explicitos, explicables y observables de disponibilidad semantica.
- R2. Las features deben saber en que nivel pueden operar, degradar o bloquearse.
- R3. La degradacion debe priorizar seguridad semantica frente a precision fingida.
- R4. El contrato debe apoyarse en el modelo de readiness y no duplicarlo.

## 7. Criterios de aceptacion

- AC1. Existe enumeracion formal de niveles de disponibilidad.
- AC2. Al menos dos features consumen el contrato de degradacion.
- AC3. Los tests cubren operacion en niveles distintos y bloqueo seguro cuando falta base.
- AC4. B158 queda trazada como prerequisito de B159 y B171.

## 8. Riesgos y notas

- Demasiados niveles complicarian el consumo.
- Pocos niveles forzarian degradaciones demasiado gruesas.