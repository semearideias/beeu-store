import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/init.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'beeu-secret-key-change-in-production';

// Middleware para verificar token JWT
export async function verifyAdminToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Login do admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await getDatabase();

    const admin = await db.get(
      'SELECT * FROM admin_users WHERE email = ? AND is_active = 1',
      [email]
    );

    if (!admin) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Atualizar último login
    await db.run(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [admin.id]
    );

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Registar novo admin (apenas admin pode fazer)
router.post('/register', verifyAdminToken, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const db = await getDatabase();

    // Verificar se é admin
    const admin = await db.get('SELECT role FROM admin_users WHERE id = ?', [req.adminId]);
    if (admin?.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas admins podem criar novos usuários' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run(
      'INSERT INTO admin_users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, role || 'editor']
    );

    res.json({
      id: result.lastID,
      email,
      name,
      role: role || 'editor'
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email já existe' });
    }
    console.error('Erro ao registar:', error);
    res.status(500).json({ error: 'Erro ao registar usuário' });
  }
});

// Verificar token
router.get('/verify', verifyAdminToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const admin = await db.get('SELECT id, email, name, role FROM admin_users WHERE id = ?', [req.adminId]);
    
    if (!admin) {
      return res.status(401).json({ error: 'Admin não encontrado' });
    }

    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar token' });
  }
});

// Logout (apenas remove o token no cliente)
router.post('/logout', verifyAdminToken, (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

export default router;
