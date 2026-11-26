---
status: done
---

## Objetivo

Implementar o fluxo completo de redefinição de senha via e-mail usando Resend: banco → backend → frontend.

---

## Contexto adicional

- O `.env` do `genda-core` já tem as variáveis do Resend configuradas. Leia o arquivo `genda-core/.env` para saber os nomes exatos das variáveis antes de implementar.
- A senha hoje usa scrypt manual em `genda-core/src/utils/auth.ts` — funções `hashPassword` e `verifyPassword`. Use as mesmas funções para salvar a nova senha.
- O JWT também é manual (`signAuthToken` / `verifyAuthToken` em `auth.ts`). O token de reset **não** usa JWT — é um token aleatório seguro (`crypto.randomBytes`).
- Não há ORM. Todo SQL é puro via `pg.Pool`. Siga o padrão dos models existentes em `genda-core/src/models/`.
- A tabela `users` está em `database/003_auth_users.sql`. O novo script de migration deve ser `database/004_password_reset_tokens.sql`.
- No frontend, "Esqueceu a senha?" já existe como texto na `LoginPage.tsx` mas exibe apenas um aviso inline sem funcionalidade. Substitua esse comportamento pelo fluxo real.
- A identidade visual completa está na seção 19 do `context.md`. Use **apenas** as cores, tipografia e padrões descritos lá.
- O frontend usa React Router DOM v7. A nova rota `/redefinir-senha` deve ser adicionada em `genda-app/src/App.tsx` como rota pública (fora do `RequireAuth`).

---

## O que implementar — passo a passo

### 1. Banco de Dados

Criar `database/004_password_reset_tokens.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL,         -- SHA-256 do token raw
  expires_at  timestamptz NOT NULL,
  used        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prt_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX idx_prt_token_hash ON public.password_reset_tokens(token_hash);
```

Executar no Supabase (conexão em `genda-core/src/config/db.ts`).

---

### 2. Backend

#### 2.1 Instalar Resend
```bash
cd genda-core && npm install resend
```

#### 2.2 Serviço de e-mail — `genda-core/src/services/email.service.ts`

- Instanciar `Resend` com a chave do `.env`.
- Exportar função `sendPasswordResetEmail(to: string, resetUrl: string): Promise<void>`.
- E-mail em português, HTML simples, com o link de redefinição.
- Leia os nomes exatos das variáveis do `.env` antes de implementar (ex: `RESEND_API_KEY`, `RESEND_FROM`, etc.).
- Adicione as variáveis lidas ao `genda-core/src/config/env.ts`.

#### 2.3 Model — `genda-core/src/models/passwordResetToken.model.ts`

Funções:
- `createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>`
- `findValidToken(tokenHash: string): Promise<{ id: string; user_id: string } | null>` — busca onde `used = false` e `expires_at > now()`
- `markTokenAsUsed(id: string): Promise<void>`
- `deleteExpiredTokensForUser(userId: string): Promise<void>` — limpa tokens antigos antes de criar um novo

#### 2.4 Controller — adicionar em `genda-core/src/controllers/auth.controller.ts`

**`requestPasswordResetController`:**
1. Valida body com Zod: `{ email: string.email() }`
2. Busca usuário por email (`getUserByEmail`)
3. Se não existir → retorna `200` com mensagem neutra (não revela existência do e-mail)
4. Deleta tokens expirados do usuário (`deleteExpiredTokensForUser`)
5. Gera token raw: `crypto.randomBytes(32).toString('hex')` (64 chars)
6. Hash: `crypto.createHash('sha256').update(tokenRaw).digest('hex')`
7. Salva no banco com expiração de **1 hora**
8. Monta URL: `${env.appUrl}/redefinir-senha?token=${tokenRaw}`
9. Envia e-mail via `sendPasswordResetEmail`
10. Retorna `200` com mensagem neutra independente do resultado

