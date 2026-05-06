# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`CATALOG-MANUAL-BASE-LANGUAGE-POLICY-01 — English base language policy for manual/**`

Cadena obligatoria vigente:

```txt
docs/backlog.md -> CATALOG-MANUAL-BASE-LANGUAGE-POLICY-01
                -> CATALOG-MANUAL-CATEGORIES-KEYS-01
                -> CATALOG-LOCALIZATION-MIRROR-STRUCTURE-01
                -> CATALOG-MANUAL-EN-MIGRATION (per-domain)
```

Estado de continuidad tras la auditoría de localización:

```txt
CATALOG-MANUAL-LOCALIZATION-AUDIT detectó que todo `manual/**` tiene texto visible en español. Cuando `locale = en`, hover, completion y signatureHelp muestran texto español al usuario. Esto es un bug crítico de UX que requiere migración sistemática a inglés base + creación de overlays ES.
```

Auditorías transversales activas:

```txt
CATALOG-MANUAL-LOCALIZATION-AUDIT — Complete. Backlog items generados.
```

---

## 2. Por qué este foco está activo

- La auditoría de localización reveló que **~1200+ entries en `manual/**`** tienen `summary`, `documentation` y `category` en español, causando que `locale = en` muestre texto español a usuarios angloparlantes.
- Las categorías españolas se usan como keys lógicas (`'Controles de lista'`, `'Objetos no visuales'`, etc.), creando un riesgo estructural si se migran textos sin normalizar keys primero.
- `CATALOG-LOCALIZATION-DOMAINS-01` sigue `Partial` pero su avance real depende de resolver primero la base EN de `manual/**`.
- `CATALOG-LOCALIZATION-ES-01` conserva el rail `es` con 31 overlays revisados, 0 issues, pero solo cubre `generated/` entries.

---

## 3. Trabajo permitido ahora

- Formalizar la política EN-base en `docs/localization.md` (`CATALOG-MANUAL-BASE-LANGUAGE-POLICY-01`).
- Normalizar categorías españolas a keys estables ingleses (`CATALOG-MANUAL-CATEGORIES-KEYS-01`).
- Crear estructura espejo `localization/es/{core,datawindow,...}/` (`CATALOG-LOCALIZATION-MIRROR-STRUCTURE-01`).
- Ejecutar migración EN por dominio empezando por visual (más pequeño) o core (más impactante).
- Mantener el baseline `es` en `0 incomplete / 0 invalid / 0 recovered / 0 orphan`.

---

## 4. Trabajo fuera de foco

- Abrir nuevos dominios de cobertura `es` sin resolver primero la base EN de `manual/**`.
- Reabrir resolvers semánticos, parsers o composition roots sin evidencia de bloqueo.
- Traducir keywords, reserved words, `signatureLabel`, `parameterName`, datatypes reales o cualquier anchor técnico.
- Añadir texto español nuevo en `manual/**` bajo cualquier pretexto.

---

## 5. Siguiente paso recomendado

- Ejecutar `CATALOG-MANUAL-BASE-LANGUAGE-POLICY-01` (doc-only, sin cambios de código).
- Seguir con `CATALOG-MANUAL-CATEGORIES-KEYS-01` para normalizar las 29+ categorías españolas.
- En paralelo, crear la estructura espejo (`CATALOG-LOCALIZATION-MIRROR-STRUCTURE-01`).
- Primera migración de dominio: `manual/visual/` (67 entries, dominio acotado, buen candidato de práctica).

---

## 6. Regla final

No se marca ningún bloque como cerrado sin código, pruebas, docs y validación final reproducible.

