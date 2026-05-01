# Quickstart — Spec 149 Unified Library Graph (B141)

## 1. Proposito

Validar que el runtime dispone de una fuente de verdad unica para proyectos, librerias y dependencias y que varios consumidores la reutilizan.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Abrir un workspace o solution con varios proyectos o librerias.
2. Consultar el project model unificado desde el runtime.
3. Verificar que libraryOrder y otro consumidor leen la misma fuente.
4. Confirmar que un archivo se asocia al proyecto correcto y al orden esperado de librerias.

## 4. Resultado esperado

- Existe una unica fuente de verdad topologica.
- El runtime deja de duplicar logica de pertenencia y orden.
- La base queda preparada para persistencia por proyecto.

## 5. Checklist

- [ ] workspaceState expone el project model unificado.
- [ ] Al menos dos consumidores lo reutilizan.
- [ ] Los tests cubren orden y pertenencia.
- [ ] La topologia queda alineada con la arquitectura del runtime.