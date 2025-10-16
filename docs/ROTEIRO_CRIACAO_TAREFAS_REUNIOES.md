# Roteiro para Criação de Tarefas e Reuniões via IA

Este documento detalha todos os campos, validações e opções necessárias para criar tarefas e reuniões no sistema.

---

## 📋 CRIAÇÃO DE TAREFAS

### Campos Obrigatórios

#### 1. **titulo** (string)
- **Validação**: Mínimo 1 caractere
- **Descrição**: Título da tarefa
- **Exemplo**: "Revisar documentação do projeto"

#### 2. **prioridade** (enum)
- **Opções**:
  - `"low"` - Prioridade Baixa (🟢 Verde)
  - `"medium"` - Prioridade Média (🟡 Amarelo)
  - `"high"` - Prioridade Alta (🔴 Vermelho)
- **Default**: "medium"
- **Exemplo**: "high"

#### 3. **data_conclusao** (date)
- **Formato**: YYYY-MM-DD
- **Validação**: Deve ser uma data válida
- **Exemplo**: "2025-10-20"

#### 4. **horario_conclusao** (time)
- **Formato**: HH:MM
- **Validação**: Deve ser um horário válido
- **Default**: "18:00"
- **Exemplo**: "15:30"

#### 5. **responsaveis** (array)
- **Validação**: Mínimo 1 responsável
- **Tipos de responsáveis**:
  - **Usuário Individual**: `{ type: 'usuario', id: 'uuid' }`
  - **Equipe**: `{ type: 'equipe', id: 'uuid' }`
- **Exemplo**:
```json
[
  { "type": "usuario", "id": "123e4567-e89b-12d3-a456-426614174000" },
  { "type": "equipe", "id": "987fcdeb-51a2-43f7-b123-456789abcdef" }
]
```

### Campos Opcionais

#### 6. **descricao** (string)
- **Validação**: Texto livre
- **Descrição**: Descrição detalhada da tarefa
- **Exemplo**: "Revisar toda a documentação técnica e atualizar os exemplos de código"

#### 7. **recorrencia** (object | null)
- **Descrição**: Configuração para tarefas recorrentes
- **Estrutura**:
```json
{
  "ativo": true,
  "frequencia": "diaria" | "semanal" | "mensal" | "anual",
  "intervalo": 1,
  "data_inicio": "2025-10-16",
  "data_fim": "2025-12-31",
  "dias_semana": [0, 1, 2, 3, 4],
  "dia_mes": 15,
  "hora_geracao": "00:00"
}
```

**Campos de Recorrência:**
- **frequencia**: Tipo de recorrência
  - `"diaria"`: Repetir a cada X dias
  - `"semanal"`: Repetir em dias específicos da semana
  - `"mensal"`: Repetir em um dia específico do mês
  - `"anual"`: Repetir anualmente
  
- **intervalo**: Número inteiro (Ex: 2 = a cada 2 dias/semanas/meses/anos)

- **dias_semana** (apenas para frequencia = "semanal"):
  - Array de números: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
  - Exemplo: `[1, 3, 5]` = Segunda, Quarta e Sexta

- **dia_mes** (apenas para frequencia = "mensal"):
  - Número de 1 a 31 representando o dia do mês
  - Exemplo: `15` = Dia 15 de cada mês

- **data_inicio**: Data de início da recorrência (YYYY-MM-DD)

- **data_fim**: Data final da recorrência (YYYY-MM-DD, opcional)

- **hora_geracao**: Horário em que a tarefa deve ser gerada (HH:MM)

### Processo de Criação

1. **Validar dados de entrada**
2. **Criar registro na tabela `tarefas`**:
```json
{
  "titulo": "string",
  "descricao": "string | null",
  "prioridade": "low | medium | high",
  "status": "criada",
  "data_conclusao": "date",
  "horario_conclusao": "time",
  "empresa_id": "uuid",
  "criado_por": "uuid",
  "arquivada": false,
  "posicao_coluna": 0
}
```

3. **Processar Responsáveis**:
   - Para cada responsável selecionado:
     - Se for `usuario`: Inserir em `tarefas_responsaveis` com `usuario_id`
     - Se for `equipe`: Inserir em `tarefas_responsaveis` com `equipe_id`

4. **Configurar Recorrência** (se aplicável):
   - Criar registro em `tarefas_recorrentes`:
