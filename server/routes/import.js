import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import https from 'https';
import http from 'http';
import xml2js from 'xml2js';
import { getDatabase } from '../db/init.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Importar produtos do CSV
router.post('/products', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum ficheiro fornecido' });
    }

    const db = await getDatabase();
    const filePath = req.file.path;
    const results = [];
    let importedRows = 0;
    let skippedRows = 0;
    const errors = [];

    // Ler o CSV
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        try {
          // Processar linhas do CSV
          for (const row of results) {
            try {
              const {
                sku,
                name,
                description,
                category_id,
                stock,
                active,
                customization_options,
                price_below_500,
                price_500,
                price_2000,
                price_5000
              } = row;

              // Validar dados obrigatórios
              if (!sku || !name) {
                skippedRows++;
                errors.push(`Linha ignorada: SKU ou nome vazio`);
                continue;
              }

              // Verificar se produto já existe
              let product = await db.get('SELECT id FROM products WHERE sku = ?', [sku]);

              if (!product) {
                // Criar novo produto
                const result = await db.run(
                  `INSERT INTO products (sku, name, description, category_id, stock, active)
                   VALUES (?, ?, ?, ?, ?, ?)`,
                  [sku, name, description || '', category_id || 1, stock || 0, active === 'true' ? 1 : 0]
                );
                product = { id: result.lastID };
              }

              // Processar cores (se existirem em customization_options)
              if (customization_options) {
                try {
                  const options = JSON.parse(customization_options);
                  if (options.colors && Array.isArray(options.colors)) {
                    for (const color of options.colors) {
                      // Verificar se cor já existe
                      const existingColor = await db.get(
                        'SELECT id FROM product_colors WHERE product_id = ? AND color_name = ?',
                        [product.id, color]
                      );

                      if (!existingColor) {
                        await db.run(
                          'INSERT INTO product_colors (product_id, color_name) VALUES (?, ?)',
                          [product.id, color]
                        );
                      }
                    }
                  }
                } catch (e) {
                  console.error('Erro ao processar cores:', e);
                }
              }

              // Processar preços por quantidade
              const priceMap = [
                { min: 1, max: 499, price: price_below_500 },
                { min: 500, max: 1999, price: price_500 },
                { min: 2000, max: 4999, price: price_2000 },
                { min: 5000, max: null, price: price_5000 }
              ];

              for (const priceRange of priceMap) {
                if (priceRange.price) {
                  // Converter preço (remover € e espaços, substituir vírgula por ponto)
                  const cleanPrice = parseFloat(
                    priceRange.price.toString().replace(/[€\s]/g, '').replace(',', '.')
                  );

                  if (!isNaN(cleanPrice)) {
                    // Verificar se já existe preço para essa faixa
                    const existingPrice = await db.get(
                      'SELECT id FROM product_prices WHERE product_id = ? AND quantity_min = ?',
                      [product.id, priceRange.min]
                    );

                    if (existingPrice) {
                      await db.run(
                        'UPDATE product_prices SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [cleanPrice, existingPrice.id]
                      );
                    } else {
                      await db.run(
                        `INSERT INTO product_prices (product_id, quantity_min, quantity_max, price)
                         VALUES (?, ?, ?, ?)`,
                        [product.id, priceRange.min, priceRange.max, cleanPrice]
                      );
                    }
                  }
                }
              }

              importedRows++;
            } catch (error) {
              skippedRows++;
              errors.push(`Erro ao processar linha: ${error.message}`);
            }
          }

          // Registar importação no histórico
          await db.run(
            `INSERT INTO import_history (filename, imported_rows, skipped_rows, status)
             VALUES (?, ?, ?, ?)`,
            [req.file.originalname, importedRows, skippedRows, 'completed']
          );

          // Limpar ficheiro temporário
          fs.unlinkSync(filePath);

          res.json({
            message: 'Importação concluída',
            imported_rows: importedRows,
            skipped_rows: skippedRows,
            errors: errors.slice(0, 10) // Mostrar apenas os primeiros 10 erros
          });
        } catch (error) {
          console.error('Erro ao processar CSV:', error);
          fs.unlinkSync(filePath);
          res.status(500).json({ error: 'Erro ao processar ficheiro' });
        }
      })
      .on('error', (error) => {
        console.error('Erro ao ler CSV:', error);
        fs.unlinkSync(filePath);
        res.status(400).json({ error: 'Erro ao ler ficheiro CSV' });
      });
  } catch (error) {
    console.error('Erro na importação:', error);
    res.status(500).json({ error: 'Erro na importação' });
  }
});

