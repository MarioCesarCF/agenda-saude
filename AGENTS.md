# Agenda Saúde — AGENTS.md

## Stack
- **Backend:** .NET 10 Web API + EF Core 10 + Npgsql (Neon PostgreSQL)
- **Frontend:** Angular 21 (module‑based, non‑standalone) + Tailwind CSS v4
- **Auth:** JWT + BCrypt (admin); public booking (no auth)

## Commands
| Component | Action | Command |
|-----------|--------|---------|
| Backend | Run | `dotnet run` (port 5268) |
| Backend | Test | `dotnet test` (xUnit + InMemory EF Core, in `AgendaSaude.Api.Tests`) |
| Frontend | Dev server | `ng serve` (port 4200) |
| Frontend | Build | `ng build` |
| Frontend | Test | `ng test --no-watch` (Vitest + jsdom, 21 tests) |

## Architecture
- **Monorepo:** `backend/AgendaSaude.Api/` + `frontend/`
- **DB:** `EnsureCreated()` on startup — no EF migrations; schema changes via raw SQL in `Program.cs`
- **Ports:** backend 5268 (not 5000), frontend 4200
- **CORS:** `AllowDevelopment` (any origin) in dev, `AllowProduction` (configurable origins) in prod
- **JSON:** `camelCase` + `ReferenceHandler.IgnoreCycles`
- **Locale:** Portuguese (`pt-BR`) registered via `registerLocaleData` + `LOCALE_ID` provider in `app-module.ts`
- **Guards:** Functional (`CanActivateFn`) — `AuthGuard`, `AdminGuard`

## Git workflow
- **`master`** is the stable branch — never push directly
- Every task/feature must be done on a **feature branch** (`feat/xxx`, `fix/xxx`, `refactor/xxx`)
- Branch naming: `feat/dark-mode-cards`, `fix/patient-lookup-bug`, `refactor/agendamento-flow`, etc.
- Workflow per task:
  1. `git switch master && git pull`
  2. `git switch -c feat/nome-da-tarefa`
  3. Develop + commit(s)
  4. `git push -u origin feat/nome-da-tarefa`
  5. Merge to `master` (via PR or locally)
- Commits should be descriptive: `feat: dark mode cards using [style.background-color]`, `fix: patient lookup by name+phone when email is empty`

