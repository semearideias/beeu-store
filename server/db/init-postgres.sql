-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  tax_id TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id INTEGER,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category_id INTEGER,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  weight TEXT,
  combined_fields TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Tabela de cores disponíveis por produto
CREATE TABLE IF NOT EXISTS product_colors (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id, color_name)
);

-- Tabela de preços por quantidade
CREATE TABLE IF NOT EXISTS product_prices (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  quantity_min INTEGER NOT NULL,
  quantity_max INTEGER,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Tabela de carrinho
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  session_id TEXT,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  color TEXT,
  customization_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id INTEGER,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  tax_id TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  color TEXT,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  customization_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  quote_number TEXT UNIQUE NOT NULL,
  user_id INTEGER,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  tax_id TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  customization_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de itens do orçamento
CREATE TABLE IF NOT EXISTS quote_items (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  color TEXT,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  customization_description TEXT,
  customization_areas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Tabela de histórico de importação
CREATE TABLE IF NOT EXISTS import_history (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  imported_rows INTEGER,
  skipped_rows INTEGER,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de fila de download de imagens
CREATE TABLE IF NOT EXISTS image_download_queue (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id)
);

-- Tabela de menus do header
CREATE TABLE IF NOT EXISTS header_menus (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT DEFAULT 'link',
  url TEXT,
  category_id INTEGER,
  icon TEXT,
  position INTEGER DEFAULT 0,
  parent_id INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES header_menus(id) ON DELETE CASCADE
);

-- Tabela de páginas personalizadas
CREATE TABLE IF NOT EXISTS custom_pages (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  show_in_menu BOOLEAN DEFAULT FALSE,
  menu_position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de SEO de produtos
CREATE TABLE IF NOT EXISTS product_seo (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  canonical_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Tabela de SEO de páginas
CREATE TABLE IF NOT EXISTS page_seo (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL UNIQUE,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  canonical_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES custom_pages(id) ON DELETE CASCADE
);

-- Tabela de admin (backoffice)
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'editor',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de página builder (construtor de páginas)
CREATE TABLE IF NOT EXISTS page_builder_sections (
  id SERIAL PRIMARY KEY,
  page_type TEXT DEFAULT 'homepage',
  section_type TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  settings TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de blocos do page builder
CREATE TABLE IF NOT EXISTS page_builder_blocks (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL,
  block_type TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  settings TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES page_builder_sections(id) ON DELETE CASCADE
);

-- Tabela de métodos de envio
CREATE TABLE IF NOT EXISTS shipping_methods (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  weight_min INTEGER DEFAULT 0,
  weight_max INTEGER,
  base_price DECIMAL(10, 2) NOT NULL,
  price_per_kg DECIMAL(10, 2) DEFAULT 0,
  free_shipping_min_amount DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de rastreamento de pedidos
CREATE TABLE IF NOT EXISTS order_tracking (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  carrier TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  shipped_at TIMESTAMP,
  estimated_delivery TIMESTAMP,
  delivered_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Tabela de configurações da loja
CREATE TABLE IF NOT EXISTS store_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'text',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configurações padrão
INSERT INTO store_settings (setting_key, setting_value, setting_type, description) 
VALUES ('min_order_value', '0', 'decimal', 'Valor mínimo de compra sem personalização (sem IVA e portes)')
ON CONFLICT (setting_key) DO NOTHING;
