import { getDatabase, getDatabaseType } from '../server/db/database.js';

async function test() {
  try {
    console.log('🔍 Testando conexão...\n');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada ✅' : 'Não configurada ❌');
    console.log('Tipo de DB:', getDatabaseType());
    
    const db = await getDatabase();
    console.log('\n✅ Conexão estabelecida!');
    
    // Testar query
    const result = await db.all('SELECT COUNT(*) as count FROM products');
    console.log(`\n📊 Produtos na database: ${result[0].count}`);
    
    const categories = await db.all('SELECT COUNT(*) as count FROM categories');
    console.log(`📊 Categorias na database: ${categories[0].count}`);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

test();
