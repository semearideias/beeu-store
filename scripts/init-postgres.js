import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Verificar se DATABASE_URL está configurada
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não está configurada!');
  process.exit(1);
}

async function initPostgres() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Inicializando PostgreSQL...\n');
    
    // Ler arquivo SQL
    const sqlPath = path.join(__dirname, '../server/db/init-postgres.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar SQL
    await pool.query(sql);
    
    console.log('✅ PostgreSQL inicializado com sucesso!');
    console.log('\n📊 Próximos passos:');
    console.log('1. Executar migração: npm run migrate');
    console.log('2. Testar a aplicação\n');
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao inicializar PostgreSQL:', err.message);
    await pool.end();
    process.exit(1);
  }
}

initPostgres();
