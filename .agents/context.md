# Contexto Completo do Projeto — Genda

## 1. O que é o Genda

**Genda** é um SaaS de agendamento online para profissionais e estúdios de estética, beleza, barbearia e cuidados pessoais. O foco é uma **experiência pública sem fricção** (clientes agendam com nome + WhatsApp, sem login, senha ou e-mail) combinada a um **painel administrativo completo** para o profissional ou dono do estúdio.

Dois públicos distintos:
- **Cliente** — acessa via link público (`/:slug`), escolhe serviço, dia, horário e confirma com nome + WhatsApp.
- **Profissional/dono** — acessa `/painel` com e-mail + senha (JWT), gerencia agenda, serviços, horários e configurações do estabelecimento.

---

## 2. Stack Técnica

### Frontend — `genda-app/`

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 18.3.1 | UI |
| TypeScript | 5.7.2 | Tipagem |
| Vite | 6.0.6 | Bundler, dev server (porta 5173) |
| Tailwind CSS | 4.0.0 | Estilização (integrado via `@tailwindcss/vite`) |
| React Router DOM | 7.1.1 | Roteamento SPA client-side |
| lucide-react | 0.468.0 | Ícones |

**Sem:** Zustand, Redux, React Query, SWR, Axios, date-fns, i18n, testes automatizados.

**Estado:** 100% `useState`/`useEffect` local por componente/página. Nenhum context global.

**Auth:** `localStorage` ou `sessionStorage` (dependendo do `rememberMe`). Token JWT + user serializado com as chaves `genda_token` e `genda_user`. Lógica centralizada em `src/services/api.ts`.

**Requisições HTTP:** função `request<T>` em `api.ts`. Nunca use `fetch` diretamente nos componentes.

**Variáveis de ambiente (frontend):**
- `VITE_API_URL` — URL do backend (default: `http://localhost:4000`)
- `VITE_DEFAULT_SLUG` — slug padrão quando nenhum é informado na URL (default: `studio-aura`)

### Backend — `genda-core/`

| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | (LTS) | Runtime |
| Express | 4.21.2 | Framework HTTP |
| TypeScript | 5.7.2 | Tipagem |
| pg (node-postgres) | 8.13.1 | Banco de dados — SQL puro, sem ORM |
| Zod | 3.24.1 | Validação de inputs nos controllers |
| multer | 1.4.5-lts.1 | Upload de arquivos (memória) |
| @aws-sdk/client-s3 | 3.700.0 | Upload para Cloudflare R2 (compatível S3) |
| dotenv | 16.4.7 | Variáveis de ambiente |
| cors | 2.8.5 | CORS |
| tsx | 4.19.2 | Dev server com watch |

**Sem:** ORM (Sequelize, Prisma, TypeORM), jsonwebtoken (JWT implementado manualmente com `crypto`), refresh tokens, testes automatizados.

**Variáveis de ambiente (backend):**
```
PORT=4000
CORS_ORIGIN=http://localhost:5173
APP_TIMEZONE=America/Sao_Paulo
JWT_SECRET=...
DATABASE_URL=postgresql://...
DATABASE_SSL=true
R2_ENDPOINT=https://ef97a1179c0ed6484714045cb9783f49.r2.cloudflarestorage.com
R2_BUCKET=genda-dev
R2_REGION=auto
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_PUBLIC_URL=...
```

### Banco de Dados

- **Supabase** (PostgreSQL) — projeto `ygkcfmjivsluisquprnv`
- Conexão via `pg.Pool` com `DATABASE_URL` + SSL (`rejectUnauthorized: false`)
- Pool: max 10 conexões, idle timeout 30s, connection timeout 10s
- Nenhuma migration automática — scripts SQL manuais em `database/`

### Deploy / Infraestrutura

- **Frontend:** Vercel (SPA rewrite em `vercel.json` — tudo aponta para `index.html`)
- **Backend:** Docker Compose (container único `genda-core`, porta 4000)
- **Assets:** Cloudflare R2 (bucket `genda-dev`) — imagens de logo, banner e serviços

---

## 3. Estrutura Completa de Arquivos

```
hagfish/
├── .agents/
│   ├── instructions.md
│   ├── context.md           ← você está aqui
│   └── tasks/
├── application.md           ← documentação de arquitetura (redundante com este arquivo)
├── database/
│   ├── 001_schema.sql       ← schema completo
│   ├── 002_seed.sql         ← seed de demonstração (studio-aura)
│   └── 003_auth_users.sql   ← tabela users
├── genda-app/               ← frontend
│   ├── package.json
│   ├── vite.config.ts       ← plugins: react() + tailwindcss()
│   ├── vercel.json          ← rewrite SPA
│   └── src/
│       ├── App.tsx
│       ├── assets/
│       │   ├── genda-icon-dots.svg
│       │   └── genda-logo-horizontal-dots.svg
│       ├── components/
│       │   ├── AdminLayout.tsx
│       │   ├── GendaDatePicker.tsx
│       │   └── RequireAuth.tsx
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── PublicBookingPage.tsx
│       │   └── admin/
│       │       ├── AdminAgendaPage.tsx
│       │       ├── AdminServicesPage.tsx
│       │       ├── AdminHoursPage.tsx
│       │       └── AdminSettingsPage.tsx
│       ├── services/
│       │   └── api.ts
│       ├── types/
│       │   └── genda.ts
│       └── utils/
│           └── format.ts
└── genda-core/              ← backend
    ├── package.json
    ├── Dockerfile
    ├── docker-compose.yml
    └── src/
        ├── server.ts
        ├── config/
        │   ├── db.ts
        │   ├── env.ts
        │   └── r2.ts
        ├── types/
        │   └── genda.types.ts
        ├── middlewares/
        │   └── auth.middleware.ts
        ├── utils/
        │   ├── auth.ts
        │   └── time.ts
        ├── models/
        │   ├── establishment.model.ts
        │   ├── service.model.ts
        │   ├── workingHours.model.ts
        │   ├── scheduleBlock.model.ts
        │   ├── appointment.model.ts
        │   └── user.model.ts
        ├── services/
        │   ├── availability.service.ts
        │   └── booking.service.ts
        ├── controllers/
        │   ├── admin.controller.ts
        │   ├── auth.controller.ts
        │   └── public.controller.ts
        └── routes/
            ├── admin.routes.ts
            ├── auth.routes.ts
            └── public.routes.ts
```

