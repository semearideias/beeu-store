import express from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/init.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'beeu-secret-key-2024';

// Middleware para verificar autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Authorization header:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Token extraído:', token ? 'Sim' : 'Não');
  
  if (token) {
    try {
      console.log('Usando secret:', JWT_SECRET.substring(0, 10) + '...');
      
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      console.log('✅ Utilizador autenticado:', decoded);
    } catch (err) {
      console.log('❌ Token inválido:', err.message);
      req.user = null;
    }
  } else {
    console.log('⚠️ Nenhum token fornecido');
    req.user = null;
  }
  
  next();
};

// Gerar número de orçamento único
function generateQuoteNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `QT-${year}${month}${day}-${random}`;
}

// Criar orçamento
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      email,
      company_name,
      contact_name,
      phone,
      address,
      city,
      postal_code,
      tax_id,
      items,
      notes
    } = req.body;

    const db = await getDatabase();

    if (!email || !company_name || !items || items.length === 0) {
      return res.status(400).json({ error: 'Dados obrigatórios em falta' });
    }

    // Calcular totais
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.total_price || 0;
    }

    const tax = subtotal * 0.23; // IVA 23%
    const total = subtotal + tax;
    const quoteNumber = generateQuoteNumber();

    // Criar orçamento
    const quoteResult = await db.run(
      `INSERT INTO quotes (
        quote_number, user_id, email, company_name, contact_name, phone, address, city, postal_code, tax_id,
        subtotal, tax, total, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quoteNumber,
        user_id || null,
        email,
        company_name,
        contact_name || null,
        phone || null,
        address || null,
        city || null,
        postal_code || null,
        tax_id || null,
        subtotal,
        tax,
        total,
        'pending',
        notes || null
      ]
    );

    const quoteId = quoteResult.lastID;

    // Inserir itens do orçamento
    for (const item of items) {
      await db.run(
        `INSERT INTO quote_items (quote_id, product_id, product_name, quantity, color, unit_price, total_price, customization_description, customization_areas)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quoteId,
          item.product_id,
          item.product_name,
          item.quantity,
          item.color || null,
          item.unit_price,
          item.total_price,
          item.customization_description || null,
          item.customization_areas || null
        ]
      );
    }

    res.status(201).json({
      message: 'Orçamento criado com sucesso',
      quote: {
        id: quoteId,
        quote_number: quoteNumber,
        subtotal,
        tax,
        total
      }
    });
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    res.status(500).json({ error: 'Erro ao criar orçamento' });
  }
});

// Listar orçamentos
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const quotes = await db.all(
      `SELECT id, quote_number, email, company_name, subtotal, tax, total, status, created_at
       FROM quotes
       ORDER BY created_at DESC`
    );

    res.json(quotes);
  } catch (error) {
    console.error('Erro ao listar orçamentos:', error);
    res.status(500).json({ error: 'Erro ao listar orçamentos' });
  }
});

// Obter orçamentos do utilizador autenticado (DEVE VIR ANTES DE /:id)
router.get('/my-quotes', authenticateToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const userId = req.user?.id;

    console.log('=== GET /my-quotes ===');
    console.log('req.user:', req.user);
    console.log('userId:', userId);

    if (!userId) {
      console.log('❌ Não autenticado');
      return res.status(401).json({ error: 'Não autenticado' });
    }

    console.log('Buscando orçamentos para userId:', userId);

    // Obter orçamentos do utilizador
    const quotes = await db.all(
      `SELECT * FROM quotes WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    console.log('✅ Orçamentos encontrados:', quotes?.length || 0);

    res.json(quotes || []);
  } catch (error) {
    console.error('❌ Erro ao obter orçamentos:', error);
    res.status(500).json({ error: 'Erro ao obter orçamentos' });
  }
});

// Obter detalhes de um orçamento
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();

    const quote = await db.get('SELECT * FROM quotes WHERE id = ?', [id]);

    if (!quote) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
    }

    const items = await db.all('SELECT * FROM quote_items WHERE quote_id = ?', [id]);

    res.json({
      ...quote,
      items
    });
  } catch (error) {
    console.error('Erro ao obter orçamento:', error);
    res.status(500).json({ error: 'Erro ao obter orçamento' });
  }
});

// Atualizar status do orçamento
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = await getDatabase();

    const validStatuses = ['pending', 'sent', 'accepted', 'rejected', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    await db.run('UPDATE quotes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

    res.json({ message: 'Status atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Submeter pedido de orçamento com personalização
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const db = await getDatabase();
    const userId = req.user?.id || null;
    
    console.log('=== SUBMETER ORÇAMENTO ===');
    console.log('req.user:', req.user);
    console.log('userId:', userId);
    console.log('req.body:', req.body);
    console.log('req.body.items:', req.body.items);
    
    // Dados do formulário
    let items = [];
    try {
      const itemsStr = req.body.items || '[]';
      console.log('itemsStr:', itemsStr);
      items = typeof itemsStr === 'string' ? JSON.parse(itemsStr) : itemsStr;
      console.log('items após parse:', items);
    } catch (err) {
      console.error('Erro ao fazer parse de items:', err);
      return res.status(400).json({ error: 'Formato inválido de produtos' });
    }
    
    const customizationDescription = req.body.customization_description || '';
    
    // Dados do cliente (se não autenticado)
    const clientName = req.body.client_name || '';
    const clientCompany = req.body.client_company || '';
    const clientCity = req.body.client_city || '';
    const clientEmail = req.body.client_email || '';
    const clientPhone = req.body.client_phone || '';
    const wantAccount = req.body.want_account === 'true';

    console.log('Validação: items.length =', items.length);
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Nenhum produto selecionado' });
    }

    if (!userId && !clientEmail) {
      return res.status(400).json({ error: 'Email obrigatório' });
    }

    const quoteNumber = generateQuoteNumber();
    const email = userId ? req.user.email : clientEmail;

    // Criar pedido de orçamento
    const result = await db.run(
      `INSERT INTO quotes (
        quote_number, user_id, email, company_name, contact_name, phone, city,
        customization_description, subtotal, tax, total, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        quoteNumber,
        userId || null,
        email,
        clientCompany || 'Não informado',
        clientName || 'Não informado',
        clientPhone || '',
        clientCity || '',
        customizationDescription,
        0, // subtotal - será calculado depois
        0, // tax
        0  // total - será calculado depois
      ]
    );

    const quoteId = result.lastID;

    // Adicionar itens do orçamento
    for (const item of items) {
      await db.run(
        `INSERT INTO quote_items (quote_id, product_id, product_name, color, quantity, unit_price, total_price, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          quoteId, 
          item.id, 
          item.name || 'Produto', 
          item.color, 
          item.quantity,
          0, // unit_price - será calculado depois
          0  // total_price - será calculado depois
        ]
      );
    }

    // Se o cliente quer criar conta, criar utilizador
    if (wantAccount && !userId) {
      // Aqui você poderia criar um utilizador automaticamente
      // Por enquanto, apenas registramos a intenção
      console.log(`Cliente ${clientEmail} deseja criar conta`);
    }

    console.log(`✅ Pedido de orçamento criado: ${quoteNumber}`);

    res.json({
      success: true,
      message: 'Orçamento submetido com sucesso',
      quoteNumber: quoteNumber
    });
  } catch (error) {
    console.error('Erro ao submeter orçamento:', error);
    res.status(500).json({ error: 'Erro ao submeter orçamento' });
  }
});

export default router;
