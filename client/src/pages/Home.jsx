import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Palette, TrendingUp, Truck, Shield, Award } from 'lucide-react';
import api from '../api';
import HomePageBuilder from './HomePageBuilder';

export default function Home() {
  const [usePageBuilder, setUsePageBuilder] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se existem seções no page builder
    checkPageBuilder();
  }, []);

  const checkPageBuilder = async () => {
    try {
      const response = await api.get('/admin/page-builder/sections/homepage');
      if (response.data && response.data.length > 0) {
        setUsePageBuilder(true);
      }
    } catch (error) {
      console.error('Erro ao verificar page builder:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  // Se existem seções no page builder, usar esse
  if (usePageBuilder) {
    return <HomePageBuilder />;
  }

  // Caso contrário, usar o layout padrão
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary to-primary/90 text-dark py-24">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Brindes Publicitários <span className="text-dark">Premium</span>
              </h1>
              <p className="text-xl text-dark/80 mb-8">
                Qualidade profissional com preços competitivos. Compre stock pronto ou personalize com seu logo.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link to="/products" className="bg-dark text-primary px-6 py-3 rounded font-bold hover:opacity-90 transition flex items-center gap-2">
                  Ver Catálogo <ArrowRight size={20} />
                </Link>
                <Link to="/quote" className="border-2 border-dark text-dark px-6 py-3 rounded font-bold hover:bg-dark/10 transition">
                  Pedir Orçamento
                </Link>
              </div>
            </div>
            <div className="bg-dark rounded-lg p-8 flex items-center justify-center h-96 shadow-lg">
              <div className="text-center">
                <Palette size={80} className="text-primary mx-auto mb-4" />
                <p className="text-primary font-bold text-xl">Catálogo Completo</p>
                <p className="text-white text-sm mt-2">12+ categorias de produtos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-16">Por que escolher BEEU?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-light p-8 rounded-lg border-l-4 border-primary hover:shadow-lg transition">
              <Truck size={40} className="text-primary mb-4" />
              <h3 className="text-xl font-bold mb-4">Entrega Rápida</h3>
              <p className="text-gray-600">Processamento rápido de pedidos com entrega em tempo recorde em todo Portugal.</p>
            </div>
            <div className="bg-light p-8 rounded-lg border-l-4 border-primary hover:shadow-lg transition">
              <Palette size={40} className="text-primary mb-4" />
              <h3 className="text-xl font-bold mb-4">Personalização Completa</h3>
              <p className="text-gray-600">Cores variadas e opções de personalização para cada produto com qualidade garantida.</p>
            </div>
            <div className="bg-light p-8 rounded-lg border-l-4 border-primary hover:shadow-lg transition">
              <Award size={40} className="text-primary mb-4" />
              <h3 className="text-xl font-bold mb-4">Preços Competitivos</h3>
              <p className="text-gray-600">Descontos progressivos por quantidade e melhor relação qualidade-preço do mercado.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-light">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-16">Como Funciona?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-lg shadow-lg border-t-4 border-primary hover:shadow-xl transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary text-dark font-bold rounded-full flex items-center justify-center text-xl">1</div>
                <h3 className="text-2xl font-bold">Compra Direta</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Navegue pelo catálogo, escolha cores e quantidades. Compre stock pronto para usar imediatamente.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Stock disponível</li>
                <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Preço imediato</li>
                <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Entrega rápida</li>
                <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Sem personalização</li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg border-t-4 border-primary hover:shadow-xl transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary text-dark font-bold rounded-full flex items-center justify-center text-xl">2</div>
                <h3 className="text-2xl font-bold">Pedir Orçamento</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Personalize seus brindes com cores, logos e designs únicos. Receba orçamento customizado.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Personalização completa</li>
                <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Qualquer quantidade</li>
                <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Orçamento detalhado</li>
                <li className="flex items-center gap-2"><span className="text-primary font-bold">✓</span> Suporte dedicado</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary via-primary to-yellow-400 py-20">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-dark mb-6">Pronto para começar?</h2>
          <p className="text-dark text-xl mb-8 max-w-2xl mx-auto">Explore nosso catálogo com 12+ categorias e encontre o brinde perfeito para sua empresa.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/products" className="bg-dark text-primary px-8 py-4 rounded font-bold hover:opacity-90 transition inline-flex items-center gap-2 text-lg">
              Explorar Produtos <ArrowRight size={20} />
            </Link>
            <Link to="/quote" className="bg-white text-dark px-8 py-4 rounded font-bold hover:opacity-90 transition inline-flex items-center gap-2 text-lg">
              Pedir Orçamento
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
