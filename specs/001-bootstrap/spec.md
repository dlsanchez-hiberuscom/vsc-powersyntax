# [001] Bootstrap profesional del plugin PowerBuilder 2025 para VS Code

## 1. Resumen

Crear la base profesional mínima del nuevo plugin de **PowerBuilder 2025 para Visual Studio Code** con arquitectura preparada para crecimiento, foco en carga rápida, separación correcta cliente / servidor y soporte explícito para un flujo de desarrollo **Spec-Driven Development**.

---

## 2. Problema

Actualmente el proyecto necesita una base inicial claramente estructurada para evitar:

- crecimiento desordenado,
- lógica pesada en el Extension Host,
- documentación inconsistente,
- y una mala base técnica para futuras capacidades semánticas y de rendimiento.

Sin este bootstrap, cualquier avance posterior corre el riesgo de apoyarse en una estructura frágil.

---

## 3. Objetivo

Dejar preparado un esqueleto inicial del plugin que permita evolucionar de forma profesional y rápida sin rehacer la base más adelante.

El bootstrap debe dejar claro:

- la estructura de carpetas principal,
- la separación entre cliente y servidor,
- el flujo documental base,
- y el marco SDD mínimo del repositorio.

---

## 4. Usuarios / actores

### 4.1 Desarrollador principal del plugin
Necesita una base clara, mantenible y escalable.

### 4.2 IA / agentes de desarrollo
Necesitan contexto estructurado, documentación canónica y puntos de entrada claros para colaborar correctamente.

### 4.3 Futuras colaboraciones técnicas
Necesitan comprender rápidamente la arquitectura y el flujo de trabajo del repositorio.

---

## 5. Alcance

Este slice incluye:

- estructura documental base del repositorio,
- estructura conceptual inicial cliente / servidor / shared,
- constitución del proyecto,
- definición del flujo SDD,
- documentación base de arquitectura, roadmap, backlog y current focus,
- y la primera spec de arranque del proyecto.

---

## 6. Fuera de alcance

Este slice no incluye todavía:

- parser funcional completo,
- indexación real,
- hover / definition / references,
- diagnósticos reales,
- semantic tokens,
- pruebas avanzadas,
- ni optimización profunda del rendimiento más allá del diseño base.

---

## 7. Requisitos

- **R1.** Debe existir una base documental mínima y coherente del repositorio.
- **R2.** Debe quedar fijada la arquitectura base recomendada del plugin.
- **R3.** Debe quedar establecido el flujo SDD oficial del proyecto.
- **R4.** Debe poder identificarse claramente la separación cliente / servidor / shared.
- **R5.** Debe quedar preparado el repositorio para evolucionar por slices pequeños.
- **R6.** La documentación inicial debe poder servir como contexto operativo para IA y humanos.

---

## 8. Criterios de aceptación

- **AC1.** Existe un conjunto inicial de documentos canónicos que describen constitución, SDD, arquitectura, roadmap, backlog y foco actual.
- **AC2.** Existe una primera spec de bootstrap con plan, tareas y quickstart.
- **AC3.** La estructura propuesta del proyecto deja explícita la separación entre cliente VS Code y servidor LSP.
- **AC4.** El bootstrap no introduce aún complejidad funcional innecesaria ni falsas promesas de features no implementadas.
- **AC5.** La base resultante permite continuar con el siguiente slice natural: activación perezosa y wiring LSP mínimo.

---

## 9. Riesgos / dudas abiertas

- Riesgo de diseñar demasiado pronto sin validar con código real.
- Riesgo de generar documentación excesiva para un bootstrap pequeño.
- Riesgo de dejar la estructura demasiado genérica y poco accionable.

---

## 10. Resultado esperado

Al cerrar este slice, el repositorio debe quedar listo para empezar la implementación técnica de la base del plugin con claridad documental, dirección arquitectónica y flujo SDD definidos.
