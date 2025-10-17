# Edge Functions para Buscar Tarefas

Este documento explica como usar as edge functions para buscar tarefas de usuários via n8n.

## 1. Buscar Todas as Tarefas de um Usuário

### Função: `buscar-tarefas-usuario`

Retorna todas as tarefas onde o usuário é responsável (diretamente ou via equipe).

### Configuração no n8n

**Nó HTTP Request:**
- **Method**: `POST`
- **URL**: `https://emlnkqygdkcngmftpsft.supabase.co/functions/v1/n8n-proxy`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw"
}
```

**Body:**
```json
{
  "url": "https://emlnkqygdkcngmftpsft.supabase.co/functions/v1/buscar-tarefas-usuario",
  "method": "POST",
  "headers": {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw"
  },
  "body": {
    "email": "usuario@exemplo.com"
  }
}
```

### Resposta de Sucesso

```json
{
  "usuario": {
    "nome": "João Silva",
    "email": "usuario@exemplo.com"
  },
  "total": 5,
  "tarefas": [
    {
      "id": "uuid-da-tarefa",
      "titulo": "Implementar nova funcionalidade",
      "descricao": "Descrição detalhada...",
      "prioridade": "alta",
      "status": "executando",
      "data_conclusao": "2025-01-20",
      "horario_conclusao": "18:00:00",
      "criado_por": "uuid-criador",
      "empresa_id": "uuid-empresa",
      "created_at": "2025-01-15T10:00:00Z",
      "tempo_gasto_minutos": 120,
      "responsaveis": [
        {
          "usuario_id": "uuid-usuario",
          "equipe_id": null
        }
      ],
      "checklists": [
        {
          "id": "uuid-checklist",
          "titulo": "Tarefas de Implementação",
          "itens": [
            {
              "id": "uuid-item",
              "item": "Criar componente",
              "concluido": true
            }
          ]
        }
      ],
      "comentarios": [
        {
          "id": "uuid-comentario",
          "comentario": "Progresso está bom!",
          "usuario_id": "uuid-usuario",
          "created_at": "2025-01-16T14:00:00Z"
        }
      ],
      "anexos": [
        {
          "id": "uuid-anexo",
          "nome": "documento.pdf",
          "url": "https://...",
          "tipo": "application/pdf",
          "tamanho": 1024000,
          "created_at": "2025-01-15T11:00:00Z"
        }
      ],
      "atividades": [
        {
          "id": "uuid-atividade",
          "acao": "status_alterado",
          "descricao": "Status alterado de 'criada' para 'executando'",
          "usuario_id": "uuid-usuario",
          "created_at": "2025-01-15T12:00:00Z"
        }
      ]
    }
  ]
}
```

### Resposta quando não há tarefas

```json
{
  "usuario": {
    "nome": "João Silva",
    "email": "usuario@exemplo.com"
  },
  "tarefas": []
}
```

---

## 2. Buscar Tarefa Específica por Título

### Função: `buscar-tarefa-especifica`

Retorna uma tarefa específica pelo título, verificando se o usuário é responsável.

### Configuração no n8n

**Nó HTTP Request:**
- **Method**: `POST`
- **URL**: `https://emlnkqygdkcngmftpsft.supabase.co/functions/v1/n8n-proxy`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw"
}
```

**Body:**
```json
{
  "url": "https://emlnkqygdkcngmftpsft.supabase.co/functions/v1/buscar-tarefa-especifica",
  "method": "POST",
  "headers": {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw"
  },
  "body": {
    "email": "usuario@exemplo.com",
    "titulo": "Implementar nova funcionalidade"
  }
}
```

### Resposta de Sucesso

```json
{
  "usuario": {
    "nome": "João Silva",
    "email": "usuario@exemplo.com"
  },
  "tarefa": {
    "id": "uuid-da-tarefa",
    "titulo": "Implementar nova funcionalidade",
    "descricao": "Descrição detalhada da tarefa...",
    "prioridade": "alta",
    "status": "executando",
    "data_conclusao": "2025-01-20",
    "horario_conclusao": "18:00:00",
    "criado_por": "uuid-criador",
    "criado_por_nome": "Maria Santos",
    "empresa_id": "uuid-empresa",
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-16T14:00:00Z",
    "tempo_inicio": "2025-01-15T12:00:00Z",
    "tempo_fim": null,
    "tempo_gasto_minutos": 120,
    "arquivada": false,
    "posicao_coluna": 0,
    "responsaveis": [
      {
        "usuario_id": "uuid-usuario",
        "equipe_id": null
      }
    ],
    "checklists": [
      {
        "id": "uuid-checklist",
        "titulo": "Tarefas de Implementação",
        "created_at": "2025-01-15T10:05:00Z",
        "updated_at": "2025-01-15T10:05:00Z",
        "itens": [
          {
            "id": "uuid-item-1",
            "item": "Criar componente React",
            "concluido": true,
            "created_at": "2025-01-15T10:05:00Z",
            "updated_at": "2025-01-15T12:00:00Z"
          },
          {
            "id": "uuid-item-2",
            "item": "Escrever testes unitários",
            "concluido": false,
            "created_at": "2025-01-15T10:05:00Z",
            "updated_at": "2025-01-15T10:05:00Z"
          }
        ]
      }
    ],
    "comentarios": [
      {
        "id": "uuid-comentario",
        "comentario": "O progresso está muito bom! Continue assim.",
        "usuario_id": "uuid-gerente",
        "usuario_nome": "Carlos Gerente",
        "created_at": "2025-01-16T14:00:00Z"
      }
    ],
    "anexos": [
      {
        "id": "uuid-anexo",
        "nome": "especificacao.pdf",
        "url": "https://storage.supabase.co/...",
        "tipo": "application/pdf",
        "tamanho": 1024000,
        "usuario_id": "uuid-criador",
        "usuario_nome": "Maria Santos",
        "created_at": "2025-01-15T11:00:00Z"
      }
    ],
    "atividades": [
      {
        "id": "uuid-atividade-1",
        "acao": "tarefa_criada",
        "descricao": "Tarefa criada",
        "usuario_id": "uuid-criador",
        "usuario_nome": "Maria Santos",
        "created_at": "2025-01-15T10:00:00Z"
      },
      {
        "id": "uuid-atividade-2",
        "acao": "status_alterado",
        "descricao": "Status alterado de 'criada' para 'executando'",
        "usuario_id": "uuid-usuario",
        "usuario_nome": "João Silva",
        "created_at": "2025-01-15T12:00:00Z"
      }
    ],
    "tempo_sessoes": [
      {
        "id": "uuid-sessao-1",
        "inicio": "2025-01-15T12:00:00Z",
        "fim": "2025-01-15T14:00:00Z",
        "minutos_trabalhados": 120,
        "usuario_id": "uuid-usuario",
        "created_at": "2025-01-15T12:00:00Z"
      }
    ]
  }
}
```

---

## Tratamento de Erros

### Usuário não encontrado (404)

```json
{
  "error": "Usuário não encontrado"
}
```

### Tarefa não encontrada (404)

```json
{
  "error": "Tarefa não encontrada com esse título"
}
```

### Usuário não é responsável (404)

```json
{
  "error": "Tarefa não encontrada ou você não é responsável por ela"
}
```

### Parâmetros inválidos (400)

```json
{
  "error": "Email é obrigatório"
}
```

ou

```json
{
  "error": "Email e título da tarefa são obrigatórios"
}
```

### Erro interno (500)

```json
{
  "error": "Mensagem de erro detalhada",
  "type": "function_error"
}
```

---

## Logs

Acesse os logs das funções em:

- **buscar-tarefas-usuario**: https://supabase.com/dashboard/project/emlnkqygdkcngmftpsft/functions/buscar-tarefas-usuario/logs
- **buscar-tarefa-especifica**: https://supabase.com/dashboard/project/emlnkqygdkcngmftpsft/functions/buscar-tarefa-especifica/logs

---

## Observações Importantes

1. **Busca por título**: A função `buscar-tarefa-especifica` usa busca case-insensitive com ILIKE, então funciona com títulos parciais.

2. **Permissões**: As funções verificam se o usuário é responsável pela tarefa (diretamente ou via equipe) antes de retornar os dados.

3. **Tarefas arquivadas**: As funções retornam apenas tarefas não arquivadas (`arquivada = false`).

4. **Dados completos**: A função `buscar-tarefa-especifica` retorna todos os dados relacionados à tarefa (checklists, comentários, anexos, atividades e sessões de tempo).

5. **Nomes de usuários**: A função `buscar-tarefa-especifica` enriquece os dados com os nomes dos usuários em comentários, atividades e anexos.
