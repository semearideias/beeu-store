import express from 'express';
import { getDatabase } from '../db/init.js';

const router = express.Router();

// Obter tabela de preços de um produto
router.get('/:productId', async (req, res) => {
  try {
    const db = await getDatabase();
    const prices = await db.all(
      'SELECT * FROM product_prices WHERE product_id = ? ORDER BY quantity_min',
      [req.params.productId]
    );
    res.json(prices);
  } catch (error) {
    console.error('Erro ao obter preços:', error);
    res.status(500).json({ error: 'Erro ao obter preços' });
  }
});

// Criar faixa de preço
router.post('/:productId', async (req, res) => {
  try {
    const db = await getDatabase();
    const { quantity_min, quantity_max, price } = req.body;

    if (!quantity_min || !price) {
      return res.status(400).json({ error: 'Quantidade mínima e preço são obrigatórios' });
    }

    const result = await db.run(
      `INSERT INTO product_prices (product_id, quantity_min, quantity_max, price)
       VALUES (?, ?, ?, ?)`,
      [req.params.productId, quantity_min, quantity_max || null, price]
    );

    res.json({ id: result.lastID, message: 'Faixa de preço criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar faixa de preço:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar faixa de preço' });
  }
});

// Atualizar faixa de preço
router.put('/:productId/:priceId', async (req, res) => {
  try {
    const db = await getDatabase();
    const { quantity_min, quantity_max, price } = req.body;

    if (!quantity_min || !price) {
      return res.status(400).json({ error: 'Quantidade mínima e preço são obrigatórios' });
    }

    await db.run(
      `UPDATE product_prices 
       SET quantity_min = ?, quantity_max = ?, price = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND product_id = ?`,
      [quantity_min, quantity_max || null, price, req.params.priceId, req.params.productId]
    );

    res.json({ message: 'Faixa de preço atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar faixa de preço:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar faixa de preço' });
  }
});

// Deletar faixa de preço
router.delete('/:productId/:priceId', async (req, res) => {
  try {
    const db = await getDatabase();
    await db.run(
      'DELETE FROM product_prices WHERE id = ? AND product_id = ?',
      [req.params.priceId, req.params.productId]
    );
    res.json({ message: 'Faixa de preço deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar faixa de preço:', error);
    res.status(500).json({ error: 'Erro ao deletar faixa de preço' });
  }
});

// Obter preço para quantidade específica
router.get('/:productId/calculate/:quantity', async (req, res) => {
  try {
    const db = await getDatabase();
    const { productId, quantity } = req.params;

    // Buscar a faixa de preço aplicável
    const priceRange = await db.get(
      `SELECT price FROM product_prices 
       WHERE product_id = ? AND quantity_min <= ? AND (quantity_max IS NULL OR quantity_max >= ?)
       ORDER BY quantity_min DESC LIMIT 1`,
      [productId, quantity, quantity]
    );

    if (priceRange) {
      res.json({ price: priceRange.price });
    } else {
      // Se não encontrar faixa, retornar preço padrão do produto
      const product = await db.get(
        'SELECT unit_price FROM products WHERE id = ?',
        [productId]
      );
      res.json({ price: product?.unit_price || 0 });
    }
  } catch (error) {
    console.error('Erro ao calcular preço:', error);
    res.status(500).json({ error: 'Erro ao calcular preço' });
  }
});

export default router;
