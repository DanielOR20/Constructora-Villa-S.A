import React, { useState } from 'react';
import { 
  Layers, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Search, 
  Calculator, 
  Info,
  RefreshCw
} from 'lucide-react';

export default function MaterialesTable({ reordenData = [], onRefresh }) {
  const [filter, setFilter] = useState('ALL'); // ALL | CRITICO | ADVERTENCIA | ESTABLE
  const [searchTerm, setSearchTerm] = useState('');

  // Estado del simulador interactivo de fórmulas con Math.ceil
  const [simLeadTime, setSimLeadTime] = useState(3);
  const [simDMax, setSimDMax] = useState(50);
  const [simDProm, setSimDProm] = useState(35);
  const [simStock, setSimStock] = useState(100);

  // Cálculos matemáticos rigurosos en vivo con Math.ceil
  const simSS = Math.ceil((simDMax - simDProm) * simLeadTime);
  const simConsumoLT = Math.ceil(simDProm * simLeadTime);
  const simPR = simConsumoLT + simSS;
  const simDeficit = Math.max(0, simPR - simStock);
  
  let simEstado = 'ESTABLE';
  if (simStock <= simPR) {
    simEstado = 'CRITICO';
  } else if (simStock <= Math.ceil(simPR * 1.25)) {
    simEstado = 'ADVERTENCIA';
  }

  const items = Array.isArray(reordenData) ? reordenData : (reordenData?.data || []);

  const filteredMateriales = items.filter((item) => {
    const estado = item.evaluacion?.estado || item.estadoReposicion || item.estado || 'ESTABLE';
    const matchesFilter = filter === 'ALL' || estado === filter;
    
    const nombre = (item.nombre || item.material?.nombre || '').toLowerCase();
    const codigo = (item.codigo || item.material?.codigo || '').toLowerCase();
    const matchesSearch = nombre.includes(searchTerm.toLowerCase()) || codigo.includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const totalCriticos = items.filter(m => (m.evaluacion?.estado || m.estadoReposicion || m.estado) === 'CRITICO').length;
  const totalAdvertencias = items.filter(m => (m.evaluacion?.estado || m.estadoReposicion || m.estado) === 'ADVERTENCIA').length;
  const totalEstables = items.filter(m => (m.evaluacion?.estado || m.estadoReposicion || m.estado) === 'ESTABLE').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h2 className="text-2xl font-black text-zinc-950 tracking-tight flex items-center space-x-2.5">
            <Layers className="w-7 h-7 text-red-600" />
            <span>Catálogo de Materiales & Motor de Reorden</span>
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Fórmulas rigurosas: <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono text-xs">SS = ⌈(D_max - D_prom) × L⌉</code> y <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 font-mono text-xs">PR = ⌈D_prom × L⌉ + SS</code>
          </p>
        </div>

        {/* Botones de Filtro Rápido - Rojo, Blanco y Negro */}
        <div className="flex items-center space-x-1.5 bg-zinc-100 p-1.5 rounded-xl border border-zinc-200">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'ALL' ? 'bg-zinc-950 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Todos ({items.length})
          </button>
          <button
            onClick={() => setFilter('CRITICO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
              filter === 'CRITICO' ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <span>Críticos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'CRITICO' ? 'bg-white text-red-600' : 'bg-red-100 text-red-800'}`}>
              {totalCriticos}
            </span>
          </button>
          <button
            onClick={() => setFilter('ADVERTENCIA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'ADVERTENCIA' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Advertencia ({totalAdvertencias})
          </button>
          <button
            onClick={() => setFilter('ESTABLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'ESTABLE' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Estables ({totalEstables})
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Criterios Oficiales */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
          />
        </div>

        <div className="flex items-center space-x-2.5 text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl w-full sm:w-auto">
          <Info className="w-4 h-4 text-zinc-900 shrink-0" />
          <span>
            <strong>Criterio de Evaluación:</strong> <span className="text-red-600 font-bold">CRÍTICO</span> (Stock ≤ PR), <span className="text-zinc-900 font-bold">ADVERTENCIA</span> (PR &lt; Stock ≤ 1.25×PR), <span className="text-zinc-600 font-bold">ESTABLE</span> (&gt; 1.25×PR).
          </span>
        </div>
      </div>

      {/* Tabla Principal de Datos - Cabecera Negra y Acentos Rojos */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-700">
            <thead className="bg-zinc-950 text-white text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Código / Material</th>
                <th className="px-4 py-3.5">Unidad</th>
                <th className="px-4 py-3.5 text-right">Precio Catálogo</th>
                <th className="px-4 py-3.5 text-right">Stock Actual</th>
                <th className="px-4 py-3.5 text-center">Lead Time</th>
                <th className="px-4 py-3.5 text-right">D_max / D_prom</th>
                <th className="px-4 py-3.5 text-right">Stock Seg. (SS)</th>
                <th className="px-4 py-3.5 text-right">Punto Reorden (PR)</th>
                <th className="px-4 py-3.5 text-right">Déficit</th>
                <th className="px-4 py-3.5 text-center">Estado</th>
                <th className="px-4 py-3.5 text-right">OC Sugerida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredMateriales.length > 0 ? (
                filteredMateriales.map((item) => {
                  const id = item.id_material || item.material?.id_material;
                  const nombre = item.nombre || item.material?.nombre;
                  const codigo = item.codigo || item.material?.codigo;
                  const unidad = item.unidad_medida || item.material?.unidad_medida;
                  const precio = item.precio_unitario || item.material?.precio_unitario || 0;

                  const p = item.parametros_demanda || item.parametros || item.calculo_matematico?.parametros || {};
                  const m = item.metricas_inventario || {};

                  const stock = m.stock_actual ?? (item.stockActual !== undefined ? item.stockActual : 0);
                  const ss = m.stock_seguridad_ss ?? (item.stockSeguridad !== undefined ? item.stockSeguridad : 0);
                  const pr = m.punto_reorden_pr ?? (item.puntoReorden !== undefined ? item.puntoReorden : 0);
                  const deficit = m.deficit_unidades ?? (item.deficit !== undefined ? item.deficit : Math.max(0, pr - stock));
                  const estado = item.evaluacion?.estado || item.estadoReposicion || item.estado || 'ESTABLE';
                  const sugerido = item.evaluacion?.cantidad_sugerida_reorden ?? item.analitica?.cantidadSugeridaCompra ?? item.cantidad_sugerida_compra ?? deficit;

                  const isCritico = estado === 'CRITICO';
                  const isAdvertencia = estado === 'ADVERTENCIA';

                  return (
                    <tr 
                      key={id}
                      className={`hover:bg-zinc-50 transition ${
                        isCritico ? 'bg-red-50/50' : isAdvertencia ? 'bg-zinc-50/70' : ''
                      }`}
                    >
                      {/* Código y Nombre */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-zinc-950">{nombre}</div>
                        <span className="text-xs font-mono text-zinc-400 font-semibold">{codigo}</span>
                      </td>

                      {/* Unidad */}
                      <td className="px-4 py-3.5 text-zinc-600 font-medium">
                        {unidad}
                      </td>

                      {/* Precio Unitario */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        ${Number(precio).toFixed(2)}
                      </td>

                      {/* Stock Actual */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded font-black ${
                          isCritico 
                            ? 'bg-red-100 text-red-700' 
                            : isAdvertencia
                            ? 'bg-zinc-200 text-zinc-900'
                            : 'bg-zinc-100 text-zinc-900'
                        }`}>
                          {stock.toLocaleString()}
                        </span>
                      </td>

                      {/* Lead Time */}
                      <td className="px-4 py-3.5 text-center font-mono text-zinc-700">
                        {p.lead_time_dias || 3} d
                      </td>

                      {/* D_max y D_prom */}
                      <td className="px-4 py-3.5 text-right font-mono text-xs">
                        <div>Max: <strong className="text-zinc-950">{p.demanda_maxima_diaria || p.d_max || 0}</strong></div>
                        <div className="text-zinc-400">Prom: {p.demanda_promedio_diaria || p.d_prom || 0}</div>
                      </td>

                      {/* Stock de Seguridad (SS) */}
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-zinc-700">
                        {ss}
                      </td>

                      {/* Punto de Reorden (PR) */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-zinc-950">
                        {pr}
                      </td>

                      {/* Déficit */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold">
                        {deficit > 0 ? (
                          <span className="text-red-600 font-black">-{deficit}</span>
                        ) : (
                          <span className="text-zinc-400 font-normal">0</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black shadow-sm ${
                          isCritico 
                            ? 'bg-red-600 text-white shadow-red-600/30' 
                            : isAdvertencia
                            ? 'bg-amber-600 text-white shadow-amber-600/30'
                            : 'bg-emerald-600 text-white shadow-emerald-600/30'
                        }`}>
                          {isCritico ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 mr-1 text-white" />
                              CRÍTICO
                            </>
                          ) : isAdvertencia ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 mr-1 text-white" />
                              ADVERTENCIA
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 mr-1 text-white" />
                              ESTABLE
                            </>
                          )}
                        </span>
                      </td>

                      {/* Compra Sugerida */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold">
                        {sugerido > 0 ? (
                          <span className="text-red-600 font-black bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            +{sugerido.toLocaleString()} {unidad}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-normal">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-zinc-400">
                    No se encontraron materiales que coincidan con el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulador Interactivo de Fórmulas Matemáticas - Negro con Acento Rojo */}
      <div className="bg-zinc-950 text-white rounded-2xl p-6 sm:p-7 shadow-xl border border-zinc-800">
        <div className="flex items-center space-x-2.5 border-b border-zinc-800 pb-4 mb-5">
          <div className="p-2 bg-red-600 rounded-lg text-white">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-white">
              Simulador Interactivo de Reorden Matemático (Math.ceil)
            </h3>
            <p className="text-xs text-zinc-400">
              Modela en tiempo real el comportamiento de reorden modificando los parámetros de demanda y lead time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Input D_max */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Demanda Máxima Diaria (D_max):
            </label>
            <input
              type="number"
              min="1"
              value={simDMax}
              onChange={(e) => setSimDMax(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
            />
          </div>

          {/* Input D_prom */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Demanda Promedio Diaria (D_prom):
            </label>
            <input
              type="number"
              min="1"
              value={simDProm}
              onChange={(e) => setSimDProm(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
            />
          </div>

          {/* Input Lead Time (L) */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Lead Time (L en días):
            </label>
            <input
              type="number"
              min="1"
              value={simLeadTime}
              onChange={(e) => setSimLeadTime(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
            />
          </div>

          {/* Input Stock Actual */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Stock Actual en Almacén:
            </label>
            <input
              type="number"
              min="0"
              value={simStock}
              onChange={(e) => setSimStock(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
            />
          </div>
        </div>

        {/* Resultados del Simulador */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-black/60 p-4 rounded-xl border border-zinc-800">
          <div className="text-center p-3 sm:border-r border-zinc-800">
            <span className="text-xs text-zinc-400 block font-medium">Stock de Seguridad (SS)</span>
            <span className="text-[11px] text-zinc-500 font-mono">⌈({simDMax} - {simDProm}) × {simLeadTime}⌉</span>
            <strong className="text-xl text-white font-mono block mt-1">{simSS} unid.</strong>
          </div>

          <div className="text-center p-3 sm:border-r border-zinc-800">
            <span className="text-xs text-zinc-400 block font-medium">Punto de Reorden (PR)</span>
            <span className="text-[11px] text-zinc-500 font-mono">⌈{simDProm} × {simLeadTime}⌉ + {simSS}</span>
            <strong className="text-xl text-white font-mono block mt-1">{simPR} unid.</strong>
          </div>

          <div className="text-center p-3 sm:border-r border-zinc-800">
            <span className="text-xs text-zinc-400 block font-medium">Déficit de Inventario</span>
            <span className="text-[11px] text-zinc-500 font-mono">max(0, PR - Stock)</span>
            <strong className={`text-xl font-mono block mt-1 ${simDeficit > 0 ? 'text-red-500 font-black' : 'text-zinc-300'}`}>
              {simDeficit} unid.
            </strong>
          </div>

          <div className="text-center p-3 flex flex-col items-center justify-center">
            <span className="text-xs text-zinc-400 block font-medium mb-1.5">Estado Resultante</span>
            <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wider ${
              simEstado === 'CRITICO' 
                ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/40' 
                : simEstado === 'ADVERTENCIA'
                ? 'bg-zinc-800 text-white'
                : 'bg-zinc-100 text-zinc-950'
            }`}>
              {simEstado}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
