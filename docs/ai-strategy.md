# Estrategia de IA — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento define la **visión estratégica** de cómo el plugin PowerBuilder para VS Code se integrará con IA para que agentes y herramientas automatizadas puedan **entender**, **navegar** y **operar** sobre código fuente PowerBuilder.

No describe implementación inmediata; las capacidades de IA pertenecen a las **Fases 10–11** del roadmap. Pero las decisiones arquitectónicas de las fases anteriores deben tenerlo en cuenta para no cerrar puertas.

---

## 2. Visión

Permitir que la IA "hable" con el plugin para:

- **entender** código PowerBuilder (símbolos, relaciones, herencia, scopes, tipos, dependencias),
- **navegar** proyectos grandes y legacy (buscar definiciones, encontrar usos, recorrer jerarquías),
- **diagnosticar** problemas (errores, warnings, deuda técnica, patrones peligrosos),
- **asistir** al desarrollador con refactorizaciones, completado, documentación automática y revisión,
- y **automatizar** tareas repetitivas de mantenimiento y migración sobre bases de código extensas.

El objetivo no es que la IA reemplace al desarrollador, sino que el plugin proporcione a la IA **contexto semántico rico y fiable** sobre PowerBuilder — algo que ningún LLM tiene de forma nativa debido a la escasa representación de PowerBuilder en los datos de entrenamiento.

---

## 3. Problema que resuelve

PowerBuilder es un lenguaje con estas características que dificultan el soporte de IA:

- **escasa representación** en datasets de entrenamiento de LLMs,
- **sintaxis no estándar** con forward declarations, prototipos, secciones de variables, eventos y herencia específica,
- **código legacy** extenso con patrones obsoletos, objetos anidados y convenciones propias de cada empresa,
- **herramientas de análisis escasas** fuera del IDE propietario,
- y **proyectos muy grandes** con miles de objetos donde el contexto manual es insuficiente.

Un plugin que pueda exponer conocimiento semántico estructurado de PowerBuilder a la IA sería un activo **sin equivalente actual** en el ecosistema.

---

## 4. Canales de integración con IA

### 4.1 VS Code Language Model API (Chat Participants + Tools)

VS Code ofrece una API nativa para que las extensiones expongan herramientas y participantes a Copilot Chat y agentes compatibles.

**Aplicación para este plugin:**

- Registrar un **Chat Participant** (`@powerbuilder`) que permita hacer preguntas sobre el proyecto PB abierto.
- Exponer **Tools** que la IA pueda invocar para consultar símbolos, relaciones, diagnósticos y estructura del proyecto.
- Participar en el flujo de **Agent mode** de VS Code proporcionando contexto PowerBuilder cuando la IA lo solicite.

**Ventajas:** integración nativa con el ecosistema VS Code/Copilot, sin infraestructura adicional.

**Requisito previo:** backbone semántico suficiente para responder consultas con precisión.

### 4.2 Model Context Protocol (MCP)

MCP es un estándar emergente para que herramientas externas expongan recursos y capacidades a modelos de lenguaje de forma agnóstica al proveedor.

**Aplicación para este plugin:**

- Exponer un **MCP Server** que sirva conocimiento del proyecto PowerBuilder a cualquier agente IA compatible.
- Resources: lista de objetos, jerarquías, archivos, símbolos exportados.
- Tools: buscar definiciones, encontrar usos, analizar dependencias, listar diagnósticos.
- Prompts: contexto pre-construido para tareas comunes de PowerBuilder.

**Ventajas:** agnóstico del proveedor de IA, compatible con múltiples clientes.

**Requisito previo:** API local estable y contratos versionados.

### 4.3 API JSON-RPC local

Definida ya en la arquitectura como `adapters/api-jsonrpc/`, esta API permite que procesos externos consuman el conocimiento del plugin directamente.

**Aplicación para este plugin:**

- Consultas programáticas desde scripts, CI/CD, o herramientas de migración.
- Integración con herramientas de análisis estático externas.
- Automatización de tareas de refactorización o auditoría.

**Ventajas:** máximo control, sin dependencia de VS Code ni de proveedores de IA.

**Requisito previo:** core agnóstico del editor y contratos bien separados del dominio.

---

## 5. Conocimiento que el plugin debe exponer a la IA

### 5.1 Conocimiento estructural (disponible temprano)

- lista de objetos del proyecto (clases, ventanas, DataWindows, etc.),
- jerarquías de herencia y relaciones de ancestro/descendiente,
- estructura de librerías, targets y workspace,
- archivos relevantes y clasificación de tipos de objeto,
- secciones de cada archivo (forward, prototypes, variables, implementación).

### 5.2 Conocimiento semántico (requiere backbone)

- símbolos por documento y por workspace (variables, funciones, eventos, tipos),
- scopes y binding,
- relaciones de uso (quién llama a quién, quién referencia qué),
- modelo de dependencias entre objetos,
- resolución de tipos y firmas de funciones/eventos,
- catálogo oficial del lenguaje y runtime.

### 5.3 Conocimiento diagnóstico

- errores sintácticos y estructurales,
- warnings semánticos (variables no usadas, shadowing, etc.),
- métricas de complejidad por objeto,
- patrones legacy detectados,
- convenciones del equipo y auditoría de arquitectura.

### 5.4 Conocimiento de DataWindow (avanzado)

- estructura de DataWindows y DataStores,
- expresiones y funciones específicas,
- relaciones DataWindow ↔ objetos PB,
- catálogo de funciones DataWindow.

---

## 6. Operaciones que la IA debería poder realizar

### 6.1 Solo lectura (bajo riesgo)

