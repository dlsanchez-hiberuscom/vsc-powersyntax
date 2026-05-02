# Spec 288 - User-facing diagnostics explainability panel (B245)

**Estado:** cerrada y validada.

## 1. Resumen

Exponer un panel read-only de explainability para diagnosticos del editor activo, mostrando explicacion, severidad, evidencia minima y acceso rapido a la localizacion sin reconstruir semantica fuera del pipeline compartido.

## 2. Estado real actual

`B245` queda `Closed`: `src/client/diagnosticsExplainabilityPanelModel.ts` construye el modelo puro del panel y `src/client/diagnosticsExplainabilityPanel.ts` publica el TreeView/controller sobre diagnosticos reales del editor activo; `src/client/extension.ts` registra comandos y wiring de foco/refresco/apertura.

## 3. Objetivo

Dar explicabilidad visible al usuario final sobre diagnosticos ya emitidos por el motor, sin abrir un segundo sistema de diagnosticos.

## 4. Alcance

- construir un modelo puro y testeable para el panel;
- renderizar el panel como TreeView read-only ligado al editor activo;
- explicar `diagnostic.code`, severidad y localizacion de forma estable;
- mantener refresco/foco/apertura desde comandos del cliente.

## 5. Fuera de alcance

- nuevos diagnosticos semanticos;
- explicaciones generadas por IA dentro del core;
- mutaciones write-enabled sobre codigo desde el panel.

## 6. Criterios de aceptacion

- AC1. Existe un panel read-only para diagnosticos explicables del editor activo.
- AC2. El modelo del panel es puro, determinista y cubierto por test unitario.
- AC3. El usuario puede refrescar, enfocar y abrir la ubicacion de un diagnostico desde comandos registrados.
- AC4. La feature reutiliza diagnosticos reales y `diagnostic.code` estable, sin duplicar motores de analisis.

## 7. Documentacion afectada

- `README.md`
- `docs/backlog.md`
- `docs/current-focus.md`
- `docs/developer-workflows.md`
- `docs/done-log.md`
- `docs/roadmap.md`

## 8. Validacion requerida

- `npm run build:test`
- `npm run test:unit -- --grep "diagnosticsExplainabilityPanelModel"`
- `npm run test:smoke -- --grep "la extension se activa en menos de 500ms"`

## 9. Cierre registrado

- `src/client/diagnosticsExplainabilityPanelModel.ts` fija tipos, explicaciones y busqueda por nodo.
- `src/client/diagnosticsExplainabilityPanel.ts` publica provider/controller y comandos del panel.
- `test/server/unit/diagnosticsExplainabilityPanelModel.test.ts` valida el modelo y la explicabilidad estable.
