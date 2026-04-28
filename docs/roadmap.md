# Roadmap — Plugin PowerBuilder 2025 para VS Code

## 1. Objetivo del roadmap

Este roadmap organiza la evolución del plugin en fases orientadas a entregar valor real sin comprometer la base técnica.

La prioridad estratégica del proyecto es:

1. fortalecer muchísimo la base,
2. garantizar velocidad de carga y estabilidad,
3. construir un núcleo semántico profesional y reutilizable,
4. escalar correctamente en proyectos grandes y legacy,
5. aportar alto valor al desarrollador humano,
6. y solo después exponer capacidades avanzadas para automatización e IA.

El objetivo final no es solo acumular features, sino construir un plugin:

- rápido,
- profesional,
- muy mantenible,
- útil sobre proyectos PowerBuilder grandes,
- y preparado para evolucionar durante años sin refactorizaciones estructurales grandes.

El roadmap asume desde el inicio una arquitectura coherente con las prácticas recomendadas para extensiones complejas de VS Code: **cliente ligero**, **activación perezosa**, **trabajo pesado fuera del Extension Host** y **separación clara entre núcleo, adaptadores y contratos**. VS Code recomienda activar solo cuando sea necesario, y la guía de Language Server explica que el análisis de lenguaje intensivo debe ejecutarse en un proceso separado para proteger CPU, memoria y responsividad del editor. 

---

## 2. Principios de priorización

Se prioriza siempre, en este orden:

1. rendimiento y carga, 
2. robustez arquitectónica,  
3. separación clara de responsabilidades,  
4. calidad del núcleo semántico compartido,  
5. experiencia del archivo abierto,  
6. escalabilidad en workspaces grandes,  
7. validación real sobre corpus grandes y legacy,  
8. priorizar integraciones oficiales y mantenibles del ecosistema PowerBuilder antes que automatizaciones más complejas o legacy,  citeturn8search45turn8search37turn8search39
9. documentación canónica alineada,  
10. capacidades avanzadas adicionales.  

---

## 3. Reglas generales del roadmap

- No se avanza agresivamente a una fase posterior si la anterior no está razonablemente consolidada.  
- No se priorizan features vistosas sobre base frágil.  
- Ninguna feature importante debe introducir duplicación de lógica semántica si puede apoyarse en servicios comunes.  
- Toda fase debe dejar trazabilidad clara en arquitectura, backlog, roadmap y documentación afectada.  
- Las capacidades para automatización e IA deben construirse sobre contratos limpios y una base estable, no modelar prematuramente el core.  
- La cobertura del lenguaje debe crecer por valor y por uso real, pero con objetivo de alcanzar una **cobertura oficial alta** de PowerBuilder 2025 en lenguaje, objetos del sistema, DataWindow y toolchain.  

---

## 4. Estrategia de cobertura de símbolos y catálogo oficial

El plugin debe aspirar a una cobertura oficial alta de la superficie pública de PowerBuilder 2025, pero sin intentar alcanzar semántica perfecta de todo desde las primeras fases.

### 4.1 Cobertura objetivo a largo plazo

A largo plazo, el plugin debería modelar de forma estructurada y utilizable:

- sintaxis y semántica base de PowerScript, incluidas declaraciones, operadores, statements y llamadas a funciones/eventos; el PowerScript Reference cubre lenguaje básico, datatypes, declaraciones, operators, statements y calling syntax. 
- funciones del sistema, funciones de objeto, eventos del sistema y eventos/funciones definidos por usuario como parte del catálogo del lenguaje.  
- objetos y controles del sistema, incluyendo propiedades, eventos y funciones de objetos relevantes como Application, Transaction, DataStore, DataWindow y otros controles estándar.  
- expresiones, funciones y superficie específica de DataWindow/DataStore, apoyándose en DataWindow Programmers Guide y DataWindow Reference.  
- conceptos de workspace, solution, target, project, libraries, dynamic libraries y workflows de build/deploy del ecosistema PowerBuilder.  
- toolchain oficial de automatización, especialmente PBAutoBuild y OrcaScript/ORCA. 

### 4.2 Criterio de ejecución realista

No se intentará modelar todo con el mismo nivel de profundidad desde el inicio. La progresión correcta será:

1. **cobertura completa o casi completa del lenguaje base y catálogo oficial más útil**, 
2. **cobertura fuerte de objetos del sistema y DataWindow con impacto directo en edición/navegación/diagnósticos**,  
3. **cobertura de herencia, owner-awareness y relaciones de framework en proyectos grandes**,  
4. **cobertura progresiva de casos raros, legacy, obsoletos o de bajo retorno**. 

### 4.3 Activo estratégico del plugin

Se considera una línea estratégica explícita del producto construir y mantener un **catálogo oficial del lenguaje y runtime** como activo propio del plugin. Ese catálogo debe alimentar hover, completado, signature help, diagnósticos, navegación y futuras capacidades externas sin obligar a duplicar conocimiento entre features.  

---

## 5. Fases del roadmap

## Fase 0 — Bootstrap profesional y gobierno del repositorio

### Objetivo
Dejar una base limpia, profesional y gobernable para crecer sin deuda estructural innecesaria.

### Entregables esperados
- manifiesto bien definido,
- estructura inicial cliente / servidor / shared,
- wiring LSP mínimo,
- documentación base del repositorio,
- constitución del proyecto,
- flujo SDD,
- build base,
- test base mínimo,
- reglas de actualización documental.

### Criterio de salida
- el plugin arranca correctamente,
- la base documental existe y es coherente,
- el ciclo básico de desarrollo/validación está operativo,
- y la arquitectura inicial no bloquea la separación futura del core.  

---

## Fase 1 — Base operativa rápida y segura

### Objetivo
Asegurar que el plugin es ligero, estable al arrancar y correctamente desacoplado del Extension Host.

### Entregables esperados
- activación perezosa real,
- cliente VS Code mínimo,
- runtime de análisis separado,
- ciclo de vida robusto del LSP,
- comandos ligeros de mantenimiento,
- logs y estado mínimos,
- validación de arranque y carga.

### Capacidades principales
- base de activación perezosa,  
- runtime de análisis separado,  
- bootstrap cliente/servidor sólido.  

### Criterio de salida
- el plugin no hace trabajo pesado al iniciar VS Code,
- el servidor se levanta solo cuando es necesario,
- y la experiencia base no degrada el editor de forma visible.  

---

## Fase 2 — Workspace, runtime y observabilidad

### Objetivo
Construir la base operativa real para proyectos grandes: descubrimiento, scheduling, invalidación y medición.

### Entregables esperados
- descubrimiento de workspace,
- clasificación básica de archivos relevantes,
- política de roots, exclusiones y watch/scan,
- scheduler de análisis,
- prioridades de trabajo,
- cancelación,
- observabilidad básica,
- primeros presupuestos de latencia y carga,
- validación sobre workspaces pequeños y medianos.

### Capacidades principales
- descubrimiento de workspace,  
- prioridades de análisis,  
- trabajo incremental y cancelable,  
- observabilidad de rendimiento,  
- time budgets básicos.  

### Criterio de salida
- el sistema sabe descubrir y observar el workspace,
- prioriza el archivo activo,
- y las tareas pesadas no bloquean de forma visible el flujo interactivo.  

---

## Fase 3 — Parsing, caché e invalidación reutilizable

### Objetivo
Construir un pipeline de parseo incremental útil y reutilizable, con caché razonable e invalidación fina.

### Entregables esperados
- pipeline de parseo incremental,
- estructuras sintácticas reutilizables,
- caché documental básica,
- fingerprints por archivo,
- invalidación por archivo afectado,
- preparación para análisis incremental,
- validación sobre cambios repetidos y edición iterativa.

### Capacidades principales
- pipeline de parseo incremental,  
- cache e invalidación fina,  
- primera base de conocimiento por documento.  

### Criterio de salida
- cambiar un archivo no obliga a rehacer todo el workspace,
- el parseo es reutilizable,
- y la base documental del archivo abierto responde con latencia razonable.  

---

## Fase 4 — Backbone semántico inicial y catálogo oficial

### Objetivo
Introducir la base canónica del conocimiento compartido: símbolos, scopes, binding inicial, índice y consultas comunes, apoyada además en un catálogo oficial del lenguaje y runtime.

