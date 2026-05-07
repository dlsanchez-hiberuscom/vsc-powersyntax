# Troubleshooting — Plugin PowerBuilder 2025 para VS Code

## 1. Propósito

Este documento define cómo diagnosticar y resolver problemas del plugin profesional de PowerBuilder 2025 para VS Code.

Debe responder a una pregunta:

> Cuando algo falla, ¿qué síntomas buscamos, qué datos recogemos, qué validaciones hacemos y qué solución o workaround aplicamos?

El proceso de release vive en `docs/release.md`. Los flujos de desarrollo viven en `docs/developer-workflows.md`. La estrategia de pruebas vive en `docs/testing.md`.

---

## 2. Principios de troubleshooting

### 2.1. Diagnosticar por capas

Todo problema debe ubicarse primero en una capa:

```text
VS Code Client
Language Client
Language Server
Workspace discovery
Parser / Indexer
Symbol Graph / Semantic Facade
Cache Layer
Provider LSP
Diagnostics
DataWindow
ORCA / PBAutoBuild
Packaging / Release
```

### 2.2. Reproducir antes de corregir

Siempre que sea posible, reducir el fallo a fixture mínimo o pasos reproducibles.

### 2.3. No ocultar fallbacks

Si el plugin degrada una feature por falta de datos, timeout, cache miss o herramienta externa ausente, debe registrarlo de forma observable.

### 2.4. No publicar resultados obsoletos

En problemas de diagnostics, semantic tokens, hover o completion, confirmar siempre versión de documento, invalidación y cache.

### 2.5. Convertir fallos recurrentes en tests

Todo bug reproducible que afecte una capa crítica debe terminar protegido por test si se corrige.

---

## 3. Datos mínimos para reportar una incidencia

```text
versión del plugin
versión de VS Code
sistema operativo
workspace/proyecto usado
formato PowerBuilder detectado
archivo afectado
pasos para reproducir
resultado esperado
resultado actual
logs del cliente
logs del servidor
si aplica: support bundle o extracto sanitizado
```

No incluir código propietario o datos sensibles sin sanitizar.

---

## 4. Problemas de activación

### Síntomas

- La extensión no se activa.
- Los comandos no aparecen.
- Las vistas/status del plugin no aparecen.
- No se inicia Language Client.

### Causas probables

- Workspace no detectado como PowerBuilder.
- Activation events demasiado restrictivos.
- Error en manifest/contribuciones.
- Fallo de dependencias o empaquetado.
- Error en `extension.ts` o composition root del cliente.

### Validaciones

```text
[ ] Confirmar que hay ficheros/formato PowerBuilder reconocible.
[ ] Revisar Output/Console del Extension Host.
[ ] Verificar comandos registrados.
[ ] Verificar que el Language Client se crea.
[ ] Comprobar errores de package/manifest.
```

### Soluciones habituales

- Abrir una carpeta/workspace que contenga estructura PowerBuilder válida.
- Ejecutar comando explícito del plugin si existe.
- Revisar activation events y contribuciones.
- Reinstalar dependencias o reconstruir extensión.

---

## 5. Problemas de Language Server

### Síntomas

- El servidor no arranca.
- El servidor se cierra al abrir un fichero.
- No hay respuestas LSP.
- El output muestra errores del servidor.

### Causas probables

- Error de bootstrap en `server.ts`.
- Handler registrado incorrectamente.
- Excepción no controlada en parser/indexer/provider.
- Configuración inválida.
- Incompatibilidad de transporte o inicialización.

### Validaciones

```text
[ ] Revisar logs del servidor.
[ ] Confirmar initialize/initialized.
[ ] Abrir fichero mínimo.
[ ] Reproducir con fixture pequeño.
[ ] Separar si falla bootstrap, document sync o provider.
```

### Soluciones habituales

- Reducir caso a fixture mínimo.
- Añadir guardas de error en handler/provider.
- Validar configuración de inicio.
- Ejecutar tests de smoke e integration del servidor.

---

## 6. Problemas de workspace discovery

### Síntomas

- No se detectan targets/projects/libraries.
- El workspace tarda demasiado en abrir.
- Se indexan carpetas incorrectas.
- No aparecen símbolos globales.

### Causas probables

- Formato de workspace no soportado o incompleto.
- Exclusiones configuradas incorrectamente.
- File watcher no emite eventos esperados.
- Discovery mezcla detección con análisis pesado.
- Paths relativos/absolutos mal normalizados.

