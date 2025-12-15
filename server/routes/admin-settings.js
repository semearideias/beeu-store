import express from 'express';
import { getDatabase } from '../db/init.js';

const router = express.Router();

// Obter todas as configurações
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const settings = await db.all('SELECT * FROM store_settings ORDER BY setting_key');
    
    // Converter para objeto
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.setting_key] = {
        value: s.setting_value,
        type: s.setting_type,
        description: s.description
      };
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    res.status(500).json({ error: 'Erro ao obter configurações' });
  }
});

// Atualizar múltiplas configurações (DEVE VIR ANTES DE /:key)
router.put('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const settings = req.body;

    // Validação: se é um objeto com múltiplas chaves
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return res.status(400).json({ error: 'Formato inválido. Envie um objeto com as configurações.' });
    }

    for (const [key, data] of Object.entries(settings)) {
      if (!data || typeof data !== 'object') {
        continue;
      }

      const existing = await db.get(
        'SELECT id FROM store_settings WHERE setting_key = ?',
        [key]
      );

      if (existing) {
        await db.run(
          `UPDATE store_settings 
           SET setting_value = ?, setting_type = ?, description = ?, updated_at = CURRENT_TIMESTAMP
           WHERE setting_key = ?`,
          [data.value || '', data.type || 'text', data.description || null, key]
        );
      } else {
        await db.run(
          `INSERT INTO store_settings (setting_key, setting_value, setting_type, description)
           VALUES (?, ?, ?, ?)`,
          [key, data.value || '', data.type || 'text', data.description || null]
        );
      }
    }

    res.json({ message: 'Configurações atualizadas com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar configurações' });
  }
});

// Obter uma configuração específica
router.get('/:key', async (req, res) => {
  try {
    const db = await getDatabase();
    const setting = await db.get(
      'SELECT * FROM store_settings WHERE setting_key = ?',
      [req.params.key]
    );

    if (!setting) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    res.json(setting);
  } catch (error) {
    console.error('Erro ao obter configuração:', error);
    res.status(500).json({ error: 'Erro ao obter configuração' });
  }
});

// Atualizar uma configuração específica
router.put('/:key', async (req, res) => {
  try {
    const db = await getDatabase();
    const { key } = req.params;
    const { value, type, description } = req.body;

    // Validação básica
    if (value === undefined || value === null) {
      return res.status(400).json({ error: 'Valor é obrigatório' });
    }

    // Verificar se existe
    const existing = await db.get(
      'SELECT id FROM store_settings WHERE setting_key = ?',
      [key]
    );

    if (existing) {
      await db.run(
        `UPDATE store_settings 
         SET setting_value = ?, setting_type = ?, description = ?, updated_at = CURRENT_TIMESTAMP
         WHERE setting_key = ?`,
        [value, type || 'text', description || null, key]
      );
    } else {
      await db.run(
        `INSERT INTO store_settings (setting_key, setting_value, setting_type, description)
         VALUES (?, ?, ?, ?)`,
        [key, value, type || 'text', description || null]
      );
    }

    res.json({ message: 'Configuração atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar configuração' });
  }
});

export default router;
