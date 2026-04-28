# Testing — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento define la estrategia de testing del proyecto, los tipos de prueba soportados, las convenciones para escribir tests y las instrucciones para ejecutarlos.

Debe mantenerse alineado con el estado real del repositorio y actualizado cuando cambien herramientas, convenciones o estructura de tests.

---

## 2. Stack de testing

| Herramienta | Versión | Propósito |
|---|---|---|
| `@vscode/test-cli` | ^0.0.12 | Runner de tests para extensiones VS Code |
| `@vscode/test-electron` | ^2.5.2 | Entorno de ejecución Electron para integration/smoke tests |
| `mocha` | ^10.7.3 | Framework de tests |
| `typescript` | ^5.9.2 | Compilación de tests |
| `tsconfig.test.json` | — | Configuración de compilación específica para tests |

---

## 3. Tipos de prueba

### 3.1 Smoke tests

**Propósito:** Verificar que la extensión arranca, se activa y no falla catastróficamente.

**Ubicación:** `test/smoke/`

**Qué validan:**
- la extensión se activa al abrir un archivo PowerBuilder,
- el cliente LSP levanta el servidor correctamente,
- no hay errores fatales al arrancar,
- y los contribution points están registrados (lenguaje, gramáticas).

**Cuándo correrlos:**
- tras cualquier cambio en el manifiesto, activación o bootstrap,
- tras cambios en wiring cliente/servidor,
- como gate mínimo antes de publicar.

### 3.2 Unit tests

**Propósito:** Verificar lógica aislada del servidor sin dependencia de VS Code ni del LSP.

**Ubicación:** `test/server/`

**Qué validan:**
- parsing de secciones y matchers,
- extracción de hechos documentales,
- lógica de diagnósticos,
- utilidades y helpers,
- modelos y tipos internos,
- y cualquier lógica pura del servidor.

**Principio:** Los unit tests no deben depender de `vscode`, `vscode-languageserver` ni de filesystem real. Si necesitan archivos, deben usar fixtures.

**Cuándo correrlos:**
- tras cualquier cambio en lógica del servidor,
- como parte del flujo normal de desarrollo.

### 3.3 Integration tests

**Propósito:** Verificar que las features LSP funcionan correctamente de extremo a extremo.

**Ubicación:** `test/` (configuración por label)

**Qué validan:**
- Document Symbols devuelven resultados correctos sobre fixtures,
- Hover devuelve información útil,
- Diagnósticos detectan bloques mal cerrados,
- caché se invalida correctamente,
- y el flujo completo cliente → servidor → respuesta funciona.

**Cuándo correrlos:**
- tras cambios en features LSP,
- tras cambios en análisis o parseo,
- como verificación antes de cerrar una spec.

### 3.4 Performance tests

**Propósito:** Medir tiempos de activación, análisis y respuesta para detectar regresiones.

**Ubicación:** `test/` (label `performance`)

**Qué validan:**
- tiempo de activación del cliente,
- tiempo hasta primer Document Symbols,
- tiempo hasta primer Hover,
- tiempo de análisis por documento,
- consumo de memoria en fixtures grandes,
- y comportamiento sobre corpus de distintos tamaños.

**Cuándo correrlos:**
- cuando se trabaje en rendimiento (B003, B007),
- antes de cerrar una fase del roadmap,
- cuando se sospeche una regresión.

---

## 4. Fixtures y corpora

### 4.1 Fixtures

**Ubicación:** `test/fixtures/`

**Propósito:** Archivos PowerBuilder controlados, pequeños y deterministas para tests unitarios e integration.

**Convenciones:**
- cada fixture debe tener un propósito claro,
- los fixtures deben cubrir casos comunes y edge cases del lenguaje,
- deben ser archivos `.sru`, `.srw`, `.srd`, etc. válidos o intencionalmente malformados para tests de diagnósticos,
- y deben estar documentados con comentarios cuando el caso no sea obvio.

### 4.2 Corpora

**Ubicación:** `test/corpora/`

**Propósito:** Proyectos PowerBuilder reales o semi-reales para validación a mayor escala.

**Convenciones:**
- no incluir corpus grandes directamente en el repo si superan tamaño razonable,
- usar `.gitignore` o submódulos para corpus externos,
- documentar qué corpus se usa y qué valida,
- los corpora no deben usarse como fixtures de unit tests (son para validación de escala y rendimiento).

---

## 5. Comandos de ejecución

### Compilar tests

```bash
npm run build:test
```

### Ejecutar todos los tests

```bash
npm test
```

### Ejecutar por tipo

```bash
npm run test:smoke
npm run test:unit
npm run test:integration
npm run test:performance
```

### Workflow recomendado

1. Compilar el proyecto: `npm run compile`
2. Compilar tests: `npm run build:test`
3. Ejecutar el tipo de test relevante al cambio
4. Si todo pasa, ejecutar `npm test` para verificación completa

---

## 6. Convenciones para escribir tests

### Estructura de un test

```typescript
import { describe, it } from 'mocha';
import { strict as assert } from 'assert';

describe('NombreDelMódulo', () => {
  describe('nombreDeLaFunción', () => {
    it('debe hacer X cuando Y', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Reglas

- cada test debe tener un nombre descriptivo en español o inglés (consistente dentro del archivo),
- usar patrón Arrange/Act/Assert,
- preferir aserciones explícitas sobre aserciones implícitas,
- un test debe probar una sola cosa,
- no depender de estado compartido entre tests,
- y limpiar cualquier estado creado durante el test.

### Naming

- archivos de test: `nombreDelModulo.test.ts`
- descripciones: empezar con verbo ("debe", "no debe", "devuelve", "lanza error cuando...")

---

## 7. Cobertura actual

### Existente

- estructura básica de test en `test/` con subdirectorios por tipo,
- configuración de `@vscode/test-cli` en `.vscode-test.js`,
- scripts de npm para todos los tipos de test,
- y `tsconfig.test.json` para compilación independiente.

### Pendiente

- cobertura mínima de unit tests para parsing, matchers y análisis,
- cobertura de integration tests para Document Symbols, Hover y Diagnósticos,
- al menos un smoke test que verifique activación,
- y al menos un performance test que mida cold start.

---

## 8. Reglas de validación por tipo de cambio

| Tipo de cambio | Tests mínimos requeridos |
|---|---|
| Cambio en parseo/matchers | Unit test sobre el caso afectado |
| Cambio en feature LSP | Integration test que verifique respuesta |
| Cambio en activación/bootstrap | Smoke test |
| Cambio en rendimiento | Performance test antes/después |
| Cambio en gramática TextMate | Validación visual + no regresión |
| Cambio en documentación | No requiere tests técnicos |

---

## 9. Relación con otros documentos

- `docs/constitution.md` (Art. X) exige validación obligatoria para toda feature.
- `docs/performance-budget.md` define los presupuestos que los performance tests deben verificar.
- `docs/spec-driven-development.md` (§5.6) requiere validación como paso del flujo SDD.
- Cada spec en `specs/` debe definir su estrategia de validación específica.

---

## 10. Regla de mantenimiento

Este documento debe actualizarse cuando:

- se añadan nuevos tipos de test,
- cambien herramientas o frameworks,
- cambie la estructura de directorios de test,
- o se establezcan nuevos umbrales de cobertura mínima.
