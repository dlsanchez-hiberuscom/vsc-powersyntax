# Tasks - Spec 259 PBAutoBuild command runner out-of-process (B183)

## 1. Preparación

- [x] T1. Confirmar el borde correcto: cliente resuelve ejecutable y servidor selecciona build file + controla el proceso.
- [x] T2. Definir la selección segura de build files usables y el estado mínimo del runner.

## 2. Implementación

- [x] T3. Implementar el runner server-side out-of-process con cancelación y timeout.
- [x] T4. Exponer comandos run/cancel y proyección mínima en stats/cliente.

## 3. Validación

- [x] T5. Añadir tests del runner: éxito, cancelación y timeout.
- [x] T6. Añadir tests de selección/proyección visible básica.

## 4. Cierre

- [x] T7. Alinear docs y cerrar `B183` solo si el build queda observable, cancelable y seguro desde VS Code.