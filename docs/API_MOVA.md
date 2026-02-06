# API MOVA - Documentação

## Base URL
```
https://ychpfpcsekncdbgwvfke.supabase.co/functions/v1
```

## Autenticação
Todas as requisições devem incluir o header:
```
Authorization: Bearer <supabase_access_token>
```

## CORS
Domínios permitidos:
- `https://mova-usuario.onrender.com`
- `https://mova-motorista.onrender.com`
- `*` (desenvolvimento)

---

## Endpoints

### 1. POST /api-onboarding
Cria perfil de usuário (passageiro ou motorista).

**Body:**
```json
{
  "role": "passenger" | "driver",
  "full_name": "Nome Completo",
  "phone": "11999999999",
  "vehicle_plate": "ABC1234",      // apenas driver
  "vehicle_model": "Honda Civic",   // apenas driver
  "vehicle_year": 2020              // apenas driver
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Profile created successfully",
  "profile": { ... }
}
```

---

### 2. POST /api-driver-online
Marca motorista como online/offline.

**Body:**
```json
{
  "is_online": true | false
}
```

**Response (200):**
```json
{
  "success": true,
  "is_online": true,
  "message": "Driver is now online"
}
```

---

### 3. POST /api-driver-location
Atualiza localização do motorista (chamar a cada 10-15s quando online).

**Body:**
```json
{
  "lat": -23.5505,
  "lng": -46.6333
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Location updated",
  "lat": -23.5505,
  "lng": -46.6333,
  "timestamp": "2026-02-06T16:00:00.000Z"
}
```

---

### 4. POST /api-rides
Cria uma nova corrida (passageiro).

**Body:**
```json
{
  "origin": {
    "lat": -23.5505,
    "lng": -46.6333,
    "address": "Av. Paulista, 1000"
  },
  "destination": {
    "lat": -23.5600,
    "lng": -46.6500,
    "address": "Rua Augusta, 500"
  },
  "scheduled_for": null
}
```

**Response (201):**
```json
{
  "success": true,
  "ride_id": "uuid",
  "status": "MATCHING",
  "drivers_notified": 5,
  "message": "Ride created and 5 drivers notified"
}
```

---

### 5. GET /api-driver-offers
Lista ofertas de corrida ativas para o motorista.

**Response (200):**
```json
{
  "success": true,
  "offers": [
    {
      "id": "uuid",
      "status": "SENT",
      "expires_at": "2026-02-06T16:01:30.000Z",
      "ride": {
        "id": "uuid",
        "origin_address": "Av. Paulista, 1000",
        "dest_address": "Rua Augusta, 500",
        "passenger": {
          "full_name": "João Silva",
          "phone": "11999999999"
        }
      }
    }
  ],
  "count": 1
}
```

---

### 6. POST /api-ride-accept
Motorista aceita uma corrida.

**Body:**
```json
{
  "ride_id": "uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Ride accepted successfully",
  "ride": { ... }
}
```

**Erros possíveis:**
- `409` - Corrida já aceita por outro motorista
- `404` - Oferta não encontrada ou expirada

---

### 7. POST /api-ride-status
Atualiza status da corrida.

**Body:**
```json
{
  "ride_id": "uuid",
  "status": "ARRIVING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
}
```

**Transições válidas:**
- `MATCHING` → `CANCELLED` (passageiro)
- `ACCEPTED` → `ARRIVING`, `CANCELLED`
- `ARRIVING` → `IN_PROGRESS`, `CANCELLED`
- `IN_PROGRESS` → `COMPLETED`

**Response (200):**
```json
{
  "success": true,
  "message": "Ride status updated to ARRIVING",
  "ride": { ... }
}
```

---

### 8. GET /api-ride-detail?ride_id=uuid
Retorna detalhes de uma corrida.

**Response (200):**
```json
{
  "success": true,
  "ride": {
    "id": "uuid",
    "status": "ACCEPTED",
    "origin_address": "...",
    "dest_address": "...",
    "passenger": { "full_name": "...", "phone": "..." },
    "driver": {
      "full_name": "...",
      "phone": "...",
      "vehicle_plate": "ABC1234",
      "vehicle_model": "Honda Civic",
      "last_lat": -23.55,
      "last_lng": -46.63
    }
  }
}
```

---

## Realtime (Supabase)

### Passageiro - Acompanhar corrida
```typescript
const channel = supabase
  .channel('ride-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'rides',
      filter: `id=eq.${rideId}`
    },
    (payload) => {
      console.log('Ride updated:', payload.new);
    }
  )
  .subscribe();
```

### Motorista - Receber ofertas
```typescript
const channel = supabase
  .channel('driver-offers')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'ride_offers',
      filter: `driver_id=eq.${userId}`
    },
    (payload) => {
      console.log('New offer:', payload.new);
      // Buscar detalhes com GET /api-driver-offers
    }
  )
  .subscribe();
```

---

## Códigos de Erro

| Status | Código | Descrição |
|--------|--------|-----------|
| 401 | `UNAUTHORIZED` | Token inválido ou ausente |
| 403 | `FORBIDDEN` | Usuário não tem permissão |
| 404 | `NOT_FOUND` | Recurso não encontrado |
| 409 | `CONFLICT` | Conflito (ex: corrida já aceita) |
| 422 | `VALIDATION` | Dados inválidos |
| 500 | `SERVER_ERROR` | Erro interno |

---

## Fluxo Completo

1. **Passageiro** cria corrida → `POST /api-rides`
2. Sistema notifica motoristas próximos via `ride_offers`
3. **Motorista** vê ofertas → `GET /api-driver-offers`
4. **Motorista** aceita → `POST /api-ride-accept`
5. **Motorista** atualiza status:
   - `ARRIVING` (a caminho)
   - `IN_PROGRESS` (corrida iniciada)
   - `COMPLETED` (corrida finalizada)
6. Ambos acompanham via **Realtime**
