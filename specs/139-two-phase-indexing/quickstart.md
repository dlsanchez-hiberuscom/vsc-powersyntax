# Quickstart — Spec 139 Two-Phase Indexing (B152)

## 1. Proposito

Comprobar que el indexador publica una fase estructural rapida antes de completar el enriquecimiento semantico del documento o del workspace.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Abrir un workspace mediano con varios archivos PowerBuilder.
2. Observar que el archivo activo alcanza structural readiness antes que enriched readiness.
3. Ejecutar una feature capaz de degradar con seguridad durante la fase estructural.
4. Esperar a que la fase enriquecida complete y confirmar mejora de completitud semantica.

## 4. Resultado esperado

- El archivo activo recibe valor temprano.
- El enriquecimiento llega despues sin bloquear.
- El readiness por fase es visible y coherente.

## 5. Checklist

- [ ] structuralPass y enrichedPass existen y estan separados.
- [ ] readinessByPass se puede inspeccionar.
- [ ] Al menos una feature funciona en structural-only.
- [ ] El pipeline no publica estado mixto incoherente.