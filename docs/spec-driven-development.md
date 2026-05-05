# Spec-Driven Development — PowerBuilder VS Code Plugin

## 1. Propósito

Definir el flujo de trabajo basado en specs para implementar, validar y cerrar cambios en el repositorio.

Este documento es propietario de:

- ciclo backlog → spec → implementación → validación → done-log;
- estados de specs;
- criterios de cierre;
- reglas para dividir trabajo;
- relación entre specs, backlog, current-focus y roadmap.

---

## 2. Principio base

Toda modificación funcional, arquitectónica u operativa relevante debe estar respaldada por una spec o por una decisión no-action documentada.

No se debe implementar por impulso ni cerrar trabajo sin validación.

Para tareas IA con budget corto, usar `docs/ai-context/powerbuilder-plugin-context.md` como pack compacto y delegar el detalle al documento propietario del área.

---

## 3. Flujo SDD

```txt
1. Backlog identifica trabajo pendiente.
2. Current Focus promueve el trabajo activo.
3. Spec define alcance ejecutable.
4. Tasks divide la ejecución.
5. Plan define estrategia técnica.
6. Implementación modifica código/docs/tests.
7. Validación comprueba criterios.
8. Done-log registra cierre real.
9. Backlog/current-focus/roadmap se alinean.
```

---

## 4. Estructura recomendada de spec

```txt
specs/<id>-<slug>/
  spec.md
  tasks.md
  plan.md
```

### `spec.md`

Debe contener:

- objetivo;
- problema;
- evidencia;
- alcance;
- fuera de alcance;
- criterios de aceptación;
- validación;
- documentación afectada;
- riesgos.

### `tasks.md`

Debe contener tareas accionables, verificables y marcables.

### `plan.md`

Debe contener estrategia técnica, orden de ejecución, riesgos y validación prevista.

---

## 5. Estados

```txt
Open              -> pendiente real
Partial           -> avance parcial, faltan criterios
Ready for closure -> código/tests básicos existen, falta cierre final
Blocked           -> bloqueado por entorno/decisión/dependencia
Done              -> cerrado con validación y docs
Superseded        -> absorbido por otra spec
```

`Done` solo es válido si existe evidencia.

---

## 6. Definition of Ready

Una spec está lista para ejecución si:

- intención clara;
- alcance y fuera de alcance claros;
- criterios verificables;
- validación definida;
- documentos afectados identificados;
- riesgos conocidos;
- dependencias claras.

---

## 7. Definition of Done

Una spec está Done solo si:

```txt
1. Implementación funcional o decisión no-action documentada.
2. Tests/validación ejecutados.
3. Documentación afectada actualizada.
4. Backlog/current-focus/roadmap alineados.
5. Done-log actualizado con evidencia.
6. No queda deuda crítica oculta.
```

---

## 8. Reglas de ejecución

- Ejecutar specs en el orden indicado por `current-focus.md` y `backlog.md`.
- No saltar dependencias.
- No ampliar scope sin actualizar spec/backlog.
- Si una spec crece demasiado, dividirla.
- Si algo no se corrige, registrar follow-up.
- No cerrar con validación pendiente.

---

## 9. Validación mínima por tipo de spec

### Documentación

```bash
npm run test:docs:drift
```

### Runtime / semántica

```bash
npm test
```

### Arquitectura

```bash
npm run test:architecture:metrics
```

### Performance

```bash
npm run test:performance:gate
```

### VSIX / release

```bash
npm run package:vsix
npm run verify:vsix-contents
npm run package:vsix:list
npm run test:smoke:installed-vsix
```

---

## 10. Done-log

Al cerrar una spec, registrar:

- ID;
- fecha;
- resumen;
- archivos relevantes;
- validación ejecutada;
- evidencia;
- documentos actualizados;
- follow-ups si existen.

No registrar en done-log trabajo que solo está planificado o parcialmente validado.
