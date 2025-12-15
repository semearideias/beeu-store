import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { initializeDatabase } from './db/init.js';
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import ordersRoutes from './routes/orders.js';
import quotesRoutes from './routes/quotes.js';
import importRoutes from './routes/import.js';
import adminAuthRoutes from './routes/admin-auth.js';
import adminMenusRoutes from './routes/admin-menus.js';
import adminProductsRoutes from './routes/admin-products.js';
import adminPagesRoutes from './routes/admin-pages.js';
import adminCategoriesRoutes from './routes/admin-categories.js';
import pageBuilderRoutes from './routes/page-builder.js';
import adminQuotesRoutes from './routes/admin-quotes.js';
import adminOrdersRoutes from './routes/admin-orders.js';
import adminShippingRoutes from './routes/admin-shipping.js';
import adminSettingsRoutes from './routes/admin-settings.js';
import adminProductPricesRoutes from './routes/admin-product-prices.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

// Configurar multer para upload de ficheiros
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(upload.single('logo_file')); // Para ficheiros simples

// Servir ficheiros estáticos (imagens, etc)
app.use(express.static('public'));

// Inicializar banco de dados
await initializeDatabase();

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/import', importRoutes);

// Rotas do Backoffice
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/menus', adminMenusRoutes);
app.use('/api/admin/products', adminProductsRoutes);
app.use('/api/admin/pages', adminPagesRoutes);
app.use('/api/admin/categories', adminCategoriesRoutes);
app.use('/api/admin/page-builder', pageBuilderRoutes);
app.use('/api/admin/quotes', adminQuotesRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/admin/shipping', adminShippingRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/product-prices', adminProductPricesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 BEEU Store API rodando em http://localhost:${PORT}`);
});
