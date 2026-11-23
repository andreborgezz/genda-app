# Genda — Documentação de Arquitetura e Contexto (`application.md`)

## 1. Visão Geral do Projeto

O **Genda** é um sistema de agendamento online voltado para profissionais e estúdios de estética, beleza, barbearias e cuidados pessoais. O foco principal é oferecer uma **experiência pública sem fricção** (sem login, senha ou e-mail obrigatório) combinada a um **painel completo de gestão** para o profissional/dono.

### Identidade Visual
- **Tema:** Claro (`#FFFFFF` base, `#F8F9FF` fundo de página, `#F4F8FF` superfícies secundárias).
- **Cores principais:** Azul Royal (`#1D4ED8` para ações e seleções), Azul Marinho (`#1E3A8A` para títulos e preços), Verde Esmeralda (`#10B981` para confirmações e status ativos), Bordas (`#DBEAFE`).
- **Tipografia:** `Plus Jakarta Sans`.
- **Assets de marca:** `genda-app/src/assets/genda-icon-dots.svg` e `genda-app/src/assets/genda-logo-horizontal-dots.svg` (também usado como `public/favicon.svg`).

---

## 2. Estrutura de Pastas e Estratégia de Git

```text
genda-app/ (raiz do repositório)
├── database/               # Scripts SQL puros para o Supabase (PostgreSQL)
│   ├── 001_schema.sql      # Tabelas, índices e constraints
│   └── 002_seed.sql        # Dados iniciais de demonstração (studio-aura)
├── genda-core/             # Backend Node.js + Express + TypeScript + pg puro (sem ORM)
│   ├── Dockerfile
│   ├── docker-compose.yml  # Container único do backend (sem banco/storage local)
│   ├── .env / .env.example
│   └── src/
│       ├── config/         # env.ts, db.ts (pg.Pool), r2.ts (Cloudflare R2 S3Client)
│       ├── routes/         # public.routes.ts, admin.routes.ts
│       ├── services/       # availability.service.ts (cálculo de slots disponíveis)
│       ├── utils/          # time.ts (conversões de horário e sobreposição)
│       └── server.ts       # Bootstrap Express, CORS, /health
├── genda-app/              # Frontend React + TypeScript + Vite + Tailwind CSS v4
│   ├── vercel.json         # Rewrite SPA para deploy futuro na Vercel
│   ├── .env / .env.example
│   └── src/
│       ├── assets/         # Logos SVG oficiais do Genda
│       ├── components/     # AdminLayout.tsx (sidebar desktop + bottom nav mobile)
│       ├── pages/
│       │   ├── PublicBookingPage.tsx
│       │   └── admin/      # AdminAgendaPage, AdminServicesPage, AdminHoursPage, AdminSettingsPage
│       ├── services/       # api.ts (cliente HTTP tipado)
│       ├── types/          # genda.ts
│       └── utils/          # format.ts (BRL, duração, máscara WhatsApp, datas)
├── stitch_gendaapp/        # Protótipos e DESIGN.md exportados do Google Stitch
└── application.md          # Este documento de contexto
```

### Estratégia de Branches
- **`main`**: Branch ativa de desenvolvimento e commits contínuos.
- **`prod`**: Branch de produção criada a partir da base estável para deploys controlados.

---

## 3. Banco de Dados — Supabase (PostgreSQL)

- **Projeto Supabase:** `ygkcfmjivsluisquprnv` (`https://ygkcfmjivsluisquprnv.supabase.co`).
- **Acesso no backend:** SQL puro via `pg.Pool` (`DATABASE_URL` com SSL).
- **Scripts:** localizados em `database/001_schema.sql` e `database/002_seed.sql`.

### Tabelas Principais
1. **`public.establishments`**
   - Armazena os dados do estúdio/profissional: `id`, `slug` (único, ex: `studio-aura`), `name`, `subtitle`, `bio`, `logo_url`, `banner_url`, `primary_color`, `address`, `address_complement`, `whatsapp`.
   - Regras globais de agenda: `slot_interval_minutes` (padrão 30), `min_advance_minutes` (padrão 60), `max_future_days` (padrão 30).
2. **`public.services`**
   - Vitrine de serviços vinculada a `establishment_id`: `name`, `category`, `description`, `duration_minutes`, `price_cents`, `image_url`, `is_active`, `sort_order`.
   - Índice: `idx_services_establishment_active (establishment_id, is_active, sort_order)`.
3. **`public.working_hours`**
   - Grade semanal (`day_of_week` de `0` = Domingo a `6` = Sábado) com `is_open`, `open_time`, `close_time`, `break_start`, `break_end`.
   - Constraint `UNIQUE (establishment_id, day_of_week)`.
4. **`public.schedule_blocks`**
   - Bloqueios pontuais (feriados, folgas, compromissos): `block_date`, `all_day`, `start_time`, `end_time`, `reason`.
   - Índice: `idx_schedule_blocks_est_date (establishment_id, block_date)`.
5. **`public.appointments`**
   - Reservas dos clientes sem exigir login: `establishment_id`, `service_id`, `client_name`, `client_whatsapp`, `notes`, `appointment_date`, `start_time`, `end_time`, `price_cents`, `duration_minutes`, `status` (`confirmed`, `completed`, `cancelled`, `no_show`).
   - Índice: `idx_appointments_est_date_status (establishment_id, appointment_date, status)`.

