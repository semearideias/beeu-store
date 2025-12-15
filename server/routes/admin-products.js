import express from 'express';
import { getDatabase } from '../db/init.js';
import { verifyAdminToken } from './admin-auth.js';

const router = express.Router();

// Obter todos os produtos
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const products = await db.all(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name ASC
    `);

    // Obter preços para cada produto
    const productsWithPrices = await Promise.all(
      products.map(async (product) => {
        const prices = await db.all(
          'SELECT * FROM product_prices WHERE product_id = ? ORDER BY quantity_min ASC',
          [product.id]
        );
        const colors = await db.all(
          'SELECT * FROM product_colors WHERE product_id = ? ORDER BY color_name ASC',
          [product.id]
        );
        return { ...product, prices, colors };
      })
    );

    res.json(productsWithPrices);
  } catch (error) {
    console.error('Erro ao obter produtos:', error);
    res.status(500).json({ error: 'Erro ao obter produtos' });
  }
});

// Obter um produto específico
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const product = await db.get(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const prices = await db.all(
      'SELECT * FROM product_prices WHERE product_id = ? ORDER BY quantity_min ASC',
      [product.id]
    );

    const colors = await db.all(
      'SELECT * FROM product_colors WHERE product_id = ? ORDER BY color_name ASC',
      [product.id]
    );

    const seo = await db.get(
      'SELECT * FROM product_seo WHERE product_id = ?',
      [product.id]
    );

    res.json({ ...product, prices, colors, seo });
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({ error: 'Erro ao obter produto' });
  }
});

// Atualizar produto
router.put('/:id', verifyAdminToken, async (req, res) => {
  try {
    console.log('PUT /products/:id', { id: req.params.id, body: req.body });
    
    const { name, description, category_id, stock, weight, active, prices, colors, seo } = req.body;
    const db = await getDatabase();

    // Se apenas category_id está sendo atualizado, fazer update simples
    if (Object.keys(req.body).length === 1 && category_id !== undefined) {
      console.log('Atualizando apenas category_id para:', category_id);
      
      await db.run(
        `UPDATE products SET category_id = ? WHERE id = ?`,
        [category_id || null, req.params.id]
      );
      
      console.log('Produto atualizado com sucesso');
      return res.json({ message: 'Produto atualizado com sucesso' });
    }

    // Atualizar produto (update completo)
    await db.run(
      `UPDATE products 
       SET name = ?, description = ?, category_id = ?, stock = ?, weight = ?, active = ?
       WHERE id = ?`,
      [name, description, category_id || null, stock, weight || null, active ? 1 : 0, req.params.id]
    );

    // Atualizar preços
    if (prices && Array.isArray(prices)) {
      // Deletar preços antigos
      await db.run('DELETE FROM product_prices WHERE product_id = ?', [req.params.id]);

      // Inserir novos preços
      for (const price of prices) {
        if (price.quantity_min && price.price) {
          await db.run(
            `INSERT INTO product_prices (product_id, quantity_min, quantity_max, price) 
             VALUES (?, ?, ?, ?)`,
            [req.params.id, price.quantity_min, price.quantity_max || null, price.price]
          );
        }
      }
    }

    // Atualizar cores
    if (colors && Array.isArray(colors)) {
      // Deletar cores antigas
      await db.run('DELETE FROM product_colors WHERE product_id = ?', [req.params.id]);

      // Inserir novas cores
      for (const color of colors) {
        if (color.color_name) {
          await db.run(
            `INSERT INTO product_colors (product_id, color_name, color_hex, image_url) 
             VALUES (?, ?, ?, ?)`,
            [req.params.id, color.color_name, color.color_hex || null, color.image_url || null]
          );
        }
      }
    }

    // Atualizar SEO
    if (seo) {
      const existingSeo = await db.get('SELECT id FROM product_seo WHERE product_id = ?', [req.params.id]);
      
      if (existingSeo) {
        await db.run(
          `UPDATE product_seo 
           SET meta_title = ?, meta_description = ?, meta_keywords = ?, og_title = ?, og_description = ?, og_image = ?, canonical_url = ?
           WHERE product_id = ?`,
          [seo.meta_title || null, seo.meta_description || null, seo.meta_keywords || null, 
           seo.og_title || null, seo.og_description || null, seo.og_image || null, 
           seo.canonical_url || null, req.params.id]
        );
      } else {
        await db.run(
          `INSERT INTO product_seo (product_id, meta_title, meta_description, meta_keywords, og_title, og_description, og_image, canonical_url) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [req.params.id, seo.meta_title || null, seo.meta_description || null, seo.meta_keywords || null,
           seo.og_title || null, seo.og_description || null, seo.og_image || null, seo.canonical_url || null]
        );
      }
    }

    res.json({ message: 'Produto atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Deletar produto
router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

// Validar referências (SKU) - Verificar quais já existem
router.post('/check-references', verifyAdminToken, async (req, res) => {
  try {
    const { references } = req.body;

    if (!Array.isArray(references) || references.length === 0) {
      return res.status(400).json({ error: 'Referências inválidas' });
    }

    const db = await getDatabase();

    // Buscar todas as referências que já existem
    const placeholders = references.map(() => '?').join(',');
    const query = `SELECT sku FROM products WHERE sku IN (${placeholders})`;
    
    const existingProducts = await db.all(query, references);
    const existingReferences = existingProducts.map(p => p.sku);

    console.log(`Validação de referências: ${references.length} total, ${existingReferences.length} já existem`);

    res.json({
      total: references.length,
      existing_references: existingReferences,
      new_count: references.length - existingReferences.length
    });
  } catch (error) {
    console.error('Erro ao validar referências:', error);
    res.status(500).json({ error: 'Erro ao validar referências' });
  }
});

export default router;
