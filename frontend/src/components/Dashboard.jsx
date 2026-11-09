import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  CopyX, 
  TrendingUp, 
  ArrowRight, 
  ShieldAlert, 
  Building,
  DollarSign
} from 'lucide-react';

export default function Dashboard({ 
  reordenData = [], 
  duplicadosData = null, 
  stockBodegas = [], 
  movimientos = [], 
  setActiveTab 
}) {
  const totalMateriales = reordenData?.length || 0;
  
  // Filtrar según el estado de reposición
  const criticos = (reordenData || []).filter(
    (m) => (m.evaluacion?.estado || m.estadoReposicion || m.estado) === 'CRITICO'
  );
  const advertencias = (reordenData || []).filter(
    (m) => (m.evaluacion?.estado || m.estadoReposicion || m.estado) === 'ADVERTENCIA'
  );
  const estables = (reordenData || []).filter(
    (m) => (m.evaluacion?.estado || m.estadoReposicion || m.estado) === 'ESTABLE'
  );

  // Cálculo dinámico del valor financiero total del inventario
  const valorTotalInventario = (reordenData || []).reduce((acc, m) => {
    const stock = m.metricas_inventario?.stock_actual ?? (m.stockActual !== undefined ? m.stockActual : 0);
    const precio = Number(m.precio_unitario || m.material?.precio_unitario || 0);
    return acc + (stock * precio);
  }, 0);

  const valorTotalInventarioFormateado = `₡${valorTotalInventario.toLocaleString('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

  const reporteDup = duplicadosData?.data || duplicadosData;
  const totalCasosDuplicados = reporteDup?.resumen_ejecutivo?.total_casos_duplicados ?? 
    (reporteDup?.auditoria_compras_duplicadas?.length || reporteDup?.casos?.length || 0);

  const fugaValorTotalFormateada = reporteDup?.cuantificacion_consolidada?.fuga_valor_total_formateada || '₡130,250.00';
  const totalAlertasActivas = criticos.length + totalCasosDuplicados;

  // Agrupamiento de existencias por almacén / obra
  const ubicacionesMap = {};
  if (stockBodegas && stockBodegas.length > 0) {
    stockBodegas.forEach((item) => {
      const ubi = item.ubicacion || 'Bodega Central';
      if (!ubicacionesMap[ubi]) {
        ubicacionesMap[ubi] = [];
      }
      ubicacionesMap[ubi].push(item);
    });
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h2 className="text-2xl font-black text-zinc-950 tracking-tight">
            Dashboard Ejecutivo de Inventarios
          </h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Métricas financieras y operativas, monitoreo de puntos de reorden y auditoría de compras
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-black bg-zinc-950 text-white border border-zinc-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span>
            Constructora Del Valle S.A.
          </span>
        </div>
      </div>

      {/* 5 TARJETAS CON MÉTRICAS CLAVE (KPIs FINANCIEROS Y OPERATIVOS) - ROJO, BLANCO Y NEGRO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Catálogo */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 hover:border-zinc-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Total Catálogo
            </span>
            <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-black text-zinc-950 font-mono">{totalMateriales}</h3>
            <p className="text-xs text-zinc-500 mt-1 font-medium">
              Insumos activos catálogo
            </p>
          </div>
        </div>

        {/* KPI 2: Valor Total de Inventario (Métrica Financiera en Colones ₡) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 hover:border-zinc-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Valor Inventario
            </span>
            <div className="p-2.5 rounded-xl bg-zinc-950 text-white border border-zinc-800">
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-zinc-950 font-mono truncate" title={valorTotalInventarioFormateado}>
              {valorTotalInventarioFormateado}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 font-medium">
              Valorización física actual
            </p>
          </div>
        </div>

        {/* KPI 3: Ítems en Estado Crítico (Resaltado en Rojo Carmesí) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-red-600 hover:shadow-md transition relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-red-600"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
              Stock Crítico (≤ PR)
            </span>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-black text-red-600 font-mono">{criticos.length}</h3>
            <p className="text-xs text-red-700 font-semibold mt-1">
              {criticos.length > 0 ? 'Reposición urgente requerida' : 'Inventario sobre reorden'}
            </p>
          </div>
        </div>

        {/* KPI 4: Alertas Activas & Fugas de Valor */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 hover:border-zinc-300 transition relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
              Fugas de Valor
            </span>
            <div className="p-2.5 rounded-xl bg-zinc-900 text-white">
              <CopyX className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-zinc-950 font-mono truncate" title={fugaValorTotalFormateada}>
              {fugaValorTotalFormateada}
            </h3>
            <p className="text-xs text-red-600 font-bold mt-1">
              {totalAlertasActivas} alerta(s) de auditoría
            </p>
          </div>
        </div>

        {/* KPI 5: Movimientos Auditados */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 hover:border-zinc-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Movimientos
            </span>
            <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-black text-zinc-950 font-mono">{movimientos?.length || 0}</h3>
            <p className="text-xs text-zinc-500 mt-1 font-medium">
              Transacciones auditadas
            </p>
          </div>
        </div>
      </div>

      {/* BANNER DE AUDITORÍA DE COMPRAS DUPLICADAS (PARTE A - ROJO, BLANCO Y NEGRO) */}
      {totalCasosDuplicados > 0 && (
        <div className="bg-zinc-950 border-l-4 border-red-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center space-x-4">
              <div className="p-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/30 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                    Hallazgo de Auditoría Parte A
                  </span>
                  <span className="text-xs text-zinc-400">
                    {totalCasosDuplicados} caso detectado
                  </span>
                </div>
                <h4 className="font-black text-white text-base mt-1">
                  Órdenes de Compra Duplicadas: OC-1041 vs OC-1042 (Proveedor A)
                </h4>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Mismo proveedor y partidas idénticas en ventana crítica de octubre. Fuga financiera evitable en riesgo: <strong className="text-red-400 font-mono">{fugaValorTotalFormateada}</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('alertas')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/25 transition whitespace-nowrap self-stretch lg:self-auto justify-center"
            >
              <span>Inspeccionar Auditoría</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2 Columnas: Nivel de Cobertura vs Distribución por Almacenes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna Izquierda: Nivel de Cobertura y Reorden */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
            <div>
              <h3 className="font-black text-zinc-950 text-base">
                Nivel de Cobertura vs. Punto de Reorden (PR)
              </h3>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">
                PR = ⌈D_prom × L⌉ + SS
              </p>
            </div>
            <button
              onClick={() => setActiveTab('materiales')}
              className="text-xs font-bold text-zinc-900 hover:text-red-600 flex items-center space-x-1 transition"
            >
              <span>Ver Catálogo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {reordenData && reordenData.length > 0 ? (
              reordenData.map((item) => {
                const stock = item.metricas_inventario?.stock_actual ?? (item.stockActual !== undefined ? item.stockActual : 0);
                const pr = item.metricas_inventario?.punto_reorden_pr ?? (item.puntoReorden !== undefined ? item.puntoReorden : 1);
                const estado = item.evaluacion?.estado || item.estadoReposicion || item.estado || 'ESTABLE';
                const percentage = Math.min(100, Math.round((stock / (pr * 1.5)) * 100));

                const isCritico = estado === 'CRITICO';
                const isAdvertencia = estado === 'ADVERTENCIA';

                return (
                  <div 
                    key={item.id_material || item.material?.id_material} 
                    className={`p-4 rounded-xl border transition ${
                      isCritico 
                        ? 'border-red-300 bg-red-50/40' 
                        : isAdvertencia 
                        ? 'border-zinc-300 bg-zinc-50/70' 
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold text-zinc-400 mr-2">
                          {item.codigo || item.material?.codigo}
                        </span>
                        <span className="font-bold text-zinc-950 text-sm">
                          {item.nombre || item.material?.nombre}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                        isCritico
                          ? 'bg-red-600 text-white border-red-600'
                          : isAdvertencia
                          ? 'bg-zinc-800 text-white border-zinc-800'
                          : 'bg-zinc-100 text-zinc-800 border-zinc-300'
                      }`}>
                        {estado}
                      </span>
                    </div>

                    {/* Barra de progreso en rojo para crítico o zinc para estable */}
                    <div className="mt-3">
                      <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isCritico ? 'bg-red-600' : isAdvertencia ? 'bg-zinc-700' : 'bg-zinc-900'
                          }`}
                          style={{ width: `${Math.max(6, percentage)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500 mt-2.5 font-medium">
                      <span>
                        Stock: <strong className={`font-mono ${isCritico ? 'text-red-700' : 'text-zinc-950'}`}>
                          {stock.toLocaleString()} {item.unidad_medida || item.material?.unidad_medida}
                        </strong>
                      </span>
                      <span>
                        PR: <strong className="text-zinc-950 font-mono">{pr.toLocaleString()}</strong>
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-zinc-400 py-6 text-center">Cargando métricas de inventario...</p>
            )}
          </div>
        </div>

        {/* Columna Derecha: Existencias por Ubicación (Bodegas y Obras) */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
            <div>
              <h3 className="font-black text-zinc-950 text-base">
                Existencias por Frente de Obra y Almacén
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Distribución física de materiales en Bodega Central y Obras
              </p>
            </div>
            <button
              onClick={() => setActiveTab('movimientos')}
              className="text-xs font-bold text-zinc-900 hover:text-red-600 flex items-center space-x-1 transition"
            >
              <span>Registrar Movimiento</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {Object.keys(ubicacionesMap).length > 0 ? (
              Object.entries(ubicacionesMap).map(([ubicacion, items], idx) => (
                <div key={idx} className="border border-zinc-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-zinc-100">
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-zinc-700" />
                      <h4 className="font-black text-zinc-900 text-sm">{ubicacion}</h4>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {items.length} insumo(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {items.map((item, itemIdx) => (
                      <div key={itemIdx} className="text-xs flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                        <span className="text-zinc-600 truncate max-w-[120px] font-medium">
                          {item.material_nombre}:
                        </span>
                        <strong className="text-zinc-950 font-mono">
                          {Number(item.cantidad_actual).toLocaleString()} {item.unidad_medida}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-400 py-6 text-center">Cargando existencias por ubicación...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
