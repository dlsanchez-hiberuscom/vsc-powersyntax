# Tasks — Spec 142 Background Preemption (B124)

## 1. Preparacion

- [x] T1. Identificar tareas de fondo que deben soportar cancelacion y preempcion.
- [x] T2. Definir puntos de control seguros y estado minimo para reanudar.

## 2. Implementacion

- [x] T3. Aplicar cancellation checks al indexador y a otro camino largo del runtime.
- [x] T4. Implementar preempcion del scheduler por trabajo interactivo.
- [x] T5. Reencolar trabajo cancelado con reanudacion segura.
- [x] T6. Exponer trazas basicas de cancelacion y reentrada.

## 3. Validacion

- [x] T7. Anadir tests de cancelacion y preempcion.
- [x] T8. Ejecutar compilacion TypeScript.
- [x] T9. Ejecutar tests del scheduler o indexador afectados.

## 4. Cierre

- [x] T10. Reflejar trazabilidad documental de B124.
- [x] T11. Registrar limites temporales si alguna tarea de fondo sigue sin puntos de corte seguros.