```json
{
  "tarefa_template_id": "uuid_da_tarefa",
  "frequencia": "string",
  "intervalo": 1,
  "ativo": true,
  "data_inicio": "date",
  "data_fim": "date | null",
  "dias_semana": [0,1,2,3,4] | null,
  "dia_mes": 15 | null,
  "hora_geracao": "time",
  "empresa_id": "uuid",
  "criado_por": "uuid"
}
```

5. **Registrar Atividade**:
   - Inserir em `tarefas_atividades`:
```json
{
  "tarefa_id": "uuid",
  "usuario_id": "uuid_criador",
  "acao": "criacao",
  "descricao": "Tarefa criada"
}
```

6. **Notificar** (via Edge Function):
   - Chamar `notify-task-created` com:
```json
{
  "taskId": "uuid",
  "createdBy": "uuid_criador"
}
```

---

## 📅 CRIAÇÃO DE REUNIÕES

### Campos Obrigatórios

#### 1. **titulo** (string)
- **Validação**: Mínimo 1 caractere
- **Descrição**: Título da reunião
- **Exemplo**: "Reunião de Planejamento Sprint"

#### 2. **data_reuniao** (date)
- **Formato**: YYYY-MM-DD
- **Validação**: Não pode ser data passada
- **Exemplo**: "2025-10-20"

#### 3. **horario_inicio** (time)
- **Formato**: HH:MM
- **Validação**: Deve ser um horário válido
- **Default**: "09:00"
- **Exemplo**: "14:30"

#### 4. **duracao_minutos** (integer)
- **Validação**: Deve ser maior que 0
- **Default**: 60
- **Descrição**: Duração da reunião em minutos
- **Exemplo**: 90

#### 5. **participantes** (array)
- **Validação**: Mínimo 1 participante
- **Tipos de participantes**:
  - **Usuário Individual**: ID do usuário
  - **Equipe**: ID da equipe (todos os membros serão incluídos)
- **Exemplo**:
```json
[
  "usuario_id_1",
  "usuario_id_2",
  "equipe_id_1"
]
```

### Campos Opcionais

#### 6. **descricao** (string)
- **Validação**: Texto livre
- **Descrição**: Objetivo e pauta da reunião
- **Exemplo**: "Discutir funcionalidades do próximo sprint e distribuir tarefas"

#### 7. **link_reuniao** (string)
- **Validação**: URL válida (opcional)
- **Descrição**: Link para reunião online (Google Meet, Zoom, Teams, etc.)
- **Exemplo**: "https://meet.google.com/abc-defg-hij"

### Processo de Criação

1. **Validar dados de entrada**

2. **Criar registro na tabela `reunioes`**:
```json
{
  "titulo": "string",
  "descricao": "string | null",
  "data_reuniao": "date",
  "horario_inicio": "time",
  "duracao_minutos": 60,
  "link_reuniao": "string | null",
  "empresa_id": "uuid",
  "criado_por": "uuid"
}
```

3. **Processar Participantes**:
   - Para cada participante selecionado:
     - Se for `usuario`: 
       - Inserir em `reunioes_participantes` com `usuario_id`
     - Se for `equipe`:
       - Inserir em `reunioes_participantes` com `equipe_id`
       - Buscar todos os membros da equipe em `usuarios_equipes`
       - Inserir cada membro individualmente em `reunioes_participantes` com `usuario_id`

4. **Notificar** (via Edge Function):
   - Chamar `notify-meeting-created` com:
```json
{
  "reuniao": {
    "id": "uuid",
    "titulo": "string",
    "data_reuniao": "date",
    "horario_inicio": "time",
    "duracao_minutos": 60
  },
  "participantes": {
    "usuarios": ["uuid1", "uuid2"],
    "equipes": ["equipe_uuid1"]
  },
  "empresa": {
    "id": "uuid",
    "nome": "string"
  },
  "criador": {
    "id": "uuid",
    "nome": "string"
  }
}
```

---

## 🤖 IMPLEMENTAÇÃO COM IA

### Fluxo Recomendado

#### Para Tarefas:

1. **Extrair Informações do Prompt**:
   - Identificar título
   - Detectar prioridade (palavras-chave: urgente, importante, baixa prioridade, etc.)
   - Extrair data/prazo
   - Identificar responsáveis mencionados
   - Detectar se é recorrente (palavras-chave: diariamente, toda semana, mensalmente, etc.)

2. **Validar e Formatar**:
   - Converter datas para formato correto
   - Mapear nomes de usuários/equipes para IDs
   - Validar campos obrigatórios

3. **Criar via API**:
   - Fazer POST para Edge Function ou diretamente no Supabase
   - Retornar ID da tarefa criada

#### Para Reuniões:

1. **Extrair Informações do Prompt**:
   - Identificar título/assunto
   - Extrair data e horário
   - Detectar duração (padrão: 60 minutos)
   - Identificar participantes
   - Extrair link de reunião (se mencionado)

2. **Validar e Formatar**:
   - Converter datas para formato correto
   - Mapear participantes para IDs
   - Validar campos obrigatórios

3. **Criar via API**:
   - Fazer POST para Edge Function ou diretamente no Supabase
   - Retornar ID da reunião criada

---

## 📡 EDGE FUNCTIONS DISPONÍVEIS

### Tarefas
- **notify-task-created**: Notifica criação de tarefa
- **notify-task-responsible-added**: Notifica adição de responsável
- **notify-task-responsible-removed**: Notifica remoção de responsável
- **notify-task-completed**: Notifica conclusão de tarefa
- **notify-task-reminder-1day**: Lembrete 1 dia antes
- **notify-task-reminder-today**: Lembrete no dia
- **notify-task-overdue-1day**: Notifica atraso de 1 dia
- **notify-task-overdue-5days**: Notifica atraso de 5 dias

### Reuniões
- **notify-meeting-created**: Notifica criação de reunião

---

## 🔍 CONSULTAS ÚTEIS

### Buscar Usuários da Empresa
```sql
SELECT id, nome, email, funcao_empresa
FROM usuarios
WHERE empresa_id = 'uuid_empresa'
  AND ativo = true
  AND tipo_usuario != 'master'
```

### Buscar Equipes da Empresa
```sql
SELECT id, nome, descricao
FROM equipes
WHERE empresa_id = 'uuid_empresa'
```

### Buscar Membros de uma Equipe
```sql
SELECT u.id, u.nome, u.email
FROM usuarios u
JOIN usuarios_equipes ue ON u.id = ue.usuario_id
WHERE ue.equipe_id = 'uuid_equipe'
  AND u.ativo = true
```

---

## 💡 EXEMPLOS DE USO COM IA

### Exemplo 1: Criar Tarefa Simples
**Prompt**: "Criar tarefa de revisar código para João com prioridade alta até amanhã"

**Payload**:
```json
{
  "titulo": "Revisar código",
  "prioridade": "high",
  "data_conclusao": "2025-10-17",
  "horario_conclusao": "18:00",
  "responsaveis": [
    { "type": "usuario", "id": "uuid_joao" }
  ]
}
```

### Exemplo 2: Criar Tarefa Recorrente
**Prompt**: "Criar tarefa de backup do sistema toda segunda às 9h para a equipe de TI"

**Payload**:
```json
{
  "titulo": "Backup do sistema",
  "prioridade": "high",
  "data_conclusao": "2025-10-21",
  "horario_conclusao": "09:00",
  "responsaveis": [
    { "type": "equipe", "id": "uuid_equipe_ti" }
  ],
  "recorrencia": {
    "ativo": true,
    "frequencia": "semanal",
    "intervalo": 1,
    "dias_semana": [1],
    "data_inicio": "2025-10-16",
    "hora_geracao": "00:00"
  }
}
```

### Exemplo 3: Criar Reunião
**Prompt**: "Agendar reunião de planejamento para quinta às 14h com 2 horas de duração, participantes: Maria, equipe de desenvolvimento"

**Payload**:
```json
{
  "titulo": "Reunião de Planejamento",
  "data_reuniao": "2025-10-17",
  "horario_inicio": "14:00",
  "duracao_minutos": 120,
  "participantes": [
    "uuid_maria",
    "uuid_equipe_dev"
  ]
}
```

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **Status da Tarefa**: Sempre começa como `"criada"`
2. **Expansão de Equipes**: Quando uma equipe é atribuída, TODOS os membros ativos são incluídos individualmente
3. **Notificações**: São enviadas automaticamente via Edge Functions
4. **Recorrência**: É processada por uma Edge Function agendada (`generate-recurring-tasks`)
5. **Formato de Responsáveis nas Notificações**: 
   - Usuários em equipes são marcados com `em_equipe: true` e `nome_equipe: "string"`
   - Usuários individuais têm `em_equipe: false`
6. **Tarefas Concluídas/Aprovadas**: Não recebem notificações de prazo ou atraso

---

## 📚 REFERÊNCIAS

- Tabelas: `tarefas`, `reunioes`, `tarefas_responsaveis`, `reunioes_participantes`
- Modais: `CreateTaskModal.tsx`, `CreateMeetingModal.tsx`
- Edge Functions: Diretório `supabase/functions/`
