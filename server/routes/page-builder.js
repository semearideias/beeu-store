import express from 'express';
import { getDatabase } from '../db/init.js';
import { verifyAdminToken } from './admin-auth.js';

const router = express.Router();

// ============ SEÇÕES ============

// Obter todas as seções de uma página
router.get('/sections/:pageType', async (req, res) => {
  try {
    const db = await getDatabase();
    const sections = await db.all(
      `SELECT * FROM page_builder_sections 
       WHERE page_type = ? 
       ORDER BY position ASC`,
      [req.params.pageType]
    );

    // Obter blocos para cada seção
    const sectionsWithBlocks = await Promise.all(
      sections.map(async (section) => {
        const blocks = await db.all(
          `SELECT * FROM page_builder_blocks 
           WHERE section_id = ? 
           ORDER BY position ASC`,
          [section.id]
        );
        return {
          ...section,
          settings: section.settings ? JSON.parse(section.settings) : {},
          blocks: blocks.map(b => ({
            ...b,
            settings: b.settings ? JSON.parse(b.settings) : {}
          }))
        };
      })
    );

    res.json(sectionsWithBlocks);
  } catch (error) {
    console.error('Erro ao obter seções:', error);
    res.status(500).json({ error: 'Erro ao obter seções' });
  }
});

// Criar nova seção
router.post('/sections', async (req, res) => {
  try {
    const { pageType, sectionType, settings } = req.body;
    const db = await getDatabase();

    // Obter próxima posição
    const lastSection = await db.get(
      `SELECT MAX(position) as maxPos FROM page_builder_sections WHERE page_type = ?`,
      [pageType]
    );
    const position = (lastSection?.maxPos || 0) + 1;

    const result = await db.run(
      `INSERT INTO page_builder_sections (page_type, section_type, position, settings) 
       VALUES (?, ?, ?, ?)`,
      [pageType, sectionType, position, JSON.stringify(settings || {})]
    );

    res.json({
      id: result.lastID,
      pageType,
      sectionType,
      position,
      settings: settings || {},
      blocks: [],
      is_active: 1
    });
  } catch (error) {
    console.error('Erro ao criar seção:', error);
    res.status(500).json({ error: 'Erro ao criar seção' });
  }
});

// Atualizar seção
router.put('/sections/:id', async (req, res) => {
  try {
    const { sectionType, settings, is_active, position } = req.body;
    const db = await getDatabase();

    await db.run(
      `UPDATE page_builder_sections 
       SET section_type = ?, settings = ?, is_active = ?, position = ?
       WHERE id = ?`,
      [sectionType, JSON.stringify(settings || {}), is_active ? 1 : 0, position, req.params.id]
    );

    res.json({ message: 'Seção atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar seção:', error);
    res.status(500).json({ error: 'Erro ao atualizar seção' });
  }
});

// Deletar seção
router.delete('/sections/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM page_builder_sections WHERE id = ?', [req.params.id]);
    res.json({ message: 'Seção deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar seção:', error);
    res.status(500).json({ error: 'Erro ao deletar seção' });
  }
});

// ============ BLOCOS ============

// Criar novo bloco
router.post('/blocks', async (req, res) => {
  try {
    const { sectionId, blockType, settings } = req.body;
    const db = await getDatabase();

    // Obter próxima posição
    const lastBlock = await db.get(
      `SELECT MAX(position) as maxPos FROM page_builder_blocks WHERE section_id = ?`,
      [sectionId]
    );
    const position = (lastBlock?.maxPos || 0) + 1;

    const result = await db.run(
      `INSERT INTO page_builder_blocks (section_id, block_type, position, settings) 
       VALUES (?, ?, ?, ?)`,
      [sectionId, blockType, position, JSON.stringify(settings || {})]
    );

    res.json({
      id: result.lastID,
      sectionId,
      blockType,
      position,
      settings: settings || {},
      is_active: 1
    });
  } catch (error) {
    console.error('Erro ao criar bloco:', error);
    res.status(500).json({ error: 'Erro ao criar bloco' });
  }
});

// Atualizar bloco
router.put('/blocks/:id', async (req, res) => {
  try {
    const { blockType, settings, is_active, position } = req.body;
    const db = await getDatabase();

    await db.run(
      `UPDATE page_builder_blocks 
       SET block_type = ?, settings = ?, is_active = ?, position = ?
       WHERE id = ?`,
      [blockType, JSON.stringify(settings || {}), is_active ? 1 : 0, position, req.params.id]
    );

    res.json({ message: 'Bloco atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar bloco:', error);
    res.status(500).json({ error: 'Erro ao atualizar bloco' });
  }
});

// Deletar bloco
router.delete('/blocks/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    await db.run('DELETE FROM page_builder_blocks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Bloco deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar bloco:', error);
    res.status(500).json({ error: 'Erro ao deletar bloco' });
  }
});

// Reordenar blocos (drag and drop)
router.put('/blocks/reorder/:sectionId', async (req, res) => {
  try {
    const { blocks } = req.body;
    const db = await getDatabase();

    for (const block of blocks) {
      await db.run(
        `UPDATE page_builder_blocks SET position = ? WHERE id = ?`,
        [block.position, block.id]
      );
    }

    res.json({ message: 'Blocos reordenados com sucesso' });
  } catch (error) {
    console.error('Erro ao reordenar blocos:', error);
    res.status(500).json({ error: 'Erro ao reordenar blocos' });
  }
});

export default router;
