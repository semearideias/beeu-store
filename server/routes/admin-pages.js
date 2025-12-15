import express from 'express';
import { getDatabase } from '../db/init.js';
import { verifyAdminToken } from './admin-auth.js';

const router = express.Router();

// Obter todas as páginas
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const pages = await db.all(`
      SELECT * FROM custom_pages 
      ORDER BY created_at DESC
    `);

    // Obter SEO para cada página
    const pagesWithSeo = await Promise.all(
      pages.map(async (page) => {
        const seo = await db.get(
          'SELECT * FROM page_seo WHERE page_id = ?',
          [page.id]
        );
        return { ...page, seo };
      })
    );

    res.json(pagesWithSeo);
  } catch (error) {
    console.error('Erro ao obter páginas:', error);
    res.status(500).json({ error: 'Erro ao obter páginas' });
  }
});

// Obter uma página específica
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const page = await db.get('SELECT * FROM custom_pages WHERE id = ?', [req.params.id]);

    if (!page) {
      return res.status(404).json({ error: 'Página não encontrada' });
    }

    const seo = await db.get('SELECT * FROM page_seo WHERE page_id = ?', [page.id]);

    res.json({ ...page, seo });
  } catch (error) {
    console.error('Erro ao obter página:', error);
    res.status(500).json({ error: 'Erro ao obter página' });
  }
});

// Obter página por slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const db = await getDatabase();
    const page = await db.get('SELECT * FROM custom_pages WHERE slug = ? AND is_published = 1', [req.params.slug]);

    if (!page) {
      return res.status(404).json({ error: 'Página não encontrada' });
    }

    const seo = await db.get('SELECT * FROM page_seo WHERE page_id = ?', [page.id]);

    res.json({ ...page, seo });
  } catch (error) {
    console.error('Erro ao obter página:', error);
    res.status(500).json({ error: 'Erro ao obter página' });
  }
});

// Criar nova página
router.post('/', verifyAdminToken, async (req, res) => {
  try {
    const { title, slug, content, meta_title, meta_description, meta_keywords, is_published, show_in_menu, menu_position } = req.body;
    const db = await getDatabase();

    // Validar slug único
    const existing = await db.get('SELECT id FROM custom_pages WHERE slug = ?', [slug]);
    if (existing) {
      return res.status(400).json({ error: 'Slug já existe' });
    }

    const result = await db.run(
      `INSERT INTO custom_pages (title, slug, content, meta_title, meta_description, meta_keywords, is_published, show_in_menu, menu_position) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, content || '', meta_title || null, meta_description || null, meta_keywords || null, is_published ? 1 : 0, show_in_menu ? 1 : 0, menu_position || 0]
    );

    res.json({
      id: result.lastID,
      title,
      slug,
      content: content || '',
      meta_title: meta_title || null,
      meta_description: meta_description || null,
      meta_keywords: meta_keywords || null,
      is_published: is_published ? 1 : 0,
      show_in_menu: show_in_menu ? 1 : 0,
      menu_position: menu_position || 0
    });
  } catch (error) {
    console.error('Erro ao criar página:', error);
    res.status(500).json({ error: 'Erro ao criar página' });
  }
});

// Atualizar página
router.put('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { title, slug, content, meta_title, meta_description, meta_keywords, is_published, show_in_menu, menu_position, seo } = req.body;
    const db = await getDatabase();

    // Validar slug único (se mudou)
    const page = await db.get('SELECT slug FROM custom_pages WHERE id = ?', [req.params.id]);
    if (page.slug !== slug) {
      const existing = await db.get('SELECT id FROM custom_pages WHERE slug = ?', [slug]);
      if (existing) {
        return res.status(400).json({ error: 'Slug já existe' });
      }
    }

    // Atualizar página
    await db.run(
      `UPDATE custom_pages 
       SET title = ?, slug = ?, content = ?, meta_title = ?, meta_description = ?, meta_keywords = ?, is_published = ?, show_in_menu = ?, menu_position = ?
       WHERE id = ?`,
      [title, slug, content || '', meta_title || null, meta_description || null, meta_keywords || null, is_published ? 1 : 0, show_in_menu ? 1 : 0, menu_position || 0, req.params.id]
    );

    // Atualizar SEO
    if (seo) {
      const existingSeo = await db.get('SELECT id FROM page_seo WHERE page_id = ?', [req.params.id]);
      
      if (existingSeo) {
        await db.run(
          `UPDATE page_seo 
           SET og_title = ?, og_description = ?, og_image = ?, canonical_url = ?
           WHERE page_id = ?`,
          [seo.og_title || null, seo.og_description || null, seo.og_image || null, seo.canonical_url || null, req.params.id]
        );
      } else {
        await db.run(
          `INSERT INTO page_seo (page_id, og_title, og_description, og_image, canonical_url) 
           VALUES (?, ?, ?, ?, ?)`,
          [req.params.id, seo.og_title || null, seo.og_description || null, seo.og_image || null, seo.canonical_url || null]
        );
      }
    }

    res.json({ message: 'Página atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar página:', error);
    res.status(500).json({ error: 'Erro ao atualizar página' });
  }
});

// Deletar página
router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM custom_pages WHERE id = ?', [req.params.id]);
    res.json({ message: 'Página deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar página:', error);
    res.status(500).json({ error: 'Erro ao deletar página' });
  }
});

export default router;
