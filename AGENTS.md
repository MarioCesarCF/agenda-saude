# Agenda Saúde — AGENTS.md

## Stack
- **Backend:** .NET 10 Web API + EF Core 10 + Npgsql (Neon PostgreSQL)
- **Frontend:** Angular 21 (module‑based, non‑standalone) + Tailwind CSS v4
- **Auth:** JWT + BCrypt (admin); public booking (no auth)

## Commands
| Component | Action | Command |
|-----------|--------|---------|
| Backend | Run | `dotnet run` (port 5268) |
| Frontend | Dev server | `ng serve` (port 4200) |
| Frontend | Build | `ng build` |
| Frontend | Test | `npm test` (no tests written yet) |

## Architecture
- **Monorepo:** `backend/AgendaSaude.Api/` + `frontend/`
- **DB:** `EnsureCreated()` on startup — no EF migrations; schema changes via raw SQL in `Program.cs`
- **Ports:** backend 5268 (not 5000), frontend 4200
- **CORS:** AllowAll (dev only)
- **JSON:** `camelCase` + `ReferenceHandler.IgnoreCycles`

## Git workflow
- **`master`** is the stable branch — never push directly
- Every task/feature must be done on a **feature branch** (`feat/xxx`, `fix/xxx`, `refactor/xxx`)
- Branch naming: `feat/dark-mode-cards`, `fix/patient-lookup-bug`, `refactor/agendamento-flow`, etc.
- Workflow per task:
  1. `git checkout master && git pull`
  2. `git checkout -b feat/nome-da-tarefa`
  3. Develop + commit(s)
  4. `git push -u origin feat/nome-da-tarefa`
  5. Merge to `master` (via PR or locally)
- Commits should be descriptive: `feat: dark mode cards using [style.background-color]`, `fix: patient lookup by name+phone when email is empty`

## API structure
| Route | Auth | Purpose |
|-------|------|---------|
| `POST /api/auth/login` | No | Admin login (returns token + nome + tema + cores + icone) |
| `POST /api/auth/cadastro-consultorio` | No | Register clinic (includes optional theme fields) |
| `GET/PUT /api/cadastros/configuracao` | JWT | Read/update clinic config (theme, colors, icon) |
| `/api/cadastros/profissionais` | JWT | CRUD professionals |
| `/api/cadastros/servicos` | JWT | CRUD services |
| `/api/cadastros/vinculos` | JWT | GET (list), POST (link), DELETE (unlink) profissional↔servico |
| `/api/cadastros/pacientes` | JWT | CRUD patients |
| `/api/cadastros/horarios` | JWT | CRUD weekly schedules |
| `/api/cadastros/bloqueios` | JWT | CRUD blocks |
| `/api/agendamento` | JWT | List (with `?data=` & `?profissionalId=`), create admin, cancel, status |
| `/api/publico/{consultorioId:guid}/configuracao` | No | Get public config for theme/colors |
| `/api/publico/{consultorioId:guid}/profissionais` | No | List (optional `?servicoId=`) |
| `/api/publico/{consultorioId:guid}/servicos` | No | List (optional `?profissionalId=`) |
| `/api/publico/{consultorioId:guid}/horarios-disponiveis` | No | Available slots (`profissionalId` optional — when omitted uses clinic-wide + service-specific fallback, `?servicoId=` optional, `dataInicio`/`dataFim` optional) |
| `/api/publico/{consultorioId:guid}/agendar` | No | Create appointment (creates/finds patient by email or name+phone; email optional) |

## Frontend routes
| Path | Module | Description |
|------|--------|-------------|
| `/login` | Admin | Login page |
| `/admin/dashboard` | Admin | Weekly agenda view |
| `/admin/dashboard/profissionais` | Admin | Manage professionals + vinculação de serviços |
| `/admin/dashboard/servicos` | Admin | Manage services |
| `/admin/dashboard/horarios` | Admin | Manage weekly schedules (two tabs: Profissionais + Serviços) |
| `/admin/dashboard/configuracao` | Admin | Clinic customization (theme, colors, icon) |
| `/p/:consultorioId` | Publico | Patient booking wizard (4 steps) |

