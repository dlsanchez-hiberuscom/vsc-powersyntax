# Plan - Spec 250 Ancestros nativos PowerBuilder (B225)

## 1. Enfoque tecnico

Extender el catalogo compartido antes de tocar consumidores. Los consumers deben preguntar al mismo servicio y no recrear listas locales.

## 2. Pasos

1. Identificar gaps reales en tests/corpus.
2. Ampliar dataset/indice del system catalog.
3. Conectar consumidores existentes solo si ya usan el servicio compartido.
4. Anadir tests positivos/negativos.

## 3. Riesgos

- ocultar errores reales marcando tipos desconocidos como sistema;
- duplicar aliases en diagnostics o hierarchy.

## 4. Validacion

- tests unitarios del catalogo y consumers semanticos afectados.
