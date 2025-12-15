import express from 'express';
import { getDatabase } from '../db/init.js';

const router = express.Router();

// Listar todos os pedidos
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { status, payment_status, search } = req.query;

    let query = `
      SELECT 
        o.id, o.order_number, o.email, o.company_name, o.contact_name,
        o.subtotal, o.tax, o.total, o.status, o.payment_status, o.created_at,
        COUNT(oi.id) as item_count,
        ot.status as shipping_status, ot.carrier, ot.tracking_number
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN order_tracking ot ON o.id = ot.order_id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (payment_status) {
      query += ' AND o.payment_status = ?';
      params.push(payment_status);
    }

    if (search) {
      query += ' AND (o.order_number LIKE ? OR o.email LIKE ? OR o.company_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' GROUP BY o.id ORDER BY o.created_at DESC';

    const orders = await db.all(query, params);
    res.json(orders);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
});

// Obter detalhes de um pedido
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;

    const order = await db.get(
      `SELECT * FROM orders WHERE id = ?`,
      [id]
    );

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const items = await db.all(
      `SELECT * FROM order_items WHERE order_id = ? ORDER BY id`,
      [id]
    );

    const tracking = await db.get(
      `SELECT * FROM order_tracking WHERE order_id = ?`,
      [id]
    );

    res.json({ ...order, items, tracking });
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(500).json({ error: 'Erro ao obter pedido' });
  }
});

// Atualizar status do pedido
router.put('/:id/status', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (payment_status) {
      updates.push('payment_status = ?');
      params.push(payment_status);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await db.run(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'Pedido atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

// Atualizar rastreamento
router.put('/:id/tracking', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const { status, carrier, tracking_number, tracking_url, shipped_at, estimated_delivery, delivered_at, notes } = req.body;

    // Verificar se já existe rastreamento
    const existing = await db.get(
      'SELECT id FROM order_tracking WHERE order_id = ?',
      [id]
    );

    if (existing) {
      await db.run(
        `UPDATE order_tracking 
         SET status = ?, carrier = ?, tracking_number = ?, tracking_url = ?, 
             shipped_at = ?, estimated_delivery = ?, delivered_at = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE order_id = ?`,
        [status, carrier, tracking_number, tracking_url, shipped_at, estimated_delivery, delivered_at, notes, id]
      );
    } else {
      await db.run(
        `INSERT INTO order_tracking (order_id, status, carrier, tracking_number, tracking_url, shipped_at, estimated_delivery, delivered_at, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, status, carrier, tracking_number, tracking_url, shipped_at, estimated_delivery, delivered_at, notes]
      );
    }

    res.json({ message: 'Rastreamento atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar rastreamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar rastreamento' });
  }
});

export default router;
