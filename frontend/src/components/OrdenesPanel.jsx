import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  Search, 
  Calendar, 
  Truck, 
  DollarSign, 
  AlertTriangle, 
  Eye, 
  CheckCircle2, 
  X, 
  CopyX 
} from 'lucide-react';
import api from '../services/api';

export default function OrdenesPanel({ onVerDuplicados }) {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroProveedor, setFiltroProveedor] = useState('ALL');
  const [busqueda, setBusqueda] = useState('');
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ordenes');
      setOrdenes(res.data.data || []);
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = async (id) => {
    try {
      setLoadingDetalle(true);
      const res = await api.get(`/ordenes/${id}`);
      setOrdenSeleccionada(res.data.data || null);
    } catch (error) {
      console.error('Error al cargar detalle de orden:', error);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const formatMoneda = (valor) => {
    const num = Number(valor) || 0;
    return `₡${num.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const ordenesFiltradas = ordenes.filter((oc) => {
    const matchProveedor = filtroProveedor === 'ALL' || oc.id_proveedor === Number(filtroProveedor);
    const matchBusqueda = 
      oc.numero_orden.toLowerCase().includes(busqueda.toLowerCase()) ||
      oc.nombre_proveedor.toLowerCase().includes(busqueda.toLowerCase());
    return matchProveedor && matchBusqueda;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h2 className="text-2xl font-black text-zinc-950 tracking-tight flex items-center space-x-2.5">
            <FileCheck2 className="w-7 h-7 text-red-600" />
            <span>Registro de Órdenes de Compra (Octubre 2026)</span>
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Gestión y revisión de adquisiciones a proveedores de Constructora Del Valle S.A.
          </p>
        </div>

        <button
          onClick={onVerDuplicados}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 transition"
        >
          <CopyX className="w-4 h-4" />
          <span>Auditar Duplicados (Parte A)</span>
        </button>
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por OC o proveedor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-zinc-500 uppercase">Proveedor:</span>
          <select
            value={filtroProveedor}
            onChange={(e) => setFiltroProveedor(e.target.value)}
            className="px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
          >
            <option value="ALL">Todos los Proveedores</option>
            <option value="1">Proveedor A (Cemento y Acero)</option>
            <option value="2">Proveedor B (Agregados y Arena)</option>
            <option value="3">Proveedor C (Blocks y Concretos)</option>
          </select>
        </div>
      </div>

      {/* Tabla de Órdenes de Compra */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-700">
            <thead className="bg-zinc-950 text-white text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">N° Orden</th>
                <th className="px-4 py-3.5">Proveedor</th>
                <th className="px-4 py-3.5 text-center">Fecha Emisión</th>
                <th className="px-4 py-3.5 text-center">Estado</th>
                <th className="px-4 py-3.5 text-right">Importe Total</th>
                <th className="px-4 py-3.5">Observaciones / Alerta</th>
                <th className="px-4 py-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-400">
                    Cargando órdenes de compra...
                  </td>
                </tr>
              ) : ordenesFiltradas.length > 0 ? (
                ordenesFiltradas.map((oc) => {
                  const esDuplicada = oc.numero_orden === 'OC-1041' || oc.numero_orden === 'OC-1042';

                  return (
                    <tr
                      key={oc.id_orden}
                      className={`hover:bg-zinc-50 transition ${
                        esDuplicada ? 'bg-red-50/60' : ''
                      }`}
                    >
                      {/* N° Orden */}
                      <td className="px-4 py-3.5 font-mono font-bold text-zinc-950">
                        <span className="flex items-center space-x-1.5">
                          <span>{oc.numero_orden}</span>
                          {esDuplicada && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white uppercase shadow-sm">
                              Duplicado
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Proveedor */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-zinc-950">{oc.nombre_proveedor}</div>
                        <span className="text-xs font-mono text-zinc-400">{oc.codigo_proveedor}</span>
                      </td>

                      {/* Fecha Emisión */}
                      <td className="px-4 py-3.5 text-center text-zinc-600 font-mono text-xs">
                        {new Date(oc.fecha_emision).toLocaleDateString()}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-900 text-white">
                          {oc.estado}
                        </span>
                      </td>

                      {/* Importe Total */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-zinc-950">
                        {formatMoneda(oc.total)}
                      </td>

                      {/* Observaciones */}
                      <td className="px-4 py-3.5 text-xs text-zinc-600 max-w-xs truncate">
                        {oc.observaciones}
                      </td>

                      {/* Botón Ver Partidas */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => verDetalle(oc.id_orden)}
                          className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition"
                          title="Ver partidas y desglose"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-zinc-400">
                    No se encontraron órdenes de compra con los filtros especificados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Panel de Detalle de Partidas */}
      {ordenSeleccionada && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera del Modal */}
            <div className="bg-zinc-950 text-white p-5 flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-red-600 text-white rounded-xl font-bold shadow-md shadow-red-600/30">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">
                    Detalle de Orden: {ordenSeleccionada.numero_orden}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Emisión: {new Date(ordenSeleccionada.fecha_emision).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOrdenSeleccionada(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div>
                  <span className="text-zinc-400 font-bold uppercase block">Proveedor:</span>
                  <strong className="text-zinc-950 text-sm block mt-0.5">{ordenSeleccionada.nombre_proveedor}</strong>
                  <span className="text-zinc-500 font-mono">{ordenSeleccionada.codigo_proveedor}</span>
                </div>
                <div>
                  <span className="text-zinc-400 font-bold uppercase block">Contacto & Teléfono:</span>
                  <span className="text-zinc-800 block mt-0.5">{ordenSeleccionada.telefono_proveedor || 'N/A'}</span>
                  <span className="text-zinc-500">{ordenSeleccionada.email_proveedor}</span>
                </div>
              </div>

              {/* Tabla de Partidas */}
              <div>
                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Partidas / Materiales Adquiridos:
                </h4>
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-950 text-white font-bold uppercase">
                      <tr>
                        <th className="p-3">Material</th>
                        <th className="p-3 text-right">Cantidad</th>
                        <th className="p-3 text-right">Precio Unit.</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {(ordenSeleccionada.detalles || []).map((det, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50">
                          <td className="p-3">
                            <span className="font-bold text-zinc-950 block">{det.nombre_material}</span>
                            <span className="font-mono text-zinc-400">{det.codigo_material}</span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-zinc-800">
                            {Number(det.cantidad).toLocaleString()} {det.unidad_medida}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {formatMoneda(det.precio_unitario)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-zinc-950">
                            {formatMoneda(det.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-zinc-50 font-bold text-zinc-900 border-t border-zinc-200">
                      <tr>
                        <td colSpan={3} className="p-3 text-right text-xs uppercase">Total de la Orden:</td>
                        <td className="p-3 text-right font-mono text-sm text-red-700 font-black">
                          {formatMoneda(ordenSeleccionada.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Observaciones */}
              <div className="text-xs text-zinc-700 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                <strong>Observaciones registradas:</strong> "{ordenSeleccionada.observaciones}"
              </div>
            </div>

            {/* Pie del Modal */}
            <div className="bg-zinc-50 px-6 py-4 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setOrdenSeleccionada(null)}
                className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
