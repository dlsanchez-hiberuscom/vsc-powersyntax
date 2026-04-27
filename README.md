# Hiberus PowerSyntax

Plugin profesional de **Visual Studio Code** para **PowerBuilder** y **PowerScript**, diseñado para ser **rápido**, **mantenible** y **escalable** sobre proyectos grandes y código legacy.

> Este repositorio desarrolla el **plugin**, no una aplicación PowerBuilder de negocio. Los archivos PowerBuilder presentes en fixtures o corpus se usan como **casos de validación y prueba**.

---

## Objetivo

Ofrecer una base moderna para trabajar con PowerBuilder en VS Code mediante:

- soporte declarativo del lenguaje;
- arquitectura **cliente VS Code + servidor LSP**;
- evolución incremental hacia análisis semántico más rico;
- validación sobre corpus reales.

---

## Estado actual

### Implementado hoy

- contribución declarativa del lenguaje;
- `language-configuration.json`;
- gramática TextMate principal;
- gramática para bloques PowerBuilder en Markdown;
- estructura inicial **cliente + servidor LSP**;
- `Document Symbols` básicos;
- `Hover` básico;
- diagnósticos estructurales iniciales;
- análisis por documento con caché en memoria.

### Base técnica actual

- **Cliente:** `src/client/extension.ts`
- **Servidor:** `src/server/server.ts`
- **Parseo inicial:** `src/server/parsing/*`
- **Análisis documental:** `src/server/analysis/*`
- **Features LSP actuales:** `src/server/features/*`
- **Tipos compartidos:** `src/shared/types.ts`

### Aún no cerrado

Todavía no deben asumirse como implementadas o completas estas áreas:

- índice global incremental;
- binder, scopes y resolver semántico robusto;
- AST formal completo;
- `definition`, `references`, `rename`;
- semantic tokens reales;
- completion y hover avanzados;
- política de caché con límite o evicción;
- flujo estándar de tests y CI completamente normalizado.

---

## Principios del proyecto

1. **Prioridad a la base** antes que a features avanzadas.
2. **Cliente ligero, servidor rico**.
3. **Corpus real antes que teoría**.
4. **Evolución incremental** y verificable.
5. **Documentación alineada** con el estado real del repositorio.

---

## Arquitectura

### Cliente VS Code

Responsable de:

- activación de la extensión;
- arranque del cliente LSP;
- configuración y coordinación ligera con el editor.

### Servidor LSP

Responsable de:

- parseo;
- análisis documental;
- diagnósticos;
- `hover`;
- `document symbols`;
- evolución futura hacia semántica, índice y navegación avanzada.

### Regla clave

La lógica costosa debe vivir en el servidor, no en el cliente.

---

## Estructura real del repositorio

```text
/src
  /client
    extension.ts
  /server
    server.ts
    /analysis
    /features
    /model
    /parsing
    /utils
  /shared
    types.ts

/syntaxes
/test
/docs
/specs
/tools
```

---

## Instalación y arranque

### Instalar dependencias

```bash
npm install
```

### Compilar

```bash
npm run compile
```

### Ejecutar en desarrollo

- abrir el repositorio en VS Code;
- pulsar `F5`.

---

## Validación mínima

Si hay cambios en TypeScript o runtime:

```bash
npm install
npm run compile
```

Y además:

- lanzar la extensión con `F5`;
- validar al menos un archivo PowerBuilder real o fixture.

Si hay cambios en gramáticas:

- revisar highlighting;
- validar patrones conflictivos conocidos;
- evitar regresiones visuales.

---

## Roadmap corto

1. consolidar activación, manifest y flujo básico;
2. normalizar tests y validación;
3. endurecer caché e invalidación;
4. reforzar parseo y análisis documental;
5. introducir modelo de símbolos y scopes;
6. construir índice global incremental;
7. añadir navegación semántica fuerte;
8. ampliar diagnósticos y productividad;
9. optimizar rendimiento sobre corpus grandes y legacy.

---

## Política de documentación

Toda decisión técnica relevante debe reflejarse en la documentación canónica del repositorio.

Si cambia cualquiera de estos elementos:

- arquitectura;
- estructura del repo;
- estrategia semántica;
- políticas de caché;
- roadmap;
- comandos de build o validación;

deben actualizarse, como mínimo:

- `README.md`;
- `docs/**` afectados;
- `specs/**` afectados;
- y cualquier otra documentación canónica impactada.

La documentación debe distinguir siempre entre:

- **estado actual implementado**;
- **dirección objetivo**;
- **trabajo planificado**.

---

## Uso de IA

La IA debe actuar como asistente del **plugin**, no como asistente de una aplicación PowerBuilder de negocio.

Siempre debe:

- pensar en términos de **VS Code extension + LSP**;
- respetar la arquitectura del plugin;
- no inventar features no implementadas;
- actualizar la documentación afectada cuando proponga o implemente cambios.
