# Como Usar HTTP Proxy no n8n

Este documento explica como usar o edge function `n8n-proxy` para fazer requisições HTTP genéricas no n8n, incluindo chamadas para buscar dados de usuários.

## Configuração no n8n

### 1. Adicionar nó HTTP Request

No n8n, adicione um nó **HTTP Request** e configure:

**Configurações básicas:**
- **Method**: `POST`
- **URL**: `https://emlnkqygdkcngmftpsft.supabase.co/functions/v1/n8n-proxy`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw"
}
```

### 2. Exemplo: Buscar dados de usuários

**Body (JSON):**
```json
{
  "url": "https://emlnkqygdkcngmftpsft.supabase.co/rest/v1/usuarios",
  "method": "GET",
  "headers": {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw"
  }
}
```

### 3. Exemplo: Buscar usuário específico por ID

**Body (JSON):**
```json
{
  "url": "https://emlnkqygdkcngmftpsft.supabase.co/rest/v1/usuarios?id=eq.UUID_DO_USUARIO",
  "method": "GET",
  "headers": {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw"
  }
}
```

### 4. Exemplo: Criar um novo usuário

**Body (JSON):**
```json
{
  "url": "https://emlnkqygdkcngmftpsft.supabase.co/rest/v1/usuarios",
  "method": "POST",
  "headers": {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw",
    "Prefer": "return=representation"
  },
  "body": {
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "senha_hash": "hash_senha_aqui",
    "tipo_usuario": "usuario",
    "empresa_id": "uuid_da_empresa"
  }
}
```

### 5. Exemplo: Atualizar usuário

**Body (JSON):**
```json
{
  "url": "https://emlnkqygdkcngmftpsft.supabase.co/rest/v1/usuarios?id=eq.UUID_DO_USUARIO",
  "method": "PATCH",
  "headers": {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw",
    "Prefer": "return=representation"
  },
  "body": {
    "nome": "João Silva Atualizado",
    "funcao_empresa": "Gerente"
  }
}
```

## Chamando Edge Functions Customizadas

Você também pode usar o `http-proxy` para chamar outras edge functions:

**Body (JSON):**
```json
{
  "url": "https://emlnkqygdkcngmftpsft.supabase.co/functions/v1/nome-da-funcao",
  "method": "POST",
  "headers": {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw"
  },
  "body": {
    "parametro1": "valor1",
    "parametro2": "valor2"
  }
}
```

## Filtros e Operadores do Supabase REST API

Ao consultar dados, você pode usar vários operadores:

- `eq` - Igual a: `?coluna=eq.valor`
- `neq` - Diferente de: `?coluna=neq.valor`
- `gt` - Maior que: `?coluna=gt.valor`
- `gte` - Maior ou igual: `?coluna=gte.valor`
- `lt` - Menor que: `?coluna=lt.valor`
- `lte` - Menor ou igual: `?coluna=lte.valor`
- `like` - Padrão SQL: `?coluna=like.*texto*`
- `ilike` - Padrão SQL (case insensitive): `?coluna=ilike.*texto*`
- `in` - Em lista: `?coluna=in.(valor1,valor2,valor3)`
- `is` - Verificar nulo: `?coluna=is.null`

### Exemplo com filtros múltiplos:

```json
{
  "url": "https://emlnkqygdkcngmftpsft.supabase.co/rest/v1/usuarios?ativo=eq.true&tipo_usuario=eq.usuario&select=id,nome,email",
  "method": "GET",
  "headers": {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbG5rcXlnZGtjbmdtZnRwc2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDc3MTksImV4cCI6MjA3MTg4MzcxOX0.rCi6bLl3-XaRUmSwUwvxF8GItTvJlhZyo8pLbPNcbMw"
  }
}
```

## Tratamento de Erros

O edge function retorna:

- **200 OK**: Requisição bem-sucedida
- **400 Bad Request**: Parâmetros inválidos (URL não fornecida)
- **500 Internal Server Error**: Erro no proxy ou na requisição

Resposta de erro típica:
```json
{
  "error": "HTTP request failed: 404",
  "details": "Not Found"
}
```

## Logs

Todos os logs são registrados no Supabase Edge Function logs para debug:
- URL chamada
- Método HTTP
- Body da requisição
- Status da resposta
- Erros (se houver)

Acesse os logs em: https://supabase.com/dashboard/project/emlnkqygdkcngmftpsft/functions/n8n-proxy/logs
