import sqlite3 from 'sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db = null;
let dbType = 'sqlite'; // 'sqlite' ou 'postgres'

// Detectar qual database usar
if (process.env.DATABASE_URL) {
  dbType = 'postgres';
  console.log('📊 Usando PostgreSQL para produção');
} else {
  dbType = 'sqlite';
  console.log('📊 Usando SQLite para desenvolvimento');
}

// ==================== SQLite ====================
function initSQLite() {
  const dbPath = path.join(__dirname, '../../beeu.db');
  const sqlite = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Erro ao abrir SQLite:', err);
    } else {
      console.log('✅ SQLite conectado');
    }
  });

  // Promisify methods
  sqlite.run = promisifyRun(sqlite.run.bind(sqlite));
  sqlite.get = promisifyGet(sqlite.get.bind(sqlite));
  sqlite.all = promisifyAll(sqlite.all.bind(sqlite));
  sqlite.exec = promisifyExec(sqlite.exec.bind(sqlite));

  return sqlite;
}

// ==================== PostgreSQL ====================
function initPostgres() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  pool.on('error', (err) => {
    console.error('❌ Erro no pool PostgreSQL:', err);
  });

  // Wrapper para compatibilidade com SQLite
  const pgWrapper = {
    run: async (sql, params = []) => {
      try {
        // Converter placeholders SQLite (?) para PostgreSQL ($1, $2, etc)
        const pgSql = convertSqlToPostgres(sql);
        const result = await pool.query(pgSql, params);
        return { lastID: result.rows[0]?.id, changes: result.rowCount };
      } catch (err) {
        throw err;
      }
    },
    get: async (sql, params = []) => {
      try {
        const pgSql = convertSqlToPostgres(sql);
        const result = await pool.query(pgSql, params);
        return result.rows[0];
      } catch (err) {
        throw err;
      }
    },
    all: async (sql, params = []) => {
      try {
        const pgSql = convertSqlToPostgres(sql);
        const result = await pool.query(pgSql, params);
        return result.rows;
      } catch (err) {
        throw err;
      }
    },
    exec: async (sql) => {
      try {
        await pool.query(sql);
      } catch (err) {
        throw err;
      }
    },
    pool: pool
  };

  console.log('✅ PostgreSQL conectado');
  return pgWrapper;
}

// ==================== Utilitários ====================
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

function convertSqlToPostgres(sql) {
  // Converter ? para $1, $2, etc
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

// ==================== Exports ====================
export async function getDatabase() {
  if (!db) {
    if (dbType === 'postgres') {
      db = initPostgres();
    } else {
      db = initSQLite();
    }
  }
  return db;
}

export function getDatabaseType() {
  return dbType;
}
