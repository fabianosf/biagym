# TreinosAtleta — Prompts Completos das Fases 1 a 10

**Projeto:** TreinosAtleta  
**Stack:** React Native + Expo + TypeScript + NativeWind + Supabase  
**Data:** 15/08/2026

---

## Prompt da Fase 1 — Fundação do Projeto

```text
Você é um Arquiteto Fullstack TypeScript Sênior especializado em React Native + Expo.

Sua tarefa é criar a fundação completa e profissional do projeto de um aplicativo de treinos (fitness) multiplataforma.

### Contexto do Projeto
- Nome temporário do app: "TreinosAtleta" (pode ser alterado depois)
- Stack obrigatória:
  - React Native + Expo (SDK mais recente estável)
  - TypeScript (strict mode)
  - Expo Router (file-based routing)
  - NativeWind (Tailwind CSS para React Native)
  - Supabase (será integrado nas próximas fases)
- O app terá as seguintes áreas principais:
  - Autenticação de alunos e admin
  - Catálogo de programas de treino
  - Detalhe do programa + player de vídeo
  - Progresso do aluno
  - Área administrativa (upload de vídeos e liberação de acesso)

### O que você deve entregar

1. **Comandos exatos** para criar o projeto do zero com Expo + TypeScript + Expo Router.

2. **Estrutura de pastas** completa e profissional, seguindo princípios de Clean Architecture / Feature-first + Domain-Driven. 
   A estrutura deve separar claramente:
   - app/ (rotas do Expo Router)
   - src/domain/ (tipos e regras de domínio)
   - src/features/ (features por domínio: auth, programs, progress, admin...)
   - src/shared/ (componentes, hooks, utils, constants)
   - src/services/ (integrações externas – Supabase etc.)
   - src/types/ (tipos globais se necessário)

3. **Configuração completa do NativeWind** (incluindo tailwind.config.js, global.css, babel e metro se necessário).

4. **Arquivos de configuração essenciais** já preenchidos:
   - tsconfig.json (strict)
   - app.json / app.config.ts (nome, slug, scheme, etc.)
   - package.json (dependências principais já listadas)
   - .gitignore adequado
   - README.md inicial explicando a estrutura

5. **Boas práticas obrigatórias**:
   - TypeScript em modo strict
   - Path aliases configurados (@/ para src/)
   - Separação clara entre domínio, features e infraestrutura
   - Preparado para receber os tipos de domínio na Fase 2
   - Código limpo, legível e pronto para evolução

### Restrições
- Não implemente telas reais ainda (apenas a estrutura e arquivos de configuração).
- Não implemente autenticação nem conexão com Supabase ainda.
- Não use bibliotecas desnecessárias.
- Priorize simplicidade + escalabilidade.

### Formato de saída obrigatório
1. Lista de comandos para criar e configurar o projeto (passo a passo).
2. Árvore completa de pastas e arquivos.
3. Conteúdo dos arquivos de configuração mais importantes (tsconfig, tailwind.config, app.config, etc.).
4. Explicação breve do porquê da estrutura escolhida.

Entregue tudo pronto para eu copiar e executar.
```

---

## Prompt da Fase 2 — Modelagem de Tipos e Domínio

