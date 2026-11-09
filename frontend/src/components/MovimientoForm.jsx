import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Package, 
  Building,
  FileText
} from 'lucide-react';
import { registrarMovimiento } from '../services/api';

export default function MovimientoForm({ 
  materiales = [], 
  bodegas = [],
  movimientosRecientes = [], 
  onMovimientoCreado 
}) {
  const [tipo, setTipo] = useState('ENTRADA'); // ENTRADA | SALIDA | TRASLADO | AJUSTE
  const [materialId, setMaterialId] = useState('');
  const [ubicacionOrigen, setUbicacionOrigen] = useState('Bodega Central');
  const [ubicacionDestino, setUbicacionDestino] = useState('Obra Torre Norte');
  const [cantidad, setCantidad] = useState('');
  const [documento, setDocumento] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Lista de ubicaciones oficiales
  const listaUbicaciones = [
    'Bodega Central',
    'Obra Torre Norte',
    'Obra Residencial Las Palmas',
    'Proveedor A (Acero y Cemento)',
    'Proveedor B (Agregados)',
    'Proveedor C (Prefabricados)'
  ];

  // Material seleccionado actualmente
  const materialSeleccionado = (materiales || []).find(
    (m) => String(m.id_material) === String(materialId)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessData(null);

    // 1. Validaciones del lado del cliente
    if (!materialId) {
      setError('Por favor selecciona un material del catálogo.');
      return;
    }

    const cantNum = Number(cantidad);
    if (!cantNum || isNaN(cantNum) || cantNum <= 0) {
      setError('La cantidad a registrar debe ser un valor numérico estrictamente mayor a 0.');
      return;
    }

    if (tipo === 'ENTRADA' && !ubicacionDestino.trim()) {
      setError('Para una ENTRADA debes seleccionar la ubicación de destino.');
      return;
    }

    if (tipo === 'SALIDA' && !ubicacionOrigen.trim()) {
      setError('Para una SALIDA debes seleccionar la ubicación de origen.');
      return;
    }

    if (tipo === 'TRASLADO') {
      if (!ubicacionOrigen.trim() || !ubicacionDestino.trim()) {
        setError('Para un TRASLADO debes especificar tanto la ubicación origen como la de destino.');
        return;
      }
      if (ubicacionOrigen.trim().toLowerCase() === ubicacionDestino.trim().toLowerCase()) {
        setError('La ubicación de origen y destino no pueden ser iguales en un traslado.');
        return;
      }
    }

    // Validación preventiva de stock en salidas y traslados
    if ((tipo === 'SALIDA' || tipo === 'TRASLADO') && materialSeleccionado) {
      const stockDisponible = materialSeleccionado.stock_actual_calculado ?? materialSeleccionado.stock_actual ?? 0;
      if (cantNum > stockDisponible) {
        setError(
          `Alerta preventiva: El material "${materialSeleccionado.nombre}" tiene solo ${stockDisponible} ${materialSeleccionado.unidad_medida} disponibles. La transacción será rechazada por el servidor con error HTTP 400 si el saldo resulta negativo.`
        );
      }
    }

    try {
      setLoading(true);

      const payload = {
        tipo_movimiento: tipo === 'TRASLADO' ? 'TRANSFERENCIA' : tipo,
        id_material: Number(materialId),
        cantidad: cantNum,
        ubicacion_origen: tipo === 'ENTRADA' ? null : ubicacionOrigen.trim(),
        ubicacion_destino: tipo === 'SALIDA' ? null : ubicacionDestino.trim(),
        documento_referencia: documento.trim() || `DOC-${Date.now().toString().slice(-6)}`,
        observaciones: observaciones.trim()
      };

      const respuesta = await registrarMovimiento(payload);

      setSuccessData(respuesta.data || respuesta);
      setCantidad('');
      setDocumento('');
      setObservaciones('');

      if (onMovimientoCreado) {
        onMovimientoCreado();
      }
    } catch (err) {
      console.error('Error al registrar movimiento:', err);
      const backendError =
        err.response?.data?.error?.mensaje ||
        err.response?.data?.message ||
        err.message ||
        'Error inesperado al conectar con el servidor backend.';
      setError(backendError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      {/* Columna Izquierda: Formulario Validado */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 sm:p-8">
          <div className="border-b border-zinc-200 pb-4 mb-6">
            <h2 className="text-xl font-black text-zinc-950 tracking-tight flex items-center space-x-2.5">
              <PlusCircle className="w-6 h-6 text-red-600" />
              <span>Registrar Movimiento de Inventario</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Transacción ACID en MySQL con validación y rollback automático ante saldo negativo
            </p>
          </div>

          {/* Banner de Error HTTP / Validación */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-900 text-xs sm:text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <strong className="font-bold block">Error en la transacción de inventario:</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Banner de Éxito Transaccional */}
          {successData && (
            <div className="mb-6 p-4 rounded-xl bg-zinc-950 border-l-4 border-red-600 text-white text-xs sm:text-sm flex items-start space-x-3 shadow-md">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-white mt-0.5" />
              <div>
                <strong className="font-bold block text-white">Transacción confirmada en Base de Datos (Commit Exitoso)</strong>
                <span className="text-zinc-300">
                  Movimiento de {successData.tipo_movimiento} por {successData.cantidad} {successData.unidad_medida} registrado bajo folio <strong>{successData.documento_referencia}</strong>.
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Selector de Tipo de Movimiento */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Tipo de Transacción: *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'ENTRADA', label: 'Entrada', desc: 'Compra / Ingreso' },
                  { id: 'SALIDA', label: 'Salida', desc: 'Consumo en Obra' },
                  { id: 'TRASLADO', label: 'Traslado', desc: 'Entre Almacenes' },
                  { id: 'AJUSTE', label: 'Ajuste', desc: 'Conteo Físico' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTipo(item.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      tipo === item.id
                        ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-600/20 font-bold'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Selector de Material */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Material / Insumo: *
                </label>
                {materialSeleccionado && (
                  <span className="text-xs font-semibold text-zinc-500">
                    Stock Disponible: <strong className="text-zinc-950 font-mono">{materialSeleccionado.stock_actual_calculado ?? materialSeleccionado.stock_actual ?? 0} {materialSeleccionado.unidad_medida}</strong>
                  </span>
                )}
              </div>
              <div className="relative">
                <Package className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <select
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
                >
                  <option value="">-- Seleccionar material del catálogo --</option>
                  {(materiales || []).map((m) => (
                    <option key={m.id_material} value={m.id_material}>
                      {m.nombre} ({m.codigo}) — {m.unidad_medida} | Stock: {m.stock_actual_calculado ?? m.stock_actual ?? 0}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Cantidad a Mover y Documento de Origen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Cantidad a Mover: *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="Ej: 150"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Documento de Referencia / Origen:
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ej: OC-1041, REM-501, VALE-22"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
                  />
                </div>
              </div>
            </div>

            {/* 4. Ubicaciones según el Tipo de Transacción */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tipo !== 'ENTRADA' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Ubicación Origen (Retiro de): *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    <select
                      value={ubicacionOrigen}
                      onChange={(e) => setUbicacionOrigen(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
                    >
                      {listaUbicaciones.map((u, idx) => (
                        <option key={idx} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {tipo !== 'SALIDA' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Ubicación Destino (Recepción en): *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    <select
                      value={ubicacionDestino}
                      onChange={(e) => setUbicacionDestino(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
                    >
                      {listaUbicaciones.map((u, idx) => (
                        <option key={idx} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Observaciones */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Observaciones / Justificación de la Operación:
              </label>
              <textarea
                rows="2"
                placeholder="Ej: Suministro para colado de trabes en nivel 4"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full px-4 py-2.5 border border-zinc-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
              ></textarea>
            </div>

            {/* Botón Principal de Acción - Rojo Corporativo */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 tracking-wide"
            >
              {loading ? (
                <span>Ejecutando transacción ACID en MySQL...</span>
              ) : (
                <>
                  <ArrowLeftRight className="w-5 h-5" />
                  <span>Procesar y Confirmar Transacción</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Columna Derecha: Feed de Últimos Movimientos */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-5">
          <div className="flex items-center space-x-2 border-b border-zinc-100 pb-3 mb-4">
            <History className="w-5 h-5 text-zinc-900" />
            <h3 className="font-black text-zinc-950 text-base">Últimas Transacciones</h3>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {movimientosRecientes && movimientosRecientes.length > 0 ? (
              movimientosRecientes.slice(0, 8).map((m) => {
                const isSalida = m.tipo_movimiento === 'SALIDA';

                return (
                  <div key={m.id_movimiento} className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs space-y-1.5 hover:border-zinc-300 transition">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full font-black border text-[10px] ${
                        isSalida 
                          ? 'bg-red-100 text-red-700 border-red-200' 
                          : 'bg-zinc-900 text-white border-zinc-800'
                      }`}>
                        {m.tipo_movimiento}
                      </span>
                      <span className="text-zinc-400 font-mono text-[11px]">
                        {new Date(m.fecha).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="font-bold text-zinc-950 text-sm">
                      {m.material_nombre}
                    </div>

                    <div className="flex items-center justify-between text-zinc-600 font-medium">
                      <span>Cantidad: <strong className="text-zinc-950 font-mono">{Number(m.cantidad).toLocaleString()} {m.unidad_medida}</strong></span>
                      <span className="font-mono text-zinc-400">{m.documento_referencia}</span>
                    </div>

                    <div className="text-[11px] text-zinc-500">
                      {m.ubicacion_origen && <span>De: <strong>{m.ubicacion_origen}</strong> </span>}
                      {m.ubicacion_destino && <span>A: <strong>{m.ubicacion_destino}</strong></span>}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-zinc-400 py-8 text-center">No hay transacciones recientes registradas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
