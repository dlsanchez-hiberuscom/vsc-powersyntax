# Plan - Spec 277 ORCA import and compile controlled (B193)

1. Reutilizar `last-export.state` como frontera de entrada del import ORCA y añadir captura de fingerprint de PBL.
2. Materializar un helper server-side que haga preflight, backup binario, script de import y ledger persistido antes de invocar el runner existente.
3. Publicar el comando cliente visible, validar con unit + smoke focal y mover el foco canónico a `B194`.