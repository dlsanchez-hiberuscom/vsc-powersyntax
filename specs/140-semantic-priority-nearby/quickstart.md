# Quickstart — Spec 140 Semantic Priority Nearby (B122)

## 1. Proposito

Validar que el trabajo cercano al archivo activo se ordena por valor semantico real antes que por orden fisico del workspace.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Abrir un archivo con ancestros o tipos relacionados conocidos.
2. Disparar trabajo de indexacion de fondo.
3. Verificar que los documentos semanticamente cercanos se procesan antes que otros no relacionados.
4. Confirmar que el resto del workspace sigue avanzando con una cuota minima de progreso.

## 4. Resultado esperado

- El contexto cercano se atiende primero.
- El scheduler sigue siendo justo a escala de workspace.
- La experiencia del archivo activo mejora sin bloquear el progreso global.

## 5. Checklist

- [ ] Existe ranking de cercania semantica.
- [ ] Los tests demuestran prioridad por herencia o proyecto.
- [ ] No hay starvation del trabajo global.
- [ ] La politica es explicable en logs o trazas.