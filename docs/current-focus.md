# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`CATALOG-LOCALIZATION-DOMAINS-01 — Localization coverage by domain`

Cadena obligatoria vigente:

```txt
docs/backlog.md -> CATALOG-LOCALIZATION-DOMAINS-01
```

Estado de continuidad tras cerrar el slice framework-specific:

```txt
`SYMBOL-FRAMEWORKS-01` quedó cerrado añadiendo packs advisory PFC/STD sobre el rail existente de framework knowledge packs, con source explícito, confidence/fallback proyectados por surface y validación gated con fixtures locales; el backlog operativo vuelve a `CATALOG-LOCALIZATION-DOMAINS-01` como pendiente parcial vigente.
```

Auditorías transversales activas:

```txt
ninguna
```

---

## 2. Por qué este foco está activo

- `SYMBOL-FRAMEWORKS-01` ya quedó cubierto sin abrir otro motor semántico: PFC/STD entran por knowledge packs advisory, el símbolo real del workspace sigue siendo la autoridad y el manifest usa fallback curado sólo cuando el owner type no existe en el system catalog.
- `CATALOG-LOCALIZATION-DOMAINS-01` permanece `Partial` con pendiente exacto visible: `datawindow-properties` sigue en `0/7` y el resto de dominios `generated` todavía necesita decisión de alcance con baseline antes/después.
- `CATALOG-LOCALIZATION-ES-01` sigue siendo el paraguas de cobertura `es`; volver a `CATALOG-LOCALIZATION-DOMAINS-01` evita inventar una cadena nueva mientras el backlog activo todavía conserva este frente abierto.

---

## 3. Trabajo permitido ahora

- Abrir el siguiente corte documental visible para `datawindow-properties` y decidir con evidencia qué dominios `generated` pendientes merecen slice explícito.
- Mantener el baseline `es` en `0 incomplete / 0 invalid / 0 recovered / 0 orphan` y usar `targetId`/`targetKey` con reportes antes/después.
- Tratar `SYMBOL-FRAMEWORKS-01` como cerrado: sólo se reabre por regresión demostrada, no para ampliar heurísticas sin nuevo slice promovido.

---

## 4. Trabajo fuera de foco

- Reabrir `SYMBOL-FRAMEWORKS-01`, `SYMBOL-DOCS-EXAMPLES-01` o cualquiera de los slices de cobertura ya cerrados salvo regresión demostrada o cambio explícito de alcance.
- Promocionar heurísticas PFC/STD a autoridad semántica del runtime base o del catálogo oficial.
- Traducir keywords, reserved words, `signatureLabel`, `parameterName`, datatypes reales o cualquier anchor técnico del catálogo.
- Traducir anchors técnicos o modificar identidad semántica del catálogo bajo pretexto de enrichment.
- Reabrir resolvers semánticos, `KnowledgeBase`, `DataWindowFastContext`, parsers o composition roots sin evidencia de bloqueo real para el slice de localización por dominios.

---

## 5. Siguiente paso recomendado

- abrir el siguiente corte de cobertura visible de `CATALOG-LOCALIZATION-DOMAINS-01` con baseline y reportes reales, empezando por `datawindow-properties` o dejando fuera con evidencia el resto `generated` pendiente.
- conservar `SYMBOL-FRAMEWORKS-01` como slice cerrado y usar la revisión global del Bloque 2 sólo después de decidir qué pendiente documental/localización sigue realmente viva.

---

## 6. Regla final

No se marca ningún bloque como cerrado sin código, pruebas, docs y validación final reproducible.
