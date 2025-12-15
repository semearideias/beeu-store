import express from 'express';
import { getDatabase } from '../db/init.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Gerar número de pedido único
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
}

// Criar pedido
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      email,
      company_name,
      contact_name,
      phone,
      address,
      city,
      postal_code,
      tax_id,
      items,
      notes
    } = req.body;

    const db = await getDatabase();

    if (!email || !company_name || !items || items.length === 0) {
      return res.status(400).json({ error: 'Dados obrigatórios em falta' });
    }

    // Calcular totais
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.total_price || 0;
    }

    const tax = subtotal * 0.23; // IVA 23%
    const total = subtotal + tax;
    const orderNumber = generateOrderNumber();

    // Criar pedido
    const orderResult = await db.run(
      `INSERT INTO orders (
        order_number, user_id, email, company_name, contact_name, phone, address, city, postal_code, tax_id,
        subtotal, tax, total, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        user_id || null,
        email,
        company_name,
        contact_name || null,
        phone || null,
        address || null,
        city || null,
        postal_code || null,
        tax_id || null,
        subtotal,
        tax,
        total,
        'pending',
        notes || null
      ]
    );

    const orderId = orderResult.lastID;

    // Inserir itens do pedido
    for (const item of items) {
      await db.run(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, color, unit_price, total_price, customization_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.product_name,
          item.quantity,
          item.color || null,
          item.unit_price,
          item.total_price,
          item.customization_notes || null
        ]
      );
    }

    res.status(201).json({
      message: 'Pedido criado com sucesso',
      order: {
        id: orderId,
        order_number: orderNumber,
        subtotal,
        tax,
        total
      }
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// Obter pedidos do utilizador
router.get('/', verifyToken, async (req, res) => {
  try {
    const db = await getDatabase();
    
    console.log('=== GET /orders ===');
    console.log('req.userId:', req.userId);
    
    if (!req.userId) {
      console.log('❌ Não autenticado');
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const orders = await db.all(
      `SELECT id, order_number, email, company_name, subtotal, tax, total, status, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.userId]
    );

    console.log('✅ Pedidos encontrados:', orders?.length || 0);
    res.json(orders || []);
  } catch (error) {
    console.error('❌ Erro ao obter pedidos:', error);
    res.status(500).json({ error: 'Erro ao obter pedidos' });
  }
});

// Obter detalhes de um pedido
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [id]);

    res.json({
      ...order,
      items
    });
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(500).json({ error: 'Erro ao obter pedido' });
  }
});

// Atualizar status do pedido (admin)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = await getDatabase();

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    await db.run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

    res.json({ message: 'Status atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

export default router;
