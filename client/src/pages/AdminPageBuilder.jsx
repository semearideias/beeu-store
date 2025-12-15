import React, { useState, useEffect } from 'react';
import { Plus, Settings, Eye, EyeOff, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../api';
import PageBuilderEditor from '../components/PageBuilderEditor';
import PageBuilderPreview from '../components/PageBuilderPreview';

export default function AdminPageBuilder() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  // Debug: Log quando editingSection muda
  React.useEffect(() => {
    console.log('editingSection mudou para:', editingSection);
  }, [editingSection]);

  const pageType = 'homepage';

  // Carregar seções
  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/page-builder/sections/${pageType}`);
      setSections(response.data);
    } catch (error) {
      console.error('Erro ao carregar seções:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSection = async (sectionType) => {
    try {
      const response = await api.post('/admin/page-builder/sections', {
        pageType,
        sectionType,
        settings: getDefaultSettings(sectionType)
      });
      setSections([...sections, response.data]);
    } catch (error) {
      console.error('Erro ao adicionar seção:', error);
    }
  };

  const updateSection = async (id, updates) => {
    try {
      // Encontrar a seção atual para manter os dados existentes
      const currentSection = sections.find(s => s.id === id);
      
      if (!currentSection) {
        console.error('Seção não encontrada:', id);
        return;
      }
      
      // Se updates contém settings, usar isso; caso contrário, é o objeto completo
      let newSettings = currentSection.settings;
      let newIsActive = currentSection.is_active;
      let newPosition = currentSection.position;
      
      if (updates.settings !== undefined) {
        // Vem do PageBuilderEditor
        newSettings = updates.settings;
      } else if (updates.is_active !== undefined) {
        // Vem do botão de visibilidade
        newIsActive = updates.is_active;
      } else if (updates.position !== undefined) {
        // Vem do reordenamento
        newPosition = updates.position;
      }
      
      const dataToSend = {
        sectionType: currentSection.section_type,
        settings: newSettings,
        is_active: newIsActive,
        position: newPosition
      };
      
      console.log('Atualizando seção:', { id, currentSection, dataToSend });
      await api.put(`/admin/page-builder/sections/${id}`, dataToSend);
      
      // Atualizar estado com os dados salvos
      setSections(sections.map(s => s.id === id ? { 
        ...s, 
        settings: newSettings,
        is_active: newIsActive,
        position: newPosition
      } : s));
      setEditingSection(null);
    } catch (error) {
      console.error('Erro ao atualizar seção:', error);
    }
  };

  const deleteSection = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta seção?')) {
      try {
        await api.delete(`/admin/page-builder/sections/${id}`);
        setSections(sections.filter(s => s.id !== id));
      } catch (error) {
        console.error('Erro ao deletar seção:', error);
      }
    }
  };

  const moveSectionUp = async (id) => {
    try {
      const index = sections.findIndex(s => s.id === id);
      if (index > 0) {
        const newSections = [...sections];
        [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
        
        // Atualizar posições no backend
        for (let i = 0; i < newSections.length; i++) {
          await api.put(`/admin/page-builder/sections/${newSections[i].id}`, {
            sectionType: newSections[i].section_type,
            settings: newSections[i].settings,
            position: i + 1
          });
        }
        setSections(newSections);
      }
    } catch (error) {
      console.error('Erro ao mover seção para cima:', error);
    }
  };

  const moveSectionDown = async (id) => {
    try {
      const index = sections.findIndex(s => s.id === id);
      if (index < sections.length - 1) {
        const newSections = [...sections];
        [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
        
        // Atualizar posições no backend
        for (let i = 0; i < newSections.length; i++) {
          await api.put(`/admin/page-builder/sections/${newSections[i].id}`, {
            sectionType: newSections[i].section_type,
            settings: newSections[i].settings,
            position: i + 1
          });
        }
        setSections(newSections);
      }
    } catch (error) {
      console.error('Erro ao mover seção para baixo:', error);
    }
  };

  const moveBlockUp = async (sectionId, blockId) => {
    try {
      const section = sections.find(s => s.id === sectionId);
      if (!section || !section.blocks) return;
      
      const blockIndex = section.blocks.findIndex(b => b.id === blockId);
      
      if (blockIndex > 0) {
        const newBlocks = [...section.blocks];
        [newBlocks[blockIndex], newBlocks[blockIndex - 1]] = [newBlocks[blockIndex - 1], newBlocks[blockIndex]];
        
        // Atualizar posições no backend
        for (let i = 0; i < newBlocks.length; i++) {
          await api.put(`/admin/page-builder/blocks/${newBlocks[i].id}`, {
            blockType: newBlocks[i].block_type,
            settings: newBlocks[i].settings,
            position: i + 1
          });
        }
        
        setSections(sections.map(s => s.id === sectionId ? { ...s, blocks: newBlocks } : s));
      }
    } catch (error) {
      console.error('Erro ao mover bloco para cima:', error);
    }
  };

  const moveBlockDown = async (sectionId, blockId) => {
    try {
      const section = sections.find(s => s.id === sectionId);
      if (!section || !section.blocks) return;
      
      const blockIndex = section.blocks.findIndex(b => b.id === blockId);
      
      if (blockIndex < section.blocks.length - 1) {
        const newBlocks = [...section.blocks];
        [newBlocks[blockIndex], newBlocks[blockIndex + 1]] = [newBlocks[blockIndex + 1], newBlocks[blockIndex]];
        
        // Atualizar posições no backend
        for (let i = 0; i < newBlocks.length; i++) {
          await api.put(`/admin/page-builder/blocks/${newBlocks[i].id}`, {
            blockType: newBlocks[i].block_type,
            settings: newBlocks[i].settings,
            position: i + 1
          });
        }
        
        setSections(sections.map(s => s.id === sectionId ? { ...s, blocks: newBlocks } : s));
      }
    } catch (error) {
      console.error('Erro ao mover bloco para baixo:', error);
    }
  };

  const addBlock = async (sectionId, blockType) => {
    try {
      const response = await api.post('/admin/page-builder/blocks', {
        sectionId,
        blockType,
        settings: getDefaultBlockSettings(blockType)
      });
      
      setSections(sections.map(s => 
        s.id === sectionId 
          ? { ...s, blocks: [...(s.blocks || []), response.data] }
          : s
      ));
    } catch (error) {
      console.error('Erro ao adicionar bloco:', error);
    }
  };

  const updateBlock = async (blockId, updates) => {
    try {
      // Encontrar o bloco atual para manter os dados existentes
      let currentBlock = null;
      for (const section of sections) {
        const block = section.blocks?.find(b => b.id === blockId);
        if (block) {
          currentBlock = block;
          break;
        }
      }
      
      if (!currentBlock) {
        console.error('Bloco não encontrado:', blockId);
        return;
      }
      
      // Se updates contém settings, usar isso; caso contrário, é o objeto completo
      let newSettings = currentBlock.settings;
      let newIsActive = currentBlock.is_active;
      let newPosition = currentBlock.position;
      
      if (updates.settings !== undefined) {
        // Vem do PageBuilderEditor
        newSettings = updates.settings;
      } else if (updates.is_active !== undefined) {
        // Vem do botão de visibilidade
        newIsActive = updates.is_active;
      } else if (updates.position !== undefined) {
        // Vem do reordenamento
        newPosition = updates.position;
      }
      
      const dataToSend = {
        blockType: currentBlock.block_type,
        settings: newSettings,
        is_active: newIsActive,
        position: newPosition
      };
      
      console.log('Atualizando bloco:', { blockId, currentBlock, dataToSend });
      await api.put(`/admin/page-builder/blocks/${blockId}`, dataToSend);
      
      // Atualizar estado com os dados salvos
      setSections(sections.map(s => ({
        ...s,
        blocks: s.blocks?.map(b => b.id === blockId ? { 
          ...b, 
          settings: newSettings,
          is_active: newIsActive,
          position: newPosition
        } : b)
      })));
      setEditingBlock(null);
    } catch (error) {
      console.error('Erro ao atualizar bloco:', error);
    }
  };

  const deleteBlock = async (blockId) => {
    if (window.confirm('Tem certeza que deseja deletar este bloco?')) {
      try {
        await api.delete(`/admin/page-builder/blocks/${blockId}`);
        setSections(sections.map(s => ({
          ...s,
          blocks: s.blocks.filter(b => b.id !== blockId)
        })));
      } catch (error) {
        console.error('Erro ao deletar bloco:', error);
      }
    }
  };

  const getDefaultSettings = (sectionType) => {
    const defaults = {
      hero: {
        backgroundColor: '#ffffff',
        padding: '60px 20px',
        minHeight: '400px'
      },
      carousel: {
        backgroundColor: '#f5f5f5',
        padding: '40px 20px',
        autoplay: true,
        interval: 5000
      },
      products: {
        backgroundColor: '#ffffff',
        padding: '40px 20px',
        columns: 4
      },
      features: {
        backgroundColor: '#f9f9f9',
        padding: '60px 20px'
      },
      testimonials: {
        backgroundColor: '#ffffff',
        padding: '40px 20px'
      },
      cta: {
        backgroundColor: '#007bff',
        padding: '40px 20px',
        textColor: '#ffffff'
      },
      custom: {
        backgroundColor: '#ffffff',
        padding: '40px 20px'
      }
    };
    return defaults[sectionType] || {};
  };

  const getDefaultBlockSettings = (blockType) => {
    const defaults = {
      slide: {
        title: 'Novo Slide',
        subtitle: '',
        image: '',
        buttonText: 'Saiba Mais',
        buttonUrl: '#'
      },
      productCarousel: {
        title: 'Produtos em Destaque',
        categoryId: null,
        limit: 8,
        showPrice: true
      },
      productGrid: {
        title: 'Nossos Produtos',
        categoryId: null,
        limit: 12,
        columns: 4
      },
      productByBudget: {
        title: 'Procure por Budget',
        categoryId: null,
        limit: 12,
        showPrice: true,
        budgets: [
          { label: '0,25€', maxPrice: 0.25 },
          { label: '0,50€', maxPrice: 0.50 },
          { label: '1,00€', maxPrice: 1.00 },
          { label: '2,00€', maxPrice: 2.00 },
          { label: '5,00€', maxPrice: 5.00 }
        ]
      },
      text: {
        content: 'Adicione seu conteúdo aqui...'
      },
      image: {
        src: '',
        alt: 'Imagem'
      },
      button: {
        text: 'Clique aqui',
        url: '#',
        style: 'primary'
      }
    };
    return defaults[blockType] || {};
  };

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  console.log('Renderizando AdminPageBuilder:', { sections: sections.length, loading });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Construtor de Página</h1>
            <p className="text-gray-600 mt-2">Homepage - Personalize sua página inicial</p>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showPreview ? <EyeOff size={20} /> : <Eye size={20} />}
            {showPreview ? 'Editar' : 'Visualizar'}
          </button>
        </div>

        {showPreview ? (
          <PageBuilderPreview sections={sections} />
        ) : (
          <div className="space-y-6">
            {/* Adicionar Seção */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Adicionar Seção</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { type: 'hero', label: 'Hero' },
                  { type: 'carousel', label: 'Carrossel' },
                  { type: 'products', label: 'Produtos' },
                  { type: 'features', label: 'Funcionalidades' },
                  { type: 'testimonials', label: 'Depoimentos' },
                  { type: 'cta', label: 'Chamada à Ação' },
                  { type: 'custom', label: 'Personalizado' }
                ].map(section => (
                  <button
                    key={section.type}
                    onClick={() => addSection(section.type)}
                    className="p-3 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <Plus size={20} className="mx-auto mb-1" />
                    <span className="text-sm font-medium">{section.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Seções */}
            <div className="space-y-4">
              {sections.map((section, index) => (
                <div key={section.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Header da Seção */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical size={20} className="cursor-move" />
                      <div>
                        <h3 className="font-bold capitalize">
                          {section.section_type || 'Seção'} #{section.id}
                        </h3>
                        <p className="text-sm opacity-90">{section.blocks?.length || 0} blocos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveSectionUp(section.id)}
                        disabled={sections.findIndex(s => s.id === section.id) === 0}
                        className="p-2 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronUp size={20} />
                      </button>
                      <button
                        onClick={() => moveSectionDown(section.id)}
                        disabled={sections.findIndex(s => s.id === section.id) === sections.length - 1}
                        className="p-2 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronDown size={20} />
                      </button>
                      <button
                        onClick={() => {
                          console.log('Clicou em editar seção:', section);
                          setEditingSection(editingSection?.id === section.id ? null : section);
                        }}
                        className="p-2 hover:bg-blue-700 rounded"
                      >
                        <Settings size={20} />
                      </button>
                      <button
                        onClick={() => updateSection(section.id, { is_active: !section.is_active })}
                        className="p-2 hover:bg-blue-700 rounded"
                      >
                        {section.is_active ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="p-2 hover:bg-red-600 rounded"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Editor de Seção */}
                  {editingSection?.id === section.id && (
                    <PageBuilderEditor
                      item={section}
                      type="section"
                      onSave={(updates) => updateSection(section.id, updates)}
                      onCancel={() => setEditingSection(null)}
                    />
                  )}

                  {/* Blocos */}
                  <div className="p-4 space-y-3">
                    {section.blocks && section.blocks.map((block) => (
                      <div key={block.id} className="bg-gray-50 border border-gray-200 rounded p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <GripVertical size={18} className="text-gray-400 cursor-move" />
                          <div>
                            <p className="font-medium capitalize">{block.block_type}</p>
                            <p className="text-sm text-gray-500">{block.settings?.title || 'Sem título'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => moveBlockUp(section.id, block.id)}
                            disabled={section.blocks.findIndex(b => b.id === block.id) === 0}
                            className="p-2 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronUp size={18} />
                          </button>
                          <button
                            onClick={() => moveBlockDown(section.id, block.id)}
                            disabled={section.blocks.findIndex(b => b.id === block.id) === section.blocks.length - 1}
                            className="p-2 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronDown size={18} />
                          </button>
                          <button
                            onClick={() => {
                              console.log('Clicou em editar bloco:', block);
                              setEditingBlock(editingBlock?.id === block.id ? null : block);
                            }}
                            className="p-2 hover:bg-gray-200 rounded"
                          >
                            <Settings size={18} />
                          </button>
                          <button
                            onClick={() => updateBlock(block.id, { is_active: !block.is_active })}
                            className="p-2 hover:bg-gray-200 rounded"
                          >
                            {block.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="p-2 hover:bg-red-100 text-red-600 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Adicionar Bloco */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { type: 'slide', label: 'Slide' },
                          { type: 'productCarousel', label: 'Carrossel Produtos' },
                          { type: 'productGrid', label: 'Grade Produtos' },
                          { type: 'productByBudget', label: 'Produtos por Budget' },
                          { type: 'text', label: 'Texto' },
                          { type: 'image', label: 'Imagem' },
                          { type: 'button', label: 'Botão' }
                        ].map(blockType => (
                          <button
                            key={blockType.type}
                            onClick={() => addBlock(section.id, blockType.type)}
                            className="py-2 px-2 text-sm border border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 transition flex items-center justify-center gap-1"
                          >
                            <Plus size={14} />
                            <span>{blockType.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Editor de Bloco */}
                    {editingBlock && editingBlock.id && section.blocks?.some(b => b.id === editingBlock.id) && (
                      <PageBuilderEditor
                        item={editingBlock}
                        type="block"
                        onSave={(updates) => updateBlock(editingBlock.id, updates)}
                        onCancel={() => setEditingBlock(null)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
