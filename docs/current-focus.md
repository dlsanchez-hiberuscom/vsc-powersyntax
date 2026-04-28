# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento refleja el foco operativo actual del proyecto.

Debe responder siempre a estas preguntas:

- qué estamos cerrando ahora,
- por qué es prioritario,
- qué no debemos tocar salvo necesidad,
- cuál es el siguiente paso natural,
- y qué condición debe cumplirse para cambiar el foco.

Este documento no describe aspiraciones a largo plazo, sino el **trabajo inmediato y realista** que debe cerrarse antes de abrir nuevas capas del producto.

---

## 2. Foco actual

### Prioridad operativa

Fortalecer la **base operativa del plugin** para que la carga, la activación, el ciclo de vida del LSP y la estructura inicial del runtime sean profesionales, rápidos, observables y fiables.

La prioridad inmediata no es ampliar superficie funcional, sino asegurar que el plugin se comporta correctamente como extensión de VS Code: **cliente ligero**, **activación perezosa**, **trabajo pesado fuera del Extension Host** y **prioridad real del archivo activo**. VS Code recomienda activar solo cuando el usuario realmente necesita la extensión, y la guía de Language Server justifica ejecutar el análisis costoso fuera del host para proteger CPU, memoria y responsividad del editor. 

### Fase del roadmap en foco

El foco actual corresponde a:

- cierre efectivo de **Fase 0**,
- consolidación fuerte de **Fase 1**,
- y preparación mínima de la **Fase 2**.

Todavía **no** estamos en fase de ampliar agresivamente semántica avanzada, automatización externa ni ecosistema PowerBuilder profundo.

---

## 3. Backlog que debe cerrarse ahora

### Objetivos inmediatos en curso

El foco operativo actual debe concentrarse en estas entradas del backlog:

- **B001. Cerrar activación perezosa definitiva**
- **B002. Consolidar wiring cliente ↔ servidor LSP**
- **B003. Medición base de cold start y primer archivo**
- **B004. Formalizar prioridad estricta del archivo activo**
- **B005. Añadir scheduler mínimo con prioridades y cancelación**
- **B006. Descubrimiento de workspace y política básica de roots**
- **B007. Observabilidad mínima del runtime**
- **B008. Endurecer ciclo de vida del servidor**
- **B009. Alinear documentación canónica de base**
- **B010. Normalizar validación base del repositorio**

### Orden operativo recomendado

1. cerrar activación perezosa y arranque limpio, 
2. dejar el wiring cliente/servidor estable y observable, 
3. medir cold start, primer archivo y primer servicio útil, 
4. imponer prioridad estricta al archivo activo, 
5. introducir scheduler mínimo, prioridades y cancelación, 
6. formalizar descubrimiento de workspace y roots, 
7. cerrar observabilidad mínima y validación base, 
8. dejar documentación canónica alineada. 

---

## 4. Qué sí debe hacerse ahora

### Trabajo permitido y prioritario

- endurecer bootstrap del cliente,
- estabilizar ciclo de vida del servidor,
- eliminar trabajo pesado del arranque,
- reforzar la separación entre cliente ligero y runtime de análisis, 
- preparar métricas mínimas de activación, primer archivo y primer servicio útil, 
- introducir scheduler mínimo y cancelación cooperativa,
- formalizar prioridad del archivo abierto,
- preparar descubrimiento básico de workspace,
- mantener toda la documentación canónica actualizada con el estado real,
- y dejar lista la base para pasar a parsing incremental y caché documental, pero sin adelantar todavía una semántica más grande de la que la base puede sostener. 

### Resultado esperado de esta etapa

Al final del foco actual, el plugin debe:

- arrancar sin trabajo pesado innecesario, 
- levantar el servidor solo cuando corresponde, 
- priorizar el archivo activo frente al trabajo global, 
- permitir medir tiempos base de carga y primer servicio, 
- y dejar una base suficiente para pasar a parseo incremental y caché con menor riesgo de refactorización. 

---

## 5. Qué no debe hacerse ahora salvo causa clara

### Trabajo explícitamente fuera de foco

No debe hacerse ahora, salvo bug, deuda bloqueante o necesidad muy justificada:

- reabrir arquitectura general sin motivo,
- meter features vistosas antes de consolidar base,
- ampliar demasiado la superficie funcional,
- introducir complejidad innecesaria en el cliente, 
- adelantar semántica fuerte si todavía no están cerrados arranque, ciclo de vida, prioridades, observabilidad y validación base, 
- abrir aún integraciones como PBAutoBuild, OrcaScript/ORCA, DataWindow avanzado o API local, porque pertenecen a fases posteriores del roadmap. 

### No tocar todavía salvo necesidad real

- rename,
- references robustas,
- signature help,
- semantic tokens avanzados,
- catálogo amplio del lenguaje,
- validación grande sobre PFC,
- automatización externa o IA.

Todo eso tiene valor, pero **no es el foco inmediato**.

---

## 6. Riesgos actuales a vigilar

### Riesgos principales

- exceso de lógica en el Extension Host, 
- activación demasiado amplia, 
- arranque del servidor más pronto o con más coste del necesario, 
- indexación temprana agresiva,
- crecimiento desordenado de módulos provisionales,
- falta de separación entre runtime y lógica semántica,
- y documentación desalineada con implementación real. 

### Riesgo estructural específico

El principal riesgo técnico de esta etapa es convertir capas provisionales o bootstrap en estructuras permanentes sin diseño explícito. El foco actual debe evitar precisamente eso: construir base operativa sin convertir el bootstrap en el destino final del sistema. 

---

## 7. Evidencia mínima que debe salir de este foco

Antes de mover el foco, esta etapa debe dejar evidencia razonable de que la base realmente ha mejorado.

### Evidencias mínimas esperadas

- medición repetible de activación del cliente,
- medición repetible de tiempo hasta primer archivo útil,
- medición repetible de tiempo hasta primer servicio visible,
- comprobación de que el arranque no ejecuta trabajo pesado innecesario,
- comprobación de que el archivo activo tiene prioridad real,
- validación básica del ciclo de vida del servidor,
- y documentación actualizada reflejando el estado real. 

---

## 8. Siguiente paso natural

El siguiente paso natural del proyecto, una vez cerrado este foco, es:

1. pasar a **parseo incremental usable**,  
2. introducir **caché documental e invalidación fina**,  
3. preparar el **esqueleto del índice incremental**,  
4. y después comenzar el **backbone semántico inicial** del archivo activo. 

Es decir: primero base operativa sólida, después parseo/caché, y solo entonces semántica compartida reutilizable.

---

## 9. Condición para mover el foco

El foco actual solo debe cambiar cuando:

- la activación esté razonablemente cerrada, 
- el arranque no bloquee el editor, 
- el wiring cliente/servidor sea estable y observable, 
- existan mediciones mínimas de rendimiento, 
- la prioridad del archivo activo esté impuesta de verdad, 
- la validación base del repositorio sea repetible,
- y la estructura documental quede alineada con el estado real del repositorio. 

Si estas condiciones no se cumplen, no debe abrirse de forma agresiva la siguiente capa del roadmap.

---

## 10. Regla final de foco

Mientras este documento siga vigente, la regla operativa es:

> **no abrir más superficie funcional de la que la base actual puede sostener sin comprometer carga, estabilidad, claridad arquitectónica o documentación viva.**

La prioridad inmediata es dejar una base profesional y fiable sobre la que luego sí pueda crecer el backbone semántico, la escala sobre corpus grandes y el valor diferencial del ecosistema PowerBuilder. 