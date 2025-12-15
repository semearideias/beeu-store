import express from 'express';
import { getDatabase } from '../db/init.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Obter carrinho (autenticado ou por session)
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const userId = req.headers['x-user-id'];
    const sessionId = req.headers['x-session-id'];

    let query = `
      SELECT 
        ci.id, ci.product_id, ci.quantity, ci.color, ci.customization_notes,
        p.sku, p.name, p.image_url,
        pp.price as unit_price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_prices pp ON p.id = pp.product_id
      WHERE 1=1
    `;

    const params = [];

    if (userId) {
      query += ' AND ci.user_id = ?';
      params.push(userId);
    } else if (sessionId) {
      query += ' AND ci.session_id = ?';
      params.push(sessionId);
    } else {
      return res.status(400).json({ error: 'User ID ou Session ID necessário' });
    }

    query += ' AND pp.quantity_min <= ci.quantity AND (pp.quantity_max IS NULL OR pp.quantity_max >= ci.quantity)';
    query += ' GROUP BY ci.id ORDER BY ci.created_at DESC';

    const items = await db.all(query, params);

    res.json(items);
  } catch (error) {
    console.error('Erro ao obter carrinho:', error);
    res.status(500).json({ error: 'Erro ao obter carrinho' });
  }
});

// Adicionar item ao carrinho
router.post('/add', async (req, res) => {
  try {
    const { product_id, quantity, color, customization_notes } = req.body;
    const db = await getDatabase();
    const userId = req.headers['x-user-id'];
    const sessionId = req.headers['x-session-id'];

    if (!product_id || !quantity) {
      return res.status(400).json({ error: 'Product ID e quantity são obrigatórios' });
    }

    if (!userId && !sessionId) {
      return res.status(400).json({ error: 'User ID ou Session ID necessário' });
    }

    // Verificar se produto existe
    const product = await db.get('SELECT id FROM products WHERE id = ?', [product_id]);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Verificar se já existe no carrinho
    let query = 'SELECT id FROM cart_items WHERE product_id = ?';
    const params = [product_id];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    } else {
      query += ' AND session_id = ?';
      params.push(sessionId);
    }

    if (color) {
      query += ' AND color = ?';
      params.push(color);
    }

    const existing = await db.get(query, params);

    if (existing) {
      // Atualizar quantidade
      await db.run(
        'UPDATE cart_items SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [quantity, existing.id]
      );
    } else {
      // Inserir novo item
      await db.run(
        `INSERT INTO cart_items (user_id, session_id, product_id, quantity, color, customization_notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId || null, sessionId || null, product_id, quantity, color || null, customization_notes || null]
      );
    }

    res.json({ message: 'Item adicionado ao carrinho' });
  } catch (error) {
    console.error('Erro ao adicionar ao carrinho:', error);
    res.status(500).json({ error: 'Erro ao adicionar ao carrinho' });
  }
});

// Atualizar quantidade
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const db = await getDatabase();

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser maior que 0' });
    }

    await db.run('UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [quantity, id]);

    res.json({ message: 'Quantidade atualizada' });
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    res.status(500).json({ error: 'Erro ao atualizar quantidade' });
  }
});

// Remover item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();

    await db.run('DELETE FROM cart_items WHERE id = ?', [id]);

    res.json({ message: 'Item removido do carrinho' });
  } catch (error) {
    console.error('Erro ao remover:', error);
    res.status(500).json({ error: 'Erro ao remover item' });
  }
});

// Limpar carrinho
router.delete('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const userId = req.headers['x-user-id'];
    const sessionId = req.headers['x-session-id'];

    if (userId) {
      await db.run('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    } else if (sessionId) {
      await db.run('DELETE FROM cart_items WHERE session_id = ?', [sessionId]);
    } else {
      return res.status(400).json({ error: 'User ID ou Session ID necessário' });
    }

    res.json({ message: 'Carrinho limpo' });
  } catch (error) {
    console.error('Erro ao limpar carrinho:', error);
    res.status(500).json({ error: 'Erro ao limpar carrinho' });
  }
});

export default router;
