import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/init.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'beeu-secret-key-2024';

// Middleware para verificar token
export async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Middleware para verificar se é admin
export async function verifyAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = await getDatabase();
    
    const user = await db.get('SELECT is_admin FROM users WHERE id = ?', [decoded.id]);
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar.' });
    }
    
    req.userId = decoded.id;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Registar novo utilizador
router.post('/register', async (req, res) => {
  try {
    const { email, password, company_name, contact_name, phone, address, city, postal_code, tax_id } = req.body;
    const db = await getDatabase();

    // Verificar se email já existe
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email já registado' });
    }

    // Hash da password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar utilizador
    const result = await db.run(
      `INSERT INTO users (email, password, company_name, contact_name, phone, address, city, postal_code, tax_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, company_name, contact_name, phone, address, city, postal_code, tax_id]
    );

    const token = jwt.sign({ id: result.lastID, email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Utilizador registado com sucesso',
      token,
      user: {
        id: result.lastID,
        email,
        company_name
      }
    });
  } catch (error) {
    console.error('Erro ao registar:', error);
    res.status(500).json({ error: 'Erro ao registar utilizador' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await getDatabase();

    const user = await db.get('SELECT id, email, password, company_name FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return res.status(401).json({ error: 'Email ou password incorretos' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email ou password incorretos' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        company_name: user.company_name
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Verificar status de admin
router.get('/admin-status', verifyToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const user = await db.get('SELECT is_admin FROM users WHERE id = ?', [req.userId]);
    
    res.json({
      isAdmin: user ? user.is_admin : false
    });
  } catch (error) {
    console.error('Erro ao verificar status de admin:', error);
    res.status(500).json({ error: 'Erro ao verificar status' });
  }
});

// Obter dados do utilizador
router.get('/me', verifyToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const user = await db.get(
      'SELECT id, email, company_name, contact_name, phone, address, city, postal_code, tax_id FROM users WHERE id = ?',
      [req.userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao obter dados:', error);
    res.status(500).json({ error: 'Erro ao obter dados do utilizador' });
  }
});

// Atualizar dados do utilizador
router.put('/me', verifyToken, async (req, res) => {
  try {
    const { company_name, contact_name, phone, address, city, postal_code, tax_id } = req.body;
    const db = await getDatabase();

    await db.run(
      `UPDATE users SET company_name = ?, contact_name = ?, phone = ?, address = ?, city = ?, postal_code = ?, tax_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [company_name, contact_name, phone, address, city, postal_code, tax_id, req.userId]
    );

    res.json({ message: 'Dados atualizados com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados' });
  }
});

// Promover utilizador a admin (apenas para admin)
router.put('/promote-admin/:userId', verifyToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const { userId } = req.params;
    
    // Verificar se o utilizador atual é admin
    const currentUser = await db.get('SELECT is_admin FROM users WHERE id = ?', [req.userId]);
    if (!currentUser || !currentUser.is_admin) {
      return res.status(403).json({ error: 'Apenas administradores podem promover outros utilizadores' });
    }
    
    // Promover utilizador
    await db.run('UPDATE users SET is_admin = 1 WHERE id = ?', [userId]);
    
    res.json({ message: 'Utilizador promovido a administrador' });
  } catch (error) {
    console.error('Erro ao promover utilizador:', error);
    res.status(500).json({ error: 'Erro ao promover utilizador' });
  }
});

// Criar utilizador admin padrão (apenas na primeira execução)
router.post('/create-default-admin', async (req, res) => {
  try {
    const db = await getDatabase();
    const defaultEmail = 'info@beeu.pt';
    const defaultPassword = 'Beeu@2024!Admin';
    
    // Verificar se o utilizador já existe
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [defaultEmail]);
    if (existingUser) {
      return res.status(400).json({ error: 'Utilizador admin já existe' });
    }
    
    // Hash da password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Criar utilizador admin
    const result = await db.run(
      `INSERT INTO users (email, password, company_name, is_admin, created_at, updated_at)
       VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [defaultEmail, hashedPassword, 'BEEU Store Admin']
    );
    
    const token = jwt.sign({ id: result.lastID, email: defaultEmail }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      message: 'Utilizador admin criado com sucesso',
      email: defaultEmail,
      password: defaultPassword,
      token,
      user: {
        id: result.lastID,
        email: defaultEmail,
        is_admin: true
      }
    });
  } catch (error) {
    console.error('Erro ao criar utilizador admin:', error);
    res.status(500).json({ error: 'Erro ao criar utilizador admin' });
  }
});

// Resetar password do admin padrão
router.post('/reset-admin-password', async (req, res) => {
  try {
    const db = await getDatabase();
    const defaultEmail = 'info@beeu.pt';
    const defaultPassword = 'Beeu@2024!Admin';
    
    // Hash da password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Atualizar password
    await db.run(
      `UPDATE users SET password = ?, is_admin = 1 WHERE email = ?`,
      [hashedPassword, defaultEmail]
    );
    
    res.json({
      message: 'Password do admin resetada com sucesso',
      email: defaultEmail,
      password: defaultPassword
    });
  } catch (error) {
    console.error('Erro ao resetar password:', error);
    res.status(500).json({ error: 'Erro ao resetar password' });
  }
});

export default router;