- consultar símbolos por nombre, tipo o ubicación,
- buscar definiciones y usos de un símbolo,
- recorrer jerarquías de herencia,
- listar diagnósticos de un archivo o del workspace,
- obtener información de hover de un símbolo,
- explorar la estructura de un archivo o del proyecto,
- consultar el catálogo oficial del lenguaje.

### 6.2 Asistencia guiada (riesgo medio, requiere confirmación)

- sugerir renombrado de símbolos con preview,
- proponer code actions y quick fixes,
- generar documentación automática para funciones/eventos,
- sugerir refactorizaciones con diff antes de aplicar.

### 6.3 Automatización (riesgo alto, requiere validación y contratos estables)

- aplicar refactorizaciones aprobadas,
- ejecutar auditorías de arquitectura y convenciones,
- generar reportes de calidad sobre el proyecto,
- ejecutar migraciones controladas de patrones legacy.

---

## 7. Principios de diseño para IA

### 7.1 La IA consume contratos, no dominio interno

La IA nunca debe acceder directamente a las estructuras internas del core. Debe consumir contratos públicos desacoplados, alineado con la constitución (Art. XIII y XV) y la arquitectura (§6.15).

### 7.2 El plugin enriquece a la IA, no al revés

El valor diferencial no es que la IA "sepa" PowerBuilder por sí sola (no lo sabe bien), sino que el plugin le proporcione **conocimiento preciso y contextual** que el LLM no tiene.

### 7.3 La calidad del contexto depende de la base semántica

Cuanto más maduro sea el backbone semántico, mayor será la calidad del contexto proporcionado a la IA. Por eso la estrategia de IA depende directamente de la madurez de las Fases 4–8.

### 7.4 Tolerancia a fallos de IA

El plugin debe funcionar perfectamente **sin IA**. Las capacidades de IA son valor añadido, no dependencia. Ninguna feature base del plugin debe requerir un modelo de lenguaje para funcionar.

### 7.5 Privacidad y control del desarrollador

El desarrollador debe tener control total sobre:

- qué información del proyecto se expone a la IA,
- si se envía código a proveedores externos,
- y si las operaciones de escritura requieren confirmación explícita.

---

## 8. Relación con el roadmap

| Fase | Contribución a la estrategia IA |
|---|---|
| Fase 4 | Base semántica inicial → la IA podrá consultar símbolos básicos |
| Fase 5 | Navegación profesional → la IA podrá buscar definiciones y usos |
| Fase 6 | Diagnósticos y productividad → la IA podrá diagnosticar problemas |
| Fase 7 | Semántica fuerte → la IA podrá entender relaciones complejas |
| Fase 8 | Escala real → la IA podrá operar sobre proyectos grandes |
| Fase 9 | Ecosistema PowerBuilder → la IA entenderá DataWindow y build |
| **Fase 10** | **Contratos públicos → la IA puede consumir conocimiento formalmente** |
| **Fase 11** | **Automatización avanzada → la IA puede asistir y operar** |

---

## 9. Decisiones arquitectónicas que deben proteger esta visión

Aunque la IA no se implementa hasta Fases 10–11, estas decisiones de las fases anteriores son críticas:

1. **Core agnóstico del editor** (Fase 4–5) — El conocimiento del dominio no debe depender de VS Code para que pueda exponerse vía MCP o JSON-RPC.
2. **Contratos separados del dominio** (Fase 4+) — Los DTOs y mensajes compartidos no deben ser un reflejo directo del modelo interno.
3. **Queries compartidas** (Fase 4+) — Las consultas del knowledge layer deben ser reutilizables por features LSP y por futuros adaptadores IA.
4. **Catálogo oficial como activo** (Fase 4+) — El catálogo del lenguaje debe estar estructurado para consumo tanto por hover/completion como por agentes IA.
5. **Rendimiento sobre proyectos grandes** (Fase 8) — La IA operará sobre proyectos reales grandes; la indexación debe escalar.

---

## 10. Métricas de éxito futuras

Cuando se implementen las capacidades de IA, las métricas de éxito serán:

- **precisión**: las respuestas de la IA sobre símbolos, relaciones y estructura son correctas porque el contexto proporcionado es preciso,
- **cobertura**: la IA puede responder sobre la mayoría de elementos del proyecto, no solo los triviales,
- **latencia**: las consultas de la IA no degradan la experiencia de edición,
- **utilidad real**: los desarrolladores PowerBuilder ven valor práctico al usar IA en su workflow diario,
- y **independencia del proveedor**: el conocimiento del plugin funciona con cualquier IA compatible, no solo con un proveedor.

---

## 11. Activo estratégico diferencial

El activo más valioso que este plugin puede aportar al ecosistema de IA es:

> **Un modelo semántico profundo, incremental y consultable de PowerBuilder que ningún LLM puede construir por sí solo.**

Este modelo incluye: el catálogo oficial del lenguaje y runtime, el conocimiento del workspace, las relaciones entre objetos, las jerarquías de herencia, los scopes, las dependencias y los patrones de uso reales.

Ese activo convierte al plugin en una pieza indispensable para cualquier integración de IA con proyectos PowerBuilder — y es la razón por la que construir la base semántica bien merece la inversión.

---

## 12. Regla de prudencia

Esta estrategia debe mantenerse como **visión**, no como compromiso de implementación inmediata.

No se debe:

- modelar prematuramente el core para consumo IA,
- introducir dependencias de proveedores de IA antes de tener base estable,
- exponer APIs sin contratos versionados,
- ni abrir superficie de automatización sin validación suficiente.

La IA vendrá. Pero vendrá sobre una base limpia, rápida y profesional.
