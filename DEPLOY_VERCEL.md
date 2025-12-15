# 🚀 Guia de Deploy com Vercel

## Visão Geral

Vercel é a melhor opção para este projeto porque:
- ✅ Integração perfeita com React/Vite
- ✅ Serverless Functions para o backend
- ✅ Deploy automático via GitHub
- ✅ Gratuito para começar
- ✅ Escalabilidade automática
- ✅ CDN global

---

## Passo 1: Preparar o Repositório GitHub

```bash
# 1. Inicializar Git (se não estiver)
cd /Users/joaosimoes/CascadeProjects/beeu-store
git init

# 2. Adicionar todos os arquivos
git add .

# 3. Commit inicial
git commit -m "Initial commit - BEEU Store"

# 4. Criar repositório no GitHub e fazer push
git remote add origin https://github.com/seu-usuario/beeu-store.git
git branch -M main
git push -u origin main
```

---

## Passo 2: Deploy na Vercel

### Opção A: Via Dashboard (Recomendado)

1. Aceda a [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Selecione "Import Git Repository"
4. Conecte seu repositório GitHub (`beeu-store`)
5. Configure:
   - **Framework Preset**: React
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`

6. Clique em "Deploy"

### Opção B: Via CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

---

## Passo 3: Configurar Variáveis de Ambiente

Na dashboard do Vercel:

1. Vá para **Settings** → **Environment Variables**
2. Adicione:
   ```
   VITE_API_URL=https://seu-projeto.vercel.app/api
   ```

3. Redeploy para aplicar as mudanças

---

## Passo 4: Configurar o Backend

### Opção A: Backend em Vercel (Serverless Functions)

O arquivo `api/index.js` já está configurado para funcionar como Serverless Function.

**Vantagens:**
- Tudo em um único deploy
- Sem servidor separado
- Escalabilidade automática

**Desvantagens:**
- SQLite não funciona bem (usar PostgreSQL)
- Cold starts iniciais

### Opção B: Backend em Railway/Heroku (Recomendado)

Se preferir manter o backend separado:

1. Deploy o backend em Railway/Heroku
2. Configure `VITE_API_URL` apontando para seu backend
3. Exemplo: `https://seu-backend-railway.railway.app/api`

---

## Passo 5: Database

### Para Produção com Vercel:

**Opção 1: PostgreSQL em Railway (Recomendado)**
```bash
# 1. Criar conta em railway.app
# 2. Criar novo projeto PostgreSQL
# 3. Copiar connection string
# 4. Adicionar em variáveis de ambiente do backend
```

**Opção 2: Usar SQLite (Não recomendado para Vercel)**
- SQLite em Vercel é problemático (sistema de arquivos efêmero)
- Use apenas para desenvolvimento local

---

## Passo 6: Atualizar Configurações

### `client/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5003',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
```

### `client/src/api.js`

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003/api';

export const api = {
  // ... suas funções de API
};
```

---

## Passo 7: Deploy Automático

Após configurar:

1. Qualquer push para `main` dispara deploy automático
2. Vercel cria preview URLs para PRs
3. Histórico de deploys disponível no dashboard

---

## URLs Após Deploy

- **Frontend**: `https://seu-projeto.vercel.app`
- **API** (se em Vercel): `https://seu-projeto.vercel.app/api`
- **API** (se em Railway): `https://seu-backend-railway.railway.app/api`

---

## Troubleshooting

### Build falha
```bash
# Verificar logs
vercel logs

# Limpar cache
vercel env pull
```

### API não funciona
- Verificar `VITE_API_URL` está correto
- Verificar CORS no backend
- Verificar variáveis de ambiente

### Database não conecta
- Verificar connection string
- Verificar credenciais
- Verificar firewall/IP whitelist

---

## Monitoramento

Vercel oferece:
- ✅ Analytics automático
- ✅ Performance monitoring
- ✅ Error tracking
- ✅ Logs em tempo real

---

## Próximos Passos

1. ✅ Fazer push para GitHub
2. ✅ Conectar Vercel
3. ✅ Configurar variáveis de ambiente
4. ✅ Deploy automático
5. ✅ Testar em produção

**Está pronto para começar?** 🚀
