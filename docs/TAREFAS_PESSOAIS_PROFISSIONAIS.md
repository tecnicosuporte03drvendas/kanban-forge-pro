# Sistema de Tarefas Pessoais vs Profissionais

## Visão Geral

O sistema permite criar dois tipos de tarefas:
- **Profissional (💼)**: Tarefas da empresa, visíveis para a equipe
- **Pessoal (👤)**: Tarefas particulares, privadas do usuário

## Permissões de Criação

| Tipo de Usuário | Pode Criar Profissional | Pode Criar Pessoal |
|-----------------|-------------------------|---------------------|
| Master          | ✅ Sim                  | ✅ Sim              |
| Proprietário    | ✅ Sim                  | ✅ Sim              |
| Gestor          | ✅ Sim                  | ✅ Sim              |
| Colaborador     | ❌ Não                  | ✅ Sim              |

## Regras de Visibilidade

### Tarefas Profissionais
- Todos os usuários da empresa veem as tarefas onde são responsáveis
- Gestores e Proprietários veem todas as tarefas profissionais da empresa

### Tarefas Pessoais
- **Apenas o criador vê suas próprias tarefas pessoais**
- Ninguém mais tem acesso (nem gestores)
- São completamente privadas

## Impacto nos Relatórios

**Tarefas pessoais NÃO influenciam:**
- Estatísticas de produtividade
- Rankings de usuários/equipes
- Métricas da empresa
- Gráficos de desempenho

**Apenas tarefas profissionais são contabilizadas nos relatórios.**

## Como Criar

### Colaboradores
Ao abrir o modal de criar tarefa, a tarefa é automaticamente criada como **pessoal** (sem opção de escolha).

### Gestores/Proprietários/Master
No modal de criar tarefa, após selecionar a prioridade, escolha o tipo:
- **💼 Profissional** (padrão)
- **👤 Pessoal**

## Identificação Visual

### No Dashboard (Kanban)
Tarefas pessoais exibem um badge roxo com ícone:
```
[👤 Pessoal]
```

### No Calendário
Tarefas pessoais têm badge especial indicando tipo.

### Na Lista de Tarefas
Filtro disponível para separar tarefas pessoais das profissionais.

## Filtros Disponíveis

Em todas as visualizações (Kanban, Lista, Calendário) é possível filtrar por:
- **Todas**: Mostra ambos os tipos
- **💼 Profissionais**: Apenas tarefas da empresa
- **👤 Pessoais**: Apenas tarefas particulares

## Consulta via WhatsApp/N8N

O agente de IA diferencia tarefas usando emojis:
- Profissional: "💼 Revisar relatório - Profissional"
- Pessoal: "👤 Agendar consulta médica - Pessoal"

## Segurança

- RLS (Row Level Security) garante que tarefas pessoais só sejam acessíveis ao criador
- Colaboradores não podem criar tarefas profissionais via API ou interface
- Validação em múltiplas camadas (frontend, backend, database)
