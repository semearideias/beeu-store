# 📊 Guia de Migração SQLite → PostgreSQL

## O que é esta migração?

Transferir todos os dados existentes do SQLite (`beeu.db`) para PostgreSQL (Railway).

---

## ⚠️ Antes de Começar

1. **Backup do SQLite** (por segurança):
   ```bash
   cp beeu.db beeu.db.backup
   ```

2. **Verificar DATABASE_URL**:
   ```bash
   echo $DATABASE_URL
   ```
   Deve mostrar algo como: `postgresql://user:password@host:port/database`

---

## 🚀 Executar Migração

### Opção 1: Localmente (Recomendado para Teste)

```bash
# 1. Configurar DATABASE_URL localmente
export DATABASE_URL="postgresql://user:password@host:port/database"

# 2. Executar script de migração
node scripts/migrate-to-postgres.js
```

### Opção 2: Via Vercel (Produção)

A migração será executada automaticamente quando o código for deployado, se a `DATABASE_URL` estiver configurada.

---

## 📋 O que será Migrado

- ✅ Utilizadores (users)
- ✅ Categorias (categories)
- ✅ Produtos (products)
- ✅ Cores de produtos (product_colors)
- ✅ Preços (product_prices)
- ✅ Carrinho (cart_items)
- ✅ Pedidos (orders)
- ✅ Itens de pedidos (order_items)
- ✅ Rastreamento (order_tracking)
- ✅ Orçamentos (quotes)
- ✅ Itens de orçamentos (quote_items)
- ✅ Menus (header_menus)
- ✅ Páginas personalizadas (custom_pages)
- ✅ SEO (product_seo, page_seo)
- ✅ Admin (admin_users)
- ✅ Page Builder (page_builder_sections, page_builder_blocks)
- ✅ Envios (shipping_methods)
- ✅ Configurações (store_settings)
- ✅ Histórico (import_history, image_download_queue)

---

## ✅ Verificar Migração

### 1. Verificar Número de Registos

```bash
# SQLite
sqlite3 beeu.db "SELECT COUNT(*) FROM products;"

# PostgreSQL (via Railway)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM products;"
```

### 2. Testar em Produção

1. Aceda a https://beeu-store.vercel.app
2. Verifique se os produtos aparecem
3. Teste o carrinho e orçamentos
4. Teste o login

### 3. Verificar Logs

```bash
# Vercel
vercel logs

# Railway
railway logs
```

---

## 🔧 Troubleshooting

### Erro: "DATABASE_URL not found"
```bash
# Configurar localmente
export DATABASE_URL="postgresql://..."
```

### Erro: "Connection refused"
- Verificar se Railway está ativo
- Verificar firewall/IP whitelist
- Testar conexão: `psql $DATABASE_URL -c "SELECT 1;"`

### Erro: "Table does not exist"
- Executar migrations primeiro: `npm run migrate`
- Verificar se tabelas foram criadas no PostgreSQL

### Dados não aparecem
- Verificar se migração foi executada
- Verificar logs do script
- Contar registos em ambas as databases

---

## 🗑️ Após Migração Bem-Sucedida

Quando tudo estiver funcionando em produção:

```bash
# 1. Fazer backup final
cp beeu.db beeu.db.final-backup

# 2. Remover SQLite (opcional)
rm beeu.db

# 3. Commit e push
git add .
git commit -m "Remove SQLite after successful PostgreSQL migration"
git push
```

---

## 📝 Checklist Final

- [ ] DATABASE_URL configurada no Vercel
- [ ] Script de migração executado
- [ ] Dados verificados em PostgreSQL
- [ ] Aplicação testada em produção
- [ ] Logs verificados
- [ ] Backup do SQLite feito
- [ ] SQLite removido (opcional)

---

## 🆘 Precisa de Ajuda?

Se algo der errado:
1. Restaurar backup: `cp beeu.db.backup beeu.db`
2. Verificar logs
3. Contactar suporte Railway

**Boa sorte! 🚀**
