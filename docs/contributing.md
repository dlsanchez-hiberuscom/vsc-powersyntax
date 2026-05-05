# Contributing — PowerBuilder VS Code Plugin

## 1. Propósito

Definir cómo contribuir al repositorio sin romper arquitectura, rendimiento, documentación ni flujo SDD.

---

## 2. Antes de empezar

Leer:

```txt
AGENTS.md
docs/constitution.md
docs/current-focus.md
docs/backlog.md
docs/architecture.md
```

Si el cambio toca un área específica, leer también su documento propietario.

---

## 3. Reglas generales

- Respetar foco activo.
- Trabajar contra spec o backlog explícito.
- Mantener el cliente VS Code ligero.
- No bloquear el editor.
- No introducir scans completos en hot path.
- No duplicar semántica.
- No duplicar documentación.
- Actualizar tests y docs.

---

## 4. Flujo recomendado

```txt
1. Revisar foco actual.
2. Confirmar spec/backlog.
3. Crear rama si aplica.
4. Implementar cambio mínimo.
5. Añadir/ajustar tests.
6. Ejecutar validación.
7. Actualizar documentación.
8. Revisar diff.
9. Commit.
10. Push / PR.
```

---

## 5. Validación

Ejecutar según alcance:

```bash
npm test
npm run test:docs:drift
npm run test:architecture:metrics
npm run test:performance:gate
npm run package:vsix
npm run verify:vsix-contents
npm run test:smoke:installed-vsix
```

No marcar validación como OK si no se ejecutó.

---

## 6. Documentación

Actualizar cuando aplique:

```txt
docs/backlog.md
docs/current-focus.md
docs/roadmap.md
docs/done-log.md
docs/architecture.md
docs/architecture-status.md
documento propietario del área
specs/<spec>/*
```

Usar enlaces. No copiar bloques largos.

---

## 7. Pull Request / Commit

El mensaje debe indicar:

- spec o backlog relacionado;
- cambio principal;
- validación ejecutada.

Ejemplo:

```txt
VSIX-01: fix command ownership and installed VSIX smoke
```

---

## 8. No permitido

- Rewrites masivos sin spec.
- Cambios generated/manual sin autorización.
- Parsers DataWindow paralelos.
- Automatización write-enabled sin receipts.
- ORCA/PBAutoBuild en hot path.
- Mover a Done sin evidencia.