## API structure
| Route | Auth | Purpose |
|-------|------|---------|
| `POST /api/auth/login` | No | Admin login (returns token + nome + tema + cores + icone) |
| `POST /api/auth/solicitar-reset` | No | Request password reset code by email (rate limited, no user enumeration) |
| `POST /api/auth/resetar-senha` | No | Reset password with 6-digit code (body `{ token, novaSenha }`) |
| `POST /api/auth/google/{consultorioId:guid}` | No | Google Sign-In via Neon Auth: validates the Neon session token (`{ token }`) in `neon_auth.session`/`neon_auth.user`, creates/links patient by `GoogleId`/email, returns `{ id, nome, email, telefoneCelular }` |
| `POST /api/auth/cadastro-consultorio` | No | Register clinic (includes optional theme fields) |
| `POST /api/auth/cadastro-paciente/{consultorioId:guid}` | No | Register patient (body incl. optional `senha`); if email already exists **sem** senha, sets the password on the first registration (rate limited) |
| `POST /api/auth/login-paciente/{consultorioId:guid}` | No | Patient login email+senha (BCrypt, `Paciente.SenhaHash`); returns JWT with role claim `Paciente` + `{ token, id, nome, email, telefoneCelular, consultorioId }` (rate limited) |
| `GET /api/pacientes/agendamentos` | JWT + PacienteOnly | Patient's own appointments, scoped by `PacienteId` + `ConsultorioId` claims, ordered desc |
| `PATCH /api/pacientes/agendamentos/{id:guid}/cancelar` | JWT + PacienteOnly | Cancel own appointment (sets status=Cancelado, logs HistoricoAcao `CancelarAgendamentoPaciente`, no UsuarioId) |
| `PATCH /api/pacientes/agendamentos/{id:guid}/reagendar` | JWT + PacienteOnly | Reschedule own appointment (body `{ novaDataHoraInicio }`; only `Agendado`/`Confirmado` and future; reuses conflict check; logs HistoricoAcao `ReagendarAgendamentoPaciente`, no UsuarioId) |
| `POST /api/usuarios` | JWT + AdminOnly | Create user (Atendente/Profissional) |
| `PUT /api/usuarios/{id}` | JWT + AdminOnly | Update user |
| `DELETE /api/usuarios/{id}` | JWT + AdminOnly | Soft-delete user (sets Ativo=false, logs HistoricoAcao) |
| `GET /api/usuarios/perfil` | JWT | Get own profile |
| `PUT /api/usuarios/perfil` | JWT | Update own name/email |
| `PATCH /api/usuarios/perfil/senha` | JWT | Change own password (requires current password) |
| `GET/PUT /api/cadastros/configuracao` | JWT | Read/update clinic config (theme, colors, icon) |
| `/api/cadastros/profissionais` | JWT | CRUD professionals |
| `/api/cadastros/servicos` | JWT | CRUD services |
| `/api/cadastros/vinculos` | JWT | GET (list), POST (link), DELETE (unlink) profissional↔servico |
| `/api/cadastros/pacientes` | JWT | CRUD patients |
| `/api/cadastros/horarios` | JWT | CRUD weekly schedules |
| `/api/cadastros/bloqueios` | JWT | CRUD blocks |
| `/api/agendamento` | JWT | List (with `?data=`, `?profissionalId=`, `?dataInicio=`/`?dataFim=`), create admin, cancel, reschedule, status |
| `DELETE /api/agendamento/{id}` | JWT | Cancel appointment (sets status=Cancelado, logs HistoricoAcao) |
| `PATCH /api/agendamento/{id}/reagendar` | JWT | Reschedule (checks conflicts, logs HistoricoAcao) |
| `/api/publico/{consultorioId:guid}/configuracao` | No | Get public config for theme/colors |
| `/api/publico/{consultorioId:guid}/profissionais` | No | List (optional `?servicoId=`) |
| `/api/publico/{consultorioId:guid}/servicos` | No | List (optional `?profissionalId=`) |
| `/api/publico/{consultorioId:guid}/horarios-disponiveis` | No | Available slots (`profissionalId` optional — when omitted uses clinic-wide + service-specific fallback, `?servicoId=` optional, `dataInicio`/`dataFim` optional) |
| `/api/publico/{consultorioId:guid}/agendar` | No | Create appointment (creates/finds patient by email or name+phone; email optional) |

## Frontend routes
| Path | Module | Description |
|------|--------|-------------|
| `/login` | Admin | Login page (Entrar + Cadastrar Consultório tabs) |
| `/login/esqueci-senha` (`/esqueci-senha` redirects here) | Admin | Request password reset code by email |
| `/login/resetar-senha` (`/resetar-senha` redirects here) | Admin | New password form (`?token=` pre-fills the code) |
| `/admin/dashboard` | Admin | Full month calendar with appointment dots + "Hoje" button |
| `/admin/dashboard/profissionais` | Admin | Manage professionals + vinculação de serviços |
| `/admin/dashboard/servicos` | Admin | Manage services |
| `/admin/dashboard/horarios` | Admin | Manage weekly schedules (two tabs: Profissionais + Serviços) |
| `/admin/dashboard/configuracao` | Admin | Clinic customization (theme, colors, icon) — AdminGuard |
| `/admin/dashboard/usuarios` | Admin | User management CRUD — AdminGuard |
| `/admin/dashboard/perfil` | Admin | Edit own name/email + change password |
| `/p/:consultorioId` | Publico | Patient booking wizard (4 steps) |
| `/p/:consultorioId/entrar` | Publico | Patient portal login/register — tabs Entrar + Criar conta (public, no guard) |
| `/p/:consultorioId/minha-agenda` | Publico | Patient's own appointments (próximas + histórico, cancelar, reagendar) — `PacienteGuard` (redirects to `entrar`) |

