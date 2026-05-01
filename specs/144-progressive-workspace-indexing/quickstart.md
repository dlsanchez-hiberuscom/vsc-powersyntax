# Quickstart — Spec 144 Progressive Workspace Indexing (B125)

## 1. Proposito

Comprobar que el indexador recorre el workspace completo de forma progresiva, con estados explicitos y prioridad real del contexto activo.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Abrir un workspace con numero apreciable de archivos.
2. Verificar que cada unidad indexable entra en el pipeline con un estado conocido.
3. Moverse al archivo activo y comprobar que su contexto cercano adelanta al resto.
4. Esperar a la convergencia y confirmar que el workspace llega a ready sin bloqueo interactivo.

## 4. Resultado esperado

- El indexador converge progresivamente.
- El contexto activo adelanta al resto.
- La evolucion del workspace puede observarse y depurarse.

## 5. Checklist

- [ ] Cada archivo relevante tiene estado explicito.
- [ ] workspaceIndexer progresa por oleadas controladas.
- [ ] Los tests cubren convergencia y prioridad del activo.
- [ ] No se bloquean consultas interactivas durante la indexacion.