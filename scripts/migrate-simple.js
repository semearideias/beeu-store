import sqlite3 from 'sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../beeu.db');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não está configurada!');
  process.exit(1);
}

const sqliteDb = new sqlite3.Database(dbPath);
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  query_timeout: 30000,
  statement_timeout: 30000
});

const promisifyAll = (fn) => {
  return function(sql, params = []) {
    return new Promise((resolve, reject) => {
      fn(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };
};

const sqliteAll = promisifyAll(sqliteDb.all.bind(sqliteDb));

// Tabelas prioritárias (sem dependências)
const PRIORITY_TABLES = ['users', 'categories'];

// Tabelas com dependências
const DEPENDENT_TABLES = [
  'products',
  'product_colors',
  'product_prices',
  'admin_users',
  'header_menus',
  'custom_pages',
  'store_settings',
  'shipping_methods',
  'page_builder_sections',
  'page_builder_blocks',
  'orders',
  'order_items',
  'order_tracking',
  'quotes',
  'quote_items',
  'cart_items',
  'import_history'
];

async function migrateTable(tableName) {
  try {
    console.log(`📊 Migrando ${tableName}...`);
    
    const rows = await sqliteAll(`SELECT * FROM ${tableName}`, []);
    
    if (rows.length === 0) {
      console.log(`   ⏭️  Sem dados\n`);
      return { success: 0, failed: 0 };
    }

    const columns = Object.keys(rows[0]);
    let success = 0;
    let failed = 0;

    // Migrar em lotes de 10
    const batchSize = 10;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      for (const row of batch) {
        try {
          const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
          const columnNames = columns.join(', ');
          const values = columns.map(col => row[col]);
          
          const sql = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
          await pgPool.query(sql, values);
          success++;
        } catch (err) {
          failed++;
          if (failed <= 3) {
            console.log(`   ⚠️  Erro: ${err.message.substring(0, 80)}`);
          }
        }
      }
      
      // Mostrar progresso
      process.stdout.write(`\r   ${success + failed}/${rows.length} processados...`);
    }
    
    console.log(`\r   ✅ ${success} migrados, ${failed} falharam\n`);
    return { success, failed };
  } catch (err) {
    console.log(`\r   ❌ Erro: ${err.message}\n`);
    return { success: 0, failed: 0 };
  }
}

async function migrate() {
  console.log('\n🔄 Iniciando migração...\n');
  
  const stats = {
    total: 0,
    success: 0,
    failed: 0
  };

  try {
    // Desabilitar constraints temporariamente
    await pgPool.query('SET session_replication_role = replica');
    
    // Migrar tabelas prioritárias primeiro
    console.log('📌 Fase 1: Tabelas prioritárias\n');
    for (const table of PRIORITY_TABLES) {
      const result = await migrateTable(table);
      stats.success += result.success;
      stats.failed += result.failed;
    }
    
    // Migrar tabelas dependentes
    console.log('📌 Fase 2: Tabelas dependentes\n');
    for (const table of DEPENDENT_TABLES) {
      const result = await migrateTable(table);
      stats.success += result.success;
      stats.failed += result.failed;
    }
    
    // Reabilitar constraints
    await pgPool.query('SET session_replication_role = default');
    
    console.log('\n✅ Migração concluída!');
    console.log(`\n📊 Estatísticas:`);
    console.log(`   ✅ Sucesso: ${stats.success}`);
    console.log(`   ⚠️  Falhas: ${stats.failed}`);
    console.log(`\n💡 Próximos passos:`);
    console.log(`   1. Adicionar DATABASE_URL ao Vercel`);
    console.log(`   2. Redeploy no Vercel`);
    console.log(`   3. Testar aplicação em produção\n`);
    
  } catch (err) {
    console.error('\n❌ Erro fatal:', err.message);
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
}

migrate();