```text
Você é um Arquiteto de Domínio TypeScript Sênior com forte experiência em DDD leve e modelagem limpa.

Contexto:
Estamos construindo o aplicativo "TreinosAtleta" (React Native + Expo + TypeScript).
A Fase 1 já foi concluída com a seguinte estrutura:

src/
├── domain/
│   ├── auth/
│   ├── program/
│   ├── progress/
│   ├── user/
│   └── index.ts
├── features/
├── services/
└── shared/

Sua tarefa é **implementar completamente a camada de domínio** (Fase 2).

### Regras obrigatórias
- TypeScript strict
- Domínio 100% puro (não pode importar React, Expo, NativeWind, Supabase ou qualquer lib de UI/infra)
- Usar `type` e `interface` de forma clara e consistente
- Preferir tipos imutáveis e explícitos
- Criar enums ou union types quando fizer sentido
- Exportar tudo de forma limpa através do `src/domain/index.ts`
- Seguir exatamente o modelo de domínio definido nos requisitos do sistema

### Entidades que devem ser modeladas

1. **User**
   - id, name, email, role (student | admin), avatarUrl?, createdAt, updatedAt

2. **Category**
   - id, name, slug, description?

3. **Program**
   - id, title, slug, description, coverUrl, trainerName, level (iniciante | intermediário | avançado), durationWeeks, categories (array de ids ou objetos), isPublished, createdAt, updatedAt

4. **Week**
   - id, programId, weekNumber, title?

5. **Lesson** (Aula)
   - id, programId, weekId, title, description?, videoUrl, durationSeconds, order, isFreePreview?

6. **UserProgress**
   - id, userId, programId, completedLessonIds (string[]), percentComplete, lastAccessedAt, startedAt, completedAt?

7. **AccessGrant**
   - id, userId, programId, grantedBy (admin id), grantedAt, expiresAt?

### O que você deve entregar

1. Arquivos TypeScript completos e bem organizados dentro de:
   - `src/domain/user/`
   - `src/domain/program/`
   - `src/domain/progress/`
   - `src/domain/auth/` (se fizer sentido)
   - `src/domain/index.ts` (barrel file limpo)

2. Tipos auxiliares úteis (ex: CreateProgramDTO, UpdateProgressInput, ProgramWithProgress, etc.) quando fizer sentido para as próximas fases.

3. Enums ou union types para:
   - UserRole
   - ProgramLevel
   - etc.

4. Comentários mínimos e objetivos apenas onde a intenção do tipo não for óbvia.

5. Garantir que os tipos reflitam fielmente as regras de negócio:
   - Um Program contém várias Weeks
   - Uma Week contém várias Lessons
   - Progresso é por usuário + programa
   - Acesso é controlado via AccessGrant

### Formato de saída
- Mostre a árvore de arquivos que serão criados/modificados
- Em seguida cole o conteúdo completo de cada arquivo
- No final, explique brevemente as decisões de modelagem mais importantes

Não implemente nenhuma lógica de UI, hooks, services ou banco de dados.  
Apenas a camada de domínio pura.
```

---

## Prompt da Fase 3 — Autenticação

```text
Você é um Arquiteto Fullstack TypeScript Sênior especializado em React Native + Expo + Supabase.

Contexto do projeto:
- App: TreinosAtleta
- Stack: Expo + TypeScript (strict) + Expo Router + NativeWind + Supabase
- Fase 1 (fundação) e Fase 2 (domínio) já estão concluídas.
- Existe a pasta `src/domain` com os tipos User, AuthUser, UserRole, etc.
- Existe a estrutura de rotas:
  - app/(auth)/ → sign-in e sign-up
  - app/(student)/ → área do aluno
  - app/admin/ → área administrativa

Sua tarefa é implementar a **Fase 3 – Autenticação** de forma limpa e profissional.

### O que deve ser implementado

1. **Cliente Supabase**
   - Criar/configurar `src/services/supabase/client.ts`
   - Usar variáveis de ambiente (`EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
   - Tipagem correta

2. **Camada de autenticação (services)**
   - Funções: signInWithEmail, signUpWithEmail, signOut, getCurrentSession, getCurrentUser
   - Tratar erros de forma tipada e amigável
   - Mapear o usuário do Supabase para o tipo de domínio `AuthUser` / `User`

3. **Estado de autenticação**
   - Criar um AuthStore (preferencialmente com Zustand) ou AuthContext + hooks
   - Deve expor: user, session, isLoading, isAuthenticated, isAdmin, signIn, signUp, signOut
   - Escutar mudanças de autenticação do Supabase (onAuthStateChange)

4. **Proteção de rotas (Expo Router)**
   - Criar um componente ou lógica de proteção
   - Rotas `(auth)` só acessíveis quando **não** autenticado
   - Rotas `(student)` acessíveis apenas para usuários autenticados
   - Rotas `admin` acessíveis apenas para usuários com role `admin`
   - Redirecionamentos corretos (ex: usuário logado tentando acessar /sign-in → redireciona para home)

5. **Telas básicas de autenticação**
   - `sign-in.tsx` e `sign-up.tsx` funcionais (não precisam estar bonitas ainda, mas devem funcionar)
   - Usar os tipos de domínio
   - Feedback de loading e erro

### Regras obrigatórias
- Manter o domínio (`src/domain`) 100% puro (não importar Supabase dentro dele)
- Toda interação com Supabase deve ficar em `src/services` e `src/features/auth`
- TypeScript strict
- Tratar corretamente os estados de loading e erro
- Código limpo, legível e pronto para evolução
- Usar path alias `@/`

