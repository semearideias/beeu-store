import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function Page() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/admin/pages/slug/${slug}`);
        setPage(response.data);

        // Atualizar meta tags
        document.title = response.data.meta_title || response.data.title;
        
        // Remover meta tags antigos
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) metaDescription.remove();
        
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) metaKeywords.remove();

        // Adicionar novas meta tags
        if (response.data.meta_description) {
          const desc = document.createElement('meta');
          desc.name = 'description';
          desc.content = response.data.meta_description;
          document.head.appendChild(desc);
        }

        if (response.data.meta_keywords) {
          const keywords = document.createElement('meta');
          keywords.name = 'keywords';
          keywords.content = response.data.meta_keywords;
          document.head.appendChild(keywords);
        }

        // Open Graph
        if (response.data.seo) {
          const ogTitle = document.querySelector('meta[property="og:title"]');
          if (ogTitle) ogTitle.remove();
          if (response.data.seo.og_title) {
            const og = document.createElement('meta');
            og.setAttribute('property', 'og:title');
            og.content = response.data.seo.og_title;
            document.head.appendChild(og);
          }

          const ogDesc = document.querySelector('meta[property="og:description"]');
          if (ogDesc) ogDesc.remove();
          if (response.data.seo.og_description) {
            const og = document.createElement('meta');
            og.setAttribute('property', 'og:description');
            og.content = response.data.seo.og_description;
            document.head.appendChild(og);
          }

          const ogImage = document.querySelector('meta[property="og:image"]');
          if (ogImage) ogImage.remove();
          if (response.data.seo.og_image) {
            const og = document.createElement('meta');
            og.setAttribute('property', 'og:image');
            og.content = response.data.seo.og_image;
            document.head.appendChild(og);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar página:', err);
        setError('Página não encontrada');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <p className="text-gray-600">Carregando página...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Página não encontrada</h1>
          <p className="text-gray-600">A página que procura não existe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{page.title}</h1>
          <p className="text-gray-600">
            Última atualização: {new Date(page.updated_at).toLocaleDateString('pt-PT')}
          </p>
        </header>

        <div className="prose prose-lg max-w-none">
          <div 
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </article>
    </div>
  );
}