---

## 4. Backend (`genda-core`) e Serviços Externos

### Docker Compose (Container Único)
O arquivo `genda-core/docker-compose.yml` sobe **apenas o serviço `genda-core`** na porta `4000`, conectando-se externamente ao Supabase e ao Cloudflare R2 via variáveis de ambiente (`.env`).

### Integração Cloudflare R2
- **Bucket:** `genda-dev`
- **Endpoint S3:** `https://ef97a1179c0ed6484714045cb9783f49.r2.cloudflarestorage.com`
- **SDK:** `@aws-sdk/client-s3` (`PutObjectCommand`) via `POST /api/admin/upload` (campo `file` em `multipart/form-data` + `folder` opcional `establishments` ou `services`).
- **Variáveis necessárias no `.env` do `genda-core`:** `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL` (além de `R2_ENDPOINT`, `R2_BUCKET`, `R2_REGION=auto`).

### Rotas da API
- **Saúde:**
  - `GET /health` — Verifica conexão com Supabase (`SELECT 1`) e status de configuração do R2.
- **Públicas (`/api/public`):**
  - `GET /api/public/establishments/:slug` — Retorna dados do estabelecimento, serviços ativos e horários de funcionamento.
  - `GET /api/public/establishments/:slug/slots?date=YYYY-MM-DD&serviceId=<uuid>` — Calcula os horários livres e ocupados considerando `working_hours`, `break_start/end`, `schedule_blocks`, `appointments` ativos e a duração do serviço.
  - `POST /api/public/establishments/:slug/appointments` — Cria o agendamento usando transação PostgreSQL + `pg_advisory_xact_lock(hashtext(establishmentId:date))` para impedir conflitos simultâneos no mesmo horário.
- **Painel (`/api/admin`):**
  - `GET /api/admin/establishment` | `PUT /api/admin/establishment`
  - `GET /api/admin/services` | `POST /api/admin/services` | `PUT /api/admin/services/:id` | `DELETE /api/admin/services/:id`
  - `GET /api/admin/working-hours` | `PUT /api/admin/working-hours`
  - `GET /api/admin/blocks` | `POST /api/admin/blocks` | `DELETE /api/admin/blocks/:id`
  - `GET /api/admin/appointments?date=YYYY-MM-DD` | `PATCH /api/admin/appointments/:id/status`
  - `POST /api/admin/upload`

---

## 5. Frontend (`genda-app`) — Fluxos e Telas

### Fluxo Público (`/` e `/:slug`)
- **Página única responsiva** (`PublicBookingPage.tsx`) com **3 passos progressivos na mesma tela**:
  1. **Passo 1 — Serviço:** Filtro por categoria e seleção do serviço (duração + preço).
  2. **Passo 2 — Dia e Horário:** Inicia **bloqueado/acinzentado** (`opacity-50 pointer-events-none`) até o cliente escolher um serviço no Passo 1. Exibe carrossel horizontal de dias e grade de horários em tempo real.
  3. **Passo 3 — Seus dados de contato:** Inicia **bloqueado/acinzentado** até o cliente escolher dia e horário no Passo 2. Solicita apenas **Nome completo** e **WhatsApp** (sem login, senha ou e-mail).
- **Resumo & Confirmação:** Dock fixo no rodapé no mobile e card lateral fixo no desktop. Após confirmar, exibe tela de sucesso com link direto para enviar o comprovante no WhatsApp do estúdio.

### Painel do Profissional (`/painel`)
Layout responsivo (`AdminLayout.tsx`) com sidebar fixa no desktop e barra inferior fixa no mobile:
1. **`/painel` (`AdminAgendaPage.tsx`)**: Visão do dia, seletor rápido de datas, cards de resumo (Atendimentos, Concluídos, Previsto) e linha do tempo com ações (WhatsApp do cliente, Concluir, Cancelar).
2. **`/painel/servicos` (`AdminServicesPage.tsx`)**: CRUD completo de serviços com upload de foto para o R2 e edição das Regras Globais de Agenda (`slot_interval_minutes`, `min_advance_minutes`, `max_future_days`).
3. **`/painel/horarios` (`AdminHoursPage.tsx`)**: Configuração da jornada semanal (Seg–Dom, abertura, fechamento, intervalo) e criação/remoção de bloqueios pontuais de agenda.
4. **`/painel/configuracoes` (`AdminSettingsPage.tsx`)**: Upload de Logo e Banner no R2, cor principal, nome, subtítulo, link personalizado (`genda.me/:slug` com botão copiar), bio, endereço e WhatsApp.

---

## 6. Como Rodar Localmente

1. **Backend (`genda-core` em Docker):**
   ```bash
   cd genda-core
   docker compose up -d --build
   ```
   API disponível em `http://localhost:4000` (`/health`).

2. **Frontend (`genda-app`):**
   ```bash
   cd genda-app
   npm run dev
   ```
   Interface disponível em `http://localhost:5173` (página pública) e `http://localhost:5173/painel` (painel do profissional).
