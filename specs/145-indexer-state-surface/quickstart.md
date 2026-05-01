# Quickstart — Spec 145 Indexer State Surface (B126)

## 1. Proposito

Validar que el motor expone un estado del indexador util para entender colas, trabajo actual e invalidaciones sin entrar a depuracion manual profunda.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Iniciar indexacion de workspace.
2. Consultar la superficie de estado del indexador o el project status que la consuma.
3. Verificar que aparecen colas, trabajo actual, ultima actividad e invalidaciones.
4. Forzar una cancelacion o replanificacion y comprobar que el estado la refleja.

## 4. Resultado esperado

- El indexador deja de ser una caja negra.
- La informacion expuesta es estable y suficientemente barata.
- La salida ayuda a depurar y explicar el comportamiento del runtime.

## 5. Checklist

- [ ] Existe fuente unica de estado del indexador.
- [ ] projectStatus o salida equivalente la consume.
- [ ] Los tests cubren lectura de estado.
- [ ] No se introduce coste sensible por observar el estado.