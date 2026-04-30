# Spec 024 — Owner resolution (B060)

## 1. Motivación

Resolver expresiones tipo `This.foo`, `Parent.bar`, `Super::method`,
`var.member` y `obj::name` requiere un módulo dedicado que dado un
contexto léxico devuelva el `ownerType` con el que buscar miembros.

## 2. Alcance

- `src/server/knowledge/resolution/ownerResolver.ts`:
  - `resolveOwnerExpression(prefix, ctx): { ownerType: string | null, isSuper: boolean }`.
  - Casos soportados:
    - `this` → `ctx.currentType`.
    - `super` / `super::` → ancestro inmediato (vía graph).
    - `parent` → reservado: devuelve `null` (parser de UI no garantizado todavía).
    - identificador simple → tipo declarado de variable, si lo conocemos.
- Sin cambios automáticos en features hasta que B023 lo necesite.

## 3. Criterios de aceptación

1. `this` → tipo del contexto.
2. `super` → primer ancestro.
3. variable con `datatype` conocido → su datatype.
4. desconocido → null.

## 4. Documentación

`docs/architecture.md`, `docs/backlog.md` (B060).
