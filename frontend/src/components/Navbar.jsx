import React from 'react';
import { Building2, LayoutDashboard, Layers, ArrowLeftRight, AlertTriangle, FileCheck2, RefreshCw } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onRefresh, loading }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'materiales', label: 'Materiales & Reorden', icon: Layers },
    { id: 'movimientos', label: 'Registrar Movimiento', icon: ArrowLeftRight },
    { id: 'ordenes', label: 'Órdenes de Compra', icon: FileCheck2 },
    { id: 'alertas', label: 'Alertas & Auditoría', icon: AlertTriangle, hasBadge: true },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre de la Empresa */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide text-white">
                Constructora Del Valle S.A.
              </h1>
              <p className="text-xs text-amber-400 font-medium">
                Control de Inventarios & Auditoría de Compras
              </p>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="flex space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Botón de Refresco Manual */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Actualizar datos desde el backend"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1 text-xs border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
