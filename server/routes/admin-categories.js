import express from 'express';
import { getDatabase } from '../db/init.js';
import { verifyAdminToken } from './admin-auth.js';

const router = express.Router();

// Obter todas as categorias (com hierarquia)
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const categories = await db.all(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.image_url,
        c.parent_id,
        c.position,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.parent_id ASC, c.position ASC, c.name ASC
    `);
    
    // Construir hierarquia
    const hierarchy = buildCategoryHierarchy(categories);
    res.json(hierarchy);
  } catch (error) {
    console.error('Erro ao obter categorias:', error);
    res.status(500).json({ error: 'Erro ao obter categorias' });
  }
});

// Obter categorias em formato plano (para compatibilidade)
router.get('/flat', async (req, res) => {
  try {
    const db = await getDatabase();
    const categories = await db.all(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.image_url,
        c.parent_id,
        c.position,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.parent_id ASC, c.position ASC, c.name ASC
    `);
    res.json(categories);
  } catch (error) {
    console.error('Erro ao obter categorias:', error);
    res.status(500).json({ error: 'Erro ao obter categorias' });
  }
});

// Obter categoria por ID
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const category = await db.get(`
      SELECT * FROM categories WHERE id = ?
    `, [req.params.id]);
    
    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Erro ao obter categoria:', error);
    res.status(500).json({ error: 'Erro ao obter categoria' });
  }
});

// Criar nova categoria
router.post('/', verifyAdminToken, async (req, res) => {
  try {
    const { name, description, image_url } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }
    
    const db = await getDatabase();
    
    // Gerar slug a partir do nome
    const slug = generateSlug(name);
    
    const result = await db.run(
      `INSERT INTO categories (name, slug, description, image_url) 
       VALUES (?, ?, ?, ?)`,
      [name, slug, description || null, image_url || null]
    );
    
    res.json({
      id: result.lastID,
      name,
      slug,
      description: description || null,
      image_url: image_url || null,
      product_count: 0
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// Atualizar categoria
router.put('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { name, description, image_url } = req.body;
    const db = await getDatabase();
    
    // Verificar se categoria existe
    const category = await db.get('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    // Gerar novo slug se o nome mudou
    let slug = category.slug;
    if (name && name !== category.name) {
      slug = generateSlug(name);
    }
    
    await db.run(
      `UPDATE categories 
       SET name = ?, slug = ?, description = ?, image_url = ?
       WHERE id = ?`,
      [name || category.name, slug, description || null, image_url || null, req.params.id]
    );
    
    res.json({ 
      message: 'Categoria atualizada com sucesso',
      id: req.params.id,
      name: name || category.name,
      slug,
      description: description || null,
      image_url: image_url || null
    });
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// Deletar categoria
router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const db = await getDatabase();
    
    // Verificar se categoria existe
    const category = await db.get('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    // Verificar se há produtos nesta categoria
    const productsCount = await db.get(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [req.params.id]
    );
    
    if (productsCount.count > 0) {
      return res.status(400).json({ 
        error: `Não é possível deletar categoria com ${productsCount.count} produto(s). Mova os produtos para outra categoria primeiro.` 
      });
    }
    
    await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
    
    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});

// Mover produtos entre categorias
router.post('/:id/move-products', verifyAdminToken, async (req, res) => {
  try {
    const { from_category_id, product_ids } = req.body;
    const to_category_id = req.params.id;
    
    if (!from_category_id || !product_ids || product_ids.length === 0) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }
    
    const db = await getDatabase();
    
    // Verificar se categorias existem
    const fromCategory = await db.get('SELECT * FROM categories WHERE id = ?', [from_category_id]);
    const toCategory = await db.get('SELECT * FROM categories WHERE id = ?', [to_category_id]);
    
    if (!fromCategory || !toCategory) {
      return res.status(404).json({ error: 'Uma ou ambas as categorias não foram encontradas' });
    }
    
    // Mover produtos
    const placeholders = product_ids.map(() => '?').join(',');
    await db.run(
      `UPDATE products 
       SET category_id = ? 
       WHERE category_id = ? AND id IN (${placeholders})`,
      [to_category_id, from_category_id, ...product_ids]
    );
    
    res.json({ 
      message: `${product_ids.length} produto(s) movido(s) com sucesso`,
      moved_count: product_ids.length
    });
  } catch (error) {
    console.error('Erro ao mover produtos:', error);
    res.status(500).json({ error: 'Erro ao mover produtos' });
  }
});

// Obter produtos de uma categoria
router.get('/:id/products', async (req, res) => {
  try {
    const db = await getDatabase();
    const products = await db.all(`
      SELECT id, sku, name, image_url, stock, active
      FROM products
      WHERE category_id = ?
      ORDER BY name ASC
    `, [req.params.id]);
    
    res.json(products);
  } catch (error) {
    console.error('Erro ao obter produtos da categoria:', error);
    res.status(500).json({ error: 'Erro ao obter produtos da categoria' });
  }
});

// Reordenar categorias (drag-and-drop)
router.post('/reorder', verifyAdminToken, async (req, res) => {
  try {
    const { categories } = req.body;
    
    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }
    
    const db = await getDatabase();
    
    // Atualizar posição de cada categoria
    for (const cat of categories) {
      await db.run(
        'UPDATE categories SET position = ?, parent_id = ? WHERE id = ?',
        [cat.position || 0, cat.parent_id || null, cat.id]
      );
    }
    
    res.json({ message: 'Categorias reordenadas com sucesso' });
  } catch (error) {
    console.error('Erro ao reordenar categorias:', error);
    res.status(500).json({ error: 'Erro ao reordenar categorias' });
  }
});

// Mover categoria para outra (criar subcategoria ou promover)
router.post('/:id/move', verifyAdminToken, async (req, res) => {
  try {
    const { parent_id, position } = req.body;
    const category_id = req.params.id;
    
    const db = await getDatabase();
    
    // Verificar se categoria existe
    const category = await db.get('SELECT * FROM categories WHERE id = ?', [category_id]);
    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    // Verificar se parent_id existe (se fornecido)
    if (parent_id) {
      const parentCategory = await db.get('SELECT * FROM categories WHERE id = ?', [parent_id]);
      if (!parentCategory) {
        return res.status(404).json({ error: 'Categoria pai não encontrada' });
      }
    }
    
    // Atualizar categoria
    await db.run(
      'UPDATE categories SET parent_id = ?, position = ? WHERE id = ?',
      [parent_id || null, position || 0, category_id]
    );
    
    res.json({ 
      message: 'Categoria movida com sucesso',
      id: category_id,
      parent_id: parent_id || null,
      position: position || 0
    });
  } catch (error) {
    console.error('Erro ao mover categoria:', error);
    res.status(500).json({ error: 'Erro ao mover categoria' });
  }
});

// Função auxiliar para gerar slug
function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Espaços para hífens
    .replace(/-+/g, '-') // Múltiplos hífens para um
    .replace(/^-+|-+$/g, ''); // Remove hífens no início/fim
}

// Função auxiliar para construir hierarquia de categorias
function buildCategoryHierarchy(categories) {
  const categoryMap = new Map();
  const rootCategories = [];
  
  // Criar mapa de categorias
  categories.forEach(cat => {
    categoryMap.set(cat.id, {
      ...cat,
      children: []
    });
  });
  
  // Construir hierarquia
  categories.forEach(cat => {
    if (cat.parent_id) {
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        parent.children.push(categoryMap.get(cat.id));
      }
    } else {
      rootCategories.push(categoryMap.get(cat.id));
    }
  });
  
  return rootCategories;
}

export default router;