### Entregables esperados
- índice básico de símbolos,
- document symbols,
- workspace symbols básicos,
- binding inicial,
- representación canónica de símbolos,
- primeras consultas compartidas,
- inicio del catálogo oficial del lenguaje y runtime,
- base para navegación y diagnósticos sin duplicación por feature.

### Capacidades principales
- índice básico de símbolos,  
- símbolos canónicos,  
- base de scopes,  
- consultas compartidas del knowledge layer,  
- catálogo oficial del lenguaje y runtime. 

### Criterio de salida
- existe una fuente de verdad semántica inicial,
- las features dejan de depender solo de heurísticas documentales,
- y el proyecto ya no necesita multiplicar lógica por feature.  

---

## Fase 5 — Navegación profesional y valor visible temprano

### Objetivo
Entregar las primeras capacidades realmente valiosas para el desarrollador humano sobre la nueva base compartida.

### Entregables esperados
- navegación a definición,
- búsqueda de referencias,
- hover semántico,
- mejora de document/workspace symbols,
- primeras relaciones entre símbolos y dependencias,
- primeras capacidades de owner-awareness y herencia,
- validación real sobre corpus medianos y legacy.

### Capacidades principales
- navegación a definición,  
- búsqueda de referencias,  
- hover semántico,  
- modelo inicial de dependencias,  
- navegación por herencia y owner-awareness.  

### Criterio de salida
- el usuario puede navegar con utilidad real,
- las respuestas se apoyan en conocimiento compartido,
- y la experiencia del archivo activo es claramente mejor que en el bootstrap.  

---

## Fase 6 — Diagnósticos y productividad semántica base

### Objetivo
Construir la primera capa profesional de productividad semántica reutilizando el backbone ya creado.

### Entregables esperados
- diagnósticos sintácticos y estructurales,
- diagnósticos semánticos iniciales,
- semantic tokens,
- completado contextual básico,
- ayuda de firmas básica,
- cobertura creciente del catálogo oficial en hover/completion/signature help,
- validación de latencia en archivo activo,
- validación de no regresión en navegación.

### Capacidades principales
- diagnósticos sintácticos y estructurales,  
- diagnósticos semánticos,  
- tokens semánticos,  
- completado contextual,  
- ayuda de firmas,  
- explotación útil del catálogo oficial del lenguaje.  

### Criterio de salida
- el plugin ya ofrece una experiencia profesional básica de edición,
- los diagnósticos y ayudas se alimentan de servicios comunes,
- y la latencia sigue siendo controlable.  

---

## Fase 7 — Semántica fuerte y operaciones seguras

### Objetivo
Subir de nivel la confianza del plugin para soportar operaciones de mayor riesgo y valor.

### Entregables esperados
- renombrado seguro,
- code actions básicas,
- resolución más fuerte,
- mejora del modelo de dependencias,
- mayor precisión en referencias y usos,
- endurecimiento de caché e invalidación para cambios complejos.

### Capacidades principales
- renombrado seguro,  
- code actions básicas,  
- consolidación del modelo de dependencias.  

### Criterio de salida
- el plugin soporta operaciones más delicadas con una base razonablemente fiable,
- y la semántica es suficientemente robusta para cambios asistidos.  

---

## Fase 8 — Escala real, legacy y validación continua sobre corpus reales

### Objetivo
Asegurar que el plugin escala bien en proyectos grandes y aporta visión global del sistema, usando además validación sistemática sobre corpus reales.

### Entregables esperados
- explorador semántico del proyecto,
- métricas y análisis de complejidad,
- validación continua sobre corpus grandes y reales,
- optimización de memoria,
- optimización de warm indexing,
- endurecimiento de tiempo de respuesta en workspaces grandes,
- tratamiento progresivo de patrones legacy,
- suites de validación sobre PFC 2025 y otros corpus representativos.

### Capacidades principales
- explorador semántico del proyecto,  
- métricas y análisis de complejidad,  
- optimización sobre corpus grandes y legacy,  
- validación continua sobre corpus reales.  

### Criterio de salida
- el plugin mantiene valor práctico y comportamiento razonable en workspaces grandes,
- no colapsa al crecer el tamaño del proyecto,
- y las decisiones de producto se apoyan en validación real, no solo en hipótesis.  

