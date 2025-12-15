import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, LogOut, BarChart3, Package, FolderOpen, 
  ShoppingCart, FileText, Settings, ChevronDown, Home, AlertCircle
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Decodificar token para verificar se é admin
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Fazer requisição ao backend para verificar status de admin
      const response = await fetch('/api/auth/admin-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin);
        if (!data.isAdmin) {
          navigate('/');
        }
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Erro ao verificar status de admin:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { label: 'Dashboard', icon: BarChart3, path: '/admin/dashboard' },
    { label: 'Produtos', icon: Package, path: '/admin/products' },
    { label: 'Categorias', icon: FolderOpen, path: '/admin/categories' },
    { label: 'Categorias (D&D)', icon: FolderOpen, path: '/admin/categories-dragdrop' },
    { label: 'Orçamentos', icon: FileText, path: '/admin/quotes' },
    { label: 'Pedidos', icon: ShoppingCart, path: '/admin/orders' },
    { label: 'Configurações', icon: Settings, path: '/admin/settings' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100 fixed inset-0">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-dark text-white transition-all duration-300 flex flex-col shadow-lg fixed h-screen left-0 top-0 z-40`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="https://bunny-wp-pullzone-7ziofmz7ra.b-cdn.net/wp-content/uploads/2025/06/logo.png" 
              alt="BEEU"
              className={`${sidebarOpen ? 'h-8' : 'h-6'} w-auto`}
            />
            {sidebarOpen && <span className="font-bold text-lg">Admin</span>}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-700 rounded transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 transition"
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Home size={20} className="text-gray-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Settings size={20} className="text-gray-600" />
            </button>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              A
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}