---

## 4. Schema do Banco de Dados

### Extensões
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Tabela: `public.establishments`
Dados do estúdio/profissional.

| Coluna | Tipo | Padrão | Notas |
|---|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` | |
| `slug` | text UNIQUE | — | URL-friendly, ex: `studio-aura` |
| `name` | text | — | Nome do estúdio |
| `subtitle` | text | `'Estética & Beleza'` | Especialidade |
| `bio` | text | `''` | Descrição longa |
| `logo_url` | text | NULL | URL R2 |
| `banner_url` | text | NULL | URL R2 |
| `primary_color` | text | `'#1D4ED8'` | Cor da marca (hex) |
| `address` | text | `''` | Endereço completo |
| `address_complement` | text | `''` | Complemento/sala |
| `whatsapp` | text | `''` | Contato público |
| `slot_interval_minutes` | integer | `30` | Intervalo entre slots (mín. 10, máx. 120) |
| `min_advance_minutes` | integer | `60` | Antecedência mínima para agendar |
| `max_future_days` | integer | `30` | Janela máxima futura para agendamentos |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | `now()` | |

### Tabela: `public.services`
Vitrine de serviços do estabelecimento.

| Coluna | Tipo | Padrão | Notas |
|---|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` | |
| `establishment_id` | uuid FK | — | Referência `establishments.id` ON DELETE CASCADE |
| `name` | text | — | Nome do serviço |
| `category` | text | `'Geral'` | Categoria (ex: Cílios, Cabelo, Unhas) |
| `description` | text | `''` | Descrição |
| `duration_minutes` | integer | — | Duração em minutos (> 0) |
| `price_cents` | integer | — | Preço em centavos (>= 0) |
| `image_url` | text | NULL | URL R2 |
| `is_active` | boolean | `true` | Visível na página pública |
| `sort_order` | integer | `0` | Ordem de exibição |
| `created_at` / `updated_at` | timestamptz | `now()` | |

Índice: `idx_services_establishment_active (establishment_id, is_active, sort_order)`

### Tabela: `public.working_hours`
Jornada semanal do estabelecimento.

| Coluna | Tipo | Padrão | Notas |
|---|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` | |
| `establishment_id` | uuid FK | — | ON DELETE CASCADE |
| `day_of_week` | smallint | — | 0 = Domingo … 6 = Sábado |
| `is_open` | boolean | `true` | Se atende neste dia |
| `open_time` | time | `'09:00'` | |
| `close_time` | time | `'19:00'` | |
| `break_start` | time | NULL | Início do intervalo |
| `break_end` | time | NULL | Fim do intervalo |
| `created_at` / `updated_at` | timestamptz | `now()` | |

Constraint: `UNIQUE (establishment_id, day_of_week)`

### Tabela: `public.schedule_blocks`
Bloqueios pontuais de agenda (feriados, folgas, compromissos).

| Coluna | Tipo | Padrão | Notas |
|---|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` | |
| `establishment_id` | uuid FK | — | ON DELETE CASCADE |
| `block_date` | date | — | Data do bloqueio |
| `start_time` | time | NULL | Apenas para bloqueio parcial |
| `end_time` | time | NULL | Apenas para bloqueio parcial |
| `all_day` | boolean | `false` | Se true, bloqueia o dia inteiro |
| `reason` | text | `''` | Motivo (ex: Feriado, Curso) |
| `created_at` | timestamptz | `now()` | |

Índice: `idx_schedule_blocks_est_date (establishment_id, block_date)`

### Tabela: `public.appointments`
Reservas dos clientes.

