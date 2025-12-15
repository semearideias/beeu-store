import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader, Eye, Settings, X, Plus, Activity } from 'lucide-react';
import Papa from 'papaparse';

export default function ImportMakitoAdvanced() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map Columns, 3: Preview, 4: Import, 5: Monitor
  const [productsFile, setProductsFile] = useState(null);
  const [pricesFile, setPricesFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [pricesData, setPricesData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [availableColumns, setAvailableColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState([]);
  const [filesLoaded, setFilesLoaded] = useState({ products: false, prices: false });
  const [combinedFields, setCombinedFields] = useState({}); // Para campos combinados
  const [duplicateAction, setDuplicateAction] = useState('skip'); // 'skip' ou 'update'
  const [imageQueueStatus, setImageQueueStatus] = useState(null);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [xmlUrl, setXmlUrl] = useState('');
  const [xmlLoading, setXmlLoading] = useState(false);
  const [duplicateStats, setDuplicateStats] = useState(null);
  const [existingReferences, setExistingReferences] = useState(new Set());

  const REQUIRED_FIELDS = ['reference', 'name', 'description'];
  const OPTIONAL_FIELDS = ['color', 'weight', 'main_image', 'color_image', 'image_url', 'category_id', 'category_name', 'stock'];
  const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

  // Parse CSV file
  const handleFileUpload = (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (fileType === 'products') {
          setCsvData(results.data);
          const columns = Object.keys(results.data[0] || {});
          setAvailableColumns(columns);
          
          // Auto-map common column names
          const autoMapping = {};
          columns.forEach(col => {
            const lower = col.toLowerCase();
            if (lower.includes('ref')) autoMapping.reference = col;
            else if (lower.includes('name') || lower.includes('product')) autoMapping.name = col;
            else if (lower.includes('desc')) autoMapping.description = col;
            else if (lower.includes('color') && !lower.includes('image')) autoMapping.color = col;
            else if (lower.includes('weight')) autoMapping.weight = col;
            else if (lower.includes('main_image')) autoMapping.main_image = col;
            else if (lower.includes('color_image')) autoMapping.color_image = col;
            else if (lower.includes('image') || lower.includes('url')) autoMapping.image_url = col;
            else if (lower.includes('category_name')) autoMapping.category_name = col;
            else if (lower.includes('category_id') || lower.includes('category')) autoMapping.category_id = col;
            else if (lower.includes('stock')) autoMapping.stock = col;
          });
          setColumnMapping(autoMapping);
          setProductsFile(file);
          setFilesLoaded(prev => ({ ...prev, products: true }));
          setError('');
        } else {
          setPricesData(results.data);
          setPricesFile(file);
          setFilesLoaded(prev => ({ ...prev, prices: true }));
          setError('');
        }
      },
      error: (error) => {
        setError(`Erro ao ler CSV: ${error.message}`);
      }
    });
  };

  // Update column mapping
  const handleMappingChange = (field, column) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: column
    }));
  };

  // Add combined column
  const addCombinedColumn = (field, column) => {
    setCombinedFields(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), column]
    }));
  };

  // Remove combined column
  const removeCombinedColumn = (field, index) => {
    setCombinedFields(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Validate mapping
  const validateMapping = () => {
    const missing = REQUIRED_FIELDS.filter(f => !columnMapping[f] && (!combinedFields[f] || combinedFields[f].length === 0));
    if (missing.length > 0) {
      setError(`Campos obrigatórios não mapeados: ${missing.join(', ')}`);
      return false;
    }
    setError('');
    return true;
  };

  // Go to preview
  const handlePreview = () => {
    if (!validateMapping()) return;
    
    // Create preview with mapped data
    const previewData = csvData.slice(0, 5).map(row => {
      const mapped = {};
      
      // Primeiro adicionar campos do columnMapping
      Object.entries(columnMapping).forEach(([field, column]) => {
        if (column && !combinedFields[field]) {
          // Só adicionar se não há campo combinado para este field
          mapped[field] = row[column];
        }
      });
      
      // Depois adicionar campos combinados (têm prioridade)
      Object.entries(combinedFields).forEach(([field, columns]) => {
        if (columns && columns.length > 0) {
          // Combinar a coluna principal com as adicionais
          const mainColumn = columnMapping[field];
          let value = mainColumn ? row[mainColumn] : '';
          const additionalValues = columns.map(col => row[col]).filter(v => v);
          
          if (additionalValues.length > 0) {
            mapped[field] = [value, ...additionalValues].filter(v => v).join(' ');
          } else if (value) {
            mapped[field] = value;
          }
        }
      });
      
      return mapped;
    });
    setPreview(previewData);
    setStep(3);
  };

  // Monitorar fila de imagens
  const fetchImageQueueStatus = async () => {
    try {
      const response = await fetch('/api/import/image-queue-status');
      const data = await response.json();
      setImageQueueStatus(data);
    } catch (err) {
      console.error('Erro ao obter status:', err);
    }
  };

  // Processar fila de imagens
  const processImageQueue = async () => {
    try {
      const response = await fetch('/api/import/process-image-queue', { method: 'POST' });
      const data = await response.json();
      console.log('Processadas:', data);
      await fetchImageQueueStatus();
    } catch (err) {
      console.error('Erro ao processar fila:', err);
    }
  };

  // Monitoramento automático
  useEffect(() => {
    if (!monitoringActive) return;

    const interval = setInterval(async () => {
      await fetchImageQueueStatus();
      await processImageQueue();
    }, 3000); // Atualizar a cada 3 segundos

    return () => clearInterval(interval);
  }, [monitoringActive]);

  // Validar referências duplicadas
  const validateReferences = async () => {
    if (!csvData || !columnMapping.reference) {
      setError('Dados ou mapeamento de referência não encontrados');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Extrair todas as referências do CSV
      const references = csvData
        .map(row => row[columnMapping.reference])
        .filter(ref => ref && ref.trim());

      console.log(`Validando ${references.length} referências...`);

      // Buscar referências existentes no backend
      const response = await fetch('/api/admin/products/check-references', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({ references })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao validar referências');
      }

      // Calcular estatísticas
      const existing = new Set(data.existing_references || []);
      const newCount = references.length - existing.size;

      setExistingReferences(existing);
      setDuplicateStats({
        total: references.length,
        existing: existing.size,
        new: newCount,
        duplicatePercentage: Math.round((existing.size / references.length) * 100)
      });

      // Avançar para step 3.5 (validação)
      setStep(3.5);
    } catch (err) {
      setError(err.message || 'Erro ao validar referências');
    } finally {
      setLoading(false);
    }
  };

  // Importar XML da Makito
  const handleImportXml = async () => {
    if (!xmlUrl.trim()) {
      setError('Por favor, insira a URL do XML');
      return;
    }

    setXmlLoading(true);
    setError('');

    try {
      const response = await fetch('/api/import/makito-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmlUrl: xmlUrl.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao importar XML');
      }

      // Usar dados do XML como CSV
      if (data.all_data && Array.isArray(data.all_data)) {
        setCsvData(data.all_data);
        const columns = Object.keys(data.all_data[0] || {});
        setAvailableColumns(columns);

        // Auto-map columns
        const autoMapping = {};
        columns.forEach(col => {
          const lower = col.toLowerCase();
          if (lower.includes('ref')) autoMapping.reference = col;
          else if (lower.includes('name')) autoMapping.name = col;
          else if (lower.includes('desc')) autoMapping.description = col;
          else if (lower.includes('color') && !lower.includes('image')) autoMapping.color = col;
          else if (lower.includes('weight')) autoMapping.weight = col;
          else if (lower.includes('image')) autoMapping.image_url = col;
          else if (lower.includes('category')) autoMapping.category_name = col;
          else if (lower.includes('stock')) autoMapping.stock = col;
        });
        setColumnMapping(autoMapping);
        setFilesLoaded(prev => ({ ...prev, products: true }));
        setStep(2);
        setXmlUrl('');
      }
    } catch (err) {
      setError(err.message || 'Erro ao importar XML');
    } finally {
      setXmlLoading(false);
    }
  };

  // Submit import
  const handleImport = async () => {
    if (!validateMapping()) return;

    setLoading(true);
    setError('');

    try {
      // Importar todos os produtos (sem limite)
      const productsToImport = csvData;
      
      // Map all data
      const mappedData = productsToImport.map(row => {
        const mapped = {};
        
        // Primeiro adicionar campos do columnMapping
        Object.entries(columnMapping).forEach(([field, column]) => {
          if (column && !combinedFields[field]) {
            // Só adicionar se não há campo combinado para este field
            mapped[field] = row[column];
          }
        });
        
        // Depois adicionar campos combinados (têm prioridade)
        Object.entries(combinedFields).forEach(([field, columns]) => {
          if (columns && columns.length > 0) {
            // Combinar a coluna principal com as adicionais
            const mainColumn = columnMapping[field];
            let value = mainColumn ? row[mainColumn] : '';
            const additionalValues = columns.map(col => row[col]).filter(v => v);
            
            if (additionalValues.length > 0) {
              mapped[field] = [value, ...additionalValues].filter(v => v).join(' ');
            } else if (value) {
              mapped[field] = value;
            }
          }
        });
        
        return mapped;
      });

      // Prepare payload
      const payload = {
        products: mappedData,
        prices: pricesData || [],
        columnMapping,
        combinedFields,
        duplicateAction
      };

      // Send to backend
      const response = await fetch('/api/import/makito-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || `Erro HTTP ${response.status}`);
        } catch (e) {
          throw new Error(`Erro ao importar: ${responseText || response.statusText}`);
        }
      }

      const data = JSON.parse(responseText);
      setResult(data);
      
      // Iniciar monitoramento automático
      setMonitoringActive(true);
      await fetchImageQueueStatus();
      
      // Ir para passo 5 (monitoramento)
      setStep(5);
    } catch (err) {
      setError(err.message || 'Erro ao importar produtos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Importador Avançado Makito</h1>
        <p className="text-gray-600 mb-8">Importação dinâmica com mapeamento de colunas e download de imagens</p>

        {/* Step Indicator */}
        <div className="flex gap-4 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`flex-1 py-2 px-4 rounded text-center font-bold text-sm ${
                step >= s ? 'bg-primary text-dark' : 'bg-light text-gray-500'
              }`}
            >
              {s === 4 ? '📊 Monitorar' : `Passo ${s}`}
            </div>
          ))}
        </div>

        {/* Step 1: Upload Files */}
        {step === 1 && (
          <div className="bg-white p-8 rounded-lg shadow-lg space-y-6">
            <h2 className="text-2xl font-bold">1. Selecionar Ficheiros</h2>
            <p className="text-gray-600">Carregue os ficheiros CSV ou importe diretamente do XML da Makito</p>

            {/* Importar XML da Makito */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-blue-900">📥 Importar XML da Makito</h3>
              </div>
              <p className="text-sm text-blue-800">Cole a URL do XML da Makito para importar produtos diretamente</p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="http://print.makito.es:8080/user/xml/ItemDataFile.php?pszinternal=..."
                  value={xmlUrl}
                  onChange={(e) => setXmlUrl(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleImportXml}
                  disabled={xmlLoading || !xmlUrl.trim()}
                  className="bg-blue-500 text-white font-bold px-6 py-2 rounded hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {xmlLoading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Importar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-gray-500 font-bold">OU</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Products File */}
            <div>
              <label className="block text-sm font-bold mb-4">
                Ficheiro de Produtos {filesLoaded.products && <span className="text-green-600">✓</span>}
              </label>
              <div className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                filesLoaded.products ? 'border-green-500 bg-green-50' : 'border-primary hover:bg-primary/5'
              }`}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, 'products')}
                  className="hidden"
                  id="products-input"
                />
                <label htmlFor="products-input" className="cursor-pointer">
                  <Upload size={40} className={`mx-auto mb-2 ${filesLoaded.products ? 'text-green-600' : 'text-primary'}`} />
                  <p className="font-semibold text-dark">
                    {productsFile ? productsFile.name : 'Clique para selecionar ficheiro de produtos'}
                  </p>
                </label>
              </div>
            </div>

            {/* Prices File */}
            <div>
              <label className="block text-sm font-bold mb-4">
                Ficheiro de Preços {filesLoaded.prices && <span className="text-green-600">✓</span>}
              </label>
              <div className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                filesLoaded.prices ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, 'prices')}
                  className="hidden"
                  id="prices-input"
                />
                <label htmlFor="prices-input" className="cursor-pointer">
                  <Upload size={40} className={`mx-auto mb-2 ${filesLoaded.prices ? 'text-green-600' : 'text-gray-400'}`} />
                  <p className="font-semibold text-dark">
                    {pricesFile ? pricesFile.name : 'Clique para selecionar ficheiro de preços'}
                  </p>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <button
              onClick={() => {
                if (filesLoaded.products) {
                  setStep(2);
                } else {
                  setError('Por favor, carregue o ficheiro de produtos');
                }
              }}
              disabled={!filesLoaded.products}
              className="w-full bg-primary text-dark font-bold py-3 rounded hover:opacity-90 transition disabled:opacity-50"
            >
              Continuar para Mapeamento
            </button>
          </div>
        )}

        {/* Step 2: Map Columns */}
        {step === 2 && (
          <div className="bg-white p-8 rounded-lg shadow-lg space-y-6">
            <h2 className="text-2xl font-bold">2. Mapear Colunas</h2>
            <p className="text-gray-600">Selecione qual coluna do CSV corresponde a cada campo</p>

            <div className="space-y-4">
              {/* Required Fields */}
              <div>
                <h3 className="font-bold text-red-600 mb-3">Campos Obrigatórios *</h3>
                <div className="space-y-4">
                  {REQUIRED_FIELDS.map(field => (
                    <div key={field} className="border rounded p-4 bg-red-50">
                      <label className="font-semibold capitalize block mb-2">{field}</label>
                      
                      {/* Main column */}
                      <div className="flex gap-2 mb-2">
                        <select
                          value={columnMapping[field] || ''}
                          onChange={(e) => handleMappingChange(field, e.target.value)}
                          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:border-primary"
                        >
                          <option value="">-- Selecionar --</option>
                          {availableColumns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>

                      {/* Combined columns */}
                      {combinedFields[field] && combinedFields[field].length > 0 && (
                        <div className="space-y-2 mb-2">
                          {combinedFields[field].map((col, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded">
                              <span className="text-sm text-gray-600">+ {col}</span>
                              <button
                                type="button"
                                onClick={() => removeCombinedColumn(field, idx)}
                                className="ml-auto text-red-500 hover:text-red-700"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add combined column */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addCombinedColumn(field, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-4 py-2 border rounded text-sm text-gray-500 focus:outline-none focus:border-primary"
                      >
                        <option value="">+ Adicionar coluna combinada</option>
                        {availableColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Fields */}
              <div>
                <h3 className="font-bold text-blue-600 mb-3">Campos Opcionais</h3>
                <div className="space-y-4">
                  {OPTIONAL_FIELDS.map(field => (
                    <div key={field} className="border rounded p-4 bg-blue-50">
                      <label className="font-semibold capitalize block mb-2">{field}</label>
                      
                      {/* Main column */}
                      <div className="flex gap-2 mb-2">
                        <select
                          value={columnMapping[field] || ''}
                          onChange={(e) => handleMappingChange(field, e.target.value)}
                          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:border-primary"
                        >
                          <option value="">-- Não importar --</option>
                          {availableColumns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>

                      {/* Combined columns */}
                      {combinedFields[field] && combinedFields[field].length > 0 && (
                        <div className="space-y-2 mb-2">
                          {combinedFields[field].map((col, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded">
                              <span className="text-sm text-gray-600">+ {col}</span>
                              <button
                                type="button"
                                onClick={() => removeCombinedColumn(field, idx)}
                                className="ml-auto text-red-500 hover:text-red-700"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add combined column */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addCombinedColumn(field, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-4 py-2 border rounded text-sm text-gray-500 focus:outline-none focus:border-primary"
                      >
                        <option value="">+ Adicionar coluna combinada</option>
                        {availableColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border rounded font-bold hover:bg-light transition"
              >
                Voltar
              </button>
              <button
                onClick={validateReferences}
                disabled={loading}
                className="flex-1 bg-primary text-dark font-bold py-2 rounded hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Validando Referências...
                  </>
                ) : (
                  <>
                    <Eye size={20} />
                    Validar Referências
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3.5: Validação de Referências */}
        {step === 3.5 && duplicateStats && (
          <div className="bg-white p-8 rounded-lg shadow-lg space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={32} className="text-blue-600" />
              <h2 className="text-2xl font-bold">Validação de Referências</h2>
            </div>

            <p className="text-gray-600">Análise das referências do CSV em comparação com a base de dados:</p>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
                <p className="text-sm text-gray-600 font-bold">Total de Referências</p>
                <p className="text-4xl font-bold text-blue-600">{duplicateStats.total}</p>
              </div>
              <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded">
                <p className="text-sm text-gray-600 font-bold">Já Existem</p>
                <p className="text-4xl font-bold text-orange-600">{duplicateStats.existing}</p>
                <p className="text-xs text-orange-600 mt-2">{duplicateStats.duplicatePercentage}%</p>
              </div>
              <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded">
                <p className="text-sm text-gray-600 font-bold">Novas Referências</p>
                <p className="text-4xl font-bold text-green-600">{duplicateStats.new}</p>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-2">
              <p className="font-bold">Distribuição</p>
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden flex">
                <div
                  className="bg-orange-500 h-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ width: `${duplicateStats.duplicatePercentage}%` }}
                >
                  {duplicateStats.duplicatePercentage > 10 && `${duplicateStats.duplicatePercentage}%`}
                </div>
                <div
                  className="bg-green-500 h-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ width: `${100 - duplicateStats.duplicatePercentage}%` }}
                >
                  {100 - duplicateStats.duplicatePercentage > 10 && `${100 - duplicateStats.duplicatePercentage}%`}
                </div>
              </div>
            </div>

            {/* Mensagem de Ação */}
            {duplicateStats.existing > 0 ? (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                <p className="text-orange-700 font-bold">⚠️ {duplicateStats.existing} referência(s) já existem</p>
                <p className="text-orange-600 text-sm mt-1">
                  Escolha a ação abaixo para continuar com a importação
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-green-700 font-bold">✓ Todas as referências são novas!</p>
                <p className="text-green-600 text-sm mt-1">
                  Pode prosseguir com a importação sem preocupações
                </p>
              </div>
            )}

            {/* Opção de ação para duplicatas */}
            {duplicateStats.existing > 0 && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="font-bold mb-3">O que fazer com produtos já existentes?</p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="skip"
                      checked={duplicateAction === 'skip'}
                      onChange={(e) => setDuplicateAction(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>
                      <strong>Saltar</strong> - Não importar produtos que já existem
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="update"
                      checked={duplicateAction === 'update'}
                      onChange={(e) => setDuplicateAction(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>
                      <strong>Atualizar</strong> - Sobrescrever produtos existentes
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border rounded font-bold hover:bg-light transition"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  handlePreview();
                  setStep(3);
                }}
                className="flex-1 bg-primary text-dark font-bold py-2 rounded hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <Eye size={20} />
                Ver Preview
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <div className="bg-white p-8 rounded-lg shadow-lg space-y-6">
            <h2 className="text-2xl font-bold">Preview dos Dados</h2>

            {/* Opção de ação para duplicatas */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="font-bold mb-3">O que fazer com produtos já existentes?</p>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="skip"
                    checked={duplicateAction === 'skip'}
                    onChange={(e) => setDuplicateAction(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>
                    <strong>Saltar</strong> - Não importar produtos que já existem
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="update"
                    checked={duplicateAction === 'update'}
                    onChange={(e) => setDuplicateAction(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span>
                    <strong>Atualizar</strong> - Sobrescrever produtos existentes
                  </span>
                </label>
              </div>
            </div>

            <p className="text-gray-600">Verifique se os dados estão corretos antes de importar</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-light">
                    {Object.keys(columnMapping).map(field => (
                      <th key={field} className="px-4 py-2 text-left font-bold capitalize">
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-light">
                      {Object.keys(columnMapping).map(field => (
                        <td key={field} className="px-4 py-2">
                          {row[field] ? String(row[field]).substring(0, 50) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 border rounded font-bold hover:bg-light transition"
              >
                Voltar
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="flex-1 bg-primary text-dark font-bold py-2 rounded hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Importar Produtos
                  </>
                )}
              </button>
            </div>
          </div>
        )}


        {/* Step 4: Monitor Progress */}
        {step === 5 && (
          <div className="bg-white p-8 rounded-lg shadow-lg space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={32} className="text-blue-600 animate-spin" />
              <h2 className="text-2xl font-bold">4. Acompanhamento de Progresso</h2>
            </div>

            {!imageQueueStatus ? (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded text-center">
                <Loader size={40} className="animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-blue-700 font-bold text-lg">Carregando status de importação...</p>
                <p className="text-blue-600 text-sm mt-2">Pode sair da página, a importação continua em background</p>
              </div>
            ) : (
              <>
                {/* Status Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-sm text-gray-600 font-bold">Pendentes</p>
                    <p className="text-3xl font-bold text-blue-600">{imageQueueStatus.pending}</p>
                  </div>
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <p className="text-sm text-gray-600 font-bold">Concluídas</p>
                    <p className="text-3xl font-bold text-green-600">{imageQueueStatus.completed}</p>
                  </div>
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-sm text-gray-600 font-bold">Falhadas</p>
                    <p className="text-3xl font-bold text-red-600">{imageQueueStatus.failed}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <p className="font-bold">Progresso Geral</p>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-500"
                      style={{
                        width: `${imageQueueStatus.total > 0 ? (imageQueueStatus.completed / imageQueueStatus.total) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {imageQueueStatus.completed} de {imageQueueStatus.total} imagens ({imageQueueStatus.total > 0 ? Math.round((imageQueueStatus.completed / imageQueueStatus.total) * 100) : 0}%)
                  </p>
                </div>

                {/* Status Message */}
                {imageQueueStatus.pending === 0 ? (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <p className="text-green-700 font-bold">✓ Todas as imagens foram descarregadas com sucesso!</p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-blue-700 font-bold">⏳ Descarregando imagens... (atualiza a cada 3 segundos)</p>
                    <p className="text-blue-600 text-sm mt-2">Pode sair da página, a importação continua em background</p>
                  </div>
                )}
              </>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setMonitoringActive(false);
                  setStep(1);
                  setProductsFile(null);
                  setPricesFile(null);
                  setCsvData(null);
                  setPricesData(null);
                  setColumnMapping({});
                  setCombinedFields({});
                  setFilesLoaded({ products: false, prices: false });
                  setResult(null);
                }}
                className="bg-gray-500 text-white font-bold py-3 rounded hover:opacity-90 transition"
              >
                Nova Importação
              </button>
              <button
                onClick={() => window.location.href = '/admin/products'}
                className="bg-primary text-dark font-bold py-3 rounded hover:opacity-90 transition"
              >
                Ver Produtos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