### Validaciones

```text
[ ] Revisar estructura del workspace.
[ ] Confirmar ficheros PBW/PBT/PBL/PBSLN/PBPROJ/SR* si aplica.
[ ] Revisar excludes.
[ ] Medir tiempo de discovery.
[ ] Medir cold y warm por separado; un workspace limpio no debe reindexar todo el corpus en warm start.
[ ] Confirmar si se hizo full scan o incremental.
```

### Soluciones habituales

- Añadir soporte de formato detectado.
- Corregir normalización de paths.
- Separar discovery de indexación profunda.
- Forzar refresh controlado del índice.

---

## 7. Problemas de parser/indexer

### Síntomas

- Hover/completion no reconocen símbolos.
- Definition/references fallan.
- Diagnostics inconsistentes.
- Errores al editar scripts incompletos.

### Causas probables

- Parser no tolera documento incompleto.
- Strings PowerScript o sublenguajes DataWindow tratados como PowerScript normal.
- Rangos inestables.
- Indexer no invalida lo necesario.
- Símbolos eliminados no se limpian.
- Symbol graph queda desactualizado.

### Validaciones

```text
[ ] Reproducir con script mínimo.
[ ] Confirmar versión de documento.
[ ] Revisar AST/modelo parcial.
[ ] Verificar que `Query`, `Column`, `Style`, `char(`, `(` y `)` dentro de strings no generan diagnostics.
[ ] Revisar símbolos indexados.
[ ] Confirmar invalidación tras edición.
```

### Soluciones habituales

- Añadir recuperación tolerante en parser.
- Añadir tests de rangos y edición incompleta.
- Ajustar invalidación incremental.
- Limpiar símbolos al borrar/renombrar.

---

## 8. Problemas de hover/completion/signature

### Síntomas

- Hover no aparece.
- Hover muestra información pobre o incorrecta.
- Completion es lento o irrelevante.
- Signature help no detecta argumentos.

### Causas probables

- No hay snapshot válido.
- Cache miss dispara trabajo caro.
- Semantic facade no resuelve símbolo/callable.
- Provider usa regex local en vez de resolución semántica.
- Catálogo built-in incompleto.

### Validaciones

```text
[ ] Confirmar posición y documento.
[ ] Confirmar fast path de catálogo system antes de culpar al workspace readiness.
[ ] Revisar RequestContext.
[ ] Revisar cache hit/miss.
[ ] Revisar resolución semántica.
[ ] Confirmar fallback usado.
[ ] Medir latencia según performance-budget.md.
```

### Soluciones habituales

- Corregir resolver semántico.
- Añadir/ajustar cache de ViewModel.
- Añadir negative cache si aplica.
- Confirmar que build/ORCA solo degradan dashboards/capabilities y no bloquean hover, views ni diagnostics.
- Enriquecer catálogo built-in si falta símbolo.
- Añadir fixture y test del caso.

---

## 9. Problemas de diagnostics

### Síntomas

- Diagnostics no aparecen.
- Diagnostics aparecen con retraso excesivo.
- Diagnostics quedan obsoletos tras editar.
- Severidad/rango/fuente incorrectos.

### Causas probables

- Scheduler no cancela análisis anterior.
- Cache de diagnostics no valida versión.
- Parser/indexer desactualizado.
- Mezcla de fuentes sintácticas, semánticas, DataWindow o build.
- Mapping incorrecto de errores externos.

### Validaciones

```text
[ ] Confirmar documentVersion.
[ ] Confirmar fuente del diagnóstico.
[ ] Revisar scheduler/cancelación.
[ ] Revisar cache de diagnostics.
[ ] Confirmar rango y severidad.
[ ] Reproducir con fixture mínimo.
```

### Soluciones habituales

- Invalidar diagnostics por versión/fuente.
- Cancelar análisis obsoleto.
- Separar engines de diagnostics.
- Ajustar mapping de errores.
- Añadir tests contra diagnostics obsoletos.

---

## 10. Problemas de rendimiento

### Síntomas

- VS Code se ralentiza.
- Hover/completion tardan demasiado.
- Indexación consume demasiado tiempo.
- Memoria crece sin estabilizar.
- File watcher o discovery generan demasiados eventos.

### Causas probables

- Lectura de disco en hot path.
- Reparseo/reindexación excesiva.
- Cache sin invalidación o evicción.
- Trabajo global por una request local.
- Integración externa bloqueante.

### Validaciones

```text
[ ] Identificar hot path.
[ ] Medir duración.
[ ] Revisar cache hit/miss.
[ ] Revisar invalidación.
[ ] Confirmar si hubo I/O en hot path.
[ ] Comparar con docs/performance-budget.md.
```

### Soluciones habituales

- Mover trabajo pesado fuera del hot path.
- Introducir snapshot/cache con contrato.
- Reducir invalidación global.
- Añadir fallback parcial.
- Añadir performance smoke test.

---

## 11. Problemas de DataWindow

### Síntomas

- No se resuelve DataWindow referenciada.
- No aparecen columnas/controles.
- Diagnostics DataWindow incorrectos.
- Hover/completion se ralentizan con DataWindows.

### Causas probables

- Extractor no localiza source DataWindow.
- Modelo DW no cacheado o invalidado incorrectamente.
- Binding PowerScript ↔ DataWindow incompleto.
- Análisis SQL profundo ejecutado en hot path.

### Validaciones

```text
[ ] Confirmar referencia DW desde PowerScript.
[ ] Confirmar source/hash DW.
[ ] Revisar DataWindow model cache.
[ ] Revisar binding resolver.
[ ] Medir latencia.
```

### Soluciones habituales

- Corregir extractor/model parser.
- Cachear modelo por source/hash.
- Separar safe mode de análisis avanzado.
- Añadir fixture DataWindow.

---

## 12. Problemas de ORCA/PBAutoBuild

### Síntomas

- Herramienta no encontrada.
- Build falla sin diagnostics útiles.
- ORCA bloquea o produce error de sesión.
- La salida externa no se mapea correctamente.

### Causas probables

- Herramienta no instalada o no localizada.
- Configuración incorrecta.
- Runner bloqueante.
- Parser de salida incompleto.
- Error mapper insuficiente.

### Validaciones

```text
[ ] Confirmar disponibilidad de herramienta.
[ ] Confirmar path/configuración.
[ ] Revisar exit code.
[ ] Revisar stdout/stderr sanitizado.
[ ] Confirmar mapping a diagnostics.
[ ] Probar fake/mock si es desarrollo.
```

### Soluciones habituales

- Mejorar locator/configuración.
- Añadir timeout/cancelación.
- Corregir parser de salida.
- Degradar si herramienta no está disponible.
- Añadir tests con fake/mock.

---

## 13. Problemas de release/instalación

### Síntomas

- El paquete no instala.
- La extensión instala pero no activa.
- Faltan archivos empaquetados.
- Funciona en desarrollo pero no en paquete.

### Causas probables

- Manifest/package incompleto.
- Artefacto generado desde estado sucio.
- Archivos necesarios excluidos del paquete.
- Diferencias entre Extension Development Host y paquete instalado.

### Validaciones

```text
[ ] Generar artefacto desde limpio.
[ ] Instalar paquete localmente.
[ ] Verificar archivos incluidos.
[ ] Ejecutar smoke post-install.
[ ] Revisar release checklist.
```

### Soluciones habituales

- Corregir package/manifest.
- Incluir recursos necesarios.
- Repetir release desde estado limpio.
- Añadir smoke post-package.

---

## 14. Support bundle

Cuando un problema no sea reproducible localmente, se debe recopilar un paquete de soporte sanitizado.

Contenido recomendado:

```text
versión plugin
versión VS Code
sistema operativo
settings relevantes
logs cliente
logs servidor
métodos LSP afectados
errores recientes
métricas de performance si aplica
estructura de workspace sanitizada
```

No incluir fuentes propietarias sin sanitizar.

---

## 15. Plantilla de incidencia

```markdown
## Síntoma

## Entorno

- Plugin:
- VS Code:
- OS:
- Workspace/formato PB:

## Pasos para reproducir

1.
2.
3.

## Resultado esperado

## Resultado actual

## Logs / métricas

## Workaround

## Clasificación probable

- Cliente / Servidor / Workspace / Parser / Cache / Provider / Diagnostics / DataWindow / ORCA / PBAutoBuild / Release
```

---

## 16. Relación con backlog y tests

Si un problema es reproducible y requiere cambio, debe crearse o actualizarse trabajo accionable en `docs/backlog.md` o en una spec bajo `docs/specs/`.

Si se corrige, debe añadirse prueba de regresión cuando sea posible.
