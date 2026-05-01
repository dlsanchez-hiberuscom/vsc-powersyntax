# Spec 175 - Export y restore de ServingCache (B071B)

## 1. Resumen

Hacer que ServingCache pueda exportar y restaurar su contenido de forma segura para habilitar una primera capa de caché persistente de queries.

## 2. Problema

ServingCache solo existe en memoria. Aunque cacheStore ya soporta persistencia fina por proyecto, no existe todavía una superficie serializable para reutilizar resultados de serving entre sesiones.

## 3. Objetivo

Exponer una API mínima de export y restore para ServingCache que preserve el orden LRU y desacople el payload exportado del estado interno.

## 4. Alcance

- Exportar entradas actuales de ServingCache.
- Restaurar entradas previamente exportadas.
- Preservar el orden LRU restaurado.
- Copiar defensivamente el payload exportado o restaurado.

## 5. Fuera de alcance

- Persistir ServingCache en disco.
- Seleccionar qué features se persisten.
- Wiring con server o cacheStore.

## 6. Requisitos

- R1. La API debe ser genérica y no acoplar ServingCache a tipos LSP concretos.
- R2. Restore no debe romper la política LRU existente.
- R3. Los tests deben cubrir orden y copia defensiva.
- R4. La documentación debe reflejar el avance real de B071B.

## 7. Criterios de aceptacion

- AC1. ServingCache expone export y restore verificables.
- AC2. El restore mantiene orden LRU útil para futuras evicciones.
- AC3. El payload queda desacoplado del estado interno de la caché.
- AC4. Compile y tests del slice quedan en verde.

## 8. Riesgos y notas

- Una exportación que no preserve orden LRU degradaría el comportamiento del hot path restaurado.
- El slice debe quedarse en la estructura de caché y no abrir todavía persistencia de disco.
- Documentación a revisar: docs/backlog.md, docs/current-focus.md, docs/done-log.md.