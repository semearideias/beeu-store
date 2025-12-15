import React, { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Menu, X, LogOut, Home, Settings, FileText, ShoppingCart, Link as LinkIcon, Layers, ArrowRightLeft, Download, Activity, Palette, Truck, Package } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const admin = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: ShoppingCart, label: 'Produtos', path: '/admin/products' },
    { icon: ArrowRightLeft, label: 'Mover Produtos', path: '/admin/products-categories' },
    { icon: Download, label: 'Importar Makito', path: '/admin/import-makito' },
    { icon: Activity, label: 'Status Importação', path: '/admin/import-status' },
    { icon: Layers, label: 'Categorias', path: '/admin/categories' },
    { icon: LinkIcon, label: 'Menus', path: '/admin/menus' },
    { icon: FileText, label: 'Páginas', path: '/admin/pages' },
    { icon: Palette, label: 'Construtor Homepage', path: '/admin/page-builder' },
    { icon: FileText, label: 'Orçamentos', path: '/admin/quotes' },
    { icon: ShoppingCart, label: 'Pedidos', path: '/admin/orders' },
    { icon: Truck, label: 'Métodos de Envio', path: '/admin/shipping' },
    { icon: Settings, label: 'Configurações Loja', path: '/admin/store-settings' },
    { icon: Settings, label: 'Configurações', path: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">BEEU Admin</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition text-left"
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-800">
          {sidebarOpen && (
            <div className="mb-4">
              <p className="text-sm text-gray-400">Logado como</p>
              <p className="font-semibold truncate">{admin.name}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Painel de Administração</h2>
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString('pt-PT')}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
