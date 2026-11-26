# Instruções para o Antigravity

## O que você é

Você é um agente de engenharia trabalhando no projeto **Genda** — um SaaS de agendamento online para profissionais e estúdios de estética, beleza e barbearia. Você opera dentro do workspace `hagfish/`.

## Como se orientar

1. **Leia `context.md`** nesta mesma pasta para entender a arquitetura, stack e padrões do projeto antes de qualquer tarefa.
2. **Leia o arquivo de tarefa em `tasks/`** correspondente à tarefa que foi atribuída a você. Cada tarefa é um arquivo `.md` com instruções específicas.
3. **Consulte `application.md`** na raiz do projeto se precisar de detalhes mais profundos sobre arquitetura e decisões de design.

## Regras de execução

- Sempre trabalhe dentro dos diretórios `genda-app/` (frontend) e `genda-core/` (backend). Nunca altere arquivos fora dessas pastas, exceto se a tarefa indicar explicitamente.
- Siga os padrões de código descritos em `context.md` rigorosamente. Não introduza novas bibliotecas sem justificativa explícita na tarefa.
- Não crie comentários explicando o que o código faz — apenas comente o "porquê" quando não for óbvio.
- Não adicione tratamento de erro para cenários impossíveis. Confie nas garantias do framework.
- Não refatore código fora do escopo da tarefa.
- Ao finalizar uma tarefa, liste de forma concisa o que foi alterado (arquivos e o que mudou em cada um). Nada mais.

## Estrutura de pastas relevante

```
hagfish/
├── .agents/
│   ├── instructions.md   ← você está aqui
│   ├── context.md        ← leia antes de qualquer tarefa
│   └── tasks/            ← arquivos de tarefa atribuídos
├── application.md        ← arquitetura detalhada (consulte se necessário)
├── database/             ← migrations SQL
├── genda-app/            ← frontend React + TypeScript + Vite
└── genda-core/           ← backend Express + TypeScript + pg
```

## Fluxo de trabalho

1. Ler `instructions.md` (este arquivo)
2. Ler `context.md`
3. Listar os arquivos em `tasks/` e ler o de status `pending` mais recente
4. Marcar o status do arquivo de tarefa como `in_progress` antes de começar
5. Executar a tarefa seguindo rigorosamente as instruções do arquivo
6. Marcar o status do arquivo de tarefa como `done` ao finalizar
7. Reportar de forma concisa: quais arquivos foram alterados e o que mudou em cada um

## Formato dos arquivos de tarefa

Cada arquivo em `tasks/` segue este formato:

```
---
status: pending | in_progress | done
---

## Objetivo
O que deve ser feito.

## Contexto adicional
Informações específicas que o `context.md` não cobre.

## Critérios de conclusão
Lista do que deve estar funcionando ao final.
```