### Formato de saída obrigatório
1. Lista dos arquivos que serão criados ou modificados
2. Conteúdo completo de cada arquivo importante
3. Explicação breve das decisões técnicas principais
4. Instruções de como testar (o que o usuário deve fazer para validar)

Não implemente ainda as telas de catálogo, player ou área admin completa.  
Foque exclusivamente em autenticação + proteção de rotas + estado global de auth.
```

---

## Prompt da Fase 4 — Backend / Dados

```text
Você é um Arquiteto Fullstack TypeScript Sênior especializado em Supabase + React Native + Domain-Driven Design.

Contexto do projeto:
- App: TreinosAtleta
- Stack: Expo + TypeScript (strict) + Expo Router + NativeWind + Supabase
- Fases 1, 2 e 3 já estão concluídas (fundação, domínio e autenticação).
- Os tipos de domínio estão em `src/domain` (Program, Week, Lesson, UserProgress, AccessGrant, etc.).
- A autenticação já está funcionando com Supabase Auth.

Sua tarefa é implementar a **Fase 4 – Backend / Dados**.

### O que deve ser implementado

1. **Schema do Banco (Supabase / PostgreSQL)**
   - Criar o SQL completo das tabelas:
     - profiles (ou users)
     - categories
     - programs
     - weeks
     - lessons
     - user_progress
     - access_grants
   - Relacionamentos corretos (foreign keys)
   - Índices importantes
   - RLS (Row Level Security) básico e seguro
   - Triggers se necessário (ex: updated_at)

2. **Tipagem do Supabase**
   - Gerar ou criar os tipos do Database (Database type)
   - Manter compatibilidade com os tipos de domínio já existentes

3. **Camada de acesso a dados (Repository / Services)**
   Criar funções limpas em `src/services/` ou `src/features/` para:
   - Listar programas (com filtros básicos)
   - Buscar programa por ID (com weeks e lessons)
   - Buscar progresso do usuário em um programa
   - Marcar aula como concluída
   - Verificar se o usuário tem acesso a um programa (AccessGrant)
   - Listar programas que o usuário tem acesso (“Meus Itens”)
   - Funções administrativas básicas (criar programa, liberar acesso) — podem ser mais simples por enquanto

4. **Regras importantes**
   - Nunca expor dados de programas sem verificar AccessGrant (exceto programas públicos/free se houver)
   - Progresso só pode ser alterado pelo próprio usuário
   - Admin pode tudo
   - Manter o domínio puro (a lógica de negócio continua em `src/domain/rules.ts`)

### Regras obrigatórias
- TypeScript strict
- Separação clara: Domain → Services → Features
- Tratar erros de forma tipada
- Usar o cliente Supabase já criado na Fase 3
- Código limpo e preparado para as telas da Fase 5 e 6

### Formato de saída obrigatório
1. SQL completo do schema (para rodar no Supabase SQL Editor)
2. Lista de arquivos que serão criados/modificados
3. Conteúdo completo dos arquivos de service/repository mais importantes
4. Explicação breve das decisões de modelagem de dados e RLS
5. Como testar as funções principais

Não implemente as telas ainda.  
Foque apenas em: Schema + RLS + camada de acesso a dados.
```

---

## Prompt da Fase 5 — Navegação e Telas Base

```text
Você é um Arquiteto Frontend TypeScript Sênior especializado em React Native + Expo Router + NativeWind.

Contexto do projeto:
- App: TreinosAtleta
- Stack: Expo + TypeScript (strict) + Expo Router + NativeWind + Supabase
- Fases 1 a 4 já estão concluídas (fundação, domínio, autenticação e camada de dados).
- Já existem:
  - Tipos de domínio em `src/domain`
  - Autenticação funcionando
  - Services de acesso a dados (programas, progresso, access grants)
  - Estrutura de rotas com grupos `(auth)`, `(student)` e `admin`

Sua tarefa é implementar a **Fase 5 – Navegação e Telas Base**.

### Objetivo
Deixar a navegação principal do aluno funcionando com as telas base (ainda sem o visual final polido, mas já com dados reais e navegação correta).

### O que deve ser implementado

1. **Navegação (Expo Router)**
   - Ajustar e consolidar os layouts:
     - `app/(student)/_layout.tsx`
     - `app/(student)/(tabs)/_layout.tsx`
   - Tabs principais do aluno:
     - Home / Catálogo
     - Meu Progresso
     - Perfil
   - Navegação para o detalhe do programa (`/programs/[id]`)
   - Garantir que a proteção de rotas da Fase 3 continue funcionando

