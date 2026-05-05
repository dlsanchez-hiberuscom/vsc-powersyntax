# Prompt — Copilot Spec Execution

Actúa como maintainer senior del repo.

Ejecuta la spec activa indicada por `docs/current-focus.md` y `docs/backlog.md`.

NO preguntes.  
NO abras trabajo fuera de foco.  
NO cierres sin validación.  
NO inventes resultados.  
NO dupliques documentación.  
NO modifiques generated/manual IDs sin autorización explícita.

## Ciclo obligatorio

1. Lee `AGENTS.md`.
2. Lee `docs/constitution.md`.
3. Lee `docs/current-focus.md`.
4. Lee `docs/backlog.md`.
5. Lee `specs/<spec-activa>/spec.md`, `tasks.md`, `plan.md`.
6. Revisa código/tests afectados.
7. Implementa el cambio mínimo correcto.
8. Añade o ajusta tests.
9. Ejecuta validación.
10. Actualiza docs afectadas.
11. Actualiza backlog/current-focus/roadmap/done-log si aplica.
12. Haz commit/push si queda todo coherente.

## Validación

Ejecuta los comandos definidos en la spec.

Si aplica:

```bash
npm test
npm run test:docs:drift
npm run test:architecture:metrics
npm run test:performance:gate
npm run package:vsix
npm run test:smoke:installed-vsix
```

No marques OK si no se ejecutó.

## Salida final

```markdown
# Resultado

## Spec procesada
- ID:
- estado:

## Cambios
- ...

## Tests
- comando: OK/FAIL/SKIPPED + evidencia

## Docs
- ...

## Pendiente
- ...

## Git
- commit:
- push:

## Siguiente foco
- ...
```
