import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../beeu.db');

let db = null;

export async function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Erro ao abrir banco de dados:', err);
      } else {
        console.log('✅ Banco de dados conectado');
      }
    });
    
    // Promisify database methods
    db.run = promisifyRun(db.run.bind(db));
    db.get = promisifyGet(db.get.bind(db));
    db.all = promisifyAll(db.all.bind(db));
    db.exec = promisifyExec(db.exec.bind(db));
  }
  return db;
}

function promisifyRun(fn) {
  return function(sql, params = []) {
    return new Promise((resolve, reject) => {
      fn(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  };
}

function promisifyGet(fn) {
  return function(sql, params = []) {
    return new Promise((resolve, reject) => {
      fn(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };
}

function promisifyAll(fn) {
  return function(sql, params = []) {
    return new Promise((resolve, reject) => {
      fn(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };
}

function promisifyExec(fn) {
  return function(sql) {
    return new Promise((resolve, reject) => {
      fn(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  };
}

export async function initializeDatabase() {
  const db = await getDatabase();

  // Tabela de usuários
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      company_name TEXT NOT NULL,
      contact_name TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      postal_code TEXT,
      tax_id TEXT,
      is_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Adicionar coluna is_admin se não existir (migração)
  try {
    await db.run(`ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0`);
  } catch (err) {
    // Silencioso - coluna já existe
  }

  // Tabela de categorias
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE,
      description TEXT,
      image_url TEXT,
      parent_id INTEGER,
      position INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  // Adicionar coluna slug se não existir (migração)
  try {
    await db.run(`ALTER TABLE categories ADD COLUMN slug TEXT UNIQUE`);
  } catch (err) {
    // Silencioso - coluna já existe
  }

  // Adicionar colunas parent_id e position se não existirem (migração)
  try {
    await db.run(`ALTER TABLE categories ADD COLUMN parent_id INTEGER`);
  } catch (err) {
    // Silencioso - coluna já existe
  }

  try {
    await db.run(`ALTER TABLE categories ADD COLUMN position INTEGER DEFAULT 0`);
  } catch (err) {
    // Silencioso - coluna já existe
  }

  // Tabela de produtos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      image_url TEXT,
      stock INTEGER DEFAULT 0,
      weight TEXT,
      combined_fields TEXT,
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Adicionar coluna weight se não existir (migração)
  try {
    await db.run(`ALTER TABLE products ADD COLUMN weight TEXT`);
  } catch (err) {
    // Silencioso - coluna já existe
  }

  // Adicionar coluna combined_fields se não existir (migração)
  try {
    await db.run(`ALTER TABLE products ADD COLUMN combined_fields TEXT`);
  } catch (err) {
    // Silencioso - coluna já existe
  }

  // Tabela de cores disponíveis por produto
  await db.exec(`
    CREATE TABLE IF NOT EXISTS product_colors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      color_name TEXT NOT NULL,
      color_hex TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(product_id, color_name)
    )
  `);

  // Adicionar coluna image_url se não existir (migração)
  try {
    await db.run(`ALTER TABLE product_colors ADD COLUMN image_url TEXT`);
  } catch (err) {
    // Silencioso - coluna já existe
  }

  // Tabela de preços por quantidade
  await db.exec(`
    CREATE TABLE IF NOT EXISTS product_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity_min INTEGER NOT NULL,
      quantity_max INTEGER,
      price DECIMAL(10, 2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Tabela de carrinho
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_id TEXT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      color TEXT,
      customization_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Tabela de pedidos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de itens do pedido
  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      color TEXT,
      unit_price DECIMAL(10, 2) NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      customization_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Tabela de orçamentos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Adicionar coluna customization_description se não existir (migração)
  try {
    await db.run(`ALTER TABLE quotes ADD COLUMN customization_description TEXT`);
  } catch (err) {
    // Silencioso - coluna já existe
  }

  // Tabela de itens do orçamento
  await db.exec(`
    CREATE TABLE IF NOT EXISTS quote_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      color TEXT,
      unit_price DECIMAL(10, 2) NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      customization_description TEXT,
      customization_areas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Tabela de histórico de importação
  await db.exec(`
    CREATE TABLE IF NOT EXISTS import_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      imported_rows INTEGER,
      skipped_rows INTEGER,
      status TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de fila de download de imagens
  await db.exec(`
    CREATE TABLE IF NOT EXISTS image_download_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(product_id)
    )
  `);

  // Adicionar tabela se não existir (migração)
  try {
    await db.run(`ALTER TABLE image_download_queue ADD COLUMN status TEXT DEFAULT 'pending'`);
  } catch (err) {
    // Silencioso - coluna já existe
  }

  // Tabela de menus do header
  await db.exec(`
    CREATE TABLE IF NOT EXISTS header_menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT DEFAULT 'link',
      url TEXT,
      category_id INTEGER,
      icon TEXT,
      position INTEGER DEFAULT 0,
      parent_id INTEGER,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (parent_id) REFERENCES header_menus(id) ON DELETE CASCADE
    )
  `);

  // Adicionar coluna icon se não existir (migração)
  try {
    await db.run(`ALTER TABLE header_menus ADD COLUMN icon TEXT`);
  } catch (err) {
    // Silencioso - coluna já existe
  }

  // Tabela de páginas personalizadas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS custom_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT,
      meta_title TEXT,
      meta_description TEXT,
      meta_keywords TEXT,
      is_published BOOLEAN DEFAULT 1,
      show_in_menu BOOLEAN DEFAULT 0,
      menu_position INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de SEO de produtos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS product_seo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL UNIQUE,
      meta_title TEXT,
      meta_description TEXT,
      meta_keywords TEXT,
      og_title TEXT,
      og_description TEXT,
      og_image TEXT,
      canonical_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Tabela de SEO de páginas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS page_seo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL UNIQUE,
      og_title TEXT,
      og_description TEXT,
      og_image TEXT,
      canonical_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES custom_pages(id) ON DELETE CASCADE
    )
  `);

  // Tabela de admin (backoffice)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'editor',
      is_active BOOLEAN DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de página builder (construtor de páginas)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS page_builder_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_type TEXT DEFAULT 'homepage',
      section_type TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      settings TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de blocos do page builder
  await db.exec(`
    CREATE TABLE IF NOT EXISTS page_builder_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      block_type TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      settings TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (section_id) REFERENCES page_builder_sections(id) ON DELETE CASCADE
    )
  `);

  // Tabela de métodos de envio
  await db.exec(`
    CREATE TABLE IF NOT EXISTS shipping_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      weight_min INTEGER DEFAULT 0,
      weight_max INTEGER,
      base_price DECIMAL(10, 2) NOT NULL,
      price_per_kg DECIMAL(10, 2) DEFAULT 0,
      free_shipping_min_amount DECIMAL(10, 2),
      is_active BOOLEAN DEFAULT 1,
      position INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de rastreamento de pedidos
  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      carrier TEXT,
      tracking_number TEXT,
      tracking_url TEXT,
      shipped_at DATETIME,
      estimated_delivery DATETIME,
      delivered_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  // Tabela de configurações da loja
  await db.exec(`
    CREATE TABLE IF NOT EXISTS store_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT,
      setting_type TEXT DEFAULT 'text',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Inserir configurações padrão
  try {
    await db.run(
      `INSERT OR IGNORE INTO store_settings (setting_key, setting_value, setting_type, description) 
       VALUES (?, ?, ?, ?)`,
      ['min_order_value', '0', 'decimal', 'Valor mínimo de compra sem personalização (sem IVA e portes)']
    );
  } catch (err) {
    // Silencioso - configuração já existe
  }

  console.log('✅ Base de dados inicializada com sucesso');
}
