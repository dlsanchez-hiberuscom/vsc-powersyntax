# LEAN Token Policy

> **Estado:** política canónica de contexto mínimo suficiente.  
> **Última revisión:** 2026-05-06.  
> **Ámbito:** ahorro de tokens, carga selectiva de contexto y prevención de duplicidad.

---

## 1. Propósito

Esta política define cómo dar contexto a agentes IA sin cargar documentación innecesaria ni perder seguridad.

---

## 2. Regla principal

Cargar el **mínimo contexto suficiente** para ejecutar la tarea con seguridad.

No cargar todo el repositorio salvo auditoría global explícita.

---

## 3. Orden de contexto

```text
1. Instrucción del usuario
2. docs/constitution.md
3. Documento propietario de la tarea
4. Spec si existe
5. Arquitectura/status si afecta diseño
6. Testing/performance si afecta código o hot path
7. AI context pack si hace falta dominio PowerBuilder
8. Código real afectado
9. Documentos relacionados mínimos
```

---

## 4. Contexto por tarea

### Documentación

```text
constitution.md
documento a modificar
documentos relacionados directos
```

### Spec / backlog

```text
constitution.md
spec-driven-development.md
backlog.md
current-focus.md si aplica
```

### Arquitectura

```text
constitution.md
architecture.md
architecture-status.md
código real afectado
```

### Hot path / performance

```text
architecture.md
performance-budget.md
testing.md
provider/cache/indexer afectado
```

### DataWindow / PowerBuilder domain

```text
powerbuilder-plugin-context.md
architecture.md
código/fixtures afectados
```

### Release / troubleshooting

```text
release.md
troubleshooting.md
testing.md
performance-budget.md si aplica
```

---

## 5. Qué evitar

No cargar:

- `done-log.md` completo salvo consulta histórica explícita;
- `architecture-implementation-map.md` completo salvo auditoría profunda;
- guía técnica PowerBuilder completa salvo necesidad real;
- auditorías antiguas si ya existe fuente canónica;
- prompts largos no relacionados.

---

## 6. Resúmenes permitidos

Se permite usar resúmenes compactos cuando:

- el documento es histórico;
- el documento es muy grande;
- solo se necesita ownership o estado;
- no se está modificando ese documento.

---

## 7. Criterio de seguridad

Si el agente no tiene suficiente contexto para modificar código o documentación, debe pedir el archivo o cargarlo antes de actuar. No debe inventar estructura.
