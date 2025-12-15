import express from 'express';
import { getDatabase } from '../db/init.js';

const router = express.Router();

// Listar todos os produtos com filtros
router.get('/', async (req, res) => {
  try {
    const { category_id, category, search, active = true } = req.query;
    const db = await getDatabase();

    let query = `
      SELECT 
        p.id, p.sku, p.name, p.description, p.category_id, p.image_url, p.stock, p.active,
        c.name as category_name,
        c.slug as category_slug,
        GROUP_CONCAT(DISTINCT pc.color_name) as colors,
        MIN(pp.price) as min_price,
        MAX(pp.price) as max_price
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_colors pc ON p.id = pc.product_id
      LEFT JOIN product_prices pp ON p.id = pp.product_id
      WHERE 1=1
    `;

    const params = [];

    if (active !== 'false') {
      query += ' AND p.active = 1';
    }

    // Filtrar por category_id (número) ou category (slug)
    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    } else if (category) {
      // Se receber slug, buscar o ID da categoria
      query += ' AND c.slug = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' GROUP BY p.id ORDER BY p.name';

    const products = await db.all(query, params);

    res.json(products);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

// Obter detalhes de um produto
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();

    const product = await db.get(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Obter cores com imagens
    const colors = await db.all(
      'SELECT id, color_name, color_hex, image_url FROM product_colors WHERE product_id = ? ORDER BY color_name',
      [id]
    );

    // Obter preços por quantidade
    const prices = await db.all(
      'SELECT quantity_min, quantity_max, price FROM product_prices WHERE product_id = ? ORDER BY quantity_min',
      [id]
    );

    // Manter image_url como está (relativa) - o frontend vai resolver corretamente

    res.json({
      ...product,
      colors,
      prices
    });
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({ error: 'Erro ao obter produto' });
  }
});

// Obter preço para uma quantidade específica
router.get('/:id/price/:quantity', async (req, res) => {
  try {
    const { id, quantity } = req.params;
    const db = await getDatabase();

    const price = await db.get(
      `SELECT price FROM product_prices 
       WHERE product_id = ? 
       AND quantity_min <= ? 
       AND (quantity_max IS NULL OR quantity_max >= ?)
       ORDER BY quantity_min DESC
       LIMIT 1`,
      [id, quantity, quantity]
    );

    if (!price) {
      return res.status(404).json({ error: 'Preço não encontrado para essa quantidade' });
    }

    res.json({ price: price.price });
  } catch (error) {
    console.error('Erro ao obter preço:', error);
    res.status(500).json({ error: 'Erro ao obter preço' });
  }
});

// Listar categorias
router.get('/categories/list', async (req, res) => {
  try {
    const db = await getDatabase();
    const categories = await db.all('SELECT id, name, description, image_url FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

export default router;