| Coluna | Tipo | Padrão | Notas |
|---|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` | |
| `establishment_id` | uuid FK | — | ON DELETE CASCADE |
| `service_id` | uuid FK | — | Referência `services.id` ON DELETE RESTRICT |
| `client_name` | text | — | |
| `client_whatsapp` | text | — | Apenas dígitos no banco |
| `notes` | text | `''` | Observação do cliente |
| `appointment_date` | date | — | |
| `start_time` | time | — | |
| `end_time` | time | — | Calculado: start + duration |
| `price_cents` | integer | — | Snapshot do preço no momento do agendamento |
| `duration_minutes` | integer | — | Snapshot da duração |
| `status` | text | `'confirmed'` | `confirmed`, `completed`, `cancelled`, `no_show` |
| `created_at` / `updated_at` | timestamptz | `now()` | |

Índices:
- `idx_appointments_est_date_status (establishment_id, appointment_date, status)`
- `idx_appointments_service_id (service_id)`

### Tabela: `public.users`
Usuários do painel administrativo.

| Coluna | Tipo | Padrão | Notas |
|---|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` | |
| `establishment_id` | uuid FK | — | ON DELETE CASCADE |
| `name` | text | — | |
| `email` | text UNIQUE | — | |
| `password_hash` | text | — | Formato: `scrypt$<salt>$<hash>` |
| `plan_name` | text | `'Plano Pro'` | |
| `plan_status` | text | `'Ativo'` | |
| `created_at` / `updated_at` | timestamptz | `now()` | |

Índice: `idx_users_establishment_id`

---

## 5. Roteamento Frontend (`App.tsx`)

```
/              → PublicBookingPage (usa VITE_DEFAULT_SLUG)
/login         → LoginPage
/painel        → RequireAuth → AdminLayout → AdminAgendaPage (index)
/painel/servicos         → AdminServicesPage
/painel/horarios         → AdminHoursPage
/painel/estabelecimento  → AdminSettingsPage
/painel/configuracoes    → redirect → /painel/estabelecimento
/:slug         → PublicBookingPage (com slug do param)
*              → redirect → /
```

---

## 6. API — Rotas Completas

### Saúde
| Método | Rota | Handler | Descrição |
|---|---|---|---|
| GET | `/health` | `server.ts` inline | Verifica `SELECT 1` no Supabase + status R2 |

### Auth (`/api/auth`)
| Método | Rota | Handler | Descrição |
|---|---|---|---|
| POST | `/api/auth/login` | `loginController` | Valida email+senha (scrypt), emite JWT (30d se rememberMe, 24h se não) |
| GET | `/api/auth/me` | `getMeController` | Retorna user + establishment do token (requer Bearer) |

### Pública (`/api/public`) — sem autenticação
| Método | Rota | Handler | Descrição |
|---|---|---|---|
| GET | `/api/public/establishments/:slug` | `getPublicEstablishment` | Dados do estúdio + serviços ativos + horários |
| GET | `/api/public/establishments/:slug/slots?date=YYYY-MM-DD&serviceId=uuid` | `getPublicSlots` | Slots disponíveis/ocupados |
| POST | `/api/public/establishments/:slug/appointments` | `createPublicBooking` | Cria agendamento (com lock advisory) |

### Admin (`/api/admin`) — requer `Authorization: Bearer <token>`
| Método | Rota | Handler | Descrição |
|---|---|---|---|
| GET | `/api/admin/establishment` | `getAdminEstablishment` | Dados + flag `r2Configured` |
| PUT | `/api/admin/establishment` | `updateAdminEstablishment` | Atualiza dados do estúdio |
| GET | `/api/admin/services` | `getAdminServices` | Lista todos os serviços (incluindo inativos) |
| POST | `/api/admin/services` | `createAdminService` | Cria serviço |
| PUT | `/api/admin/services/:id` | `updateAdminService` | Atualiza serviço |
| DELETE | `/api/admin/services/:id` | `deleteAdminService` | Remove serviço |
| GET | `/api/admin/working-hours` | `getAdminWorkingHours` | Jornada semanal |
| PUT | `/api/admin/working-hours` | `updateAdminWorkingHours` | Salva jornada (upsert por dia) |
| GET | `/api/admin/blocks` | `getAdminBlocks` | Bloqueios a partir de 7 dias atrás |
| POST | `/api/admin/blocks` | `createAdminBlock` | Cria bloqueio |
| DELETE | `/api/admin/blocks/:id` | `deleteAdminBlock` | Remove bloqueio |
| GET | `/api/admin/appointments?date=YYYY-MM-DD` | `getAdminAppointments` | Agendamentos do dia (ou range com `startDate`/`endDate`) |
| GET | `/api/admin/appointments/month-summary?month=YYYY-MM` | `getAdminMonthSummary` | Resumo por dia do mês (count + revenue + bloqueios) |
| PATCH | `/api/admin/appointments/:id/status` | `updateAdminAppointmentStatus` | Atualiza status |
| POST | `/api/admin/upload` | `uploadAdminImage` | Upload imagem (multer memória → R2), campo `file` + `folder` |

**Multer:** memória, limite 5MB por arquivo. Campo esperado: `file` (FormData). Campo `folder`: `'estabelecimentos'` ou `'servicos'` (default: `'servicos'`).

---

## 7. Autenticação e Segurança

### JWT (implementação manual)
- Algoritmo: **HS256** implementado com `crypto.createHmac`
- Sem dependência `jsonwebtoken`
- Funções: `signAuthToken` / `verifyAuthToken` em `genda-core/src/utils/auth.ts`
- Payload: `{ sub, establishmentId, email, name, iat, exp }`
- Expiração: 30 dias (rememberMe) ou 24h (sessão)
- Verificação: `timingSafeEqual` para evitar timing attacks

### Senha (implementação manual)
- Algoritmo: **scrypt** (Node.js `crypto.scryptSync`)
- Formato no banco: `scrypt$<salt-hex-32>$<hash-hex-128>`
- Salt: 16 bytes (`crypto.randomBytes(16).toString('hex')`)
- Hash: 64 bytes derivados
- Verificação: `timingSafeEqual` para evitar timing attacks

