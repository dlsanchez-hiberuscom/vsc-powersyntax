# Plan - Spec 302 build profile matrix and environment validation (B257)

## 1. Enfoque técnico

Reutilizar la base ya cerrada de capability detection, build health, último profile recordado y discovery de build files. Primero se fija un builder puro con tests, después se expone la surface por API/tool/comando Markdown y finalmente se alinea el foco documental a `B258`.

## 2. Pasos

1. Añadir un probe unitario que fije prioridad del último profile y bloqueo por tooling ausente.
2. Implementar `pbAutoBuildProfileMatrix` como builder client-side reutilizando inventory completo y build health.
3. Exponer la surface por API pública v2.9.0, tool bridge y comando Markdown.
4. Hacer visible el acceso desde el status report y validar wiring end-to-end.
5. Alinear documentación viva y mover el foco canónico a `B258`.

## 3. Riesgos

- confundir profiles `usable` con profiles realmente ejecutables aunque falte `pbautobuild250.exe` válido;
- seguir ocultando build files ambiguos/inválidos por reutilizar solo el picker de perfiles utilizables;
- abrir un segundo rail de ejecución en vez de reutilizar inventory, tooling y health ya existentes.

## 4. Validación

- `npm run build:test`
- unit focal sobre `pbAutoBuildProfileMatrix` y contrato público
- smoke de activación con API/comando read-only nuevos

## 5. Resultado ejecutado

1. La matriz B257 proyecta perfiles y entorno de forma defendible y sin ejecutar builds.
2. La surface queda servida por API pública, tool bridge y comando Markdown.
3. El foco canónico del repo pasa a `B258`.