// Obter histórico de importações
router.get('/history', async (req, res) => {
  try {
    const db = await getDatabase();
    const history = await db.all(
      'SELECT id, filename, imported_rows, skipped_rows, status, created_at FROM import_history ORDER BY created_at DESC LIMIT 20'
    );
    res.json(history);
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({ error: 'Erro ao obter histórico' });
  }
});

// Função auxiliar para descarregar imagem
const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    try {
      const protocol = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(filepath);
      
      const options = {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': 'https://www.makito.pt/',
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'same-site'
        }
      };
      
      const request = protocol.get(url, options, (response) => {
        // Aceitar 200 e redirects (301, 302, 307, 308)
        if (response.statusCode >= 300 && response.statusCode < 400) {
          // Redirect - seguir
          file.destroy();
          fs.unlink(filepath, () => {});
          return reject(new Error(`Redirect ${response.statusCode}`));
        }
        
        if (response.statusCode !== 200) {
          file.destroy();
          fs.unlink(filepath, () => {});
          return reject(new Error(`HTTP ${response.statusCode}`));
        }
        
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(filepath);
        });
      });
      
      request.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

// Importador avançado com mapeamento dinâmico
router.post('/makito-advanced', async (req, res) => {
  try {
    const { products, prices, columnMapping, combinedFields, duplicateAction = 'skip' } = req.body;
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Dados de produtos inválidos' });
    }

    const db = await getDatabase();
    let productsImported = 0;
    let imagesDownloaded = 0;
    let colorsAggregated = 0;
    let pricesMatched = 0;
    let categoriesCreated = 0;
    const errors = [];

    console.log('=== IMPORTADOR MAKITO AVANÇADO ===');
    console.log(`Produtos a processar: ${products.length}`);
    console.log(`Preços fornecidos: ${prices ? prices.length : 0}`);

    // Criar diretório de imagens se não existir
    const imagesDir = 'public/images/products';
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Agrupar produtos por referência (para agregar cores com imagens)
    // A primeira linha de cada referência é a cor principal
    const productsByRef = {};
    for (const row of products) {
      const ref = row.reference;
      if (!ref) continue;

      if (!productsByRef[ref]) {
        // Primeira linha = cor principal e imagem padrão
        productsByRef[ref] = {
          data: row,
          mainColor: row.color, // Cor principal
          mainImage: row.main_image || row.image_url, // Imagem principal (preferir main_image)
          colors: [] // Array de {color_name, image_url}
        };
        
        // Adicionar a cor principal à lista
        if (row.color) {
          productsByRef[ref].colors.push({
            color_name: row.color,
            image_url: row.color_image || row.image_url, // Preferir color_image
            is_main: true
          });
        }
      } else {
        // Linhas subsequentes = cores adicionais
        if (row.color) {
          productsByRef[ref].colors.push({
            color_name: row.color,
            image_url: row.color_image || row.image_url, // Preferir color_image
            is_main: false
          });
        }
      }
    }

    // Processar cada referência única (sem limite)
    const refsToProcess = Object.keys(productsByRef);
    
    for (const ref of refsToProcess) {
      try {
        const productData = productsByRef[ref];
        const row = productData.data;
        const colors = productData.colors; // Já tem a cor principal

        // Extrair dados mapeados
        let name = row.name || '';
        let description = row.description || '';
        const imageUrl = productData.mainImage; // Usar imagem da primeira linha
        const stock = parseInt(row.stock) || 0;
        const weight = row.weight;

        if (!name) {
          errors.push(`Referência ${ref}: nome vazio`);
          continue;
        }

        // Processar categoria
        let categoryId = 1; // Default
        
        // Se tiver category_name, procurar ou criar
        if (row.category_name) {
          const categoryName = row.category_name.trim();
          let category = await db.get('SELECT id FROM categories WHERE name = ?', [categoryName]);
          
          if (!category) {
            // Criar categoria se não existir
            const result = await db.run(
              'INSERT INTO categories (name, description) VALUES (?, ?)',
              [categoryName, `Categoria ${categoryName}`]
            );
            categoryId = result.lastID;
            categoriesCreated++;
            console.log(`✅ Categoria criada: ${categoryName} (ID: ${categoryId})`);
          } else {
            categoryId = category.id;
            console.log(`ℹ️ Categoria encontrada: ${categoryName} (ID: ${categoryId})`);
          }
        } else if (row.category_id) {
          // Se tiver category_id, usar diretamente
          categoryId = parseInt(row.category_id) || 1;
        }

        // Verificar se produto já existe
        let product = await db.get('SELECT id FROM products WHERE sku = ?', [ref]);

        if (!product) {
          // Criar novo produto
          const result = await db.run(
            `INSERT INTO products (sku, name, description, category_id, stock, weight)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [ref, name, description, categoryId, stock, weight || null]
          );
          product = { id: result.lastID };
          productsImported++;
          console.log(`✅ Produto criado: ${ref}`);
        } else {
          // Produto já existe
          if (duplicateAction === 'skip') {
            console.log(`⏭️ Produto saltado (já existe): ${ref}`);
            continue;
          } else if (duplicateAction === 'update') {
            // Atualizar produto existente
            await db.run(
              `UPDATE products SET name = ?, description = ?, category_id = ?, stock = ?, weight = ? WHERE id = ?`,
              [name, description, categoryId, stock, weight || null, product.id]
            );
            console.log(`🔄 Produto atualizado: ${ref}`);
          }
        }

        // Descarregar imagem principal se URL fornecida
        if (imageUrl) {
          try {
            const mainFilename = `${product.id}_${Date.now()}.jpg`;
            const mainImagePath = path.join(imagesDir, mainFilename);
            
            // Delay para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Descarregar imagem principal
            await downloadImage(imageUrl, mainImagePath);
            const mainImageUrl = `/images/products/${mainFilename}`;
            
            // Salvar URL da imagem no produto
            await db.run(
              'UPDATE products SET image_url = ? WHERE id = ?',
              [mainImageUrl, product.id]
            );
            console.log(`📥 Imagem principal descarregada: ${ref}`);
          } catch (err) {
            console.log(`⚠️ Erro ao descarregar imagem principal para ${ref}: ${err.message}`);
          }
        }

        // Adicionar ou atualizar cores com imagens
        for (const colorData of colors) {
          if (colorData && colorData.color_name) {
            const existingColor = await db.get(
              'SELECT id, image_url FROM product_colors WHERE product_id = ? AND color_name = ?',
              [product.id, colorData.color_name]
            );

            // Preparar URL da imagem da cor
            let colorImageUrl = null;
            if (colorData.image_url) {
              // Se for URL externa, descarregar
              if (colorData.image_url.startsWith('http')) {
                try {
                  const colorFilename = `${product.id}_${colorData.color_name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`;
                  const colorImagePath = path.join(imagesDir, colorFilename);
                  
                  // Delay para não sobrecarregar
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  // Descarregar imagem da cor
                  await downloadImage(colorData.image_url, colorImagePath);
                  colorImageUrl = `/images/products/${colorFilename}`;
                  console.log(`📥 Imagem da cor descarregada: ${colorData.color_name}`);
                } catch (err) {
                  console.log(`⚠️ Erro ao descarregar imagem da cor ${colorData.color_name}: ${err.message}`);
                  colorImageUrl = null;
                }
              } else {
                colorImageUrl = colorData.image_url;
              }
            }

            if (!existingColor) {
              // Cor nova - adicionar
              await db.run(
                'INSERT INTO product_colors (product_id, color_name, image_url) VALUES (?, ?, ?)',
                [product.id, colorData.color_name, colorImageUrl]
              );
              colorsAggregated++;
              console.log(`✨ Cor adicionada: ${colorData.color_name}`);
            } else if (colorImageUrl && existingColor.image_url !== colorImageUrl) {
              // Cor existe mas imagem é diferente - atualizar
              await db.run(
                'UPDATE product_colors SET image_url = ? WHERE id = ?',
                [colorImageUrl, existingColor.id]
              );
              console.log(`🔄 Imagem da cor atualizada: ${colorData.color_name}`);
            }
          }
        }

        // Associar preços do segundo ficheiro
        if (prices && Array.isArray(prices)) {
          const priceRow = prices.find(p => p.reference === ref || p.sku === ref);
          if (priceRow) {
            // Processar preços por quantidade
            const priceFields = ['price_below_500', 'price_500', 'price_2000', 'price_5000'];
            const priceRanges = [
              { min: 1, max: 499 },
              { min: 500, max: 1999 },
              { min: 2000, max: 4999 },
              { min: 5000, max: null }
            ];

            for (let i = 0; i < priceFields.length; i++) {
              const priceValue = priceRow[priceFields[i]];
              if (priceValue) {
                const cleanPrice = parseFloat(
                  priceValue.toString().replace(/[€\s]/g, '').replace(',', '.')
                );

                if (!isNaN(cleanPrice)) {
                  const existingPrice = await db.get(
                    'SELECT id FROM product_prices WHERE product_id = ? AND quantity_min = ?',
                    [product.id, priceRanges[i].min]
                  );

                  if (existingPrice) {
                    await db.run(
                      'UPDATE product_prices SET price = ? WHERE id = ?',
                      [cleanPrice, existingPrice.id]
                    );
                  } else {
                    await db.run(
                      `INSERT INTO product_prices (product_id, quantity_min, quantity_max, price)
                       VALUES (?, ?, ?, ?)`,
                      [product.id, priceRanges[i].min, priceRanges[i].max, cleanPrice]
                    );
                  }
                  pricesMatched++;
                }
              }
            }
          }
        }
      } catch (error) {
        errors.push(`Referência ${ref}: ${error.message}`);
      }
    }

    // Contar imagens na fila
    const queueStatus = await db.get('SELECT COUNT(*) as count FROM image_download_queue WHERE status = "pending"');
    const imagesInQueue = queueStatus.count;

    console.log('=== RESULTADO ===');
    console.log(`Produtos importados: ${productsImported}`);
    console.log(`Categorias criadas: ${categoriesCreated}`);
    console.log(`Imagens adicionadas à fila: ${imagesInQueue}`);
    console.log(`Cores agregadas: ${colorsAggregated}`);
    console.log(`Preços associados: ${pricesMatched}`);

    res.json({
      products_imported: productsImported,
      categories_created: categoriesCreated,
      images_in_queue: imagesInQueue,
      colors_aggregated: colorsAggregated,
      prices_matched: pricesMatched,
      total_processed: refsToProcess.length,
      message: `Imagens serão descarregadas progressivamente. Use GET /api/import/image-queue-status para monitorar o progresso.`,
      errors: errors.slice(0, 20)
    });
  } catch (error) {
    console.error('Erro na importação avançada:', error);
    res.status(500).json({ error: 'Erro na importação: ' + error.message });
  }
});

// Processar fila de download de imagens (progressivo)
router.post('/process-image-queue', async (req, res) => {
  try {
    const db = await getDatabase();
    const imagesDir = 'public/images/products';
    
    // Criar diretório se não existir
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Obter próxima imagem da fila (máximo 3 por vez para não sobrecarregar)
    const queue = await db.all(
      `SELECT id, product_id, image_url FROM image_download_queue 
       WHERE status = 'pending' AND attempts < 5
       LIMIT 3`
    );

    if (queue.length === 0) {
      return res.json({ processed: 0, message: 'Nenhuma imagem na fila' });
    }

    let processed = 0;
    let successful = 0;

    for (const item of queue) {
      try {
        const filename = `${item.product_id}_${Date.now()}.jpg`;
        const filepath = path.join(imagesDir, filename);

        // Tentar descarregar com delay maior para não sobrecarregar Makito
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 segundos entre downloads

        await downloadImage(item.image_url, filepath);

        // Verificar se ficheiro foi criado
        if (fs.existsSync(filepath)) {
          // Atualizar produto com imagem
          await db.run(
            'UPDATE products SET image_url = ? WHERE id = ?',
            [`/images/products/${filename}`, item.product_id]
          );

          // Marcar como concluído
          await db.run(
            'UPDATE image_download_queue SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['completed', item.id]
          );

          console.log(`✅ Imagem descarregada: ${item.product_id}`);
          successful++;
        } else {
          throw new Error('Ficheiro não criado');
        }
      } catch (err) {
        // Incrementar tentativas
        await db.run(
          `UPDATE image_download_queue 
           SET attempts = attempts + 1, error_message = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [err.message, item.id]
        );

        console.log(`⚠️ Erro ao descarregar imagem ${item.product_id}: ${err.message}`);
      }
      processed++;
    }

    res.json({
      processed,
      successful,
      remaining: (await db.get('SELECT COUNT(*) as count FROM image_download_queue WHERE status = "pending"')).count
    });
  } catch (error) {
    console.error('Erro ao processar fila de imagens:', error);
    res.status(500).json({ error: 'Erro ao processar fila: ' + error.message });
  }
});

// Obter status da fila de imagens
router.get('/image-queue-status', async (req, res) => {
  try {
    const db = await getDatabase();

    const pending = await db.get('SELECT COUNT(*) as count FROM image_download_queue WHERE status = "pending"');
    const completed = await db.get('SELECT COUNT(*) as count FROM image_download_queue WHERE status = "completed"');
    const failed = await db.get('SELECT COUNT(*) as count FROM image_download_queue WHERE attempts >= 3');

    res.json({
      pending: pending.count,
      completed: completed.count,
      failed: failed.count,
      total: pending.count + completed.count + failed.count
    });
  } catch (error) {
    console.error('Erro ao obter status da fila:', error);
    res.status(500).json({ error: 'Erro ao obter status' });
  }
});

// Apagar todos os produtos e categorias (ADMIN ONLY)
router.post('/delete-all-products', async (req, res) => {
  try {
    const db = await getDatabase();

    // Apagar em ordem: cores, preços, imagens na fila, produtos, categorias
    await db.run('DELETE FROM product_colors');
    await db.run('DELETE FROM product_prices');
    await db.run('DELETE FROM image_download_queue');
    await db.run('DELETE FROM products');
    await db.run('DELETE FROM categories WHERE id > 1'); // Manter categoria padrão (ID 1)

    console.log('✅ Todos os produtos e categorias foram apagados');

    res.json({
      message: '✅ Todos os produtos, cores, preços e categorias foram apagados com sucesso',
      deleted: {
        products: 'Todos',
        colors: 'Todas',
        prices: 'Todos',
        categories: 'Todas (exceto padrão)',
        image_queue: 'Fila limpa'
      }
    });
  } catch (error) {
    console.error('Erro ao apagar produtos:', error);
    res.status(500).json({ error: 'Erro ao apagar: ' + error.message });
  }
});

// Obter estatísticas de produtos
router.get('/stats', async (req, res) => {
  try {
    const db = await getDatabase();

    const products = await db.get('SELECT COUNT(*) as count FROM products');
    const categories = await db.get('SELECT COUNT(*) as count FROM categories');
    const colors = await db.get('SELECT COUNT(*) as count FROM product_colors');
    const prices = await db.get('SELECT COUNT(*) as count FROM product_prices');
    const imageQueue = await db.get('SELECT COUNT(*) as count FROM image_download_queue WHERE status = "pending"');

    res.json({
      products: products.count,
      categories: categories.count,
      colors: colors.count,
      prices: prices.count,
      image_queue_pending: imageQueue.count
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});


export default router;
