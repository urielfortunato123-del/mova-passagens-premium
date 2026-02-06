# API Admin - MOVA (API Key Authentication)

## 🔐 Autenticação

Header obrigatório:
```
X-API-KEY: mova_live_9f3c2a1d7b84e6c1f9a0b2c4e8d7a6f5
```

Ou:
```
Authorization: ApiKey mova_live_9f3c2a1d7b84e6c1f9a0b2c4e8d7a6f5
```

## 📍 Base URL
```
https://ychpfpcsekncdbgwvfke.supabase.co/functions/v1/api-admin-metrics
```

---

## 📊 Endpoints

### 1. GET ?action=summary
Resumo geral do sistema (dashboard).

**Scope necessário:** `metrics:read` ou `*`

**Exemplo:**
```bash
curl -X GET \
  "https://ychpfpcsekncdbgwvfke.supabase.co/functions/v1/api-admin-metrics?action=summary" \
  -H "X-API-KEY: mova_live_9f3c2a1d7b84e6c1f9a0b2c4e8d7a6f5"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "passengers": 150,
      "drivers": 45,
      "total": 195
    },
    "rides": {
      "total": 1234,
      "completed": 1100,
      "active": 12
    },
    "drivers": {
      "online": 8
    }
  },
  "api_key_name": "MOVA Master Key",
  "timestamp": "2026-02-06T16:00:00.000Z"
}
```

---

### 2. GET ?action=rides
Lista corridas com filtros.

**Scope necessário:** `rides:read` ou `*`

**Parâmetros:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| status | string | Filtrar por status (COMPLETED, CANCELLED, etc) |
| from | ISO date | Data início |
| to | ISO date | Data fim |
| limit | int | Limite (default: 50) |
| offset | int | Offset para paginação |

**Exemplo:**
```bash
curl -X GET \
  "https://ychpfpcsekncdbgwvfke.supabase.co/functions/v1/api-admin-metrics?action=rides&status=COMPLETED&limit=20" \
  -H "X-API-KEY: mova_live_9f3c2a1d7b84e6c1f9a0b2c4e8d7a6f5"
```

---

### 3. GET ?action=finance
Relatório financeiro.

**Scope necessário:** `finance:read` ou `*`

**Parâmetros:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| from | ISO date | Data início (default: 30 dias atrás) |
| to | ISO date | Data fim (default: hoje) |

**Exemplo:**
```bash
curl -X GET \
  "https://ychpfpcsekncdbgwvfke.supabase.co/functions/v1/api-admin-metrics?action=finance&from=2026-01-01&to=2026-02-06" \
  -H "X-API-KEY: mova_live_9f3c2a1d7b84e6c1f9a0b2c4e8d7a6f5"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2026-01-01",
      "to": "2026-02-06"
    },
    "total_revenue_cents": 1234500,
    "total_revenue_brl": "12345.00",
    "completed_rides": 450,
    "average_ticket_cents": 2743,
    "average_ticket_brl": "27.43"
  }
}
```

---

### 4. GET ?action=drivers
Lista todos os motoristas.

**Scope necessário:** `drivers:read` ou `*`

**Exemplo:**
```bash
curl -X GET \
  "https://ychpfpcsekncdbgwvfke.supabase.co/functions/v1/api-admin-metrics?action=drivers" \
  -H "X-API-KEY: mova_live_9f3c2a1d7b84e6c1f9a0b2c4e8d7a6f5"
```

---

### 5. GET ?action=export&type=rides
Exporta dados em CSV.

**Scope necessário:** `export:read` ou `*`

**Parâmetros:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| type | string | Tipo de export (rides) |
| from | ISO date | Data início |
| to | ISO date | Data fim |

**Exemplo:**
```bash
curl -X GET \
  "https://ychpfpcsekncdbgwvfke.supabase.co/functions/v1/api-admin-metrics?action=export&type=rides&from=2026-01-01" \
  -H "X-API-KEY: mova_live_9f3c2a1d7b84e6c1f9a0b2c4e8d7a6f5" \
  -o corridas.csv
```

---

## 🔑 Escopos (Scopes)

| Scope | Descrição |
|-------|-----------|
| `*` | Acesso total (Master Key) |
| `metrics:read` | Dashboard/summary |
| `rides:read` | Listar corridas |
| `finance:read` | Relatórios financeiros |
| `drivers:read` | Listar motoristas |
| `export:read` | Exportar CSV |

---

## 🚨 Códigos de Erro

| Status | Código | Descrição |
|--------|--------|-----------|
| 401 | `NO_API_KEY` | API Key não fornecida |
| 403 | `INVALID_API_KEY` | API Key inválida ou inativa |
| 403 | `Insufficient scope` | Escopo insuficiente para ação |
| 400 | `Unknown action` | Ação não reconhecida |
| 500 | `Internal error` | Erro interno |

---

## 🔒 Segurança

⚠️ **NUNCA** exponha a API Key no frontend público!

✅ Use apenas em:
- Painel Admin (backend)
- Scripts internos
- Integrações B2B
- Ferramentas de BI

❌ **NÃO** use em:
- App passageiro
- App motorista
- Qualquer frontend público

---

## 📈 Auditoria

Toda chamada é registrada:
- `last_used_at` - Última utilização
- `usage_count` - Contador de uso

Para revogar uma chave:
```sql
UPDATE api_keys SET is_active = false WHERE api_key = 'mova_live_xxx';
```
