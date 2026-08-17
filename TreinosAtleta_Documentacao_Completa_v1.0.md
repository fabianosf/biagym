# TreinosAtleta — Documentação Completa do Projeto

> O produto chama-se **BiAGym**. Este documento conserva o nome temporário usado na fase inicial.
**Versão:** 1.0  
**Data:** 15/08/2026  
**Status:** MVP Implementado (Fases 1 a 9)

---

## 1. Visão Geral do Projeto

**TreinosAtleta** é um aplicativo multiplataforma (Android + iOS) de treinos sob demanda, desenvolvido para uma atleta/influencer.  

O aplicativo permite que a atleta publique programas de treino (com semanas e aulas em vídeo) e controle o acesso dos alunos. Os alunos podem consumir o conteúdo, acompanhar o progresso e baixar aulas para assistir offline.

### Objetivo Principal
Centralizar os treinos gravados pela atleta em um ambiente profissional, com controle de acesso, progresso e boa experiência de uso — inspirado em aplicativos como Queima Diária, porém com marca própria.

---

## 2. Stack Técnica

| Camada              | Tecnologia                          |
|---------------------|-------------------------------------|
| Frontend            | React Native + Expo (SDK 57)       |
| Linguagem           | TypeScript (strict mode)           |
| Roteamento          | Expo Router (file-based)           |
| Estilização         | NativeWind v4 (Tailwind CSS)       |
| Backend / BaaS      | Supabase (Auth + PostgreSQL + Storage) |
| Estado Global       | Zustand                            |
| Player de Vídeo     | expo-av / expo-video               |
| Offline             | expo-file-system                   |
| Build               | EAS Build                          |

---

## 3. Arquitetura

O projeto segue uma arquitetura **Feature-first + Domain isolado**:

```
TreinosAtleta/
├── app/                          # Rotas (Expo Router)
│   ├── (auth)/                   # Login e Cadastro
│   ├── (student)/                # Área do aluno (tabs)
│   └── admin/                    # Área administrativa
├── src/
│   ├── domain/                   # Tipos e regras de negócio (puro)
│   │   ├── user/
│   │   ├── program/
│   │   ├── progress/
│   │   ├── auth/
│   │   └── index.ts
│   ├── features/                 # Features por domínio
│   │   ├── auth/
│   │   ├── programs/
│   │   ├── progress/
│   │   ├── profile/
│   │   └── admin/
│   ├── services/                 # Integrações (Supabase, FileSystem...)
│   ├── shared/                   # Componentes e utilitários compartilhados
│   └── types/
```

### Princípios adotados
- Domínio 100% puro (sem dependência de React, Expo ou Supabase)
- Features isoladas
- Services na borda (infraestrutura)
- TypeScript strict em todo o projeto
- Path alias `@/` configurado

---

## 4. Modelagem de Domínio (Fase 2)

### Entidades principais

- **User** — Aluno ou Administrador
- **Category** — Categorias de treino
- **Program** — Programa / Desafio completo
- **Week** — Semana dentro de um programa
- **Lesson** — Aula (vídeo individual)
- **UserProgress** — Progresso do aluno em um programa
- **AccessGrant** — Controle de quem tem acesso a quais programas

### Decisões importantes de modelagem
- Entidades normalizadas (Program guarda apenas `categoryIds`)
- Visões de leitura separadas (`ProgramDetail`, `ProgramWithProgress`, `ProgramSummary`)
- Progresso e AccessGrant são entidades independentes
- Regras de negócio extraídas para funções puras (`calculatePercentComplete`, `hasProgramAccess`, etc.)

---

## 5. Fases de Implementação

### Fase 1 — Fundação do Projeto
- Criação do projeto Expo + TypeScript
- Configuração do Expo Router
- NativeWind v4
- Estrutura de pastas Feature-first + Domain
- Path aliases e TypeScript strict
- Configurações base (`app.config.ts`, `tailwind.config.js`, `tsconfig.json`...)

### Fase 2 — Modelagem de Tipos e Domínio
- Todos os tipos TypeScript do domínio
- Enums e union types (`UserRole`, `ProgramLevel`...)
- Tipos auxiliares (DTOs e visões de leitura)
- Funções de regras de negócio puras
- Barrel file limpo (`src/domain/index.ts`)

### Fase 3 — Autenticação
- Cliente Supabase configurado
- Sign In / Sign Up / Sign Out
- Auth Store (Zustand)
- Proteção de rotas por autenticação e por role (`admin` vs `student`)
- Telas de Login e Cadastro funcionais
- Mapeamento do usuário Supabase → tipos de domínio