### Middleware `requireAuth`
- Extrai `Authorization: Bearer <token>`
- Verifica assinatura e expiração do JWT
- Popula `req.auth = { userId, establishmentId, email, name }`
- Aplicado a **todo** o router `/api/admin` via `adminRouter.use(requireAuth)`
- Aplicado individualmente em `GET /api/auth/me`

### Frontend
- 401 em qualquer request autenticada → `clearAuthSession()` + redirect `/login`
- `RequireAuth` verifica token com `GET /api/auth/me` antes de renderizar rotas protegidas
- Durante verificação: exibe logo pulsando + "Verificando sessão..."

---

## 8. Lógica de Disponibilidade de Slots

**Arquivo:** `genda-core/src/services/availability.service.ts`

Algoritmo executado em `getAvailableSlotsForDate`:

1. Se a data for anterior a hoje (timezone BRT), retorna `[]`.
2. Busca `working_hours` para o `day_of_week` da data.
3. Se o dia está fechado (`is_open = false`), retorna `[]`.
4. Se existe bloqueio `all_day = true` para a data, retorna `[]`.
5. Coleta todos os intervalos bloqueados:
   - Bloqueios parciais do dia (`start_time` → `end_time`)
   - Intervalo de almoço/pausa (`break_start` → `break_end`)
6. Coleta todos os agendamentos ativos (`confirmed` ou `completed`) do dia como intervalos ocupados.
7. Itera de `open_time` até `close_time - duration` com passo `max(15, slot_interval_minutes)`.
8. Para hoje: pula slots cuja `start_time < now + min_advance_minutes`.
9. Para cada slot candidato, verifica sobreposição com todos os intervalos bloqueados/ocupados via `intervalsOverlap(aStart, aEnd, bStart, bEnd) → aStart < bEnd && aEnd > bStart`.
10. Retorna array `SlotOption[]` com `{ time: "HH:MM", available: boolean }`.

---

## 9. Anti-Double-Booking

**Arquivo:** `genda-core/src/services/booking.service.ts`

Fluxo de `createPublicAppointment`:

1. Busca estabelecimento por slug.
2. Abre transação PostgreSQL (`BEGIN`).
3. Adquire `pg_advisory_xact_lock(hashtext('${est.id}:${date}'))` — lock exclusivo por estabelecimento+data dentro da transação. Requisições concorrentes para o mesmo estúdio/dia ficam enfileiradas.
4. Dentro do lock, verifica novamente os slots disponíveis (com o `PoolClient` da transação, lendo dados já bloqueados).
5. Se o slot não está disponível → `BookingError(409, "Este horário não está mais disponível.")`.
6. Calcula `end_time = start + duration`.
7. Insere o agendamento.
8. `COMMIT`.
9. Se qualquer erro → `ROLLBACK` antes de relançar.

`BookingError` é uma classe que estende `Error` com `statusCode`. O `public.controller.ts` trata especificamente esse erro retornando `res.status(err.statusCode).json(...)` em vez de passar para o handler global.

---

## 10. Tipos TypeScript

### Frontend (`genda-app/src/types/genda.ts`)

```typescript
Establishment      // dados do estúdio
ServiceItem        // serviço
WorkingHour        // { day_of_week, is_open, open_time, close_time, break_start, break_end }
ScheduleBlock      // { id, block_date, start_time, end_time, all_day, reason }
SlotOption         // { time: string, available: boolean }
AppointmentStatus  // 'confirmed' | 'completed' | 'cancelled' | 'no_show'
Appointment        // com service_name, service_category
MonthDaySummary    // { total_count, confirmed_count, completed_count, revenue_cents, has_block, block_all_day, block_reason }
AuthUser           // { id, establishment_id, name, email, plan_name, plan_status }
```

### Backend (`genda-core/src/types/genda.types.ts`)

```typescript
AppointmentStatus  // igual ao frontend
EstablishmentRow   // mapeamento direto da tabela
ServiceRow         // mapeamento direto da tabela
WorkingHourRow     // mapeamento direto da tabela
ScheduleBlockRow   // mapeamento direto da tabela
AppointmentRow     // com service_name?, service_category? (joins)
SlotOption         // igual ao frontend
UserRow            // com password_hash
AuthTokenPayload   // { sub, establishmentId, email, name, iat, exp }
```

---

## 11. Cliente HTTP Frontend (`api.ts`)

### Gestão de sessão
```typescript
TOKEN_KEY = 'genda_token'       // localStorage ou sessionStorage
USER_KEY  = 'genda_user'        // localStorage ou sessionStorage

getAuthToken()     // lê localStorage primeiro, depois sessionStorage
getStoredUser()    // desserializa AuthUser
setAuthSession(token, user, rememberMe)  // rememberMe → localStorage, caso contrário → sessionStorage
clearAuthSession() // remove de ambos
```

### Função base `request<T>(path, init?, withAuth?)`
- Adiciona `Content-Type: application/json` exceto quando `body` é `FormData`
- Adiciona `Authorization: Bearer <token>` se `withAuth = true`
- 401 com `withAuth = true` → `clearAuthSession()` + `window.location.href = '/login'` (exceto se já em `/login`)
- Lança `Error` com `data.error` ou `Erro na requisição (${status})`