---

## Fase 9 — Especialización PowerBuilder y ecosistema profesional

### Objetivo
Cubrir piezas específicas del ecosistema PowerBuilder que aportan valor diferencial y conectan el plugin con workflows profesionales reales.

### Entregables esperados
- soporte avanzado de DataWindow,
- catálogo y navegación de DataWindow,
- integración con PBAutoBuild,
- validación de compilación desde el plugin o servicios asociados,
- estado de build y salud del workspace,
- mejor conocimiento del ecosistema del proyecto,
- preparación de auditoría técnica y convenciones.

### Capacidades principales
- soporte avanzado de DataWindow,  
- catálogo y navegación de DataWindow,  
- integración con PBAutoBuild,  
- estado de build y salud del workspace,  
- auditoría de arquitectura y convenciones.  

### Criterio de salida
- el plugin aporta valor diferencial específico del ecosistema PowerBuilder,
- permite integrarse con un backend oficial de build/automatización,
- y empieza a actuar como herramienta profesional de ingeniería, no solo de edición.  

---

## Fase 10 — Plataforma abierta para automatización

### Objetivo
Preparar la base para consumo externo y automatización avanzada sin contaminar el core.

### Entregables esperados
- contratos públicos de API local,
- versionado de contratos,
- adapter desacoplado para consultas externas,
- consultas automatizables para herramientas externas,
- documentación de contratos,
- integración avanzada con OrcaScript/ORCA para escenarios legacy o automatización más profunda,
- garantías mínimas de estabilidad del borde.

### Capacidades principales
- contratos públicos de API local,  
- consultas automatizables para herramientas externas,  
- integración con OrcaScript/ORCA.  

### Criterio de salida
- el sistema puede ser consumido externamente mediante contratos estables,
- dispone de una vía avanzada de automatización PowerBuilder para escenarios legacy,
- y el dominio interno sigue desacoplado de la representación externa.  

---

## Fase 11 — Automatización avanzada e IA sobre base estable

### Objetivo
Aprovechar la base ya madura para automatización avanzada sin reabrir la arquitectura.

### Entregables esperados
- asistencia a refactorización más avanzada,
- capacidades avanzadas para automatización e IA,
- herramientas externas apoyadas en contratos estables,
- explotación del conocimiento semántico desde fuera del editor,
- uso del catálogo oficial del lenguaje y runtime como base para agentes y procesos automatizados.

### Capacidades principales
- asistencia a refactorización más avanzada,  
- capacidades avanzadas para automatización e IA,  
- explotación externa del catálogo oficial y del backbone semántico.  

### Criterio de salida
- la automatización externa aprovecha la plataforma,
- pero el core sigue gobernado por arquitectura limpia, contratos y mantenimiento sostenible.  

---

## 6. Features objetivo ordenadas por secuencia lógica de implementación

> Ordenadas por dependencia arquitectónica y secuencia realista, no por atractivo comercial inmediato.