**`confirmPasswordResetController`:**
1. Valida body com Zod: `{ token: string.min(1), password: string.min(8) }`
2. Hash o token recebido
3. Busca token válido no banco (`findValidToken`)
4. Se não encontrar → `400` "Token inválido ou expirado."
5. Faz hash da nova senha com `hashPassword`
6. Atualiza `password_hash` na tabela `users` onde `id = token.user_id`
7. Marca token como usado (`markTokenAsUsed`)
8. Retorna `200` "Senha redefinida com sucesso."

#### 2.5 Rotas — `genda-core/src/routes/auth.routes.ts`

Adicionar:
```
POST /api/auth/request-password-reset  → requestPasswordResetController
POST /api/auth/confirm-password-reset  → confirmPasswordResetController
```

#### 2.6 Variável de ambiente — `genda-core/src/config/env.ts`

Adicionar `appUrl` lendo `APP_URL` do `.env` (ex: `http://localhost:5173` em dev).

---

### 3. Frontend

#### 3.1 API — `genda-app/src/services/api.ts`

Adicionar em `authApi`:
```typescript
requestPasswordReset: (email: string) =>
  request('/api/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email }) })

confirmPasswordReset: (token: string, password: string) =>
  request('/api/auth/confirm-password-reset', { method: 'POST', body: JSON.stringify({ token, password }) })
```

#### 3.2 LoginPage — `genda-app/src/pages/LoginPage.tsx`

Substituir o aviso inline de "Esqueceu a senha?" por um mini-formulário inline:
- Ao clicar em "Esqueceu a senha?", a área de login colapsa e exibe um campo de e-mail + botão "Enviar link"
- Chama `authApi.requestPasswordReset(email)`
- Exibe mensagem neutra de sucesso: "Se esse e-mail estiver cadastrado, você receberá um link em instantes."
- Link "Voltar ao login" para fechar o mini-formulário
- Manter toda a identidade visual existente da LoginPage

#### 3.3 Nova página — `genda-app/src/pages/ResetPasswordPage.tsx`

- Lê `?token=` da URL via `useSearchParams`
- Se não houver token → redireciona `/login`
- Exibe formulário com dois campos: "Nova senha" (mín. 8 chars) + "Confirmar nova senha" (deve ser igual)
- Toggle de visibilidade em ambos os campos (mesmo padrão da LoginPage)
- Botão "Redefinir senha" → chama `authApi.confirmPasswordReset(token, password)`
- Sucesso → mensagem "Senha redefinida! Redirecionando..." + `setTimeout` de 2s → redirect `/login`
- Erro → exibe mensagem de erro inline (mesmo padrão da LoginPage)
- Layout idêntico ao da LoginPage (mesma estrutura de duas colunas no desktop, hero + card no mobile)
- **Não** reaproveia o componente `LoginPage` — crie a página do zero seguindo os mesmos padrões visuais

#### 3.4 Rota — `genda-app/src/App.tsx`

Adicionar antes das rotas de `/painel`:
```tsx
<Route path="/redefinir-senha" element={<ResetPasswordPage />} />
```

---

## Critérios de conclusão

- [ ] `database/004_password_reset_tokens.sql` criado e executado no Supabase
- [ ] `npm install resend` feito em `genda-core`
- [ ] `sendPasswordResetEmail` enviando e-mail real via Resend
- [ ] `POST /api/auth/request-password-reset` retorna 200 sempre (sem vazar existência de e-mail)
- [ ] `POST /api/auth/confirm-password-reset` valida token, expira em 1h, atualiza senha
- [ ] Token marcado como `used` após uso (não pode ser reutilizado)
- [ ] Frontend: fluxo "Esqueci minha senha" na LoginPage funcional
- [ ] Frontend: página `/redefinir-senha?token=...` funcional
- [ ] `tsc --noEmit` passa sem erros em `genda-app` e `genda-core`
- [ ] Nenhuma nova biblioteca além de `resend` foi adicionada
