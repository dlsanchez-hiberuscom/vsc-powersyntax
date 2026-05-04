# Spec 385 — B380 Explain system symbol and catalog lookup tool for AI

## Estado

- done

## Relacion backlog

- Backlog item: `B380 — Explain system symbol and catalog lookup tool for AI`

## Objetivo

Exponer un tool/API/comando read-only que explique un simbolo del catalogo PowerBuilder con signatures, ownerTypes, provenance y localizacion opcional sin cargar datasets completos en el prompt.

## Alcance

- añadir `explain-system-symbol` al contrato read-only;
- reutilizar `SystemCatalog` y `documentationService` existentes;
- publicar un report compacto con candidates, findings y acciones recomendadas.

## Fuera de alcance

- exportar catalogos completos al cliente o al prompt;
- duplicar serving del catalogo fuera del runtime del servidor;
- abrir writes o fixes automaticos.