### Grupos de API
- `authApi` — `login`, `me`
- `publicApi` — `getEstablishment`, `getSlots`, `createAppointment`
- `adminApi` — `getEstablishment`, `updateEstablishment`, `getServices`, `createService`, `updateService`, `deleteService`, `getWorkingHours`, `updateWorkingHours`, `getBlocks`, `createBlock`, `deleteBlock`, `getAppointments`, `getMonthSummary`, `updateAppointmentStatus`, `uploadImage`

---

## 12. Utilitários Frontend (`format.ts`)

```typescript
formatCurrency(cents: number): string
// (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

formatDuration(minutes: number): string
// < 60 → "X min" | >= 60 → "Xh" ou "Xh Ymin"

formatWhatsappInput(value: string): string
// Máscara: (XX) XXXXX-XXXX — apenas dígitos, max 11

toIsoDate(date: Date): string
// YYYY-MM-DD sem timezone issues (usa getFullYear/getMonth/getDate)

DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
DAY_NAMES_FULL  = ['Domingo', 'Segunda-feira', ..., 'Sábado']
```

---

## 13. Utilitários Backend (`time.ts`)

```typescript
timeToMinutes(timeStr: string): number
// "HH:MM" → total de minutos. Usa apenas os 5 primeiros chars.

minutesToTime(totalMinutes: number): string
// total de minutos → "HH:MM" (zero-padded)

intervalsOverlap(aStart, aEnd, bStart, bEnd): boolean
// aStart < bEnd && aEnd > bStart

getDayOfWeekFromDate(dateStr: string): number
// "YYYY-MM-DD" → 0-6. Usa Date.UTC para evitar timezone.

getNowInTimezone(timeZone = env.timezone): { dateIso, minutesOfDay }
// Usa Intl.DateTimeFormat com 'en-CA' + locale parts para extrair data/hora exata no timezone configurado (default: America/Sao_Paulo)
// Trata hora 24 como 0
```

---

## 14. Utilitários Backend (`auth.ts`)

```typescript
hashPassword(password: string): string
// Gera salt de 16 bytes → scrypt 64 bytes → "scrypt$<salt>$<hash>"

verifyPassword(password: string, storedHash: string): boolean
// Extrai salt do hash armazenado → deriva novamente → timingSafeEqual

signAuthToken(payload, expiresInSeconds): string
// Header: { alg: 'HS256', typ: 'JWT' } → base64url
// Payload: { ...payload, iat, exp } → base64url
// Signature: HMAC-SHA256(header.body, JWT_SECRET) → base64url

verifyAuthToken(token: string): AuthTokenPayload | null
// Verifica assinatura com timingSafeEqual + expiração (exp < now → null)
```

---

## 15. Componentes Frontend — Detalhes

### `AdminLayout.tsx`
Layout raiz do painel. Renderiza `<Outlet />` do React Router.

**Desktop:** sidebar fixa (w-64) com:
- Logo `genda-logo-horizontal-dots.svg`
- Nav agrupada em "Operação" (Agenda, Serviços, Horários) e "Negócio" (Estabelecimento)
- Drop-up de conta no rodapé: exibe email, plano, status, link para configurações, botão logout

**Mobile:** topbar sticky (h-14) com logo + link "Ver página" + botão logout. Bottom nav fixo com ícones das 4 seções.

**Estado:** carrega `establishment` via `adminApi.getEstablishment()` para exibir logo + slug no rodapé da sidebar. Fecha o menu ao clicar fora via `mousedown` listener.

### `GendaDatePicker.tsx`
Calendário dropdown customizado.

Props: `value: string` (ISO), `onChange`, `className?`, `placement?: 'bottom' | 'top'`

- Exibe botão com data formatada (DD/MM/YYYY) + ícone calendário
- Dropdown com navegação mensal (chevrons) + grid 7×6 fixo (42 células)
- Células: dias do mês anterior/seguinte em cinza, hoje com borda azul, selecionado com fundo azul
- Botão "Hoje" no rodapé
- Fecha ao clicar fora via `mousedown` listener

### `RequireAuth.tsx`
Guard de rotas protegidas.

1. Se não há token → redirect imediato `/login`
2. Se há token → `GET /api/auth/me` para validar no servidor
3. Durante verificação → tela de loading com logo pulsando
4. Se `me` falha → `clearAuthSession()` + redirect `/login`
5. Se `me` ok → renderiza `<Outlet />`

---

## 16. Páginas Frontend — Detalhes

### `PublicBookingPage.tsx`
Página de agendamento público. Funciona tanto em `/` (usa `DEFAULT_SLUG`) quanto em `/:slug`.

**Fluxo de 3 passos progressivos na mesma tela:**

**Passo 1 — Serviço:**
- Filtro por categoria (pills horizontais, visível apenas se > 2 categorias)
- Lista de serviços com foto (opcional), nome, categoria, preço, duração
- Seleção muda a borda para `brandColor`

