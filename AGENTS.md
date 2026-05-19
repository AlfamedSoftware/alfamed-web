# AGENTS.md

## Project: Alfamed Web

SPA frontend for **Alfamed** — clinical/hospital management. Consumes `alfamed-api` via REST and Better Auth client.

Stack: React 19, TypeScript, Vite, React Router 7, Tailwind 4, shadcn/ui, better-auth client, react-hook-form, Zod.

This file defines rules AI agents must follow when changing this repository.

---

# LANGUAGE RULE

AI agents MUST ALWAYS respond in **Portuguese (Brazil)** to the user, even if prompts are in English.

---

# CRITICAL RULE

Follow **existing patterns** in this repo. Do not introduce new folder structures or auth mechanisms.

Reference implementations:

- `src/pages/SignIn/sign-in.tsx` — clinic login
- `src/pages/SignIn/admin-sign-in.tsx` — Service Desk login
- `src/pages/SelecaoUnidade/selecao-unidade.tsx` — unit selection
- `src/components/ProtectRoute/*` — route guards
- `src/lib/auth.ts` — Better Auth client
- `src/services/*.service.ts` — API calls

---

# API CONNECTION RULE

- Base URL: `authBaseUrl` from `src/lib/auth.ts` (`VITE_API_URL` or fallback `http://localhost:3333` on localhost).
- **Never** use header `x-unit-id` — it does not exist on the API.
- **Always** use `credentials: "include"` on authenticated requests (session + clinic cookies).
- Do **not** send `Authorization: Bearer` for session — Better Auth uses **HTTP cookies**.

```typescript
fetch(`${authBaseUrl}/path`, {
  method: "GET",
  credentials: "include",
  headers: { "Content-Type": "application/json" }, // when body JSON
})
```

---

# AUTH FLOWS

## Clinic flow (default)

1. `/login` → `auth.signIn.email({ email, password, callbackURL: `${origin}/session` })`
2. `ProtectedRoute` requires session
3. `/session` → `GET /session/clinics` → user picks unit → `POST /session/select-clinic` with `{ clinicId }`
4. Backend sets cookies `selectedClinicId` and `selectedProfessionalUnitId`
5. `UnitProtectedRoute` checks `selectedClinicId` via `GET /session/clinics`
6. App routes under `/home`, `/profissionais`, etc.

Files: `sign-in.tsx`, `selecao-unidade.tsx`, `protected-route.tsx`, `unit-protected-route.tsx`

## Service Desk flow (internal admin)

1. `/admin/login` → `auth.signIn.email` with `callbackURL` containing `/admin/` (e.g. `${origin}/admin/unidades`)
2. API hook requires role `internal_alfamed` on sign-in
3. `InternalProtectedRoute` requires email ending with `@alfamed.com`
4. Routes under `/admin/*` — **no** `/session`, **no** clinic cookie requirement
5. `DefaultBootstrap` in `default.tsx` skips menu roles when `pathname.startsWith("/admin")`

Files: `admin-sign-in.tsx`, `internal-protected-route.tsx`, `pages/ServiceDesk/*`

---

# ROUTE GUARDS

| Guard | File | Condition | Redirect |
|-------|------|-----------|----------|
| `ProtectedRoute` | `protected-route.tsx` | No session | `/login` |
| `UnitProtectedRoute` | `unit-protected-route.tsx` | No `selectedClinicId` from API | `/session` |
| `InternalProtectedRoute` | `internal-protected-route.tsx` | Email not `@alfamed.com` | `/admin/login` |

Route definitions: `src/app.tsx`

---

# UNIT CONTEXT (frontend)

Unit scope is **not** stored in localStorage for API calls. The backend stores it in **cookies** after `select-clinic`.

Frontend may keep `selectedUnitName` in `SidebarMenuContext` for **display only**.

To call unit-scoped API routes, ensure user completed `/session` and cookies are set — then use `credentials: "include"`.

`GET /professionals/professional-unit/roles` reads unit context from **cookies on the API** (not from query params). Prefer calling it with only `credentials: "include"` after clinic selection; avoid relying on query params as the source of truth.

---

# SERVICES LAYER

- Put HTTP calls in `src/services/*.service.ts`
- Use `authBaseUrl` + `credentials: "include"`
- Do not duplicate auth logic in pages when a service exists

Existing services: `professionals.service.ts`, `professional-unit-roles.service.ts`, `admin/admin-units.service.ts`, `admin/admin-upm.service.ts`

---

# SIDEBAR / ROLES

Menu driven by `menuRoles` in `SidebarMenuContext`, loaded in `DefaultBootstrap` (`default.tsx`):

1. `GET /session/clinics`
2. `listProfessionalUnitRoles()` → `GET /professionals/professional-unit/roles`

Role keys and menu mapping: `src/components/app-sidebar.tsx` (`MENU_ROLE_KEYS`, `menuItemsByRole`).

Supported keys: `internal_alfamed`, `administrative`, `administrative_assistant`, `medic`.

---

# FORMS AND VALIDATION

- Use `react-hook-form` + `zodResolver` + Zod schemas (see SignIn pages)
- Match API validation messages where user-facing

---

# ENV VARS

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL (dev: `http://localhost:3333`) |
| `VITE_API_PROXY_TARGET` | Vite dev proxy target only |

Default API port in code is **3333**, not 3000.

---

# DO NOT

- Reintroduce `x-unit-id` header
- Use Bearer token for Better Auth session
- Skip `credentials: "include"` on authenticated API calls
- Require `/session` for `/admin` routes
- Put business logic that belongs in `alfamed-api` only in the frontend

---

# WHEN UNSURE

Read `alfamed-api` README and `AGENTS.md` for backend contracts (cookies, Service Desk, route validation).
