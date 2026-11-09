import React from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  Layers, 
  ArrowLeftRight, 
  AlertTriangle, 
  FileCheck2, 
  RefreshCw,
  Server
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onRefresh, 
  loading, 
  totalCriticos = 0, 
  totalDuplicados = 0 
}) {
  const totalAlertas = totalCriticos + totalDuplicados;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Resumen',
      icon: LayoutDashboard,
      description: 'Métricas clave y estado de almacenes'
    },
    {
      id: 'materiales',
      label: 'Materiales & Reorden',
      icon: Layers,
      description: 'Cálculo de SS y PR en tiempo real'
    },
    {
      id: 'movimientos',
      label: 'Registro de Movimientos',
      icon: ArrowLeftRight,
      description: 'Entradas, salidas y traslados'
    },
    {
      id: 'alertas',
      label: 'Alertas & Auditoría',
      icon: AlertTriangle,
      badge: totalAlertas > 0 ? totalAlertas : null,
      badgeColor: 'bg-red-600 text-white',
      description: 'Reposición urgente y compras duplicadas'
    },
    {
      id: 'ordenes',
      label: 'Órdenes de Compra',
      icon: FileCheck2,
      description: 'Adquisiciones de octubre 2026'
    }
  ];

  return (
    <aside className="w-full lg:w-72 bg-zinc-950 text-white flex flex-col shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800 shadow-2xl">
      {/* Cabecera / Identidad Corporativa */}
      <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
        <div 
          className="flex items-center space-x-3 cursor-pointer group" 
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="w-11 h-11 rounded-xl bg-red-600 flex items-center justify-center text-white font-black shadow-lg shadow-red-600/30 group-hover:bg-red-700 transition-all">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-base leading-tight tracking-wide text-white">
              Constructora Del Valle
            </h1>
            <p className="text-[11px] font-bold text-red-500 tracking-wider uppercase mt-0.5">
              Inventarios & Auditoría
            </p>
          </div>
        </div>

        {/* Botón de Actualizar Datos */}
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Actualizar datos desde el servidor"
          className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition border border-zinc-800 flex items-center justify-center"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-500' : ''}`} />
        </button>
      </div>

      {/* Menú de Navegación */}
      <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Módulos del Sistema
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all group ${
                isActive
                  ? 'bg-red-600 text-white font-bold shadow-lg shadow-red-600/25 border border-red-500'
                  : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon 
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive 
                      ? 'text-white' 
                      : 'text-zinc-400 group-hover:text-red-500'
                  }`} 
                />
                <div className="truncate">
                  <div className="text-sm font-semibold truncate leading-tight">
                    {item.label}
                  </div>
                  <div className={`text-[11px] truncate hidden sm:block ${isActive ? 'text-red-100' : 'text-zinc-400'}`}>
                    {item.description}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                  isActive 
                    ? 'bg-zinc-950 text-white border border-zinc-800' 
                    : item.badgeColor
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Tarjeta Informativa de Estado del Servidor */}
      <div className="p-4 border-t border-zinc-800/80 bg-black/60">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center space-x-1.5 text-zinc-400 font-medium">
            <Server className="w-3.5 h-3.5 text-zinc-400" />
            <span>Servidor API:</span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-900 text-zinc-300 border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
            Puerto 4000
          </span>
        </div>
        <div className="text-[11px] text-zinc-400">
          Caso de Estudio: <strong className="text-zinc-200">Barry Vega</strong>
        </div>
      </div>
    </aside>
  );
}
