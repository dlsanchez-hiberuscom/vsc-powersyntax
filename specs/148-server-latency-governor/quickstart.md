# Quickstart — Spec 148 Server Latency Governor (B159)

## 1. Proposito

Comprobar que el runtime protege la latencia interactiva cuando coinciden consultas del usuario con indexacion o cambios masivos de fondo.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Iniciar trabajo de fondo sostenido sobre el workspace.
2. Lanzar varias consultas interactivas sobre el archivo activo.
3. Verificar que el governor detecta presion y reduce o aplaza trabajo de fondo.
4. Confirmar que las respuestas interactivas mantienen latencia estable y coherente.

## 4. Resultado esperado

- El runtime entra en modo de proteccion bajo presion.
- El trabajo de fondo se regula sin romper el pipeline.
- La interactividad del archivo activo se conserva mejor que sin governor.

## 5. Checklist

- [x] Existe latency governor.
- [x] El scheduler adapta trabajo de fondo bajo presion.
- [x] Los tests cubren al menos un escenario de proteccion efectiva.
- [x] La salida del governor es observable.