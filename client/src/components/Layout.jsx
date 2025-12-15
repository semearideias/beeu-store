import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, LogOut, User, Phone, Mail, MapPin, Search, AlertCircle, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import axios from 'axios';

export default function Layout({ children, isAuthenticated, setIsAuthenticated }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [menus, setMenus] = useState([]);
  const [pages, setPages] = useState([]);
  const navigate = useNavigate();

  // Função para renderizar ícone Lucide
  const renderIcon = (iconName) => {
    if (!iconName) return null;
    const IconComponent = LucideIcons[iconName];
    if (!IconComponent) return null;
    return <IconComponent size={18} />;
  };

  // Toggle dropdown
  const toggleDropdown = (menuId) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Carregar menus e páginas do backoffice
  useEffect(() => {
    const fetchMenusAndPages = async () => {
      try {
        // Adicionar timestamp para evitar cache
        const timestamp = new Date().getTime();
        const [menusRes, pagesRes] = await Promise.all([
          axios.get(`/api/admin/menus?t=${timestamp}`).catch(() => ({ data: [] })),
          axios.get(`/api/admin/pages?t=${timestamp}`).catch(() => ({ data: [] }))
        ]);
        
        // Carregar todos os menus (ativos e inativos, principais e subitens)
        const allMenus = (menusRes.data || []).filter(m => m.is_active);
        setMenus(allMenus);
        
        // Filtrar apenas páginas publicadas
        const publishedPages = (pagesRes.data || []).filter(p => p.is_published);
        setPages(publishedPages);
      } catch (error) {
        console.error('Erro ao carregar menus e páginas:', error);
      }
    };

    fetchMenusAndPages();
    
    // Recarregar menus a cada 30 segundos para sincronizar com alterações no admin
    const interval = setInterval(fetchMenusAndPages, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  // Obter menus principais (sem pai)
  const mainMenus = menus.filter(m => !m.parent_id);

  // Obter submenus para um menu específico
  const getSubmenus = (menuId) => menus.filter(m => m.parent_id === menuId);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-light">
      {/* Top Bar - Premium */}
      <div className="text-white text-xs py-2 hidden md:block border-b border-primary/30 font-bold" style={{ backgroundColor: '#191919' }}>
        <div className="container flex justify-between items-center">
          <div className="flex gap-8">
            <div className="flex items-center gap-2 hover:text-primary transition cursor-pointer">
              <Phone size={14} />
              <span>+351 XXX XXX XXX</span>
            </div>
            <div className="flex items-center gap-2 hover:text-primary transition cursor-pointer">
              <Mail size={14} />
              <span>info@beeu.pt</span>
            </div>
            <div className="flex items-center gap-2 hover:text-primary transition cursor-pointer">
              <MapPin size={14} />
              <span>Entrega em Portugal</span>
            </div>
          </div>
          <div className="text-white/60 text-xs">
            Envios rápidos | Qualidade garantida | Suporte 24/7
          </div>
        </div>
      </div>

      {/* Header Main - Premium Design */}
      <header className="z-50 border-b border-gray-200 font-bold" style={{ backgroundColor: '#f4f4f4' }}>
        <div className="container">
          <div className="flex items-center justify-between h-24 gap-6 py-2 text-dark">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0 hover:opacity-80 transition">
              <img 
                src="https://bunny-wp-pullzone-7ziofmz7ra.b-cdn.net/wp-content/uploads/2025/06/logo.png" 
                alt="BEEU Logo"
                className="h-14 w-auto"
              />
            </Link>

            {/* Search Bar - Premium */}
            <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden sm:block">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Pesquisar produtos, categorias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border-2 border-gray-300 focus:outline-none focus:border-dark focus:ring-2 focus:ring-dark/20 text-dark placeholder-gray-600 transition"
                />
                <button
                  type="submit"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-dark transition"
                >
                  <Search size={20} />
                </button>
              </div>
            </form>

            {/* Actions - Premium */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Cart */}
              <Link 
                to="/cart" 
                className="flex flex-col items-center justify-center text-dark hover:text-dark transition p-2 rounded-lg hover:bg-gray-300/50 group"
              >
                <ShoppingCart size={20} />
                <span className="text-xs hidden sm:inline mt-0.5 font-bold">Carrinho</span>
              </Link>
              
              {/* Quote Cart */}
              <Link 
                to="/quote-cart" 
                className="flex flex-col items-center justify-center text-dark p-2 rounded-lg hover:bg-gray-300/50 transition group"
              >
                <AlertCircle size={20} />
                <span className="text-xs hidden sm:inline mt-0.5 font-bold">Orçamentos</span>
              </Link>
              
              {/* Auth Actions */}
              {isAuthenticated ? (
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <Link 
                    to="/profile" 
                    className="flex flex-col items-center justify-center text-dark hover:text-dark transition p-2 rounded-lg hover:bg-gray-300/50 hidden sm:flex group"
                  >
                    <User size={20} />
                    <span className="text-xs mt-0.5 font-bold">Perfil</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center text-dark hover:text-dark transition p-2 rounded-lg hover:bg-gray-300/50 hidden sm:flex group"
                  >
                    <LogOut size={20} />
                    <span className="text-xs mt-0.5 font-bold">Sair</span>
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="flex flex-col items-center justify-center text-dark hover:text-dark transition p-2 rounded-lg hover:bg-gray-300/50 hidden sm:flex group"
                >
                  <User size={20} />
                  <span className="text-xs mt-0.5 font-bold">Login</span>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden text-dark p-2 hover:bg-gray-300/50 rounded-lg transition"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Search - Below Header */}
          <form onSubmit={handleSearch} className="sm:hidden pb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-2xl border-2 border-gray-300 focus:outline-none focus:border-dark text-dark placeholder-gray-600"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-dark transition"
              >
                <Search size={18} />
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* Navigation Menu - Premium */}
      <nav className="hidden lg:block text-dark border-b border-gray-200 sticky top-0 z-40 w-full" style={{ backgroundColor: '#fca800' }}>
        <div className="flex items-center h-12 px-4">
          {mainMenus.map(menu => {
            const submenus = getSubmenus(menu.id);
            const hasSubmenus = submenus.length > 0;

            if (hasSubmenus) {
              // Menu com dropdown
              return (
                <div key={menu.id} className="relative group h-full flex items-center">
                  <button className="hover:text-dark/70 px-4 h-full flex items-center gap-2 transition font-bold text-base whitespace-nowrap hover:bg-black/10">
                    {renderIcon(menu.icon)}
                    {menu.label}
                    <ChevronDown size={16} className="group-hover:rotate-180 transition" />
                  </button>
                  {/* Dropdown - Full Width Megamenu */}
                  <div className="absolute left-0 top-full w-screen bg-white text-dark shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-8 z-50" style={{ borderTop: '3px solid #e5a300' }}>
                    <div className="container grid grid-cols-5 gap-6">
                      {submenus.map(submenu => {
                        if (submenu.type === 'link') {
                          return (
                            <Link
                              key={submenu.id}
                              to={submenu.url || '/'}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 rounded-lg transition text-sm font-medium hover:text-primary group/item"
                            >
                              <div className="text-primary/60 group-hover/item:text-primary transition">
                                {renderIcon(submenu.icon)}
                              </div>
                              <span>{submenu.label}</span>
                            </Link>
                          );
                        } else if (submenu.type === 'category') {
                          return (
                            <Link
                              key={submenu.id}
                              to={`/products?category=${submenu.category_slug || submenu.category_name}`}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 rounded-lg transition text-sm font-medium hover:text-primary group/item"
                            >
                              <div className="text-primary/60 group-hover/item:text-primary transition">
                                {renderIcon(submenu.icon)}
                              </div>
                              <span>{submenu.label}</span>
                            </Link>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              );
            } else {
              // Menu simples (sem dropdown)
              if (menu.type === 'link') {
                return (
                  <Link
                    key={menu.id}
                    to={menu.url || '/'}
                    className="hover:text-dark/70 px-4 h-full flex items-center gap-2 transition font-bold text-base whitespace-nowrap hover:bg-black/10"
                  >
                    {renderIcon(menu.icon)}
                    {menu.label}
                  </Link>
                );
              } else if (menu.type === 'category') {
                return (
                  <Link
                    key={menu.id}
                    to={`/products?category=${menu.category_slug || menu.category_name}`}
                    className="hover:text-dark/70 px-4 h-full flex items-center gap-2 transition font-bold text-base whitespace-nowrap hover:bg-black/10"
                  >
                    {renderIcon(menu.icon)}
                    {menu.label}
                  </Link>
                );
              }
            }
            return null;
          })}
        </div>
      </nav>

        {/* Mobile Menu - Premium */}
        {mobileMenuOpen && (
          <nav className="lg:hidden text-dark border-t py-4" style={{ backgroundColor: '#fca800' }}>
            <div className="container flex flex-col gap-2">
              {mainMenus.map(menu => {
                const submenus = getSubmenus(menu.id);
                const hasSubmenus = submenus.length > 0;

                if (hasSubmenus) {
                  return (
                    <div key={menu.id} className="border-b border-dark/20">
                      <button
                        onClick={() => toggleDropdown(menu.id)}
                        className="hover:text-dark/70 transition font-bold text-left flex items-center justify-between text-base w-full py-3 px-3 rounded-lg hover:bg-black/10"
                      >
                        <span className="flex items-center gap-2">
                          {renderIcon(menu.icon)}
                          {menu.label}
                        </span>
                        <span className={`text-xs transition ${openDropdowns[menu.id] ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      {openDropdowns[menu.id] && (
                        <div className="pl-4 flex flex-col gap-1 mt-1 pb-2">
                          {submenus.map(submenu => {
                            if (submenu.type === 'link') {
                              return (
                                <Link
                                  key={submenu.id}
                                  to={submenu.url || '/'}
                                  className="hover:text-dark/70 transition text-sm flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-black/10"
                                >
                                  {renderIcon(submenu.icon)}
                                  {submenu.label}
                                </Link>
                              );
                            } else if (submenu.type === 'category') {
                              return (
                                <Link
                                  key={submenu.id}
                                  to={`/products?category=${submenu.category_slug || submenu.category_name}`}
                                  className="hover:text-dark/70 transition text-sm flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-black/10"
                                >
                                  {renderIcon(submenu.icon)}
                                  {submenu.label}
                                </Link>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  if (menu.type === 'link') {
                    return (
                      <Link
                        key={menu.id}
                        to={menu.url || '/'}
                        className="hover:text-dark/70 transition font-bold text-base flex items-center gap-2 py-3 px-3 rounded-lg hover:bg-black/10 border-b border-dark/20"
                      >
                        {renderIcon(menu.icon)}
                        {menu.label}
                      </Link>
                    );
                  } else if (menu.type === 'category') {
                    return (
                      <Link
                        key={menu.id}
                        to={`/products?category=${menu.category_slug || menu.category_name}`}
                        className="hover:text-dark/70 transition font-bold text-base flex items-center gap-2 py-3 px-3 rounded-lg hover:bg-black/10 border-b border-dark/20"
                      >
                        {renderIcon(menu.icon)}
                        {menu.label}
                      </Link>
                    );
                  }
                }
                return null;
              })}
              
              <div className="border-t border-dark/20 pt-3 mt-3 flex flex-col gap-2">
                <Link to="/cart" className="flex items-center gap-2 hover:text-dark/70 transition font-semibold text-sm py-2 px-3 rounded-lg hover:bg-black/10">
                  <ShoppingCart size={18} />
                  <span>Carrinho</span>
                </Link>
                
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" className="flex items-center gap-2 hover:text-dark/70 transition font-semibold text-sm py-2 px-3 rounded-lg hover:bg-black/10">
                      <User size={18} />
                      <span>Perfil</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 hover:text-dark/70 transition font-semibold text-left text-sm py-2 px-3 rounded-lg hover:bg-black/10"
                    >
                      <LogOut size={18} />
                      <span>Sair</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="hover:text-dark/70 transition font-semibold text-sm py-2 px-3 rounded-lg hover:bg-black/10">Login</Link>
                    <Link to="/register" className="bg-dark text-white px-4 py-2 rounded-lg font-semibold hover:bg-dark/90 transition inline-block text-sm">
                      Registar
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white mt-20">
        <div className="bg-primary text-dark py-8 border-b-4 border-primary">
          <div className="container">
            <h3 className="text-2xl font-bold mb-2">Precisa de ajuda?</h3>
            <p className="text-dark/80">Entre em contacto connosco para orçamentos e dúvidas</p>
          </div>
        </div>
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-primary">BEEU</h3>
              <p className="text-gray-400 text-sm">Brindes Publicitários Premium com qualidade garantida e preços competitivos.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-primary">Produtos</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/products" className="hover:text-primary transition">Catálogo Completo</Link></li>
                <li><Link to="/products?category=canetas" className="hover:text-primary transition">Canetas</Link></li>
                <li><Link to="/products?category=mochilas" className="hover:text-primary transition">Mochilas</Link></li>
                <li><Link to="/products?category=camisetas" className="hover:text-primary transition">Camisetas</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-primary">Empresa</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/quote" className="hover:text-primary transition">Pedir Orçamento</Link></li>
                <li><Link to="/login" className="hover:text-primary transition">Login</Link></li>
                <li><Link to="/register" className="hover:text-primary transition">Registar</Link></li>
                {pages.map(page => (
                  <li key={page.id}>
                    <Link to={`/page/${page.slug}`} className="hover:text-primary transition">
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-primary">Contacto</h4>
              <div className="space-y-2 text-gray-400 text-sm">
                <p className="flex items-center gap-2"><Mail size={16} /> info@beeu.pt</p>
                <p className="flex items-center gap-2"><Phone size={16} /> +351 XXX XXX XXX</p>
                <p className="flex items-center gap-2"><MapPin size={16} /> Portugal</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 BEEU - Brindes Publicitários. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