### Fase 4 — Backend / Dados
- Schema completo no PostgreSQL (Supabase)
- Tabelas: profiles, categories, programs, weeks, lessons, user_progress, access_grants
- Row Level Security (RLS) configurado
- Camada de services/repositories para:
  - Listar programas
  - Buscar programa completo
  - Progresso do usuário
  - Marcar aula como concluída
  - Verificar e gerenciar AccessGrant
  - Funções administrativas básicas

### Fase 5 — Navegação e Telas Base
- Layouts e Tabs do aluno (Home, Progresso, Perfil)
- Tela de Catálogo / Home com dados reais
- Tela de Detalhe do Programa
- Tela de Meu Progresso
- Tela de Perfil + Logout
- Componentes básicos (ProgramCard, Loading, Empty States)

### Fase 6 — Telas do Aluno (Consumo de Conteúdo)
- Player de vídeo funcional
- Fluxo completo: Programa → Semanas → Aulas → Player
- Marcação de aula como concluída
- Atualização de progresso em tempo real
- Aviso Médico obrigatório (primeira utilização)
- Melhorias de UX nas telas de catálogo e detalhe
- Estados visuais de aula (não iniciada / concluída)

### Fase 7 — Área Administrativa
- Dashboard Admin
- CRUD de Programas
- Gestão de Semanas e Aulas
- Upload de vídeos para o Supabase Storage
- Liberação e remoção de acesso (AccessGrant)
- Busca de alunos para liberação de acesso
- Proteção total da área admin por role

### Fase 8 — Progresso Avançado + Offline
- Cálculo de progresso centralizado e confiável
- Atualização otimista da UI
- Download de aulas para assistir offline
- Player compatível com vídeos locais
- Sincronização de progresso ao voltar online
- Indicadores visuais de download e status offline

### Fase 9 — Polimento e Publicação
- Melhorias finais de UX e feedbacks
- Tratamento padronizado de erros
- Error Boundaries
- Configuração completa de build (EAS)
- Ajustes de `app.config.ts` (ícones, splash, bundle identifiers)
- Checklist de publicação nas lojas
- README atualizado

---

## 6. Funcionalidades Implementadas (MVP)

### Área do Aluno
- [x] Cadastro e Login
- [x] Catálogo de programas
- [x] Meus Itens (programas com acesso liberado)
- [x] Detalhe do programa com semanas e aulas
- [x] Player de vídeo
- [x] Marcar aula como concluída
- [x] Acompanhamento de progresso
- [x] Continuar de onde parou
- [x] Download de aulas (offline)
- [x] Aviso médico obrigatório
- [x] Perfil e Logout

### Área Administrativa
- [x] Login como admin
- [x] Criar e editar programas
- [x] Gerenciar semanas e aulas
- [x] Upload de vídeos
- [x] Publicar / despublicar programas
- [x] Liberar e remover acesso de alunos

---

## 7. Regras de Negócio Principais

1. Conteúdo só é visível para usuários autenticados com AccessGrant.
2. Um Program contém várias Weeks, que contêm várias Lessons.
3. Progresso é individual e calculado por aulas concluídas.
4. Apenas o próprio aluno pode atualizar seu progresso.
5. Apenas admin pode criar conteúdo e liberar acessos.
6. Aviso médico deve ser aceito antes do primeiro treino.
7. Vídeos podem ser baixados para consumo offline.

---

## 8. Estrutura de Dados (Resumo)

**Program** → title, description, coverUrl, level, durationWeeks, isPublished  
**Week** → programId, weekNumber  
**Lesson** → programId, weekId, title, videoUrl, durationSeconds, order  
**UserProgress** → userId, programId, completedLessonIds, percentComplete  
**AccessGrant** → userId, programId, grantedBy, grantedAt  

---

## 9. Próximos Passos Recomendados (Pós-MVP)

- Notificações Push (lembretes de treino e novos programas)
- Filtros avançados no catálogo
- Melhorias de performance em listas longas
- Analytics de uso
- Sistema de assinatura / pagamento (se for o modelo de negócio)
- Versão web administrativa mais completa (opcional)
- Testes automatizados (unitários + e2e)

---

## 10. Como Rodar o Projeto

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Preencher EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY

# Iniciar
npx expo start -c
```

### Builds de Produção
```bash
# Configurar EAS (se ainda não configurado)
eas build:configure

# Build Android
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile production
```

---

## 11. Observações Finais

Este documento representa o estado do projeto após a conclusão das 9 fases planejadas.  

O MVP está funcional e cobre todos os requisitos **Must** definidos na especificação original de 20 blocos, além de parte dos itens **Should** (download offline e melhorias de progresso).

A arquitetura foi desenhada para ser evolutiva, mantendo o domínio isolado e as features bem separadas, facilitando a adição de novas funcionalidades no futuro.

---

**Documento gerado em 15/08/2026**  
**Projeto:** TreinosAtleta  
**Versão da documentação:** 1.0
