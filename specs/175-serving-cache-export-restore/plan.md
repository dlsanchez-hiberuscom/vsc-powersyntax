# Plan - Spec 175 Export y restore de ServingCache (B071B)

## 1. Resumen tecnico

Extender ServingCache con métodos para exportar y restaurar entradas, reutilizando la estructura Map actual para conservar el orden LRU y aplicando copias defensivas del payload.

## 2. Estado actual

- ServingCache ya gestiona claves estables, invalidación y LRU en memoria.
- No existe una forma de extraer ni reinyectar entradas desde otra capa.

## 3. Diseno propuesto

- Añadir un tipo ligero para entradas exportadas.
- Implementar exportEntries() como snapshot ordenado del contenido actual.
- Implementar restoreEntries() reinyectando entradas en orden y respetando capacidad.

## 4. Impacto en rendimiento

- Debe ser neutro en el hot path salvo cuando se invoquen export o restore.
- El restore debe apoyarse en la lógica LRU existente sin duplicarla.

## 5. Riesgos tecnicos

- Restaurar sin preservar orden real.
- Compartir referencias mutables entre snapshot y caché.
- Exceder capacidad sin evicción coherente.

## 6. Estrategia de validacion

- npm run test:unit -- --grep "exportEntries y restoreEntries"
- npm run compile
- npm run test:unit

## 7. Documentacion a actualizar

- docs/backlog.md
- docs/current-focus.md
- docs/done-log.md