1. **Base de activación perezosa**: permite que la extensión arranque rápido y solo cargue lo imprescindible cuando el usuario la necesita.  
2. **Runtime de análisis separado**: permite sacar el trabajo pesado fuera del Extension Host para proteger rendimiento y estabilidad.  
3. **Descubrimiento de workspace**: permite identificar proyectos, archivos y relaciones básicas sobre las que se apoyará todo lo demás.  
4. **Scheduler, prioridades y cancelación**: permite ordenar el trabajo costoso y proteger el flujo interactivo del editor.  
5. **Observabilidad básica de rendimiento**: permite medir arranque, latencias y coste de análisis para evitar regresiones invisibles.  
6. **Pipeline de parseo incremental**: permite transformar cambios de archivos en conocimiento reutilizable sin rehacer todo el workspace.  
7. **Caché e invalidación fina**: permite recalcular solo lo necesario tras cambios locales.  
8. **Índice básico de símbolos**: permite tener una base única de nombres, ubicaciones y relaciones para navegación y análisis.  
9. **Catálogo oficial del lenguaje y runtime**: permite que el plugin conozca la superficie oficial de PowerBuilder para mejorar hover, completado, validación y automatización. 
10. **Modelo de scopes y binding inicial**: permite enlazar definiciones locales y preparar una semántica compartida.  
11. **Queries compartidas del knowledge layer**: permite servir hover, navegación y diagnósticos sin duplicar lógica por feature.  
12. **Navegación a definición**: permite saltar al origen real de un símbolo usando el índice ya construido.  
13. **Búsqueda de referencias**: permite localizar usos de un símbolo sobre la misma plataforma de conocimiento.  
14. **Hover semántico**: permite mostrar contexto útil aprovechando símbolos y resolución ya existentes.  
15. **Navegación por herencia y owner-awareness**: permite entender mejor ancestros, descendientes, overrides y relaciones entre objetos.  
16. **Diagnósticos sintácticos y estructurales**: permite señalar problemas básicos usando el pipeline y el índice compartido.  
17. **Diagnósticos semánticos**: permite detectar incoherencias de mayor valor cuando la resolución ya es suficientemente sólida.  
18. **Tokens semánticos**: permite enriquecer el editor visualmente a partir del modelo de símbolos y roles.  
19. **Completado contextual**: permite sugerencias más útiles apoyadas en el conocimiento incremental del proyecto.  
20. **Ayuda de firmas**: permite asistir llamadas y uso de miembros cuando ya existe un catálogo suficientemente fiable.  
21. **Renombrado seguro**: permite cambios más controlados cuando definición y referencias ya funcionan con confianza.  
22. **Code actions básicas**: permite pequeñas correcciones automáticas basadas en diagnósticos existentes.  
23. **Explorador semántico del proyecto**: permite navegar el sistema por conceptos lógicos y no solo por archivos.  
24. **Métricas y análisis de complejidad**: permite localizar zonas problemáticas usando el grafo y el índice ya consolidados.  
25. **Validación continua sobre corpus reales**: permite endurecer el plugin usando proyectos PowerBuilder grandes y reales para evitar errores teóricos.  
26. **Soporte avanzado de DataWindow**: permite integrar artefactos específicos del ecosistema PowerBuilder dentro de la misma base de conocimiento.  
27. **Catálogo y navegación de DataWindow**: permite tratar DataWindow y DataStore con un nivel de soporte profesional comparable al del lenguaje base.  
28. **Integración con PBAutoBuild**: permite compilar y validar proyectos PowerBuilder desde un backend oficial orientado a automatización y CI.  
29. **Estado de build y salud del workspace**: permite detectar precondiciones, configuración y problemas de compilación antes de lanzar automatizaciones.  
30. **Auditoría de arquitectura y convenciones**: permite revisar calidad y consistencia apoyándose en la plataforma ya madura.  
31. **Contratos públicos de API local**: permite exponer capacidades de forma desacoplada a consumidores externos sin tocar el core.  
32. **Consultas automatizables para herramientas externas**: permite que otros procesos consuman conocimiento del proyecto de forma estable.  
33. **Integración con OrcaScript/ORCA**: permite automatización avanzada y compatibilidad con workflows legacy de bibliotecas, source control y build.  
34. **Asistencia a refactorización más avanzada**: permite cambios complejos cuando el backbone semántico ya es lo bastante fiable.  
35. **Capacidades avanzadas para automatización e IA**: permite que agentes externos utilicen la base del sistema sin acoplarse a la implementación interna.  

---

## 7. Relación entre fases y dependencias lógicas

### Dependencias fuertes
- Fase 1 depende de consolidar la Fase 0.  
- Fase 2 depende de que cliente/servidor y activación estén cerrados razonablemente.  
- Fase 3 depende de tener runtime y workspace operativos.  
- Fase 4 depende de parseo reutilizable y de una primera política de caché/invalidación.  
- Fase 5 depende de símbolo canónico, binding inicial e índice básico.  
- Fase 6 depende de navegación y consultas compartidas razonablemente consolidadas.  
- Fase 7 depende de resolución más fiable.  
- Fase 8 depende de base semántica y observabilidad suficientes, además de corpus reales de validación.  
- Fase 9 depende de base escalable y núcleo profesional sólido.  
- La integración con PBAutoBuild depende de tener una base estable de workspace, runtime, validación y producto profesional usable.  citeturn8search45turn8search49turn8search41
- Fase 10 depende de core estable y contratos claramente separados del dominio.  
- La integración con OrcaScript/ORCA depende de tener contratos claros, arquitectura madura y criterios de observabilidad/validación suficientes para controlar riesgos en escenarios legacy o complejos.  
- Fase 11 depende de API local estable, catálogo oficial suficientemente rico y backbone semántico maduro.  

