# Edge Function Unificada: Buscar Tarefas

## Visão Geral

A função `buscar-tarefas` é uma edge function unificada que retorna **TODAS** as tarefas de um usuário com dados completos para processamento pela IA no N8N.

### O que ela faz?

✅ Busca tarefas com base no tipo de usuário (colaborador, gestor, proprietário, master)  
✅ Retorna dados completos: checklists, comentários, tempo gasto, sessões  
✅ Respeita permissões: tarefas pessoais são privadas  
✅ Para Gestores+: retorna também dados de empresa, equipes e usuários  
✅ Suporta filtros opcionais: título, status, tipo, prioridade  

❌ **NÃO** retorna: atividades (histórico), anexos

---

## Endpoint

**URL Base**: `https://emlnkqygdkcngmftpsft.supabase.co/functions/v1/buscar-tarefas`

**Método**: `POST`

---

## Parâmetros

### Obrigatórios:

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `usuario_id` | UUID | ID do usuário que está consultando | `"550e8400-e29b-41d4-a716-446655440000"` |
| `tipo_usuario` | Enum | Tipo do usuário | `"colaborador"` \| `"gestor"` \| `"proprietario"` \| `"master"` |

### Opcionais (Filtros):

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `titulo` | String | Filtrar por título (busca parcial) | `"dashboard"` |
| `status` | Enum | Filtrar por status | `"executando"` \| `"criada"` \| `"aceita"` \| `"concluida"` \| `"aprovada"` |
| `tipo_tarefa` | Enum | Filtrar por tipo | `"pessoal"` \| `"profissional"` |
| `prioridade` | Enum | Filtrar por prioridade | `"baixa"` \| `"media"` \| `"alta"` \| `"urgente"` |
| `data_conclusao` | Date | Filtrar por data | `"2025-01-25"` |

---

## Regras de Permissão

### Colaborador
- ✅ Vê tarefas **profissionais** onde é responsável (direto ou via equipe)
- ✅ Vê suas próprias tarefas **pessoais**
- ❌ **NÃO** vê tarefas pessoais de outros
- ❌ **NÃO** recebe dados de empresa/equipes/usuários

### Gestor / Proprietário / Master
- ✅ Vê **TODAS** as tarefas profissionais da empresa
- ✅ Vê suas próprias tarefas pessoais
- ❌ **NÃO** vê tarefas pessoais de outros
- ✅ **RECEBE** dados extras: empresa, equipes, usuários da empresa

---

## Configuração no N8N

### HTTP Request Direto

```json
{
  "method": "POST",
  "url": "https://emlnkqygdkcngmftpsft.supabase.co/functions/v1/buscar-tarefas",
  "headers": {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw",
    "Content-Type": "application/json"
  },
  "body": {
    "usuario_id": "550e8400-e29b-41d4-a716-446655440000",
    "tipo_usuario": "gestor"
  }
}
```

### Usando o Proxy N8N

```json
{
  "url": "https://emlnkqygdkcngmftpsft.supabase.co/functions/v1/buscar-tarefas",
  "method": "POST",
  "headers": {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw"
  },
  "body": {
    "usuario_id": "550e8400-e29b-41d4-a716-446655440000",
    "tipo_usuario": "gestor"
  }
}
```

---

## Exemplos de Uso

### 1. Buscar TODAS as tarefas (sem filtros)

**Request:**
```json
{
  "usuario_id": "550e8400-e29b-41d4-a716-446655440000",
  "tipo_usuario": "colaborador"
}
```

**Response:**
Todas as tarefas profissionais onde é responsável + suas tarefas pessoais

---

### 2. Buscar tarefas por título

**Request:**
```json
{
  "usuario_id": "550e8400-e29b-41d4-a716-446655440000",
  "tipo_usuario": "colaborador",
  "titulo": "dashboard"
}
```

**Response:**
Tarefas que contenham "dashboard" no título

---

### 3. Buscar apenas tarefas pessoais