**Passo 2 — Dia e Horário:**
- **Bloqueado** (`opacity-50 grayscale pointer-events-none`) até Passo 1 ser completado
- Carrossel horizontal de dias (`max_future_days`, máx 30) com `DAY_NAMES_SHORT`
- Dias fechados (`is_open = false`) aparecem em dashed/cinza, `cursor-not-allowed`
- Ao selecionar serviço, seleciona automaticamente o primeiro dia aberto
- Grade de horários: busca slots via `publicApi.getSlots()` sempre que serviço ou data muda
- Slots indisponíveis: `line-through`, dashed border
- Loading: 8 skeleton pills animados

**Passo 3 — Dados de contato:**
- **Bloqueado** até Passo 2 ser completado (serviço + dia + horário selecionados)
- Campos: nome completo (mín. 2 chars), WhatsApp (máscara, mín. 10 dígitos), observação (opcional)
- **Sem login, senha ou e-mail**

**Resumo:**
- **Desktop:** card lateral fixo (sticky top-20, col-span-4)
- **Mobile:** dock fixo no rodapé com nome do serviço + preço + botão confirmar

**Confirmação:** `publicApi.createAppointment()`. Em caso de sucesso, exibe tela de confirmação com:
- Detalhes do agendamento
- Botão "Enviar comprovante no WhatsApp" (`wa.me/55{phone}?text=...`)
- Botão "Fazer outro agendamento" (reseta o estado)

**`StepPill`:** componente interno (não exportado), exibe número + label com estados: `active`, `completed` (checkmark verde), `locked` (cinza).

**`brandColor`:** `establishment.primary_color` — usado inline em `style` para botões primários, borda de seleção, etc.

### `LoginPage.tsx`
Layout de duas colunas no desktop (5/12 formulário + 7/12 showcase azul). Mobile: hero azul arredondado + card branco sobreposto.

Campos: email, senha (toggle visibilidade), checkbox "Lembrar de mim" (30 dias).

Fluxo: `authApi.login()` → `setAuthSession()` → redirect `/painel`.

"Esqueceu a senha?" exibe aviso inline (sem funcionalidade — redefinição por token planejada).

Contato de suporte: `borges01andre@gmail.com`.

### `AdminAgendaPage.tsx`
Duas visões alternáveis: **Dia** e **Mês**.

**Visão Dia:**
- Carrossel horizontal de 15 dias a partir de hoje
- Cada dia mostra: nome abreviado + número + badge com count de agendamentos
- Dias fechados: `opacity-55`, dashed border
- 3 cards de resumo: Atendimentos, Concluídos, Previsto (soma de ativos)
- Timeline: cards de agendamento com horário, cliente, serviço, status, duração, preço, WhatsApp
- Ações (apenas para `confirmed`): botão "Concluir" (→ `completed`) + botão "Cancelar" (→ `cancelled`)
- Botão WhatsApp: `wa.me/55{cleanPhone}`

**Visão Mês:**
- Calendário mensal com navegação por mês
- Cada célula: número do dia + badges de count + indicador de bloqueio
- Mobile: apenas dots coloridos (azul = tem agendamento, âmbar = tem bloqueio)
- Desktop: count + receita do dia
- Clicar em célula de outro mês navega para aquele mês

**Carregamento de metadados da strip (15 dias):** `loadStripMeta` carrega em paralelo `getWorkingHours` + `getMonthSummary` para todos os meses cobertos pela strip. Atualiza ao mudar status de agendamento.

**`STATUS_META`:** mapeamento de status → `{ label, badgeClass }` para os badges coloridos.

### `AdminServicesPage.tsx`
CRUD de serviços + Regras Globais de Agenda.

**Lista:** grid 2 colunas no desktop, foto (ou placeholder ImagePlus), nome, categoria, preço, duração, status (Ativo/Pausado), botões Editar/Excluir.

**Modal:** cria ou edita serviço. Campos: nome, categoria, duração (min), preço (R$ como string, convertido para cents no submit), is_active, descrição, foto (URL manual ou upload R2).

Upload de foto: `adminApi.uploadImage(file, 'servicos')` → preenche `form.image_url` com a URL retornada.

**Regras Globais:** exibe `slot_interval_minutes`, `min_advance_minutes`, `max_future_days` em inputs numéricos. Salva via `adminApi.updateEstablishment(...)`.

**Exclusão:** usa `confirm()` nativo antes de deletar.

**Estado do formulário:**
```typescript
ServiceFormState {
  name, category, description,
  duration_minutes: number,
  price_reais: string,   // "100.00" — NÃO cents, convertido no submit
  image_url: string,
  is_active: boolean
}
```

### `AdminHoursPage.tsx`
Jornada semanal + bloqueios pontuais.

**Jornada:** lista Domingo→Sábado. Cada dia: checkbox `is_open` + campos de horário (abre, fecha, intervalo início, intervalo fim). Salva todos de uma vez via `adminApi.updateWorkingHours(hours)`.

**Bloqueios:** formulário com GendaDatePicker, checkbox "Dia inteiro", campos de horário parcial (ocultos quando `all_day = true`), campo motivo, botão "Bloquear". Lista de bloqueios existentes com botão remover.

### `AdminSettingsPage.tsx`
Configurações do estabelecimento.

**Identidade Visual & Imagens:** upload de logo + banner para R2 (pasta `estabelecimentos`). Preview inline. 5 swatches de cor pré-definidos + input hex manual.

**Dados do Estúdio:** nome, subtítulo, slug (validado como `[a-z0-9-]+`), bio. Link personalizado com botão "Copiar" (copia `origin/slug`).

