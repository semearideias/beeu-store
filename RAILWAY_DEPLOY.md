# 🚀 Deploy do Backend no Railway

## Problema Atual

O Vercel está apenas servindo o **frontend** (arquivos estáticos). O **backend** (API Node.js) não está deployado, por isso os dados não aparecem.

## Solução: Deploy Backend no Railway

### Passo 1: Criar Novo Serviço no Railway

1. **Aceda a [railway.app](https://railway.app)**
2. **Clique no projeto existente** (onde está o PostgreSQL)
3. **Clique em "New Service"**
4. **Selecione "GitHub Repo"**
5. **Conecte o repositório**: `semearideias/beeu-store`
6. **Aguarde o deploy automático**

### Passo 2: Configurar Variáveis de Ambiente

No Railway, no serviço do backend:

1. **Vá para "Variables"**
2. **Adicione as seguintes variáveis:**

```
PORT=5003
NODE_ENV=production
JWT_SECRET=beeu-secret-key-2024
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**Nota:** O `${{Postgres.DATABASE_URL}}` conecta automaticamente ao PostgreSQL do mesmo projeto.

### Passo 3: Configurar Start Command

1. **Vá para "Settings"**
2. **Em "Deploy"**
3. **Start Command**: `node server/index.js`
4. **Root Directory**: deixe vazio (raiz do projeto)

### Passo 4: Obter URL do Backend

Após o deploy:

1. **Vá para "Settings"**
2. **Em "Networking"**
3. **Clique em "Generate Domain"**
4. **Copie a URL** (ex: `beeu-store-production.up.railway.app`)

### Passo 5: Atualizar Frontend no Vercel

1. **Vá para Vercel Dashboard**
2. **Projeto `beeu-store`**
3. **Settings → Environment Variables**
4. **Adicione/Atualize:**
   - **Name**: `VITE_API_URL`
   - **Value**: `https://beeu-store-production.up.railway.app/api`
5. **Save**
6. **Redeploy**

---

## Arquitetura Final

```
┌─────────────────┐
│   Vercel        │
│   (Frontend)    │ → https://beeu-store.vercel.app
└────────┬────────┘
         │
         │ API Calls
         ↓
┌─────────────────┐
│   Railway       │
│   (Backend)     │ → https://beeu-store-production.up.railway.app
└────────┬────────┘
         │
         │ SQL
         ↓
┌─────────────────┐
│   Railway       │
│   (PostgreSQL)  │
└─────────────────┘
```

---

## Verificar Deploy

### Backend (Railway)
```bash
curl https://beeu-store-production.up.railway.app/api/health
```

Deve retornar: `{"status":"ok"}`

### Frontend (Vercel)
Aceda a `https://beeu-store.vercel.app` e verifique se os produtos aparecem.

---

## Troubleshooting

### Backend não inicia
- Verificar logs no Railway
- Verificar se `DATABASE_URL` está configurada
- Verificar se porta está correta

### Frontend não conecta ao backend
- Verificar se `VITE_API_URL` está configurada no Vercel
- Verificar CORS no backend
- Verificar logs do browser (F12 → Console)

### Dados não aparecem
- Verificar se migração foi executada
- Verificar conexão PostgreSQL
- Verificar logs do backend

---

## Custos

- **Railway**: Gratuito até $5/mês de uso
- **Vercel**: Gratuito (frontend estático)
- **PostgreSQL**: Incluído no Railway

**Total**: Gratuito para começar! 🎉
