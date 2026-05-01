# Quickstart — Spec 134 Atomic KB Publish (B165)

## 1. Proposito

Comprobar que el servidor publica KnowledgeBase e indices como una unidad coherente y que un publish fallido no deja estado mezclado.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Abrir un workspace con varios archivos PowerBuilder.
2. Disparar indexacion de fondo y, al mismo tiempo, consultas de hover o definition sobre el archivo activo.
3. Verificar que las respuestas leen un estado consistente antes o despues del publish, pero no una mezcla intermedia.
4. Forzar un caso de validacion interna fallida en staging y comprobar que el servidor conserva el estado previo.

## 4. Resultado esperado

- El estado visible cambia con un swap unico.
- Un fallo de publicacion no rompe las features interactivas.
- La latencia del archivo activo sigue protegida.

## 5. Checklist

- [ ] Existe staged semantic state.
- [ ] atomicPublishSwap esta cubierto por tests.
- [ ] rollbackOnInvalidPublish deja el estado previo operativo.
- [ ] No se observan resultados a medias en hover, completion o definition.