**Localização & Contato:** endereço, complemento, WhatsApp (máscara `formatWhatsappInput`).

Salva via `adminApi.updateEstablishment(...)` apenas os campos editáveis (não inclui `slot_interval_minutes` etc., gerenciados em Serviços).

---

## 17. Models Backend — Funções Disponíveis

### `establishment.model.ts`
- `getEstablishmentBySlug(slug)` → `EstablishmentRow | null`
- `getEstablishmentById(id)` → `EstablishmentRow | null`
- `resolveEstablishmentId(slugParam?)` → `string | null` (fallback: primeiro establishment por `created_at`)
- `updateEstablishmentById(id, data)` → `EstablishmentRow | null` — usa `COALESCE` + `CASE WHEN $n::boolean THEN $m ELSE col END` para campos nullable (logo_url, banner_url)

### `service.model.ts`
- `getActiveServicesByEstablishment(estId)` → `ServiceRow[]` (apenas `is_active = true`, ordenado por `sort_order`)
- `getAllServicesByEstablishment(estId)` → `ServiceRow[]` (incluindo inativos)
- `getActiveServiceById(serviceId, estId, client?)` → `ServiceRow | null`
- `createService(estId, data)` → `ServiceRow`
- `updateServiceById(id, data)` → `ServiceRow | null` (mesma estratégia de `CASE WHEN` para `image_url`)
- `deleteServiceById(id)` → `boolean`

### `workingHours.model.ts`
- `getWorkingHoursByEstablishment(estId)` → `WorkingHourRow[]` (ordenado por `day_of_week`)
- `getWorkingHourByDay(estId, dayOfWeek, client?)` → `WorkingHourRow | null`
- `upsertWorkingHours(estId, workingHours)` → `WorkingHourRow[]` — transação com `INSERT ... ON CONFLICT DO UPDATE`

### `scheduleBlock.model.ts`
- `getScheduleBlocksByDate(estId, date, client?)` → retorna apenas `{ all_day, start_time, end_time }`
- `getScheduleBlocksInRange(estId, startDate, endDate)` → `ScheduleBlockRow[]`
- `getUpcomingScheduleBlocks(estId)` → bloqueios a partir de 7 dias atrás
- `createScheduleBlock(estId, data)` → `ScheduleBlockRow`
- `deleteScheduleBlockById(id)` → `void`

### `appointment.model.ts`
- `getActiveAppointmentIntervals(estId, date, client?)` → `{ start_time, end_time }[]` (apenas `confirmed` ou `completed`)
- `getAppointmentsByEstablishment(estId, date, startDate?, endDate?)` → `AppointmentRow[]` com JOIN em `services`
- `getMonthlyAppointmentSummary(estId, startDate, endDate)` → agregação por dia (total, confirmed, completed, revenue excluindo cancelled)
- `insertAppointment(client, data)` → `AppointmentRow` (sempre dentro de transação)
- `updateAppointmentStatusById(id, status)` → `{ id, status } | null`

### `user.model.ts`
- `getUserByEmail(email)` → `UserRow | null` (case-insensitive via `lower()`)
- `getUserById(id)` → `Omit<UserRow, 'password_hash'> | null`

---

## 18. Zod Schemas no Backend (admin.controller.ts)

```typescript
updateEstablishmentSchema: {
  slug: string.trim().min(2).regex(/^[a-z0-9-]+$/).optional()
  name: string.trim().min(2).optional()
  primary_color: string.regex(/^#[0-9a-fA-F]{6}$/).optional()
  slot_interval_minutes: number.int().min(10).max(120).optional()
  min_advance_minutes: number.int().min(0).max(1440).optional()
  max_future_days: number.int().min(1).max(180).optional()
  // + subtitle, bio, logo_url, banner_url, address, address_complement, whatsapp
}

serviceSchema: {
  name: string.trim().min(2)
  category: string.trim().min(1) default('Geral')
  duration_minutes: number.int().min(10).max(480)
  price_cents: number.int().min(0)
  is_active: boolean default(true)
  sort_order: number.int() default(0)
  // + description, image_url (nullable)
}

workingHoursArraySchema: {
  workingHours: Array<{
    day_of_week: number.int().min(0).max(6)
    is_open: boolean
    open_time: string.regex(/^\d{2}:\d{2}/)
    close_time: string.regex(/^\d{2}:\d{2}/)
    break_start: string.regex(...).nullable().optional()
    break_end: string.regex(...).nullable().optional()
  }>
}
// Validação extra no controller: open < close, break dentro do horário

blockSchema: {
  block_date: string.regex(/^\d{4}-\d{2}-\d{2}$/)
  all_day: boolean default(false)
  start_time: string.regex(/^\d{2}:\d{2}$/).nullable().optional()
  end_time: string.regex(/^\d{2}:\d{2}$/).nullable().optional()
  reason: string.trim() default('')
}

createAppointmentSchema (public.controller): {
  serviceId: string.uuid()
  date: string.regex(/^\d{4}-\d{2}-\d{2}$/)
  startTime: string.regex(/^\d{2}:\d{2}$/)
  clientName: string.trim().min(2)
  clientWhatsapp: string.trim().min(8)
  notes: string.trim().max(500).optional()
}
```

---

## 19. Identidade Visual — Paleta de Cores Completa

**Use apenas estes valores. Nunca invente cores novas.**

