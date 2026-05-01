# Quickstart — Spec 147 Formal Degraded Mode (B158)

## 1. Proposito

Validar que las features del servidor conocen el nivel de disponibilidad semantica y degradan o se bloquean de forma segura cuando falta contexto.

## 2. Prerequisitos

```bash
npm install
npm run compile
```

## 3. Validacion rapida

1. Abrir un workspace recien cargado y consultar una feature durante structural-only.
2. Verificar que la feature degrada o se bloquea con una ruta segura.
3. Esperar a nearby-semantic-ready o project-semantic-ready y repetir la consulta.
4. Confirmar que la feature gana capacidad solo cuando el nivel lo permite.

## 4. Resultado esperado

- No hay precision fingida cuando el motor aun no esta listo.
- Las features mejoran progresivamente con el readiness real.
- El contrato de niveles es consistente entre features.

## 5. Checklist

- [ ] Existe enumeracion formal de niveles.
- [ ] Al menos dos features consumen el contrato.
- [ ] Los tests cubren degradacion y bloqueo seguro.
- [ ] El mapping desde readiness es coherente.