## Key gotchas
- App module file is `app-module.ts`, **not** `app.module.ts`
- Angular 21 Vite build: `@angular/build:application` builder
- Tailwind v4: `@import "tailwindcss"` in CSS (no `@tailwind` directives); PostCSS via `.postcssrc.json`
- Components are module‑based (`standalone: false`) — `declarations` in `NgModule`
- Guards are **functional** (`CanActivateFn`) — not class-based. Angular 21 will throw `Class constructor XGuard cannot be invoked without 'new'` if you use class-based guards with `canActivate: [GuardFn]` syntax
- Theme/colors stored per-clinic in `Consultorio` table (columns: `Tema`, `CorPrimaria`, `CorSecundaria`, `CorDestaque`, `Icone`)
- Admin layouts use dynamic colors via `[style.*]` bindings (NOT Tailwind color classes) because colors are runtime-configurable
- Dark mode card backgrounds: **never** use `bg-white` + `[class.bg-slate-800]` — Tailwind v4 CSS specificity causes `bg-white` to override `bg-slate-800`. Always use `[style.background-color]` inline bindings for reliable dark mode rendering
- Patient portal uses `/p/{consultorioId}` with a GUID — no auth required
- Auth state (admin) in localStorage key `auth` — `AuthService` reads/writes it; patient portal auth in key `auth-paciente` — `PacienteAuthService` reads/writes it (signals: `token()`, `nome()`, `email()`, `telefoneCelular()`, `consultorioId()`)
- `authInterceptor` is a functional interceptor (not class‑based). It attaches the **admin** token except for `/api/pacientes/**`, which uses the **patient** token (`PacienteAuthService`) — the two tokens never mix
- Connection string in `appsettings.Development.json` (gitignored); fallback in `appsettings.json`
- Default JWT key in `appsettings.json` — **must** override in production
- Google Sign-In (pacientes) via **Neon Auth** (mesma abordagem do Cardapio Online). Front usa `@neondatabase/neon-js` (`createAuthClient(AppConfig.neonAuthUrl)`), `signIn.social({ provider: 'google', callbackURL })` com redirect para `/p/{id}?via=google`; o draft do wizard é salvo em sessionStorage antes do redirect e restaurado no retorno. Backend valida o token de sessão **opaco** em `neon_auth.session`/`neon_auth."user"` (SQL raw via `NeonSessionValidator`, `INeonSessionValidator`) — não há `GoogleTokenValidator`/jwks. Sessões e OAuth (client id/secret) ficam no Neon Console. `AppConfig.neonAuthUrl` aponta para `https://<projeto>.neonauth.sa-east-1.aws.neon.tech/neondb/auth` (também em `appsettings.json` como `NeonAuth:Url`)
- Portuguese locale: `registerLocaleData(localePt, 'pt-BR')` + `{ provide: LOCALE_ID, useValue: 'pt-BR' }` in `app-module.ts`. All `date` pipe formats render in Portuguese. `toLocaleDateString('pt-BR')` also used in some places
- Backend tests: xUnit + `Microsoft.EntityFrameworkCore.InMemory` (project: `AgendaSaude.Api.Tests`, 60 tests)
- Frontend tests: Vitest v4 + jsdom (30 tests across 5 files: `auth.service.spec.ts`, `paciente-auth.service.spec.ts`, `loading.service.spec.ts`, `auth.interceptor.spec.ts`, `loading.interceptor.spec.ts`)

## Patient booking wizard (AgendamentoComponent)
**Steps** (4, with progress bar):
1. Welcome — instructions + "Saiba Mais" tip
2. Escolha — professional + service columns side-by-side with smart filtering:
   - Select professional → services filtered to linked ones only; `semProfissional` services excluded; if exactly 1 → auto-selected
   - Select service → professionals filtered to linked ones only; if exactly 1 → auto-selected
3. Data/Hora — full month calendar grid + available time slots based on service duration
   - Only days with available slots are clickable (others show border + muted text)
   - Green dot indicator on days that have available slots
   - Days before tomorrow are disabled (opacity + pointer-events-none)
   - Loading spinner overlay while fetching horários from API
   - `diaTemHorarios()` returns `false` when `horariosDisponiveis` is empty (no false-positives during load)
