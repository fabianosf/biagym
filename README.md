# BiAGym

Aplicativo de treinos multiplataforma (iOS, Android e Web) para alunas consumirem programas em vídeo, acompanharem progresso e assistirem aulas offline.

## Stack

- **Expo SDK 57** + React Native + TypeScript (strict)
- **Expo Router** — navegação file-based
- **NativeWind v4** + Tailwind CSS 3 — UI
- **Supabase** — auth, banco, storage e RLS
- **Zustand** — estado global (auth, offline)
- **expo-video** — player de aulas
- **expo-file-system** + **NetInfo** — downloads e sync offline

## Arquitetura

```
app/              → rotas finas (Expo Router)
src/domain/       → tipos e regras puras (sem UI/SDK)
src/services/     → Supabase, storage, sync, downloads
src/features/     → telas, hooks e componentes por área
src/shared/       → UI reutilizável, erros, constantes
supabase/         → schema, seed, storage, migrations
```

**Princípio:** rotas só reexportam screens das features. Regras de negócio ficam em `domain/`; integrações em `services/`.

## Pré-requisitos

- Node.js 20+
- npm
- Conta [Expo](https://expo.dev) (para EAS Build)
- Projeto [Supabase](https://supabase.com) configurado

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Variáveis de ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha:

| Variável | Descrição |
|----------|-----------|
| `EXPO_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Chave anon/public |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | (opcional) ID do projeto EAS após `eas init` |
| `EXPO_PUBLIC_SENTRY_DSN` | DSN do projeto Sentry |
| `EXPO_PUBLIC_APP_ENV` | `development` \| `staging` \| `production` |
| `EXPO_PUBLIC_SENTRY_ENABLED_IN_DEV` | `true` para testar Sentry localmente |

### 3. Banco de dados Supabase

Execute no **SQL Editor**, nesta ordem:

1. `supabase/schema.sql`
2. `supabase/seed.sql` (opcional, dados de exemplo)
3. `supabase/storage.sql` (bucket de vídeos)
4. `supabase/phase8-progress-offline.sql` (coluna `last_lesson_id`)
5. `supabase/phase10-notifications.sql` (push token + preferências)

Deploy da Edge Function:

```bash
supabase functions deploy send-push-notification
```

### 4. Sentry

1. Crie projeto **React Native** em [sentry.io](https://sentry.io)
2. Copie o DSN para `EXPO_PUBLIC_SENTRY_DSN`
3. Produção: `EXPO_PUBLIC_APP_ENV=production`
4. Dev: Sentry desligado por padrão (sem poluição de logs)

### 5. Push notifications

1. `eas init` → `EXPO_PUBLIC_EAS_PROJECT_ID`
2. Build em dispositivo físico (não Expo Go)
3. iOS: credenciais APNs via `eas credentials`
4. Perfil → ativar notificações → teste

## Desenvolvimento

```bash
# Servidor Expo (limpar cache)
npm run start:clear

# Plataformas
npm run android
npm run ios
npm run web

# Verificação TypeScript
npm run typecheck
```

> **Expo Go:** para recursos nativos completos (vídeo, downloads, NetInfo), prefira um **development build** (`npm run build:dev`).

## Rotas principais

| Rota | Área |
|------|------|
| `/` | Catálogo (Meus Itens + Explorar) |
| `/programs/[id]` | Detalhe do programa |
| `/programs/[id]/lessons/[lessonId]` | Player de aula |
| `/progress` | Progresso do aluno |
| `/profile` | Perfil e logout |
| `/sign-in` `/sign-up` | Autenticação |
| `/admin` | Dashboard administrativo |
| `/admin/programs` | Gestão de programas |
| `/admin/students/[id]` | Espaço do aluno (liberação de fichas e programas) |

## Builds de produção (EAS)

### Setup inicial (uma vez)

```bash
npm install -g eas-cli
eas login
eas init
```

Atualize `EXPO_PUBLIC_EAS_PROJECT_ID` no `.env` e ajuste `eas.json` → `submit.production.ios` com seu Apple ID e Team ID.

### Comandos

```bash
# Build interno para testes (APK Android)
npm run build:preview

# Produção — Google Play (AAB)
npm run build:android

# Produção — App Store (IPA)
npm run build:ios

# Enviar às lojas (após build)
npm run submit:android
npm run submit:ios
```

### Perfis EAS (`eas.json`)

| Perfil | Uso |
|--------|-----|
| `development` | Dev client + simulador iOS |
| `preview` | APK interno / testes QA |
| `production` | App Store + Google Play (autoIncrement) |

## Publicação nas lojas — checklist

### Antes do build

- [ ] `.env` de produção apontando para Supabase de produção
- [ ] SQL schema + storage + RLS executados no Supabase prod
- [ ] Ícones e splash em `assets/images/` revisados
- [ ] `app.config.ts`: `version`, `buildNumber` / `versionCode`
- [ ] `eas.json`: Apple ID, Team ID, ASC App ID preenchidos
- [ ] Testar fluxos: login, catálogo, player, progresso offline, admin

### App Store Connect (iOS)

- [ ] Criar app com bundle ID `com.biagym.app`
- [ ] Preencher metadados (nome, subtítulo, descrição, keywords)
- [ ] Screenshots (6.7", 6.5", iPad se suportado)
- [ ] Política de privacidade (URL pública)
- [ ] Classificação etária e questionário de exportação (ITSAppUsesNonExemptEncryption: false)
- [ ] Conta de teste para revisão da Apple
- [ ] Upload via `eas submit` ou Transporter

### Google Play Console (Android)

- [ ] Criar app com package `com.biagym.app`
- [ ] Ficha da loja (descrição curta/longa, ícone, feature graphic)
- [ ] Screenshots phone + tablet
- [ ] Política de privacidade (URL)
- [ ] Formulário de conteúdo do app (Data safety)
- [ ] Upload AAB via `eas submit` ou Play Console
- [ ] Track internal → closed → production

### Conteúdo legal recomendado

- [ ] Política de privacidade (LGPD)
- [ ] Termos de uso
- [ ] Aviso médico no app (já implementado no player)

## Decisões técnicas principais

| Decisão | Motivo |
|---------|--------|
| Domain-driven + services | Testabilidade e evolução sem acoplamento à UI |
| Progresso offline com fila sequencial | Evita perda de dados e race conditions |
| `mergeRemoteProgress` (union) | Progresso local nunca sobrescrito pelo servidor |
| Bucket público + RLS admin | Player simples; escrita restrita |
| `expo-image` com cache | Performance em listas com capas |
| `AppErrorBoundary` global | Evita tela branca em erros de render |
| `getFriendlyErrorMessage` | Mensagens padronizadas auth + dados + timeout |

## Estrutura de fases concluídas

1. Fundação (Expo, Router, NativeWind)
2. Domínio (entidades, rules, DTOs)
3. Autenticação (Supabase Auth + proteção de rotas)
4. Backend (schema, RLS, services)
5. Navegação e telas do aluno
6. Player e consumo de conteúdo
7. Área administrativa
8. Progresso avançado + offline
9. Polimento e publicação
10. Observabilidade (Sentry) + Push notifications ← **fase atual**

## Fase 10 – Sentry + Push (testes)

### Sentry
1. Defina `EXPO_PUBLIC_SENTRY_ENABLED_IN_DEV=true` e `EXPO_PUBLIC_SENTRY_DSN=...`
2. Adicione botão temporário ou force erro no boundary
3. Verifique evento no dashboard Sentry (user id + role, sem e-mail)

### Push
1. Build dev/prod em dispositivo físico
2. Perfil → ativar notificações (permite permissão neste momento)
3. Token salvo em `profiles.expo_push_token`
4. Toque em **Enviar notificação de teste**
5. Edge Function envia via Expo Push API

## Melhorias futuras (pós-v1)

- Cache offline de metadados de programas (catálogo sem internet)
- Cron de lembretes (“3 dias sem treinar”) via Supabase Scheduled Functions
- Analytics (Firebase/Mixpanel)
- Internacionalização (i18n)
- Testes E2E automatizados (Maestro / Detox)
- Otimização de listas longas com FlashList

## Licença

Projeto privado — todos os direitos reservados.