## Key gotchas
- App module file is `app-module.ts`, **not** `app.module.ts`
- Angular 21 Vite build: `@angular/build:application` builder
- Tailwind v4: `@import "tailwindcss"` in CSS (no `@tailwind` directives); PostCSS via `.postcssrc.json`
- Components are module‑based (`standalone: false`) — `declarations` in `NgModule`
- Auth state in localStorage key `auth` — `AuthService` reads/writes it
- `AuthService` exposes signals: `tema()`, `corPrimaria()`, `corSecundaria()`, `corDestaque()`, `icone()`, `nomeFantasia()`
- Theme/colors stored per-clinic in `Consultorio` table (columns: `Tema`, `CorPrimaria`, `CorSecundaria`, `CorDestaque`, `Icone`)
- Admin layouts use dynamic colors via `[style.*]` bindings (NOT Tailwind color classes) because colors are runtime-configurable
- Dark mode card backgrounds: **never** use `bg-white` + `[class.bg-slate-800]` — Tailwind v4 CSS specificity causes `bg-white` to override `bg-slate-800`. Always use `[style.background-color]` inline bindings (e.g. `"config?.tema === 'dark' ? '#1e293b' : '#fff'"`) for reliable dark mode rendering
- Patient portal uses `/p/{consultorioId}` with a GUID — no auth required
- `authInterceptor` is a functional interceptor (not class‑based)
- Connection string in `appsettings.Development.json` (gitignored); fallback in `appsettings.json`
- Default JWT key in `appsettings.json` — **must** override in production
- No test infrastructure exists (`vitest` is in devDeps but unused)
- Prettier (`^3.8.1`) is in devDeps but no config or script

## Patient booking wizard (AgendamentoComponent)
**Steps** (4, with progress bar):
1. Welcome — instructions + "Saiba Mais" tip
2. Escolha — professional + service columns side-by-side; pick either first, the other auto-filters via `?servicoId=` / `?profissionalId=`; search inputs for both lists
3. Data/Hora — 14-day calendar grid + available time slots based on service duration
4. Confirmar — review summary + patient form (nome, email, celular) + submit

**Service–professional linking:**
- Many-to-many via `ProfissionalServico` join table (FKs: `ProfissionalId`, `ServicoId`)
- If no links exist → all services shown for that professional (and vice versa)
- Links managed via vínculo modal in `profissionais.component.ts` (chain-link icon button)

**Patient lookup (`CriarOuBuscarPacienteAsync`):**
- If email provided → lookup by `Email + ConsultorioId`
- Else → lookup by `Nome + TelefoneCelular + ConsultorioId`
- If no match → creates new patient
- Email is optional (Nome + Celular required)

**Appointment days:** Start from tomorrow (not today); window controlled by `Consultorio.DiasAgenda` (default 2, configurable 1–30)

## Models (9 entities)
`Consultorio` → `Usuario`, `Profissional`, `Servico`, `Paciente`, `Agendamento`, `HorarioDisponivel`, `BloqueioAgenda`, `ProfissionalServico`
- All cascade‑delete from `Consultorio`; FK to Profissional/Paciente/Servico are `Restrict`
- `Agendamento` unique index on `(ProfissionalId, DataHoraInicio)`
- `Usuario` unique index on `(Email, ConsultorioId)`
- `ProfissionalServico` composite PK on `(ProfissionalId, ServicoId)`
- `Servico` has `SemProfissional` (bool) — services like X-rays don't need a specific professional
- `HorarioDisponivel` has nullable `ProfissionalId?` AND nullable `ServicoId?` — supports per-professional hours, clinic-wide hours (both null), and service-specific hours (`ServicoId` set, `ProfissionalId` null)
