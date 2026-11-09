import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MaterialesTable from './components/MaterialesTable';
import MovimientoForm from './components/MovimientoForm';
import AlertasPanel from './components/AlertasPanel';
import OrdenesPanel from './components/OrdenesPanel';

import {
  getAlertasReorden,
  getAlertasDuplicados,
  getAlertasResumen,
  getStockPorUbicacion,
  getMovimientos,
  getMateriales
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de datos
  const [reordenData, setReordenData] = useState([]);
  const [duplicadosData, setDuplicadosData] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [stockBodegas, setStockBodegas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [materiales, setMateriales] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        reordenRes,
        duplicadosRes,
        resumenRes,
        stockRes,
        movsRes,
        matsRes
      ] = await Promise.all([
        getAlertasReorden().catch(() => ({ data: [] })),
        getAlertasDuplicados().catch(() => null),
        getAlertasResumen().catch(() => null),
        getStockPorUbicacion().catch(() => ({ data: [] })),
        getMovimientos(40).catch(() => ({ data: [] })),
        getMateriales().catch(() => ({ data: [] }))
      ]);

      setReordenData(reordenRes?.data || []);
      setDuplicadosData(duplicadosRes);
      setResumen(resumenRes?.data || resumenRes);
      setStockBodegas(stockRes?.data || []);
      setMovimientos(movsRes?.data || []);
      setMateriales(matsRes?.data || []);
    } catch (err) {
      console.error('Error al cargar datos desde el backend:', err);
      setError('No se pudo comunicar con la API REST (http://localhost:4000/api). Verifica que el servicio de backend esté activo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Conteo dinámico para insignias del menú
  const totalCriticos = (reordenData || []).filter(item => {
    const estado = item.evaluacion?.estado || item.estado_reposicion || item.estado;
    return estado === 'CRITICO';
  }).length;

  const reporteDup = duplicadosData?.data || duplicadosData;
  const totalDuplicados = (reporteDup?.auditoria_compras_duplicadas || reporteDup?.casos || []).length;

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col lg:flex-row font-sans text-zinc-950 antialiased selection:bg-red-600 selection:text-white">
      {/* Barra Lateral Profesional en Negro y Rojo */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={loadData}
        loading={loading}
        totalCriticos={totalCriticos}
        totalDuplicados={totalDuplicados}
      />

      {/* Área de Trabajo Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Banner de Error si falla la conexión */}
        {error && (
          <div className="bg-red-600 text-white px-6 py-3.5 text-sm font-bold shadow-md flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="px-3.5 py-1.5 bg-zinc-950 hover:bg-black text-white font-bold rounded-lg text-xs transition shadow-sm"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Contenido Dinámico */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading && !reordenData.length ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-14 h-14 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-zinc-700 font-bold text-sm tracking-wide">
                Conectando con el servidor MySQL & calculando modelos de inventario...
              </p>
              <span className="text-xs text-zinc-400 font-mono">
                API Base: http://localhost:4000/api
              </span>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  resumen={resumen}
                  reordenData={reordenData}
                  duplicadosData={duplicadosData}
                  stockBodegas={stockBodegas}
                  movimientos={movimientos}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'materiales' && (
                <MaterialesTable
                  reordenData={reordenData}
                  onRefresh={loadData}
                />
              )}

              {activeTab === 'movimientos' && (
                <MovimientoForm
                  materiales={materiales}
                  bodegas={[
                    { id_bodega: 1, nombre: 'Bodega Central', tipo: 'Bodega Central' },
                    { id_bodega: 2, nombre: 'Obra Torre Norte', tipo: 'Obra' },
                    { id_bodega: 3, nombre: 'Obra Residencial Las Palmas', tipo: 'Obra' }
                  ]}
                  movimientosRecientes={movimientos}
                  onMovimientoCreado={loadData}
                />
              )}

              {activeTab === 'alertas' && (
                <AlertasPanel
                  reordenData={reordenData}
                  duplicadosData={duplicadosData}
                  onRefresh={loadData}
                />
              )}

              {activeTab === 'ordenes' && (
                <OrdenesPanel
                  onVerDuplicados={() => setActiveTab('alertas')}
                />
              )}
            </>
          )}
        </main>

        {/* Pie de Página Institucional - Negro Corporativo */}
        <footer className="bg-zinc-950 border-t border-zinc-800 text-zinc-400 py-5 text-xs text-center mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-bold text-zinc-300">
              Constructora Del Valle S.A. &bull; Sistema de Gestión de Inventarios & Auditoría de Compras
            </span>
            <span className="text-zinc-400 font-mono text-[11px]">
              Paleta Corporativa: <strong className="text-red-500">Rojo</strong>, <strong className="text-white">Blanco</strong> & <strong className="text-zinc-300">Negro</strong> &bull; Puerto 4000 / 5173
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