4. Confirmar — review summary + patient form (nome*, email, celular*) + submit
   - `submitted` flag triggers per-field validation on confirm attempt
   - Red border + "obrigatório" message on empty required fields (Nome, Celular)
   - Asterisks on required labels

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
`Consultorio` → `Usuario`, `Profissional`, `Servico`, `Paciente`, `Agendamento`, `HorarioDisponivel`, `BloqueioAgenda`, `ProfissionalServico`, `HistoricoAcao`
- All cascade‑delete from `Consultorio`; FK to Profissional/Paciente/Servico are `Restrict`
- `Agendamento` unique index on `(ProfissionalId, DataHoraInicio)`
- `Usuario` unique index on `(Email, ConsultorioId)`
- `ProfissionalServico` composite PK on `(ProfissionalId, ServicoId)`
- `Servico` has `SemProfissional` (bool) — services like X-rays don't need a specific professional
- `HorarioDisponivel` has nullable `ProfissionalId?` AND nullable `ServicoId?` — supports per-professional hours, clinic-wide hours (both null), and service-specific hours (`ServicoId` set, `ProfissionalId` null)
- `HistoricoAcao` — audit trail for destructive actions (ExcluirAgendamento, Reagendar, ExcluirUsuario); FKs to Consultorio and Usuario

## PerfilUsuario enum
`Admin`, `Atendente`, `Profissional` — used in JWT claims and route guards. `AdminOnly` policy enforced on `CadastrosController` and `UsuariosController`.

## Password Recovery Plan
**Goal:** Allow users who forgot their password to reset it via email from the login screen.

### Backend

1. **New model: `ResetToken`**
   - Fields: `Id` (Guid PK), `UsuarioId` (Guid FK → Usuario), `Token` (string, hashed), `CriadoEm` (DateTime), `ExpiraEm` (DateTime), `Usado` (bool)
   - Table: `ResetTokens` (create via raw SQL in `Program.cs`)
   - Cascade delete from `Usuario` (when user deleted, tokens are cleaned up)

2. **New DTOs:**
   - `SolicitarResetRequest` → `{ email: string }`
   - `ResetarSenhaRequest` → `{ token: string, novaSenha: string }`

3. **New service: `ResetSenhaService`**
   - `SolicitarResetAsync(email)`:
     - Find `Usuario` by email (any consultorio). If not found → return success (don't leak existence)
     - Generate random 6-digit code (or UUID-based token)
     - Hash the token, store in `ResetTokens` with 15-min expiry
     - Send email via `System.Net.Mail.SmtpClient` (config from `appsettings.json`: `Smtp.Host`, `Smtp.Port`, `Smtp.User`, `Smtp.Password`, `Smtp.From`)
     - If no SMTP configured → log token to console (dev mode)
   - `ResetarSenhaAsync(token, novaSenha)`:
     - Find matching `ResetToken` where `Usado=false` and `ExpiraEm >.UtcNow`
     - Verify token hash matches
     - Update `Usuario.SenhaHash` with new BCrypt hash
     - Mark token as `Usado=true`
     - Return success/failure

4. **New controller endpoints in `AuthController`:**
   - `POST /api/auth/solicitar-reset` — `[EnableRateLimiting("auth")]`, body: `SolicitarResetRequest`
   - `POST /api/auth/resetar-senha` — `[EnableRateLimiting("auth")]`, body: `ResetarSenhaRequest`

5. **SmtpSettings in `appsettings.json`:**
   ```json
   "Smtp": {
     "Host": "",
     "Port": 587,
     "User": "",
     "Password": "",
     "From": "noreply@agendasaude.com.br"
   }
   ```

6. **Program.cs:** Register `ResetSenhaService` as scoped

### Frontend

1. **New route:** `/esqueci-senha` → `EsqueciSenhaComponent` (declarado no `AdminModule`)
   - Simple form: input email + "Enviar código" button
   - On success: shows message "Se o email estiver cadastrado, você receberá um código de recuperação"
   - Links back to `/login`

2. **New route:** `/resetar-senha` → `ResetarSenhaComponent` (declarado no `AdminModule`)
   - Query param: `?token=xxx` (pre-filled from email link, or user pastes manually)
   - Form: token input + nova senha + confirmar senha + "Redefinir senha" button
   - On success: redirects to `/login` with success message

3. **Login component updates:**
   - Add "Esqueci minha senha?" link below the password input
   - Link navigates to `/esqueci-senha`

4. **AdminRoutingModule:** Add the two new routes (no auth guard needed — public routes)

### Security considerations
- Rate limit both endpoints (already using `"auth"` policy — 10 req/min per IP)
- Tokens expire in 15 minutes
- Always return success regardless of email existence (prevent user enumeration)
- Log HistoricoAcao for password resets (optional, for audit trail)
