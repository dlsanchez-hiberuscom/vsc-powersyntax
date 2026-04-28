# [002] Quickstart — Consolidación del runtime y observabilidad base

## 1. Propósito

Guía rápida para validar que el slice 002 funciona correctamente después de implementar los cambios.

---

## 2. Prerequisitos

```bash
npm install
npm run compile
```

---

## 3. Validación rápida

### 3.1 Verificar instrumentación

1. Abrir VS Code con el repositorio.
2. Pulsar `F5` para lanzar la Extension Development Host.
3. Abrir un archivo PowerBuilder (`.sru`, `.srw`, etc.).
4. Abrir el panel Output → seleccionar "VSC PowerSyntax".
5. Verificar que aparecen líneas con tiempos de activación:
   - `[TIMING] Client activation: XXms`
   - `[TIMING] LSP client start: XXms`
6. Verificar que al hacer hover o navegar los símbolos aparecen tiempos:
   - `[TIMING] documentSymbols: XXms`
   - `[TIMING] hover: XXms`

### 3.2 Verificar restart

1. Abrir la Command Palette (`Ctrl+Shift+P`).
2. Buscar "PowerSyntax: Restart Server" (o el nombre del comando registrado).
3. Ejecutar el comando.
4. Verificar en el Output Channel que el servidor se detuvo y reinició correctamente.
5. Verificar que Document Symbols y Hover siguen funcionando tras el restart.

### 3.3 Verificar prioridad del archivo activo

1. Abrir un archivo PowerBuilder.
2. Verificar que Document Symbols y Hover responden rápidamente.
3. (Cuando exista trabajo de fondo) Verificar que el archivo activo no se ve afectado por trabajo global.

### 3.4 Verificar presupuestos de rendimiento

Comparar los tiempos observados en el Output Channel con los presupuestos de `docs/performance-budget.md`:

| Operación | Presupuesto (archivo pequeño) |
|---|---|
| Activación cliente | < 500 ms |
| Document Symbols | < 50 ms |
| Hover | < 30 ms |
| Diagnósticos | < 100 ms |

---

## 4. Ejecutar tests

```bash
# Compilar tests
npm run build:test

# Ejecutar todos los tests
npm test

# Ejecutar solo performance tests
npm run test:performance

# Ejecutar solo smoke tests
npm run test:smoke

# Ejecutar solo unit tests
npm run test:unit
```

### Resultado esperado

- todos los tests pasan,
- los performance tests verifican que las operaciones cumplen los presupuestos,
- y no hay errores fatales en la consola.

---

## 5. Checklist de validación

- [ ] El output channel muestra tiempos de activación.
- [ ] Los handlers registran tiempos de ejecución.
- [ ] El comando de restart funciona sin dejar estado inconsistente.
- [ ] Document Symbols y Hover siguen funcionando tras restart.
- [ ] Los tiempos observados están dentro de los presupuestos.
- [ ] `npm test` pasa sin errores.
- [ ] `npm run test:performance` pasa sin errores.
- [ ] No hay errores en el Developer Tools (F12) de la Extension Development Host.
