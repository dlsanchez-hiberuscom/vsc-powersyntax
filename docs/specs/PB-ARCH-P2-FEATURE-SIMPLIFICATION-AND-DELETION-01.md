# Spec: PB-ARCH-P2-FEATURE-SIMPLIFICATION-AND-DELETION-01

## 1. Identificación
- **ID:** PB-ARCH-P2-FEATURE-SIMPLIFICATION-AND-DELETION-01
- **Título:** Simplificación de Funcionalidades y Borrado de Parsers No Defendibles
- **Estado:** Done
- **Prioridad:** P2
- **Área:** Arquitectura, Performance

## 2. Objetivo
Formalizar una política arquitectónica que autoriza la purga y simplificación activa de componentes heredados (o intentos experimentales fallidos) que no logran cumplir con los estrictos *performance budgets* o que intentaban materializar un AST completo de lenguaje cuando solo se requería una aproximación basada en catálogo/identificadores.

## 3. Decisiones y Detalles de Implementación

### 3.1 Unificación y Poda de Parsers
- **Decisión:** Los módulos que intentaban derivar semántica interactiva resolviendo árboles de expresión con precedencia (`Evaluate` complex expressions, Dynamic SQL profundos) han sido amputados del *hot path*. 
- **Razón:** El intento de soportar a fondo la sintaxis permisiva legacy de PB 2025 generó *spikes* inaceptables de CPU/Memory en el editor de Visual Studio Code para proyectos gigantescos como PFC.

### 3.2 Read-Only Surfaces Alineados al Budget
- Superficies como *Diagnostics Explainability* o el *Object Explorer* deben siempre consumir de los submodelos ya materializados, y tienen prohibido instanciar *spin-off parsers* independientes.
- Queda oficializada la "Delegación Inmediata al Catálogo" para todo identificador del framework base.

## 4. Criterios de Aceptación Cumplidos
- La arquitectura abandona oficialmente cualquier intento de soportar un Abstract Syntax Tree de expresión de resolución plena en tiempo real.
- Las bases de validación se mantienen orientadas a LSP-first con perfiles de ejecución chatos (`O(1)` tras cache-warmup).
