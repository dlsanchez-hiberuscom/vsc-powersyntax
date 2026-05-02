# Plan - Spec 253 Formatter server-side y presupuesto de formato (B227)

## 1. Enfoque tecnico

Resolver `B227` como cambio de arquitectura controlado: el cliente conserva selector/configuración/UX y delega el cálculo a un comando del servidor LSP que reutiliza el formatter puro y aplica budgets explícitos.

## 2. Pasos

1. Definir contrato request/result para formatting server-side con skip por budget.
2. Añadir comando del servidor que formatee o degrade con reason explícito.
3. Adaptar `registerFormatting()` para usar la nueva ruta en formato manual y `formatOnSave`.
4. Añadir tests unitarios del contrato server-side y reusar smoke existente.
5. Actualizar docs canónicas y cerrar `B227` si el cliente queda fino y el budget es visible.

## 3. Riesgos

- romper `formatOnSave` al pasar de sync a async;
- reintroducir lógica pesada en cliente mediante configuración o postprocesado;
- fijar budgets demasiado agresivos o invisibles.

## 4. Validacion

- unit del contrato server-side y budgets;
- unit del formatter puro existente;
- smoke de formatting real en VS Code.

## 5. Resultado ejecutado

1. Se definió un contrato request/result compartido para formatting server-side con skip por budget.
2. Se añadió el comando `powerbuilder.formatDocument` en el servidor LSP.
3. El provider manual y `formatOnSave` pasaron a delegar al servidor de forma asíncrona.
4. Se fijaron budgets explícitos por caracteres y líneas, con aviso visible cuando el documento queda omitido.