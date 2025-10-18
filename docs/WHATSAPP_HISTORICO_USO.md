# Como Usar o Sistema de Histórico de Conversas WhatsApp

## Visão Geral

O sistema foi implementado com:
- ✅ Tabela `whatsapp_conversas` - gerencia sessões de conversa
- ✅ Tabela `whatsapp_mensagens` - armazena mensagens individuais
- ✅ Triggers automáticos para atualizar contadores e timestamps
- ✅ Função `encerrar_conversas_inativas()` para limpar sessões antigas
- ✅ Edge Function `gerenciar-conversa-whatsapp` para facilitar integração

## Estrutura das Tabelas

### whatsapp_conversas
```sql
- id (UUID)
- numero_usuario (text) - número do WhatsApp
- instancia_id (UUID) - referência à instância
- sessao_iniciada_em (timestamp)
- sessao_encerrada_em (timestamp)
- ativa (boolean) - se a sessão está ativa
- contexto_atual (jsonb) - resumo do que foi discutido
- ultima_mensagem_em (timestamp)
- total_mensagens (integer)
- push_name (text) - nome do contato
- created_at, updated_at
```

### whatsapp_mensagens
```sql
- id (UUID)
- conversa_id (UUID) - FK para whatsapp_conversas
- numero_usuario (text)
- remetente (text)
- destinatario (text)
- de_mim (boolean) - se foi enviada pelo sistema/IA
- conteudo_mensagem (text)
- tipo_mensagem (text)
- horario (timestamp)
- message_id (text) - ID do WhatsApp
- push_name (text)
- status (text)
- respondida_por_ia (boolean)
- intencao_detectada (text) - ex: "buscar_tarefas"
- ferramenta_usada (text) - ex: "Toll All Tasks"
- dados_completos (jsonb)
- created_at
```

## Usando a Edge Function no N8N

### 1. Configurar Node HTTP Request

**URL:**
```
https://emlnkqygdkcngmftpsft.supabase.co/functions/v1/gerenciar-conversa-whatsapp
```

**Method:** POST

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer SEU_SUPABASE_ANON_KEY"
}
```

**Body (JSON):**
```json
{
  "mensagem": {
    "numero_usuario": "{{ $json.body.data.key.remoteJid }}",
    "remetente": "{{ $json.body.data.key.remoteJid }}",
    "destinatario": "{{ $json.body.data.key.participant }}",
    "de_mim": false,
    "conteudo_mensagem": "{{ $json.body.message.conversation }}",
    "tipo_mensagem": "conversation",
    "message_id": "{{ $json.body.data.key.id }}",
    "push_name": "{{ $json.body.data.pushName }}",
    "dados_completos": "{{ $json }}"
  },
  "limite_historico": 10
}
```

### 2. Resposta da Edge Function

```json
{
  "sucesso": true,
  "conversa_id": "uuid-da-conversa",
  "mensagem_id": "uuid-da-mensagem",
  "historico": [
    {
      "id": "uuid",
      "conteudo_mensagem": "Quero ver minhas tarefas",
      "de_mim": false,
      "horario": "2025-10-17T14:00:00Z",
      "tipo_mensagem": "conversation"
    },
    {
      "id": "uuid",
      "conteudo_mensagem": "Você tem 5 tarefas...",
      "de_mim": true,
      "horario": "2025-10-17T14:00:05Z"
    }
  ],
  "total_mensagens_historico": 2
}
```

## Integração com o Agente IA

### 3. Preparar Histórico para a IA

No N8N, antes de chamar o nó "Analise de Texto" (Agent), processar o histórico:

```javascript
// Node Code (JavaScript)
const historico = $input.all()[0].json.historico;

// Formatar histórico para o prompt
const historicoFormatado = historico.map(msg => {
  const remetente = msg.de_mim ? "Assistente" : "Usuário";
  return `${remetente}: ${msg.conteudo_mensagem}`;
}).join('\n');

return {
  json: {
    historico_texto: historicoFormatado,
    mensagem_atual: $json.body.message.conversation,
    conversa_id: $input.all()[0].json.conversa_id
  }
};
```

### 4. Atualizar Prompt do Agente

No nó "Analise de Texto", atualizar o prompt:

```
HISTÓRICO DA CONVERSA:
{{ $json.historico_texto }}

MENSAGEM ATUAL: {{ $json.mensagem_atual }}