**Request:**
```json
{
  "usuario_id": "550e8400-e29b-41d4-a716-446655440000",
  "tipo_usuario": "gestor",
  "tipo_tarefa": "pessoal"
}
```

**Response:**
Apenas tarefas pessoais do usuário

---

### 4. Buscar tarefas em andamento de alta prioridade

**Request:**
```json
{
  "usuario_id": "550e8400-e29b-41d4-a716-446655440000",
  "tipo_usuario": "gestor",
  "status": "executando",
  "prioridade": "alta"
}
```

**Response:**
Tarefas filtradas por status E prioridade

---

### 5. Gestor buscando tarefas profissionais da empresa

**Request:**
```json
{
  "usuario_id": "550e8400-e29b-41d4-a716-446655440000",
  "tipo_usuario": "gestor",
  "tipo_tarefa": "profissional"
}
```

**Response:**
TODAS as tarefas profissionais da empresa + dados de empresa, equipes e usuários

---

## Estrutura de Resposta

### Para Colaborador:

```json
{
  "usuario": {
    "id": "uuid",
    "nome": "João Silva",
    "email": "usuario@exemplo.com",
    "celular": "5521982534276",
    "tipo_usuario": "colaborador",
    "empresa_id": "uuid-empresa"
  },
  "permissoes": {
    "pode_ver_todas_profissionais": false,
    "pode_acessar_dados_empresa": false
  },
  "total_tarefas": 5,
  "tarefas": [
    {
      "id": "uuid",
      "titulo": "Implementar feature X",
      "descricao": "...",
      "tipo_tarefa": "profissional",
      "prioridade": "alta",
      "status": "executando",
      "data_conclusao": "2025-01-25",
      "horario_conclusao": "18:00:00",
      "tempo_inicio": "2025-01-20T09:00:00Z",
      "tempo_fim": null,
      "tempo_gasto_minutos": 240,
      "criado_por": "uuid",
      "criado_por_nome": "Maria Santos",
      "empresa_id": "uuid-empresa",
      "created_at": "...",
      "updated_at": "...",
      "arquivada": false,
      "posicao_coluna": 0,
      "responsaveis": [...],
      "checklists": [...],
      "comentarios": [...],
      "tempo_sessoes": [...]
    }
  ]
}
```

### Para Gestor/Proprietário/Master:

```json
{
  "usuario": {...},
  "permissoes": {
    "pode_ver_todas_profissionais": true,
    "pode_acessar_dados_empresa": true
  },
  "total_tarefas": 25,
  "tarefas": [...],
  
  "empresa": {
    "id": "uuid",
    "razao_social": "Empresa LTDA",
    "nome_fantasia": "Empresa",
    "cnpj": "12345678000199",
    "ativa": true
  },
  "equipes": [
    {
      "id": "uuid",
      "nome": "Desenvolvimento",
      "descricao": "Equipe de desenvolvimento",
      "criado_por": "uuid",
      "created_at": "..."
    }
  ],
  "usuarios_empresa": [
    {
      "id": "uuid",
      "nome": "Carlos Silva",
      "email": "carlos@empresa.com",
      "celular": "5521999887766",
      "funcao_empresa": "Desenvolvedor",
      "tipo_usuario": "colaborador",
      "ativo": true
    }
  ]
}
```

---

## Detalhamento dos Dados de Tarefa

### Campos Principais:

- `id`, `titulo`, `descricao` - Identificação básica
- `tipo_tarefa` - `"pessoal"` ou `"profissional"`
- `prioridade` - `"baixa"`, `"media"`, `"alta"`, `"urgente"`
- `status` - `"criada"`, `"aceita"`, `"executando"`, `"concluida"`, `"aprovada"`
- `data_conclusao`, `horario_conclusao` - Prazo
- `tempo_inicio`, `tempo_fim`, `tempo_gasto_minutos` - Tracking de tempo
- `criado_por`, `criado_por_nome` - Quem criou
- `empresa_id` - Empresa dona da tarefa
- `created_at`, `updated_at` - Timestamps
- `arquivada` - Status de arquivamento
- `posicao_coluna` - Posição no Kanban

