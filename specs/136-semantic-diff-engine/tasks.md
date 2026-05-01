# Tasks — Spec 136 Semantic Diff Engine (B170)

## 1. Preparacion

- [x] T1. Identificar artefactos documentales que deben entrar en la comparacion semantica.
- [x] T2. Definir la taxonomia minima de diffImpactLevel.

## 2. Implementacion

- [x] T3. Implementar classifyDocumentSemanticDiff.
- [x] T4. Implementar noSemanticChangeFastPath.
- [x] T5. Conectar la salida del diff al pipeline de analisis para uso posterior por invalidacion.

## 3. Validacion

- [x] T6. Anadir tests de comentarios y formato sin impacto semantico.
- [x] T7. Anadir tests de cambios de firma, visibilidad o herencia con impacto real.
- [x] T8. Ejecutar compilacion TypeScript.

## 4. Cierre

- [x] T9. Actualizar la trazabilidad documental de B170.
- [x] T10. Registrar huecos detectados para B153 o B154 si el diff no cubre todos los consumidores todavia.
