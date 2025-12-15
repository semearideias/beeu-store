import express from 'express';
import { getDatabase } from '../db/init.js';
import { sendQuoteUpdatedEmail } from '../services/emailService.js';

const router = express.Router();

// Listar todos os orçamentos
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { status, search } = req.query;

    let query = `
      SELECT 
        q.id, q.quote_number, q.email, q.company_name, q.contact_name,
        q.subtotal, q.tax, q.total, q.status, q.created_at,
        COUNT(qi.id) as item_count
      FROM quotes q
      LEFT JOIN quote_items qi ON q.id = qi.quote_id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND q.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (q.quote_number LIKE ? OR q.email LIKE ? OR q.company_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' GROUP BY q.id ORDER BY q.created_at DESC';

    const quotes = await db.all(query, params);
    res.json(quotes);
  } catch (error) {
    console.error('Erro ao listar orçamentos:', error);
    res.status(500).json({ error: 'Erro ao listar orçamentos' });
  }
});

// Obter detalhes de um orçamento
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;

    const quote = await db.get(
      `SELECT * FROM quotes WHERE id = ?`,
      [id]
    );

    if (!quote) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }

    const items = await db.all(
      `SELECT qi.*, p.name as product_name, p.sku 
       FROM quote_items qi
       LEFT JOIN products p ON qi.product_id = p.id
       WHERE qi.quote_id = ?
       ORDER BY qi.id`,
      [id]
    );

    res.json({ ...quote, items });
  } catch (error) {
    console.error('Erro ao obter orçamento:', error);
    res.status(500).json({ error: 'Erro ao obter orçamento' });
  }
});

// Atualizar orçamento
router.put('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const { status, subtotal, tax, total, shipping_cost, notes, items } = req.body;

    // Atualizar orçamento
    await db.run(
      `UPDATE quotes 
       SET status = ?, subtotal = ?, tax = ?, total = ?, shipping_cost = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, subtotal, tax, total, shipping_cost || 0, notes, id]
    );

    // Atualizar itens se fornecidos
    if (items && Array.isArray(items)) {
      // Deletar itens antigos
      await db.run('DELETE FROM quote_items WHERE quote_id = ?', [id]);
      
      // Inserir novos itens
      for (const item of items) {
        await db.run(
          `INSERT INTO quote_items (
            quote_id, product_id, product_name, quantity, unit_price, total_price, customization_description
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            item.product_id,
            item.product_name,
            item.quantity,
            item.unit_price,
            item.total_price,
            item.customization_description || ''
          ]
        );
      }
    }

    res.json({ message: 'Orçamento atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    res.status(500).json({ error: 'Erro ao atualizar orçamento' });
  }
});

// Converter orçamento em pedido
router.post('/:id/convert-to-order', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;

    const quote = await db.get('SELECT * FROM quotes WHERE id = ?', [id]);
    if (!quote) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }

    // Gerar número de pedido
    const lastOrder = await db.get(
      'SELECT order_number FROM orders ORDER BY id DESC LIMIT 1'
    );
    const nextNumber = lastOrder ? parseInt(lastOrder.order_number.split('-')[1]) + 1 : 1;
    const orderNumber = `ORD-${String(nextNumber).padStart(6, '0')}`;

    // Criar pedido
    const result = await db.run(
      `INSERT INTO orders (
        order_number, email, company_name, contact_name, phone, address, city, postal_code, tax_id,
        subtotal, tax, total, status, payment_status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        orderNumber, quote.email, quote.company_name, quote.contact_name, quote.phone,
        quote.address, quote.city, quote.postal_code, quote.tax_id,
        quote.subtotal, quote.tax, quote.total, 'pending', 'pending', quote.notes
      ]
    );

    const orderId = result.lastID;

    // Copiar itens do orçamento para o pedido
    const items = await db.all(
      'SELECT * FROM quote_items WHERE quote_id = ?',
      [id]
    );

    for (const item of items) {
      await db.run(
        `INSERT INTO order_items (
          order_id, product_id, product_name, quantity, color, unit_price, total_price, customization_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, item.product_id, item.product_name, item.quantity, item.color,
          item.unit_price, item.total_price, item.customization_description
        ]
      );
    }

    // Atualizar status do orçamento
    await db.run(
      'UPDATE quotes SET status = ? WHERE id = ?',
      ['converted', id]
    );

    res.json({ message: 'Orçamento convertido em pedido', orderId, orderNumber });
  } catch (error) {
    console.error('Erro ao converter orçamento:', error);
    res.status(500).json({ error: 'Erro ao converter orçamento' });
  }
});

// Enviar email de notificação
router.post('/:id/send-email', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;

    // Obter orçamento
    const quote = await db.get('SELECT * FROM quotes WHERE id = ?', [id]);
    if (!quote) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }

    // Obter cliente
    const customer = {
      name: quote.company_name,
      contact_name: quote.contact_name,
      email: quote.email,
      phone: quote.phone,
      address: quote.address,
      postal_code: quote.postal_code,
      city: quote.city
    };

    // Obter dados da empresa
    const settings = await db.all('SELECT setting_key, setting_value FROM store_settings WHERE setting_key LIKE "company_%"');
    const company = {};
    settings.forEach(s => {
      company[s.setting_key] = s.setting_value;
    });

    // Enviar email
    await sendQuoteUpdatedEmail(quote, customer, company);

    res.json({ message: 'Email enviado com sucesso' });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).json({ error: error.message || 'Erro ao enviar email' });
  }
});

export default router;
