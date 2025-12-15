// Vercel Serverless Function - Proxy para o backend
// Este arquivo redireciona as requisições da API para o servidor Node.js

import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Importar rotas do servidor
import authRoutes from '../server/routes/auth.js';
import productsRoutes from '../server/routes/products.js';
import quotesRoutes from '../server/routes/quotes.js';
import ordersRoutes from '../server/routes/orders.js';
import categoriesRoutes from '../server/routes/categories.js';
import machinesRoutes from '../server/routes/machines.js';
import suppliersRoutes from '../server/routes/suppliers.js';
import vehiclesRoutes from '../server/routes/vehicles.js';
import settingsRoutes from '../server/routes/settings.js';
import usersRoutes from '../server/routes/users.js';
import rolesRoutes from '../server/routes/roles.js';
import adminRoutes from '../server/routes/admin.js';

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