2. **Telas Base do Aluno**
   Criar/implementar as seguintes telas (usando dados reais dos services da Fase 4):

   - **Home / Catálogo** (`(tabs)/index.tsx`)
     - Listar programas disponíveis
     - Mostrar programas que o usuário tem acesso (“Meus Itens”)
     - Navegação para o detalhe do programa

   - **Detalhe do Programa** (`programs/[id].tsx`)
     - Mostrar informações do programa
     - Listar semanas e aulas
     - Botão/ação para entrar na aula (preparar navegação para o player)
     - Mostrar progresso atual do usuário naquele programa

   - **Meu Progresso** (`(tabs)/progress.tsx`)
     - Listar programas que o usuário já começou
     - Mostrar percentual de conclusão

   - **Perfil** (`(tabs)/profile.tsx`)
     - Mostrar dados básicos do usuário
     - Botão de logout

3. **Estados de UI**
   - Loading states
   - Empty states
   - Tratamento básico de erro

4. **Componentes reutilizáveis básicos**
   - Card de Programa
   - Lista de Aulas/Semanas
   - Header simples
   - Loading indicator

### Regras obrigatórias
- Usar os types do domínio (`Program`, `ProgramDetail`, `UserProgress`, etc.)
- Usar os services criados na Fase 4
- Manter a separação: features → services → domain
- TypeScript strict
- NativeWind para estilização
- Código limpo e preparado para a Fase 6 (onde vamos melhorar o visual e implementar o player)

### Formato de saída obrigatório
1. Lista de arquivos criados/modificados
2. Conteúdo completo dos arquivos principais (layouts + telas + componentes)
3. Explicação breve das decisões de navegação e organização
4. Como testar o fluxo completo do aluno até o momento

Não implemente ainda o player de vídeo completo nem a área admin.  
Foque em: Navegação sólida + Telas base do aluno consumindo dados reais.
```

---

## Prompt da Fase 6 — Telas do Aluno (Consumo de Conteúdo)

```text
Você é um Arquiteto Frontend TypeScript Sênior especializado em React Native + Expo + NativeWind + UX de aplicativos de treino.

Contexto do projeto:
- App: TreinosAtleta
- Stack: Expo + TypeScript (strict) + Expo Router + NativeWind + Supabase
- Fases 1 a 5 já estão concluídas (fundação, domínio, autenticação, dados e telas base).
- Já existem as telas de Catálogo, Detalhe do Programa, Progresso e Perfil com dados reais.

Sua tarefa é implementar a **Fase 6 – Telas do Aluno (Consumo de Conteúdo)**.

### Objetivo
Deixar a experiência do aluno completa e usável: visualizar programas, entrar nas aulas, assistir o vídeo, marcar como concluída e ver o progresso atualizado.

### O que deve ser implementado

1. **Player de Vídeo**
   - Criar a tela/modal de player (`programs/[id]/lesson/[lessonId].tsx` ou modal)
   - Usar `expo-av` ou `expo-video` (escolha a mais estável)
   - Controles básicos (play/pause, barra de progresso)
   - Ao atingir ~80% do vídeo ou ao toque do usuário, permitir marcar a aula como concluída
   - Feedback visual quando a aula for concluída

2. **Fluxo completo de consumo**
   - Do Detalhe do Programa → lista de semanas/aulas → Player
   - Mostrar claramente quais aulas já foram concluídas
   - Atualizar o progresso do programa em tempo real após marcar uma aula
   - Botão “Continuar de onde parou” quando fizer sentido

3. **Melhorias nas telas existentes**
   - **Detalhe do Programa**: visual mais claro da estrutura (Semana → Aulas), progresso e status de cada aula
   - **Home/Catálogo**: diferenciar melhor “Meus Itens” vs programas disponíveis
   - **Meu Progresso**: mostrar percentual e última aula assistida
   - Empty states e loading states mais bem cuidados

4. **Aviso Médico (RF-08)**
   - Implementar o disclaimer médico obrigatório
   - Deve aparecer na primeira vez que o usuário for assistir qualquer aula
   - Salvar que o usuário já aceitou (AsyncStorage ou no perfil)

5. **Componentes importantes**
   - LessonItem (com status: não iniciada / em andamento / concluída)
   - ProgressBar
   - VideoPlayer controlado
   - MedicalDisclaimer modal/bottom sheet

