# Current Focus — Plugin PowerBuilder 2025 para VS Code

## 1. Foco activo

`B182 — PBAutoBuild build-file discovery and validation`

Estado actual: las seis specs pedidas (`B042`, `B181`, `B227`, `B228`, `B070`, `B162`) quedan cerradas y validadas. `B181` ya detecta `PBAutoBuild250.exe` de forma read-only, pero el build moderno sigue sin poder declararse usable mientras el plugin no descubra y valide los build files JSON reales del workspace. Por eso el siguiente hueco estructural pasa a ser `B182`.

Trazas paralelas activas que no desplazan ese foco principal:

- `B225` (`specs/250-native-ancestors-system-catalog`), como refuerzo incremental de ancestros nativos del runtime PowerBuilder servidos por `system catalog`;
- `B226` (`specs/251-orderentry-enterprise-baseline`), como baseline enterprise parcial sobre `fixtures-local/STD_FC_OrderEntry` para discovery/indexación y futuras regresiones semánticas reales.

---

## 2. Por qué es prioritario

`B182` es ahora el siguiente guardrail operativo del build moderno:

- `B181` solo resuelve la capacidad de herramienta; todavía falta saber qué build files existen y si representan un proyecto utilizable;
- `B183` y `B187` dependen directamente de este contrato read-only, así que abrir runner o health sin él sería fingir readiness;
- cerrarlo ahora mantiene el cliente ligero y evita meter heurísticas de ejecución donde todavía falta discovery sólido.

---

## 3. Trabajo permitido ahora

- descubrir build files JSON de PBAutoBuild desde el workspace/modelo de proyecto sin ejecutar builds;
- validar compatibilidad mínima, mapeo a proyecto y reason codes de invalidez o ausencia;
- dejar ese contrato reutilizable por runner, health y UX posteriores.

---

## 4. Trabajo fuera de foco

No abrir salvo causa clara:

- ejecutar builds reales antes de tener discovery/validation confiables;
- parsear logs o abrir UX de perfiles/comandos sin contrato de build file estable;
- mezclar validación read-only con runner o health antes de tiempo.

---

## 5. Criterios de salida del foco actual

- el plugin descubre build files relevantes y sabe a qué proyecto/workspace pertenecen;
- cada build file queda clasificado como utilizable, inválido o ambiguo con reason codes claros;
- runner/health pueden consumir ese contrato sin rehacer discovery por su cuenta.

---

## 6. Siguiente foco natural

1. `B183/B187` — runner out-of-process y health unificado del build moderno.
2. `B225/B226` — completar ancestros nativos del sistema y cobertura enterprise real sobre OrderEntry.

---

## 7. Regla final

No anunciar build moderno operativo sin discovery y validación read-only de build files reales detrás.