# 📊 Configuração de Database

## Desenvolvimento vs Produção

### 🔧 Desenvolvimento (SQLite)
- **Arquivo**: `beeu.db`
- **Vantagem**: Sem configuração, funciona localmente
- **Desvantagem**: Não escalável para produção

### 🚀 Produção (PostgreSQL)
- **Recomendado**: Railway, Heroku, ou outro provedor
- **Vantagem**: Escalável, seguro, profissional
- **Desvantagem**: Requer configuração

---

## Opção 1: Railway (Recomendado) ⭐

### Passo 1: Criar Conta Railway
1. Aceda a [railway.app](https://railway.app)
2. Clique em "Start a New Project"
3. Selecione "Provision PostgreSQL"

### Passo 2: Copiar Connection String
1. Vá para "Connect"
2. Copie a **Database URL**
3. Exemplo: `postgresql://user:password@host:port/database`

### Passo 3: Configurar Variáveis de Ambiente

**Localmente (para testes):**
```bash
# Criar arquivo .env
DATABASE_URL=postgresql://user:password@host:port/database
```

**No Vercel:**
1. Vá para Settings → Environment Variables
2. Adicione:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   ```
3. Redeploy

### Passo 4: Executar Migrations
```bash
# Criar tabelas no PostgreSQL
npm run migrate
```

---

## Opção 2: Heroku

### Passo 1: Criar App Heroku
```bash
heroku create seu-app-name
heroku addons:create heroku-postgresql:hobby-dev
```

### Passo 2: Copiar DATABASE_URL
```bash
heroku config:get DATABASE_URL
```

### Passo 3: Adicionar ao Vercel
- Mesmo processo que Railway

---

## Opção 3: Supabase (PostgreSQL Gerenciado)

### Passo 1: Criar Projeto
1. Aceda a [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Preencha os dados

### Passo 2: Copiar Connection String
- Settings → Database → Connection String

### Passo 3: Configurar no Vercel
- Mesmo processo que Railway

---

## Migração de SQLite para PostgreSQL

### Passo 1: Exportar Dados do SQLite
```bash
# Usar ferramenta como pgloader ou fazer manualmente
sqlite3 beeu.db ".dump" > dump.sql
```

### Passo 2: Importar para PostgreSQL
```bash
psql -U user -d database -f dump.sql
```

### Passo 3: Testar Conexão
```bash
DATABASE_URL=postgresql://... npm run dev
```

---

## Variáveis de Ambiente

### Desenvolvimento (.env)
```
PORT=5003
DATABASE_URL=sqlite:///beeu.db
NODE_ENV=development
JWT_SECRET=seu-secret-key
```

### Produção (Vercel)
```
PORT=5003
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
JWT_SECRET=seu-secret-key-seguro
```

---

## Troubleshooting

### Erro: "DATABASE_URL not found"
- Verificar se variável está configurada no Vercel
- Verificar se está no Environment Variables correto

### Erro: "Connection refused"
- Verificar se DATABASE_URL está correta
- Verificar firewall/IP whitelist no provedor

### Erro: "Table does not exist"
- Executar migrations: `npm run migrate`
- Verificar se tabelas foram criadas

---

## Próximos Passos

1. **Escolher provedor** (Railway, Heroku, ou Supabase)
2. **Criar database PostgreSQL**
3. **Copiar DATABASE_URL**
4. **Adicionar ao Vercel**
5. **Testar conexão**
6. **Migrar dados** (se necessário)

---

## Recomendação Final

**Use Railway** porque:
- ✅ Gratuito para começar
- ✅ Integração fácil com Vercel
- ✅ PostgreSQL de qualidade
- ✅ Suporte excelente
- ✅ Escalável

**Próximo passo: Qual provedor você quer usar?** 🚀