### Regras obrigatórias
- Usar os types e rules do domínio (`calculatePercentComplete`, `hasProgramAccess`, etc.)
- Usar os services da Fase 4 para marcar aula como concluída e buscar progresso
- TypeScript strict
- Manter a arquitetura limpa (features → services → domain)
- Boa experiência mobile (feedbacks claros, estados de loading e erro)
- NativeWind para estilização

### Formato de saída obrigatório
1. Lista de arquivos criados/modificados
2. Conteúdo completo dos arquivos principais (Player, Detalhe do Programa atualizado, componentes de aula e progresso, Aviso Médico)
3. Explicação das decisões de UX e técnicas
4. Como testar o fluxo completo: entrar em um programa → assistir aula → marcar como concluída → ver progresso atualizado

Não implemente ainda a área administrativa (Fase 7).  
Foque em deixar a experiência do aluno completa e funcional.
```

---

## Prompt da Fase 7 — Área Administrativa

```text
Você é um Arquiteto Fullstack TypeScript Sênior especializado em React Native + Expo + Supabase.

Contexto do projeto:
- App: TreinosAtleta
- Stack: Expo + TypeScript (strict) + Expo Router + NativeWind + Supabase
- Fases 1 a 6 já estão concluídas (incluindo a experiência completa do aluno e a área administrativa).
- A área do aluno já permite consumir programas, assistir aulas e registrar progresso.
- Já existe a rota `app/admin/` protegida por role `admin`.

Sua tarefa é implementar a **Fase 7 – Área Administrativa**.

### Objetivo
Permitir que a atleta (admin) gerencie o conteúdo do aplicativo: criar/editar programas, fazer upload de vídeos e liberar acesso para os alunos.

### O que deve ser implementado

1. **Layout e Navegação Admin**
   - Consolidar `app/admin/_layout.tsx`
   - Telas principais:
     - Dashboard Admin (`/admin`)
     - Gerenciar Programas
     - Gerenciar Aulas / Upload de Vídeos
     - Liberação de Acesso (Access Grants)

2. **Gestão de Programas**
   - Listar todos os programas (publicados e rascunhos)
   - Criar novo programa
   - Editar programa existente
   - Publicar / despublicar programa
   - Campos: título, descrição, capa, nível, duração em semanas, categorias

3. **Gestão de Semanas e Aulas + Upload de Vídeo**
   - Dentro de um programa, gerenciar semanas e aulas
   - Criar/editar aula
   - Upload de vídeo (usar Supabase Storage)
   - Definir ordem das aulas
   - Definir duração do vídeo
   - Possibilidade de marcar aula como “preview gratuito” (opcional)

4. **Liberação de Acesso (AccessGrant)**
   - Tela para buscar alunos (por e-mail ou nome)
   - Liberar acesso de um aluno a um ou mais programas
   - Remover acesso
   - Ver lista de alunos que têm acesso a determinado programa

5. **Regras importantes**
   - Apenas usuários com role `admin` podem acessar essas telas
   - Upload de vídeo deve usar Supabase Storage (bucket privado ou público controlado)
   - Após upload, salvar a URL do vídeo na tabela `lessons`
   - Manter as regras de domínio e services já criados
   - Feedback claro de loading, sucesso e erro

### Regras obrigatórias
- TypeScript strict
- Reutilizar ao máximo os types do domínio e os services existentes
- Manter a arquitetura limpa
- NativeWind para UI
- Código preparado para evolução (não hardcodar demais)

### Formato de saída obrigatório
1. Lista de arquivos criados/modificados
2. Conteúdo completo das telas e componentes principais da área admin
3. Como foi feito o upload de vídeo (código do service + uso na tela)
4. Explicação das decisões técnicas
5. Como testar o fluxo completo de admin:
   - Criar um programa
   - Adicionar semanas e aulas
   - Fazer upload de um vídeo
   - Liberar acesso para um aluno
   - Verificar se o aluno consegue ver o programa

Foque exclusivamente na área administrativa. Não altere a experiência do aluno a menos que seja necessário para integração.
```

---

## Prompt da Fase 8 — Progresso Avançado + Offline

```text
Você é um Arquiteto Fullstack TypeScript Sênior especializado em React Native + Expo + Supabase + experiência offline-first.