Analise a mensagem considerando o contexto do histórico e responda de acordo com as ferramentas disponíveis.
```

### 5. Salvar Resposta da IA

Após a IA responder, salvar a resposta como nova mensagem:

```json
{
  "mensagem": {
    "numero_usuario": "{{ $('Node Anterior').item.json.body.data.key.remoteJid }}",
    "remetente": "sistema",
    "destinatario": "{{ $('Node Anterior').item.json.body.data.key.remoteJid }}",
    "de_mim": true,
    "conteudo_mensagem": "{{ $json.output }}",
    "tipo_mensagem": "conversation",
    "respondida_por_ia": true,
    "intencao_detectada": "{{ $json.intent }}",
    "ferramenta_usada": "{{ $json.tool_used }}"
  },
  "limite_historico": 0
}
```

## Fluxo Completo no N8N

```mermaid
graph TD
    A[Webhook WhatsApp] --> B[Gerenciar Conversa]
    B --> C{Sessão Existe?}
    C -->|Não| D[Criar Nova Sessão]
    C -->|Sim| E[Usar Sessão Existente]
    D --> F[Salvar Mensagem]
    E --> F
    F --> G[Buscar Histórico]
    G --> H[Formatar para IA]
    H --> I[Agente IA Analisa]
    I --> J{Usar Tool?}
    J -->|Sim| K[Executar Tool]
    J -->|Não| L[Resposta Direta]
    K --> M[IA Gera Resposta]
    L --> M
    M --> N[Salvar Resposta]
    N --> O[Enviar WhatsApp]
```

## Queries Úteis

### Buscar Conversa Ativa de um Usuário
```sql
SELECT * FROM public.whatsapp_conversas
WHERE numero_usuario = '5521982534276'
  AND ativa = true
ORDER BY sessao_iniciada_em DESC
LIMIT 1;
```

### Buscar Histórico de uma Conversa
```sql
SELECT 
  conteudo_mensagem,
  de_mim,
  horario,
  intencao_detectada,
  ferramenta_usada
FROM public.whatsapp_mensagens
WHERE conversa_id = 'uuid-da-conversa'
ORDER BY horario ASC;
```

### Encerrar Conversas Inativas (via Cron)
```sql
SELECT public.encerrar_conversas_inativas();
```

### Estatísticas de Conversas
```sql
SELECT 
  numero_usuario,
  COUNT(*) as total_conversas,
  SUM(total_mensagens) as total_mensagens,
  AVG(total_mensagens) as media_mensagens_por_conversa,
  MAX(total_mensagens) as maior_conversa
FROM public.whatsapp_conversas
GROUP BY numero_usuario
ORDER BY total_mensagens DESC;
```

## Manutenção

### Limpar Conversas Antigas (via Cron)

Configure um cron job no Supabase para executar:

```sql
-- Arquivar conversas com mais de 30 dias
UPDATE public.whatsapp_conversas
SET ativa = false, sessao_encerrada_em = now()
WHERE ativa = true 
  AND sessao_iniciada_em < (now() - INTERVAL '30 days');

-- Deletar mensagens de conversas muito antigas (opcional)
DELETE FROM public.whatsapp_mensagens
WHERE conversa_id IN (
  SELECT id FROM public.whatsapp_conversas
  WHERE sessao_iniciada_em < (now() - INTERVAL '90 days')
);
```

## Exemplo de Uso Direto (SQL)

Se preferir não usar a edge function:

```sql
-- 1. Criar ou buscar sessão
INSERT INTO public.whatsapp_conversas (numero_usuario, ativa)
VALUES ('5521982534276', true)
ON CONFLICT DO NOTHING
RETURNING id;

-- 2. Salvar mensagem
INSERT INTO public.whatsapp_mensagens (
  conversa_id,
  numero_usuario,
  remetente,
  destinatario,
  de_mim,
  conteudo_mensagem
) VALUES (
  'uuid-da-conversa',
  '5521982534276',
  '5521982534276',
  'sistema',
  false,
  'Quero ver minhas tarefas'
);
```

## Benefícios

✅ **Memória de Contexto**: IA lembra o que foi dito antes  
✅ **Sessões Organizadas**: Conversas separadas por período  
✅ **Performance**: Índices otimizados para buscas rápidas  
✅ **Analytics**: Dados estruturados para análise  
✅ **Escalável**: Suporta múltiplos usuários simultaneamente  
✅ **Rastreável**: Histórico completo de interações  

## URLs Úteis

- **Edge Function Logs**: https://supabase.com/dashboard/project/emlnkqygdkcngmftpsft/functions/gerenciar-conversa-whatsapp/logs
- **SQL Editor**: https://supabase.com/dashboard/project/emlnkqygdkcngmftpsft/sql/new
- **Tabelas**: https://supabase.com/dashboard/project/emlnkqygdkcngmftpsft/editor