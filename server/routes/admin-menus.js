import express from 'express';
import { getDatabase } from '../db/init.js';
import { verifyAdminToken } from './admin-auth.js';

const router = express.Router();

// Obter todos os menus
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const menus = await db.all(`
      SELECT 
        hm.*,
        c.name as category_name,
        c.slug as category_slug
      FROM header_menus hm
      LEFT JOIN categories c ON hm.category_id = c.id
      ORDER BY hm.position ASC, hm.id ASC
    `);
    res.json(menus);
  } catch (error) {
    console.error('Erro ao obter menus:', error);
    res.status(500).json({ error: 'Erro ao obter menus' });
  }
});

// Obter menus com categorias
router.get('/with-categories', async (req, res) => {
  try {
    const db = await getDatabase();
    const menus = await db.all(`
      SELECT 
        hm.*,
        c.name as category_name
      FROM header_menus hm
      LEFT JOIN categories c ON hm.category_id = c.id
      ORDER BY hm.position ASC, hm.id ASC
    `);
    res.json(menus);
  } catch (error) {
    console.error('Erro ao obter menus:', error);
    res.status(500).json({ error: 'Erro ao obter menus' });
  }
});

// Criar novo menu
router.post('/', verifyAdminToken, async (req, res) => {
  try {
    const { name, label, type, url, category_id, icon, position, parent_id } = req.body;
    const db = await getDatabase();

    const result = await db.run(
      `INSERT INTO header_menus (name, label, type, url, category_id, icon, position, parent_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, label, type || 'link', url || null, category_id || null, icon || null, position || 0, parent_id || null]
    );

    res.json({
      id: result.lastID,
      name,
      label,
      type: type || 'link',
      url: url || null,
      category_id: category_id || null,
      icon: icon || null,
      position: position || 0,
      parent_id: parent_id || null,
      is_active: 1
    });
  } catch (error) {
    console.error('Erro ao criar menu:', error);
    res.status(500).json({ error: 'Erro ao criar menu' });
  }
});

// Atualizar menu
router.put('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { name, label, type, url, category_id, icon, position, parent_id, is_active } = req.body;
    const db = await getDatabase();

    await db.run(
      `UPDATE header_menus 
       SET name = ?, label = ?, type = ?, url = ?, category_id = ?, icon = ?, position = ?, parent_id = ?, is_active = ?
       WHERE id = ?`,
      [name, label, type, url || null, category_id || null, icon || null, position, parent_id || null, is_active, req.params.id]
    );

    res.json({ message: 'Menu atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar menu:', error);
    res.status(500).json({ error: 'Erro ao atualizar menu' });
  }
});

// Deletar menu
router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM header_menus WHERE id = ?', [req.params.id]);
    res.json({ message: 'Menu deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar menu:', error);
    res.status(500).json({ error: 'Erro ao deletar menu' });
  }
});

// Reordenar menus
router.post('/reorder', verifyAdminToken, async (req, res) => {
  try {
    const { menus } = req.body;
    const db = await getDatabase();

    for (const menu of menus) {
      await db.run(
        'UPDATE header_menus SET position = ? WHERE id = ?',
        [menu.position, menu.id]
      );
    }

    res.json({ message: 'Menus reordenados com sucesso' });
  } catch (error) {
    console.error('Erro ao reordenar menus:', error);
    res.status(500).json({ error: 'Erro ao reordenar menus' });
  }
});

export default router;