Contexto do projeto:
- App: TreinosAtleta
- Stack: Expo + TypeScript (strict) + Expo Router + NativeWind + Supabase
- Fases 1 a 7 já estão concluídas (incluindo a experiência completa do aluno e a área administrativa).
- Já é possível marcar aulas como concluídas e ver o progresso básico.

Sua tarefa é implementar a **Fase 8 – Progresso Avançado + Offline**.

### Objetivo
Tornar o acompanhamento de progresso mais robusto, confiável e com suporte a uso offline (download de aulas + sincronização).

### O que deve ser implementado

1. **Melhoria do Sistema de Progresso**
   - Garantir que o cálculo de `percentComplete` esteja centralizado nas rules do domínio
   - Atualização otimista da UI ao marcar uma aula como concluída
   - Sincronização correta com o backend (evitar condições de corrida)
   - Mostrar “última aula assistida” e “continuar de onde parou” de forma confiável
   - Histórico simples de conclusões (se fizer sentido)

2. **Suporte Offline (Download de Aulas)**
   - Permitir que o aluno baixe uma aula (vídeo) para assistir offline
   - Usar `expo-file-system` + armazenamento local
   - Controlar quais aulas já foram baixadas
   - Indicador visual de “baixado” / “baixando” / “disponível offline”
   - Player deve conseguir reproduzir o vídeo local quando offline
   - Estratégia de limpeza de cache (opcional, mas desejável)

3. **Sincronização**
   - Quando o app voltar a ficar online, sincronizar o progresso pendente
   - Evitar perda de dados de progresso feito offline
   - Feedback claro para o usuário sobre o estado da sincronização

4. **Estados e UX**
   - Loading, offline, erro de sincronização e sucesso devem ser bem tratados
   - Não quebrar a experiência se o usuário estiver sem internet

### Regras obrigatórias
- Manter o domínio puro
- Reutilizar os types e rules já existentes (`UserProgress`, `calculatePercentComplete`, etc.)
- TypeScript strict
- Arquitetura limpa (services para FileSystem e sincronização)
- Não quebrar o que já funciona nas fases anteriores

### Formato de saída obrigatório
1. Lista de arquivos criados/modificados
2. Conteúdo completo dos arquivos principais (services de download, sincronização, melhorias no progresso e no player)
3. Explicação da estratégia de offline + sincronização escolhida
4. Como testar:
   - Marcar aulas como concluídas
   - Baixar uma aula
   - Ficar offline e assistir
   - Voltar online e verificar se o progresso sincronizou corretamente

Foque em robustez do progresso e capacidade offline. Não implemente ainda notificações push ou publicação nas lojas.
```

---

## Prompt da Fase 9 — Polimento e Publicação

```text
Você é um Arquiteto Fullstack TypeScript Sênior especializado em React Native + Expo com experiência em publicação de aplicativos nas lojas.

Contexto do projeto:
- App: TreinosAtleta
- Stack: Expo + TypeScript (strict) + Expo Router + NativeWind + Supabase
- Fases 1 a 8 já estão concluídas (o aplicativo está funcional: autenticação, catálogo, player, progresso, offline e área admin).

Sua tarefa é implementar a **Fase 9 – Polimento e Publicação**.

### Objetivo
Deixar o aplicativo pronto para testes finais e publicação na App Store e Google Play, com boa qualidade de UX, tratamento de erros e configurações de build.

### O que deve ser implementado

1. **Polimento de UX e UI**
   - Revisar e melhorar feedbacks visuais (loading, sucesso, erro, empty states)
   - Garantir consistência visual (cores, espaçamentos, tipografia)
   - Melhorar microinterações importantes (marcar aula como concluída, download, liberação de acesso)
   - Revisar o Aviso Médico (garantir que aparece corretamente na primeira utilização)
   - Ajustes finais de usabilidade nas telas principais

2. **Tratamento de Erros e Edge Cases**
   - Padronizar mensagens de erro amigáveis
   - Tratar falhas de rede, timeout e erros do Supabase de forma consistente
   - Evitar telas em branco ou estados quebrados
   - Adicionar Error Boundary se necessário

3. **Configurações de Build e Publicação**
   - Ajustar `app.config.ts` / `app.json` com:
     - Nome final do app
     - Bundle Identifier (iOS) e Package (Android)
     - Ícones e splash screen
     - Version e versionCode/buildNumber
     - Permissões necessárias
   - Configurar EAS Build (eas.json)
   - Preparar comandos para gerar builds de produção (iOS e Android)
   - Checklist do que precisa ser feito nas lojas (App Store Connect e Google Play Console)

