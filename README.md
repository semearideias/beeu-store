# BEEU - Loja Online de Brindes Publicitários

Loja online moderna e profissional para venda de brindes publicitários com opções de compra direta e orçamentos personalizados.

## Características

- ✅ Catálogo de produtos com filtros
- ✅ Visualização de preços por quantidade
- ✅ Cores disponíveis por produto
- ✅ Carrinho de compras
- ✅ Sistema de checkout
- ✅ Pedidos e histórico
- ✅ Orçamentos personalizados
- ✅ Autenticação de utilizadores
- ✅ Importação de produtos via CSV
- ✅ Design moderno e responsivo

## Cores da Marca

- **Primária**: #f9b233 (Amarelo)
- **Secundária**: #161616 (Preto)

## Instalação

### Pré-requisitos

- Node.js 16+
- npm ou yarn

### Setup Backend

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm run dev
```

O servidor estará disponível em `http://localhost:5003`

### Setup Frontend

```bash
cd client

# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

## Estrutura do Projeto

```
beeu-store/
├── server/
│   ├── db/
│   │   └── init.js          # Inicialização do banco de dados
│   ├── routes/
│   │   ├── auth.js          # Autenticação
│   │   ├── products.js      # Produtos
│   │   ├── cart.js          # Carrinho
│   │   ├── orders.js        # Pedidos
│   │   ├── quotes.js        # Orçamentos
│   │   └── import.js        # Importação CSV
│   └── index.js             # Servidor principal
├── client/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas
│   │   ├── api.js           # Cliente API
│   │   ├── App.jsx          # App principal
│   │   └── index.css        # Estilos
│   └── index.html
└── README.md
```

## API Endpoints

### Autenticação
- `POST /api/auth/register` - Registar novo utilizador
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Obter dados do utilizador
- `PUT /api/auth/me` - Atualizar dados do utilizador

### Produtos
- `GET /api/products` - Listar produtos
- `GET /api/products/:id` - Obter detalhes do produto
- `GET /api/products/:id/price/:quantity` - Obter preço para quantidade
- `GET /api/products/categories/list` - Listar categorias

### Carrinho
- `GET /api/cart` - Obter carrinho
- `POST /api/cart/add` - Adicionar item
- `PUT /api/cart/:id` - Atualizar quantidade
- `DELETE /api/cart/:id` - Remover item
- `DELETE /api/cart` - Limpar carrinho

### Pedidos
- `POST /api/orders` - Criar pedido
- `GET /api/orders` - Listar pedidos do utilizador
- `GET /api/orders/:id` - Obter detalhes do pedido
- `PUT /api/orders/:id/status` - Atualizar status

### Orçamentos
- `POST /api/quotes` - Criar orçamento
- `GET /api/quotes` - Listar orçamentos
- `GET /api/quotes/:id` - Obter detalhes do orçamento
- `PUT /api/quotes/:id/status` - Atualizar status

### Importação
- `POST /api/import/products` - Importar produtos do CSV
- `GET /api/import/history` - Histórico de importações

## Importação de Produtos

### Formato CSV

```csv
sku,name,description,category_id,stock,active,customization_options,price_below_500,price_500,price_2000,price_5000
21948,Mochila Teylok,Descrição,1,1000,true,"{""colors"": [""blue"", ""black"", ""red""], ""print_areas"": [""barrel"", ""clip""]}","15,400 €","14,900 €","14,300 €","13,800 €"
```

### Colunas

- `sku`: Identificador único do produto
- `name`: Nome do produto
- `description`: Descrição
- `category_id`: ID da categoria
- `stock`: Quantidade em stock
- `active`: Ativo (true/false)
- `customization_options`: JSON com cores e áreas de personalização
- `price_below_500`: Preço para < 500 unidades
- `price_500`: Preço para 500-1999 unidades
- `price_2000`: Preço para 2000-4999 unidades
- `price_5000`: Preço para 5000+ unidades

## Banco de Dados

O projeto usa SQLite. O banco de dados é criado automaticamente na primeira execução.

### Tabelas Principais

- `users` - Utilizadores
- `categories` - Categorias de produtos
- `products` - Produtos
- `product_colors` - Cores disponíveis
- `product_prices` - Preços por quantidade
- `cart_items` - Itens do carrinho
- `orders` - Pedidos
- `order_items` - Itens dos pedidos
- `quotes` - Orçamentos
- `quote_items` - Itens dos orçamentos

## Autenticação

O sistema suporta dois modos:

1. **Com Registo**: Utilizadores registam-se e fazem login
2. **Sem Registo**: Clientes podem fazer compra como convidados (com session ID)

## Próximas Fases

- [ ] Integração com EUpago
- [ ] Integração com PayPal
- [ ] Integração com API de fornecedores
- [ ] Sistema de gestão de stock automático
- [ ] Dashboard de admin
- [ ] Relatórios de vendas
- [ ] Email marketing
- [ ] Avaliações de produtos

## Licença

MIT

## Suporte

Para suporte, contacte: info@beeu.pt
