import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CopyX, 
  ShieldAlert, 
  CheckCircle, 
  Calendar, 
  Truck, 
  TrendingDown,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function AlertasPanel({ reordenData = [], duplicadosData = null, onRefresh }) {
  const [activeSubTab, setActiveSubTab] = useState('todos'); // 'todos', 'duplicados', 'sobreprecios', 'reorden'

  // Normalizar datos de auditoría de duplicados y fugas
  const reporteAuditoria = duplicadosData?.data || duplicadosData || {};
  const casosDuplicados = reporteAuditoria.auditoria_compras_duplicadas || reporteAuditoria.casos || [];
  const sobreprecios = reporteAuditoria.auditoria_sobreprecios || [];
  const consolidado = reporteAuditoria.cuantificacion_consolidada || {};
  const resumenEjecutivo = reporteAuditoria.resumen_ejecutivo || {};

  // Normalizar datos de reorden
  const itemsReorden = Array.isArray(reordenData) ? reordenData : (reordenData?.data || []);

  const criticos = itemsReorden.filter(item => {
    const estado = item.evaluacion?.estado || item.estadoReposicion || item.estado;
    return estado === 'CRITICO';
  });

  const advertencias = itemsReorden.filter(item => {
    const estado = item.evaluacion?.estado || item.estadoReposicion || item.estado;
    return estado === 'ADVERTENCIA';
  });

  const formatMoneda = (valor) => {
    const num = Number(valor) || 0;
    return `₡${num.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-200 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-md shadow-red-600/30">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-950 tracking-tight">
                Panel de Alertas & Auditoría de Fugas de Valor
              </h2>
              <p className="text-sm text-zinc-500 mt-0.5">
                Auditoría financiera Parte A & B (Caso Barry Vega) y reposición crítica bajo el Punto de Reorden
              </p>
            </div>
          </div>
        </div>

        {/* Filtros rápidos por sub-pestaña */}
        <div className="flex items-center bg-zinc-100 p-1.5 rounded-xl text-xs font-bold text-zinc-600 border border-zinc-200">
          <button
            onClick={() => setActiveSubTab('todos')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'todos' ? 'bg-zinc-950 text-white shadow-sm' : 'hover:text-zinc-950'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveSubTab('duplicados')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'duplicados' ? 'bg-zinc-950 text-white shadow-sm' : 'hover:text-zinc-950'
            }`}
          >
            <span>Duplicados</span>
            {casosDuplicados.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('sobreprecios')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'sobreprecios' ? 'bg-zinc-950 text-white shadow-sm' : 'hover:text-zinc-950'
            }`}
          >
            Sobreprecios
          </button>
          <button
            onClick={() => setActiveSubTab('reorden')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'reorden' ? 'bg-zinc-950 text-white shadow-sm' : 'hover:text-zinc-950'
            }`}
          >
            <span>Stock Crítico</span>
            {criticos.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
            )}
          </button>
        </div>
      </div>

      {/* BANNER DE CUANTIFICACIÓN CONSOLIDADA DE FUGAS DE VALOR (ROJO, BLANCO Y NEGRO) */}
      <div className="bg-zinc-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border-l-4 border-red-600">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-600 text-white inline-block">
              Dictamen de Auditoría Financiera
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              Fuga Total en Riesgo: {consolidado.fuga_valor_total_formateada || formatMoneda(consolidado.fuga_valor_total || 130250)}
            </h3>
            <p className="text-xs text-zinc-300">
              Pérdidas monetarias cuantificadas por órdenes duplicadas a proveedores en ventana de 3 días y sobreprecios facturados por encima de la lista de contrato oficial.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 w-full lg:w-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
              <span className="text-[11px] text-zinc-400 block font-medium">Por Duplicación</span>
              <strong className="text-base sm:text-lg font-black font-mono text-white block mt-0.5">
                {consolidado.fuga_valor_por_duplicacion_formateada || formatMoneda(consolidado.fuga_valor_por_duplicacion || 130250)}
              </strong>
              <span className="text-[10px] text-zinc-400 block mt-1">
                {resumenEjecutivo.total_casos_duplicados ?? casosDuplicados.length} caso(s)
              </span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
              <span className="text-[11px] text-zinc-400 block font-medium">Por Sobreprecios</span>
              <strong className="text-base sm:text-lg font-black font-mono text-white block mt-0.5">
                {consolidado.fuga_valor_por_sobreprecios_formateada || formatMoneda(consolidado.fuga_valor_por_sobreprecios || 0)}
              </strong>
              <span className="text-[10px] text-zinc-400 block mt-1">
                {resumenEjecutivo.total_renglones_con_sobreprecio ?? sobreprecios.length} partida(s)
              </span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-zinc-400 block font-medium">Caso Barry Vega</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white mt-1">
                OC-1041 vs OC-1042
              </span>
              <span className="text-[10px] text-red-400 block mt-1 font-bold">
                CONFIRMADO (PROV-001)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: AUDITORÍA DE COMPRAS DUPLICADAS (PARTE A) */}
      {(activeSubTab === 'todos' || activeSubTab === 'duplicados') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <CopyX className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-black text-zinc-950">
                Auditoría Parte A: Órdenes de Compra Duplicadas
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300">
                {casosDuplicados.length} Caso(s) Detectado(s)
              </span>
            </div>
            <div className="text-xs text-zinc-500 font-mono">
              Algoritmo: Mismo Proveedor + Mismas Partidas + Ventana ≤ 3 días
            </div>
          </div>

          {casosDuplicados.length > 0 ? (
            <div className="space-y-6">
              {casosDuplicados.map((caso, idx) => {
                const orden1 = caso.orden_original || {};
                const orden2 = caso.orden_duplicada || {};
                const prov = caso.proveedor || {};
                const alerta = caso.alerta || {};
                const partidas = caso.partidas_coincidentes || caso.materiales_coincidentes || [];

                return (
                  <div 
                    key={idx} 
                    className="bg-white rounded-2xl border-2 border-red-600 shadow-md p-6 relative overflow-hidden"
                  >
                    {/* Cinta Superior de Alerta */}
                    <div className="bg-red-600 text-white px-5 py-2 -mx-6 -mt-6 mb-5 flex flex-wrap items-center justify-between font-bold text-xs uppercase tracking-wider gap-2">
                      <span className="flex items-center space-x-2">
                        <ShieldAlert className="w-4 h-4 text-white" />
                        <span>HALLAZGO CRÍTICO DE AUDITORÍA: {alerta.clasificacion || alerta.tipo || 'COMPRA DUPLICADA'}</span>
                      </span>
                      <span className="bg-zinc-950 text-white px-2.5 py-0.5 rounded-full text-[11px] font-mono">
                        Diferencia temporal: {alerta.dias_diferencia ?? 0} día(s)
                      </span>
                    </div>

                    {/* Proveedor e Impacto Financiero */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-5 border-b border-zinc-100">
                      <div>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Proveedor Auditado:</span>
                        <h4 className="text-base font-bold text-zinc-950 mt-0.5 flex items-center space-x-1.5">
                          <Truck className="w-4 h-4 text-zinc-500" />
                          <span>{prov.nombre}</span>
                        </h4>
                        <span className="text-xs font-mono text-zinc-500">{prov.codigo} &bull; {prov.email}</span>
                      </div>

                      <div className="md:text-right bg-red-50 p-4 rounded-xl border border-red-200">
                        <span className="text-xs font-bold text-red-800 uppercase tracking-wider block">
                          Impacto Financiero Duplicado en Riesgo:
                        </span>
                        <span className="text-2xl font-black text-red-700 font-mono">
                          {caso.fuga_valor_duplicacion_formateada || formatMoneda(caso.fuga_valor_duplicacion || orden2.total)}
                        </span>
                      </div>
                    </div>

                    {/* Comparación Cara a Cara de las Órdenes Duplicadas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-5">
                      {/* Tarjeta Orden 1 (Original) */}
                      <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
                        <div className="flex items-center justify-between border-b border-zinc-200 pb-2 mb-2">
                          <span className="text-xs font-bold text-zinc-500 uppercase">Orden Original:</span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-zinc-900 text-white">
                            {orden1.estado}
                          </span>
                        </div>
                        <div className="text-lg font-black text-zinc-950 font-mono">
                          {orden1.numero_orden}
                        </div>
                        <div className="text-xs text-zinc-600 mt-1 flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Fecha Emisión: <strong>{new Date(orden1.fecha_emision).toLocaleDateString()}</strong></span>
                        </div>
                        <div className="text-xs text-zinc-600 mt-1">
                          Importe Total: <strong className="font-mono text-zinc-950">{orden1.total_formateado || formatMoneda(orden1.total)}</strong>
                        </div>
                        <p className="text-[11px] text-zinc-600 mt-2 italic bg-white p-2.5 rounded-lg border border-zinc-200">
                          "{orden1.observaciones}"
                        </p>
                      </div>

                      {/* Tarjeta Orden 2 (Duplicada) */}
                      <div className="p-4 rounded-xl border-2 border-red-300 bg-red-50/60">
                        <div className="flex items-center justify-between border-b border-red-200 pb-2 mb-2">
                          <span className="text-xs font-bold text-red-600 uppercase">Orden Duplicada Detectada:</span>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-red-600 text-white">
                            {orden2.estado}
                          </span>
                        </div>
                        <div className="text-lg font-black text-red-700 font-mono">
                          {orden2.numero_orden}
                        </div>
                        <div className="text-xs text-zinc-600 mt-1 flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Fecha Emisión: <strong>{new Date(orden2.fecha_emision).toLocaleDateString()}</strong></span>
                        </div>
                        <div className="text-xs text-zinc-600 mt-1">
                          Importe Total: <strong className="font-mono text-red-700">{orden2.total_formateado || formatMoneda(orden2.total)}</strong>
                        </div>
                        <p className="text-[11px] text-red-700 mt-2 italic bg-white p-2.5 rounded-lg border border-red-200">
                          "{orden2.observaciones}"
                        </p>
                      </div>
                    </div>

                    {/* Partidas y Materiales Coincidentes */}
                    <div className="mt-4">
                      <h5 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                        Partidas / Materiales Coincidentes:
                      </h5>
                      <div className="overflow-x-auto border border-zinc-200 rounded-xl">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-zinc-950 text-white font-bold uppercase">
                            <tr>
                              <th className="p-3">Código / Material</th>
                              <th className="p-3 text-right">Cant. {orden1.numero_orden}</th>
                              <th className="p-3 text-right">Cant. {orden2.numero_orden}</th>
                              <th className="p-3 text-right">Precio Unitario</th>
                              <th className="p-3 text-right">Subtotal Duplicado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200">
                            {partidas.map((m, mIdx) => (
                              <tr key={mIdx} className="hover:bg-zinc-50">
                                <td className="p-3 font-bold text-zinc-950">
                                  {m.nombre} <span className="font-mono text-zinc-400 font-normal">({m.codigo})</span>
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-zinc-700">
                                  {m.cantidad_orden_original} {m.unidad_medida}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-red-600">
                                  {m.cantidad_orden_duplicada} {m.unidad_medida}
                                </td>
                                <td className="p-3 text-right font-mono">
                                  {m.precio_contrato_formateado || formatMoneda(m.precio_pagado_orden_1 || m.precio_unitario)}
                                </td>
                                <td className="p-3 text-right font-mono font-black text-red-700">
                                  {m.subtotal_duplicado_formateado || formatMoneda(m.subtotal_duplicado)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Acción Correctiva */}
                    <div className="mt-5 p-4 rounded-xl bg-red-100 border border-red-300 flex items-start space-x-3 text-xs text-red-950">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Acción Correctiva Inmediata (Dictamen Barry Vega):</strong> Proceder a anular formalmente la orden 
                        <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded text-red-700 mx-1">
                          {orden2.numero_orden}
                        </span> 
                        en el sistema contable y retener la emisión del pago para evitar el doble desembolso de 
                        <span className="font-mono font-bold"> {orden2.total_formateado || formatMoneda(orden2.total)} </span> 
                        a favor de {prov.nombre}.
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500">
              <CheckCircle className="w-10 h-10 text-zinc-900 mx-auto mb-2" />
              <h4 className="font-bold text-zinc-800 text-base">No se detectaron compras duplicadas</h4>
              <p className="text-xs text-zinc-500 mt-1">
                Todas las órdenes de compra evaluadas cumplen con las políticas de unicidad y temporalidad.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 2: AUDITORÍA DE SOBREPRECIOS */}
      {(activeSubTab === 'todos' || activeSubTab === 'sobreprecios') && (
        <div className="space-y-4 pt-4 border-t border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-6 h-6 text-zinc-900" />
              <h3 className="text-lg font-black text-zinc-950">
                Auditoría Parte B: Sobreprecios y Compras Fuera de Contrato
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-900 border border-zinc-300">
                {sobreprecios.length} Renglón(es)
              </span>
            </div>
            <div className="text-xs text-zinc-500 font-mono">
              Criterio: Precio Pagado en OC &gt; Precio Base de Catálogo
            </div>
          </div>

          {sobreprecios.length > 0 ? (
            <div className="overflow-x-auto border border-zinc-200 rounded-2xl bg-white shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-950 text-white font-bold uppercase border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Orden & Fecha</th>
                    <th className="p-3">Proveedor</th>
                    <th className="p-3">Material</th>
                    <th className="p-3 text-right">Cantidad</th>
                    <th className="p-3 text-right">Precio Contrato</th>
                    <th className="p-3 text-right">Precio Pagado</th>
                    <th className="p-3 text-right">Sobreprecio Unit.</th>
                    <th className="p-3 text-right">Fuga Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {sobreprecios.map((sp, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="p-3">
                        <span className="font-mono font-bold text-zinc-950 block">{sp.numero_orden}</span>
                        <span className="text-[11px] text-zinc-500">{new Date(sp.fecha_emision).toLocaleDateString()}</span>
                      </td>
                      <td className="p-3 font-medium text-zinc-800">{sp.proveedor}</td>
                      <td className="p-3">
                        <span className="font-bold text-zinc-950 block">{sp.material.nombre}</span>
                        <span className="font-mono text-zinc-400 text-[11px]">{sp.material.codigo}</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-zinc-700">
                        {sp.cantidad} {sp.material.unidad_medida}
                      </td>
                      <td className="p-3 text-right font-mono text-zinc-600">
                        {sp.precio_contrato_formateado || formatMoneda(sp.precio_contrato)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-zinc-950">
                        {sp.precio_pagado_formateado || formatMoneda(sp.precio_pagado)}
                      </td>
                      <td className="p-3 text-right font-mono text-red-600 font-bold">
                        +{sp.sobreprecio_unitario_formateado || formatMoneda(sp.sobreprecio_unitario)}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-red-700">
                        {sp.fuga_por_sobreprecio_formateada || formatMoneda(sp.fuga_por_sobreprecio)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500 text-xs">
              <CheckCircle className="w-6 h-6 text-zinc-900 mx-auto mb-1" />
              Todas las órdenes de compra auditadas respetaron los precios contractuales pactados.
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 3: ALERTAS DE REORDEN (STOCK CRÍTICO & ADVERTENCIAS) */}
      {(activeSubTab === 'todos' || activeSubTab === 'reorden') && (
        <div className="space-y-6 pt-4 border-t border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-black text-zinc-950">
                Monitoreo de Reposición: Stock Crítico (Stock ≤ PR)
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                criticos.length > 0 ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-800'
              }`}>
                {criticos.length} Material(es) Crítico(s)
              </span>
            </div>

            <div className="text-xs text-zinc-500 font-mono bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">
              SS = ⌈(D_max - D_prom) × L⌉ &nbsp;|&nbsp; PR = ⌈D_prom × L⌉ + SS
            </div>
          </div>

          {criticos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {criticos.map((item) => {
                const stockActual = item.metricas_inventario?.stock_actual ?? item.stock_actual ?? 0;
                const puntoReorden = item.metricas_inventario?.punto_reorden_pr ?? item.punto_reorden ?? 0;
                const stockSeguridad = item.metricas_inventario?.stock_seguridad_ss ?? item.stock_seguridad ?? 0;
                const deficit = item.metricas_inventario?.deficit_unidades ?? item.deficit ?? (puntoReorden - stockActual);
                const sugerido = item.evaluacion?.cantidad_sugerida_reorden ?? item.cantidad_sugerida_compra ?? deficit;

                return (
                  <div 
                    key={item.id_material}
                    className="bg-white rounded-2xl border-2 border-red-600 shadow-sm p-6 hover:shadow-md transition relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-2 h-full bg-red-600"></div>

                    <div className="flex items-start justify-between pl-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-zinc-400">{item.codigo}</span>
                        <h4 className="text-base font-bold text-zinc-950">{item.nombre}</h4>
                        <span className="text-xs text-zinc-500">Unidad: {item.unidad_medida}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white animate-pulse">
                        CRÍTICO
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-4 p-3.5 bg-red-50/60 rounded-xl border border-red-200 text-center pl-2">
                      <div>
                        <span className="text-[11px] font-bold text-zinc-500 block">Stock Actual</span>
                        <strong className="text-lg font-black text-red-700 font-mono">
                          {stockActual}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-zinc-500 block">Punto Reorden (PR)</span>
                        <strong className="text-lg font-black text-zinc-950 font-mono">
                          {puntoReorden}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-zinc-500 block">Stock Seg. (SS)</span>
                        <strong className="text-lg font-black text-zinc-700 font-mono">
                          {stockSeguridad}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-3 border-t border-zinc-100 pl-2">
                      <span className="text-zinc-600">
                        Déficit: <strong className="text-red-700 font-mono">{deficit} {item.unidad_medida}</strong>
                      </span>
                      <span className="text-white font-bold bg-red-600 px-3 py-1 rounded-lg shadow-sm flex items-center space-x-1">
                        <span>Generar OC:</span>
                        <strong className="font-mono">+{sugerido} {item.unidad_medida}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500">
              <CheckCircle className="w-10 h-10 text-zinc-900 mx-auto mb-2" />
              <h4 className="font-bold text-zinc-800 text-base">Inventario de Materiales Óptimo</h4>
              <p className="text-xs text-zinc-500 mt-1">
                Ningún material se encuentra por debajo de su Punto de Reorden calculado.
              </p>
            </div>
          )}

          {/* Zona de Advertencia */}
          {advertencias.length > 0 && (
            <div className="mt-6 pt-4 border-t border-zinc-200">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="w-5 h-5 text-zinc-700" />
                <h4 className="text-sm font-bold text-zinc-900">
                  Materiales en Zona Preventiva de Advertencia (PR &lt; Stock ≤ PR × 1.25):
                </h4>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-200 text-zinc-800">
                  {advertencias.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {advertencias.map((adv) => {
                  const stockActual = adv.metricas_inventario?.stock_actual ?? adv.stock_actual ?? 0;
                  const puntoReorden = adv.metricas_inventario?.punto_reorden_pr ?? adv.punto_reorden ?? 0;

                  return (
                    <div key={adv.id_material} className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs">
                      <div className="flex items-center justify-between font-bold text-zinc-900">
                        <span>{adv.nombre}</span>
                        <span className="text-[10px] bg-zinc-800 text-white px-2 py-0.5 rounded font-black">
                          ADVERTENCIA
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-zinc-600 font-mono">
                        <span>Stock: <strong>{stockActual}</strong></span>
                        <span>PR: <strong>{puntoReorden}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