4. **Melhorias finais de qualidade**
   - Revisar performance básica (listas longas, imagens, vídeos)
   - Garantir que o app não quebra offline
   - Verificar se as regras de acesso (AccessGrant) estão sendo respeitadas em todos os pontos
   - Remover logs desnecessários e códigos de debug

5. **Documentação mínima**
   - Atualizar o README com:
     - Como rodar o projeto
     - Como configurar as variáveis de ambiente
     - Como gerar os builds
     - Principais decisões técnicas

### Regras obrigatórias
- Não quebrar funcionalidades já implementadas
- TypeScript strict
- Manter a arquitetura limpa
- Focar em estabilidade e qualidade percebida pelo usuário final

### Formato de saída obrigatório
1. Lista de arquivos criados/modificados
2. Conteúdo dos arquivos mais importantes (configurações de build, melhorias de erro, ajustes de UX relevantes)
3. Checklist completo para publicação nas lojas
4. Comandos finais para gerar os builds de produção
5. Resumo do que foi polido e o que ainda pode ser melhorado em versões futuras

Esta é a fase final de preparação. O objetivo é deixar o aplicativo estável, apresentável e pronto para ser enviado às lojas.
```

---

## Prompt da Fase 10 — Observabilidade + Notificações Push

```text
Você é um Arquiteto Fullstack TypeScript Sênior especializado em React Native + Expo + Supabase, com experiência em produção e retenção de usuários.

Contexto do projeto:
- App: TreinosAtleta
- Stack: Expo + TypeScript (strict) + Expo Router + NativeWind + Supabase
- Fases 1 a 9 já estão concluídas. O aplicativo está funcional e pronto para publicação.
- Agora vamos implementar melhorias de produção e retenção.

Sua tarefa é implementar a **Fase 10 – Observabilidade + Notificações Push**.

### Objetivo
Adicionar visibilidade de erros em produção (Sentry) e notificações push para aumentar engajamento e retenção dos alunos.

### O que deve ser implementado

1. **Crash Reporting e Observabilidade (Sentry)**
   - Instalar e configurar `@sentry/react-native`
   - Integrar com Expo
   - Capturar erros não tratados
   - Capturar erros de boundary
   - Enviar contexto útil (user id, role, tela atual)
   - Configurar ambiente (development vs production)
   - Não enviar dados sensíveis

2. **Notificações Push**
   - Usar `expo-notifications`
   - Solicitar permissão de forma adequada (especialmente no iOS)
   - Salvar o push token do usuário no Supabase (tabela `profiles` ou tabela dedicada)
   - Criar service para envio de notificações (pode ser via Supabase Edge Function ou serviço externo)
   - Casos de uso principais:
     - Lembrete de treino (ex: “Você não treina há 3 dias”)
     - Novo programa liberado
     - Aula nova disponível em um programa que o aluno já tem acesso
   - Tela ou configuração no Perfil para o usuário ativar/desativar notificações

3. **Estrutura técnica**
   - Criar services limpos para:
     - Sentry
     - Notificações (registro de token + envio)
   - Manter a arquitetura atual (domain puro, features isoladas)
   - Tratar permissões e estados de forma elegante

4. **Boas práticas**
   - Não irritar o usuário pedindo permissão de notificação no primeiro segundo
   - Respeitar quem desativou as notificações
   - Logs e erros do Sentry não devem poluir o ambiente de desenvolvimento

### Regras obrigatórias
- TypeScript strict
- Não quebrar nada das fases anteriores
- Código limpo e preparado para produção
- Documentar claramente o que precisa ser configurado no Sentry e no Expo (project ID, etc.)

### Formato de saída obrigatório
1. Lista de arquivos criados/modificados
2. Conteúdo completo dos arquivos principais (configuração do Sentry, service de notificações, integração no perfil, etc.)
3. Instruções de configuração (o que criar no Sentry e no Expo)
4. Como testar:
   - Forçar um erro e ver se aparece no Sentry
   - Registrar o push token
   - Enviar uma notificação de teste
5. Observações sobre limitações (especialmente iOS e background)

Foque apenas em Sentry + Notificações Push. Não implemente cache offline do catálogo nem FlashList nesta fase.
```

---

**Fim do documento.**  
Todos os 10 prompts estão prontos para uso.


# Senha Banco de dados Supabase
# 300884xx@FL0G2Lxy048d$