### Responsáveis:

```json
"responsaveis": [
  {
    "id": "uuid",
    "usuario_id": "uuid-usuario",
    "equipe_id": "uuid-equipe"
  }
]
```

### Checklists:

```json
"checklists": [
  {
    "id": "uuid",
    "titulo": "Backend Tasks",
    "created_at": "...",
    "updated_at": "...",
    "itens": [
      {
        "id": "uuid",
        "item": "Criar API endpoint",
        "concluido": true,
        "created_at": "...",
        "updated_at": "..."
      }
    ]
  }
]
```

### Comentários (enriquecidos com nomes):

```json
"comentarios": [
  {
    "id": "uuid",
    "comentario": "Bom progresso!",
    "usuario_id": "uuid",
    "usuario_nome": "Carlos Silva",
    "usuario_email": "carlos@empresa.com",
    "created_at": "2025-01-20T11:00:00Z"
  }
]
```

### Sessões de Tempo (produtividade):

```json
"tempo_sessoes": [
  {
    "id": "uuid",
    "inicio": "2025-01-20T09:00:00Z",
    "fim": "2025-01-20T13:00:00Z",
    "minutos_trabalhados": 240,
    "usuario_id": "uuid",
    "usuario_nome": "João Silva",
    "created_at": "2025-01-20T09:00:00Z"
  }
]
```

---

## Erros Comuns

### 400 - Parâmetros Faltando

```json
{
  "error": "usuario_id e tipo_usuario são obrigatórios",
  "code": "MISSING_PARAMS"
}
```

### 400 - Tipo de Usuário Inválido

```json
{
  "error": "tipo_usuario deve ser: colaborador, gestor, proprietario ou master",
  "code": "INVALID_TIPO_USUARIO"
}
```

### 404 - Usuário Não Encontrado

```json
{
  "error": "Usuário não encontrado ou inativo",
  "code": "USER_NOT_FOUND"
}
```

### 500 - Erro Interno

```json
{
  "error": "Erro ao buscar tarefas",
  "details": {...},
  "code": "INTERNAL_ERROR"
}
```

---

## Cenários de Uso pela IA

### 1. "Quais são minhas tarefas?"
**Parâmetros**: apenas `usuario_id` e `tipo_usuario`  
**Retorno**: TODAS as tarefas que o usuário pode ver

### 2. "Me fala sobre a tarefa de dashboard"
**Parâmetros**: + `titulo: "dashboard"`  
**Retorno**: Tarefas com "dashboard" no título

### 3. "Minhas tarefas pessoais"
**Parâmetros**: + `tipo_tarefa: "pessoal"`  
**Retorno**: Apenas tarefas pessoais

### 4. "Tarefas urgentes em andamento"
**Parâmetros**: + `status: "executando"`, `prioridade: "alta"`  
**Retorno**: Tarefas filtradas

### 5. "Quem está na minha equipe?" (Gestor+)
**Parâmetros**: apenas `usuario_id` e `tipo_usuario: "gestor"`  
**Retorno**: Inclui `usuarios_empresa` e `equipes`

---

## Logs

Acesse os logs da função em:
https://supabase.com/dashboard/project/emlnkqygdkcngmftpsft/functions/buscar-tarefas/logs

---

## Observações Importantes

1. **Identificação**: Usa `usuario_id` (UUID) diretamente, não mais celular
2. **Tipo de usuário**: Obrigatório para aplicar permissões corretas
3. **Tarefas pessoais**: São PRIVADAS - apenas o criador vê
4. **Tarefas profissionais**: Visibilidade depende do tipo de usuário
5. **Dados extras**: Apenas Gestor+ recebe empresa/equipes/usuários
6. **Atividades**: NÃO são retornadas (histórico muito verboso)
7. **Anexos**: NÃO são retornados (arquivos grandes)
8. **Performance**: Filtros opcionais melhoram performance
9. **IA decide**: A IA processa o JSON e decide o que mostrar ao usuário
10. **Arquivadas**: Tarefas arquivadas são EXCLUÍDAS dos resultados
