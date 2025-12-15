import express from 'express';
import { getDatabase } from '../db/init.js';

const router = express.Router();

// Listar todos os métodos de envio
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const methods = await db.all(
      'SELECT * FROM shipping_methods ORDER BY position, name'
    );
    res.json(methods);
  } catch (error) {
    console.error('Erro ao listar métodos de envio:', error);
    res.status(500).json({ error: 'Erro ao listar métodos de envio' });
  }
});

// Obter um método de envio
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const method = await db.get(
      'SELECT * FROM shipping_methods WHERE id = ?',
      [req.params.id]
    );

    if (!method) {
      return res.status(404).json({ error: 'Método de envio não encontrado' });
    }

    res.json(method);
  } catch (error) {
    console.error('Erro ao obter método de envio:', error);
    res.status(500).json({ error: 'Erro ao obter método de envio' });
  }
});

// Criar método de envio
router.post('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const { name, description, weight_min, weight_max, base_price, price_per_kg, free_shipping_min_amount, is_active, position } = req.body;

    // Validação básica
    if (!name || base_price === undefined || base_price === null) {
      return res.status(400).json({ error: 'Nome e preço base são obrigatórios' });
    }

    const result = await db.run(
      `INSERT INTO shipping_methods (name, description, weight_min, weight_max, base_price, price_per_kg, free_shipping_min_amount, is_active, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        parseInt(weight_min) || 0,
        weight_max ? parseInt(weight_max) : null,
        parseFloat(base_price),
        parseFloat(price_per_kg) || 0,
        free_shipping_min_amount ? parseFloat(free_shipping_min_amount) : null,
        is_active !== false ? 1 : 0,
        parseInt(position) || 0
      ]
    );

    res.json({ id: result.lastID, message: 'Método de envio criado com sucesso' });
  } catch (error) {
    console.error('Erro ao criar método de envio:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar método de envio' });
  }
});

// Atualizar método de envio
router.put('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;
    const { name, description, weight_min, weight_max, base_price, price_per_kg, free_shipping_min_amount, is_active, position } = req.body;

    // Validação básica
    if (!name || base_price === undefined || base_price === null) {
      return res.status(400).json({ error: 'Nome e preço base são obrigatórios' });
    }

    await db.run(
      `UPDATE shipping_methods 
       SET name = ?, description = ?, weight_min = ?, weight_max = ?, base_price = ?, price_per_kg = ?, free_shipping_min_amount = ?, is_active = ?, position = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name,
        description || null,
        parseInt(weight_min) || 0,
        weight_max ? parseInt(weight_max) : null,
        parseFloat(base_price),
        parseFloat(price_per_kg) || 0,
        free_shipping_min_amount ? parseFloat(free_shipping_min_amount) : null,
        is_active !== false ? 1 : 0,
        parseInt(position) || 0,
        id
      ]
    );

    res.json({ message: 'Método de envio atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar método de envio:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar método de envio' });
  }
});

// Deletar método de envio
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM shipping_methods WHERE id = ?', [req.params.id]);
    res.json({ message: 'Método de envio deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar método de envio:', error);
    res.status(500).json({ error: 'Erro ao deletar método de envio' });
  }
});

// Calcular custo de envio baseado no peso
router.post('/calculate', async (req, res) => {
  try {
    const db = await getDatabase();
    const { weight_grams, order_total } = req.body;

    const weight_kg = weight_grams / 1000;

    // Encontrar método de envio aplicável
    const method = await db.get(
      `SELECT * FROM shipping_methods 
       WHERE is_active = 1 
       AND weight_min <= ? 
       AND (weight_max IS NULL OR weight_max >= ?)
       ORDER BY position
       LIMIT 1`,
      [weight_kg, weight_kg]
    );

    if (!method) {
      return res.status(404).json({ error: 'Nenhum método de envio disponível para este peso' });
    }

    // Calcular custo
    let shipping_cost = method.base_price + (weight_kg * method.price_per_kg);

    // Aplicar envio gratuito se aplicável
    if (method.free_shipping_min_amount && order_total >= method.free_shipping_min_amount) {
      shipping_cost = 0;
    }

    res.json({
      method_id: method.id,
      method_name: method.name,
      shipping_cost: parseFloat(shipping_cost.toFixed(2))
    });
  } catch (error) {
    console.error('Erro ao calcular envio:', error);
    res.status(500).json({ error: 'Erro ao calcular envio' });
  }
});

export default router;
