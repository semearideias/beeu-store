import sqlite3 from 'sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../beeu.db');

// Verificar se DATABASE_URL está configurada
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não está configurada!');
  console.error('Configure a variável de ambiente DATABASE_URL antes de executar este script.');
  process.exit(1);
}

// Conectar ao SQLite
const sqliteDb = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao SQLite:', err);
    process.exit(1);
  }
  console.log('✅ Conectado ao SQLite');
});

// Conectar ao PostgreSQL
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pgPool.on('error', (err) => {
  console.error('❌ Erro no PostgreSQL:', err);
  process.exit(1);
});

// Promisify SQLite
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

const sqliteAll = promisifyAll(sqliteDb.all.bind(sqliteDb));

// Tabelas para migrar (ordem importante para respeitar FKs)
const TABLES = [
  'users',
  'categories',
  'products',
  'product_colors',
  'product_prices',
  'cart_items',
  'orders',
  'order_items',
  'order_tracking',
  'quotes',
  'quote_items',
  'header_menus',
  'custom_pages',
  'product_seo',
  'page_seo',
  'admin_users',
  'page_builder_sections',
  'page_builder_blocks',
  'shipping_methods',
  'store_settings',
  'import_history',
  'image_download_queue'
];

async function migrateTable(tableName) {
  try {
    // Obter dados do SQLite
    const rows = await sqliteAll(`SELECT * FROM ${tableName}`, []);
    
    if (rows.length === 0) {
      console.log(`⏭️  ${tableName}: Nenhum dado para migrar`);
      return;
    }

    // Preparar INSERT para PostgreSQL
    const columns = Object.keys(rows[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const columnNames = columns.join(', ');
    
    const insertSql = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

    // Inserir dados
    let inserted = 0;
    for (const row of rows) {
      const values = columns.map(col => row[col]);
      try {
        await pgPool.query(insertSql, values);
        inserted++;
      } catch (err) {
        console.warn(`⚠️  Erro ao inserir linha em ${tableName}:`, err.message);
      }
    }

    console.log(`✅ ${tableName}: ${inserted}/${rows.length} registos migrados`);
  } catch (err) {
    console.error(`❌ Erro ao migrar ${tableName}:`, err.message);
  }
}

async function migrate() {
  console.log('\n🔄 Iniciando migração de dados...\n');

  try {
    // Desabilitar foreign keys temporariamente
    await pgPool.query('SET session_replication_role = replica');

    for (const table of TABLES) {
      await migrateTable(table);
    }

    // Reabilitar foreign keys
    await pgPool.query('SET session_replication_role = default');

    console.log('\n✅ Migração concluída!');
    console.log('\n📊 Próximos passos:');
    console.log('1. Verificar dados em produção');
    console.log('2. Testar a aplicação');
    console.log('3. Se tudo estiver bem, pode eliminar beeu.db\n');
  } catch (err) {
    console.error('❌ Erro durante migração:', err.message);
  } finally {
    // Fechar conexões
    sqliteDb.close();
    await pgPool.end();
  }
}

migrate().catch(err => {
  console.error('❌ Erro na migração:', err);
  process.exit(1);
});
