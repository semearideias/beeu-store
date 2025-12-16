import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não está configurada!');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkData() {
  try {
    console.log('🔍 Verificando dados no PostgreSQL...\n');

    const tables = [
      'users',
      'categories', 
      'products',
      'product_colors',
      'product_prices',
      'orders',
      'quotes',
      'admin_users',
      'header_menus',
      'store_settings'
    ];

    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      const count = result.rows[0].count;
      console.log(`${table.padEnd(20)} ${count} registos`);
    }

    console.log('\n📊 Exemplo de produtos:');
    const products = await pool.query('SELECT id, sku, name FROM products LIMIT 5');
    products.rows.forEach(p => {
      console.log(`  - ${p.sku}: ${p.name.substring(0, 50)}`);
    });

    console.log('\n📊 Exemplo de categorias:');
    const categories = await pool.query('SELECT id, name FROM categories LIMIT 5');
    categories.rows.forEach(c => {
      console.log(`  - ${c.name}`);
    });

    await pool.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    await pool.end();
    process.exit(1);
  }
}

checkData();