---

## 8. Estado actual esperado del roadmap

Estado de referencia del proyecto:

- **Fase 0**: en curso / consolidación inicial.
- **Fase 1**: prioridad inmediata.
- **Fase 2**: siguiente objetivo natural.
- **Fase 3**: siguiente base crítica.
- **Fase 4**: inicio real del backbone semántico.
- **Fases 5–7**: crecimiento hacia producto profesional usable día a día.
- **Fase 8**: endurecimiento serio para escala, legacy y validación sobre corpus reales.
- **Fase 9**: especialización fuerte en ecosistema PowerBuilder, DataWindow y build profesional.
- **Fases 10–11**: apertura controlada a automatización externa e IA sobre base madura.

---

## 9. Regla de avance entre fases

No se debe avanzar de forma agresiva a la siguiente fase si la anterior no está razonablemente consolidada.

Consolidar significa:

- implementación estable,
- validación mínima real,
- impacto en rendimiento controlado,
- documentación actualizada,
- backlog ajustado al estado real,
- y ausencia de deuda bloqueante escondida.  

---

## 10. Política de revisión del roadmap

El roadmap debe revisarse y actualizarse cada vez que:

- se cierra una fase relevante,
- cambia la arquitectura,
- aparecen bloqueos técnicos graves,
- cambian prioridades de producto,
- una validación real obliga a replantear el orden,
- o la experiencia sobre workspaces grandes contradice las hipótesis iniciales.  

---

## 11. Criterios transversales que deben revisarse en todas las fases

En toda fase deben revisarse, cuando aplique:

- impacto en activación,  
- impacto en archivo activo,  
- impacto en memoria,  
- coste sobre workspaces grandes,  
- comportamiento incremental,  
- cancelación e invalidación,  
- reutilización de servicios semánticos comunes,  
- cobertura creciente del catálogo oficial de símbolos y runtime, 
- validación sobre corpus reales cuando la fase lo requiera,  
- y actualización de la documentación canónica.  

---

## 12. Regla final de producto

El objetivo del roadmap no es llegar rápido a “muchas features”, sino llegar a un plugin que combine:

- rapidez,
- estabilidad,
- valor profesional real,
- buen soporte para proyectos grandes y legacy,
- alto aprovechamiento por desarrolladores humanos,
- capacidad de automatización externa,
- cobertura oficial alta del lenguaje y runtime de PowerBuilder,
- y una base suficientemente limpia como para seguir creciendo sin rehacer el núcleo.  

---

## 13. Fuentes clave consultadas

- Activation Events | Visual Studio Code Extension API — activación perezosa y best practices.  
- Language Server Extension Guide | Visual Studio Code — separación cliente/servidor y análisis intensivo fuera del editor.  
- Extension Host | Visual Studio Code Extension API — hosts, runtimes y preferencias de ejecución.  
- Language Server Protocol — base JSON-RPC del modelo LSP. 
- Clean/Hexagonal Architecture overview — separación de core y adaptadores.  
- PowerScript Reference 2025 — lenguaje, funciones, eventos y sintaxis base.  
- Objects and Controls 2025 R2 — objetos, controles, propiedades, funciones y eventos del sistema.  
- DataWindow Programmers Guide / DataWindow Reference — superficie DataWindow/DataStore y funciones de expresiones.  
- Users Guide 2025 — workspaces, solutions, targets, projects, libraries y build. 
- PBAutoBuild / Installing PBAutoBuild / enhancements — backend oficial de build y automatización.
- OrcaScript / ORCA Guide — automatización avanzada, bibliotecas, queries y build legacy.  
- Troubleshooting PBC/ORCA/PBAutoBuild — riesgos y problemas reales de integración. 
- OpenSourcePFCLibraries — corpus real de validación a gran escala para PowerBuilder 2025.  