| Token semântico | Valor hex | Uso |
|---|---|---|
| Fundo de página | `#F8F9FF` | Background geral (`bg-[#F8F9FF]`) |
| Superfície secundária | `#F4F8FF` | Cards internos, inputs, superfícies elevadas |
| Hover suave | `#E5EEFF` | Hover em elementos secundários |
| Azul ação/seleção | `#1D4ED8` | Botões primários, estado selecionado, ícones principais |
| Azul hover | `#1E40AF` | Hover de botões primários (`hover:bg-[#1E40AF]`) |
| Azul título/preço | `#1E3A8A` | Headings, valores monetários, texto de destaque |
| Azul título escuro | `#0A1C30` | Titles de páginas (usado em LoginPage) |
| Azul claro | `#93C5FD` | Hover de bordas, estados disabled de botões |
| Azul pastel | `#DBEAFE` | Bordas, dividers, fundos de badges |
| Verde confirmação | `#10B981` | Status ativo, confirmações, WhatsApp |
| Verde hover | `#059669` | Hover no botão WhatsApp |
| Verde escuro | `#047857` | Texto em badges verdes |
| Verde fundo badge | `#10B981/10` ou `#10B981/15` | Background de badge "Ativo" |
| Texto secundário | `#5A6B82` | Labels, descrições, placeholders |
| Branco | `#FFFFFF` | Superfície principal de cards |

**Tipografia:** `Plus Jakarta Sans` (via CSS global).

**Bordas e sombras padrão:**
- Border: `border border-[#DBEAFE]`
- Card shadow (drop-up): `0px 10px 25px -5px rgba(30, 58, 138, 0.14), 0px 4px 10px -2px rgba(30, 58, 138, 0.05)`
- Datepicker shadow: `0px 10px 25px -5px rgba(30, 58, 138, 0.12), 0px 4px 10px -2px rgba(30, 58, 138, 0.05)`

**Classes CSS customizadas (definidas globalmente):**
- `.genda-card` — card branco com borda e arredondamento padrão
- `.genda-dock` — dock mobile (bottom bar) com backdrop blur

---

## 20. Padrões de Código — Regras Absolutas

### Frontend
1. **Named exports** em todos os componentes: `export function ComponentName()`.
2. **Sem `cn()` utility** — Tailwind inline direto com template literals.
3. **Requests SEMPRE via `api.ts`** — nunca `fetch` diretamente em componentes.
4. **Sem comentários explicativos** — apenas comentários de "porquê" quando o comportamento for não-óbvio.
5. **Sem novas libs** sem justificativa explícita na task.
6. **Nomes de arquivos:** PascalCase para componentes/páginas, camelCase para utils/services/types.
7. **Imagens de serviço** no upload: pasta `'servicos'`. Imagens do estúdio: pasta `'estabelecimentos'`.
8. **Valores monetários** sempre em centavos no código/API. Conversão para display via `formatCurrency`.
9. **Datas** sempre como string ISO `YYYY-MM-DD`. Conversão via `toIsoDate`. Nunca `new Date().toISOString().split('T')[0]` (timezone unsafe).

### Backend
1. **SQL puro** — sem query builders, sem ORMs.
2. **Validação Zod** em todo controller antes de qualquer lógica.
3. **Erros via `next(err)`** — handler global em `server.ts`. Exceção: `BookingError` tratado inline no `public.controller.ts`.
4. **`PoolClient` passado como parâmetro** quando dentro de transação — nunca abrir nova conexão dentro de transação existente.
5. **`::text` cast** em queries para campos `time` e `date` — pg retorna objetos Date por padrão, mas precisamos de strings.
6. **Sem refresh tokens** — JWT simples, sessão expira e redireciona para login.

---

## 21. Como Rodar Localmente

### Backend
```bash
cd genda-core
docker compose up -d --build
# API disponível em http://localhost:4000
# Checar: GET http://localhost:4000/health
```

### Frontend
```bash
cd genda-app
npm run dev
# Frontend em http://localhost:5173
# Página pública: http://localhost:5173/studio-aura
# Painel: http://localhost:5173/painel
```

### Scripts disponíveis
**genda-app:** `dev`, `build` (tsc + vite build), `preview`
**genda-core:** `dev` (tsx watch), `build` (tsc), `start` (node dist/server.js)

---

## 22. Seed de Demonstração

Estabelecimento: `studio-aura` — "Studio Aura Aesthetics"

Serviços (5):
1. Design de Sobrancelhas + Lash Lifting — 60min — R$ 160,00 — Cílios & Sobrancelhas
2. Corte & Finalização Studio — 60min — R$ 140,00 — Cabelo
3. Manicure Completa + Esmaltação em Gel — 75min — R$ 110,00 — Unhas
4. Limpeza de Pele Profunda + LED — 90min — R$ 220,00 — Estética Facial
5. Extensão Volume Russo — 120min — R$ 240,00 — Cílios & Sobrancelhas

Horários (padrão):
- Dom: Fechado
- Seg–Sex: 09:00–19:00, intervalo 12:00–13:00
- Sáb: 09:00–20:00, intervalo 12:00–13:00
- Dom: 09:00–17:00, sem intervalo

Agendamentos de demonstração: Mariana Costa (10:00–11:00) e Camila Ferreira (14:30–15:45) no dia atual.
