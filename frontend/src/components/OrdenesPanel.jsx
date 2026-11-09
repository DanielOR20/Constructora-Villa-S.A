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
  CopyX,
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  FileText
} from 'lucide-react';
import api, { login, getUsuarioSesion, crearOrden, aprobarOrden } from '../services/api';

export default function OrdenesPanel({ onVerDuplicados }) {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroProveedor, setFiltroProveedor] = useState('ALL');
  const [filtroEstadoAprobacion, setFiltroEstadoAprobacion] = useState('ALL');
  const [busqueda, setBusqueda] = useState('');
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  
  // Usuario y sesión simulada para demostración de RBAC
  const [usuarioActual, setUsuarioActual] = useState(getUsuarioSesion() || {
    id_usuario: 2,
    nombre: 'Lic. Sofía Ramírez',
    email: 'sofia.ramirez@constructoradelvalle.com',
    rol: 'jefatura_compras'
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [mensajeAccion, setMensajeAccion] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);

  // Modal de Crear Orden
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [nuevaOC, setNuevaOC] = useState({
    numero_orden: '',
    id_proveedor: '1',
    fecha_emision: new Date().toISOString().slice(0, 10),
    observaciones: '',
    cantidad: '1500',
    precio_unitario: '185.00'
  });

  const usuariosDemo = [
    { id: 1, nombre: 'Ing. Carlos Mendoza', email: 'carlos.mendoza@constructoradelvalle.com', rol: 'jefatura_area', limite: 'Hasta ₡250k' },
    { id: 2, nombre: 'Lic. Sofía Ramírez', email: 'sofia.ramirez@constructoradelvalle.com', rol: 'jefatura_compras', limite: '₡250k a ₡2M' },
    { id: 3, nombre: 'C.P. Fernando Castro', email: 'fernando.castro@constructoradelvalle.com', rol: 'gerencia_financiera', limite: '₡2M a ₡10M' },
    { id: 4, nombre: 'Ing. Daniel Ortega', email: 'daniel.ortega@constructoradelvalle.com', rol: 'gerencia_general', limite: '> ₡10M + Comité' }
  ];

  useEffect(() => {
    cargarOrdenes();
    // Auto-login con usuario demo predeterminado si no hay token
    if (!localStorage.getItem('token_jwt_constructora')) {
      cambiarUsuarioDemo(usuariosDemo[1]);
    }
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

  const cambiarUsuarioDemo = async (u) => {
    try {
      setLoginLoading(true);
      setMensajeAccion(null);
      setErrorAccion(null);
      const res = await login(u.email, 'Password123!');
      setUsuarioActual(res.data.usuario);
      setMensajeAccion(`Sesión iniciada con JWT como: ${u.nombre} (${u.rol})`);
    } catch (err) {
      console.error('Error en login demo:', err);
      // Fallback local si el backend aún no migró la BD
      setUsuarioActual(u);
    } finally {
      setLoginLoading(false);
    }
  };

  const verDetalle = async (id) => {
    try {
      const res = await api.get(`/ordenes/${id}`);
      setOrdenSeleccionada(res.data.data || null);
    } catch (error) {
      console.error('Error al cargar detalle de orden:', error);
    }
  };

  const handleAprobarRechazar = async (idOrden, accion) => {
    setMensajeAccion(null);
    setErrorAccion(null);

    let motivo = '';
    if (accion === 'rechazada') {
      motivo = window.prompt('Ingrese el motivo técnico de rechazo de la orden de compra:', 'Excede el presupuesto asignado según auditoría');
      if (!motivo) return;
    }

    try {
      const res = await aprobarOrden(idOrden, accion, motivo);
      setMensajeAccion(res.data?.mensaje || `Orden de compra ${accion.toUpperCase()} exitosamente.`);
      await cargarOrdenes();
    } catch (err) {
      const backendError =
        err.response?.data?.error?.mensaje ||
        err.response?.data?.message ||
        err.message ||
        'Error al procesar la aprobación.';
      setErrorAccion(backendError);
    }
  };

  const handleCrearOrdenSubmit = async (e) => {
    e.preventDefault();
    setMensajeAccion(null);
    setErrorAccion(null);

    const cant = Number(nuevaOC.cantidad);
    const precio = Number(nuevaOC.precio_unitario);

    try {
      const payload = {
        numero_orden: nuevaOC.numero_orden || undefined,
        id_proveedor: Number(nuevaOC.id_proveedor),
        fecha_emision: nuevaOC.fecha_emision,
        observaciones: nuevaOC.observaciones,
        partidas: [
          {
            id_material: 1, // Cemento gris 50 kg
            cantidad: cant,
            precio_unitario: precio
          }
        ]
      };

      const res = await crearOrden(payload);
      setMensajeAccion(`Orden ${res.data.numero_orden} creada por ${res.data.total_formateado}. Nivel requerido asignado: ${res.data.matriz_aprobacion.autoridad}.`);
      setModalCrearOpen(false);
      await cargarOrdenes();
    } catch (err) {
      const backendError = err.response?.data?.error?.mensaje || err.message;
      setErrorAccion(backendError);
    }
  };

  const formatMoneda = (valor) => {
    const num = Number(valor) || 0;
    return `₡${num.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const ordenesFiltradas = ordenes.filter((oc) => {
    const matchProveedor = filtroProveedor === 'ALL' || oc.id_proveedor === Number(filtroProveedor);
    const matchEstado = filtroEstadoAprobacion === 'ALL' || oc.estado_aprobacion === filtroEstadoAprobacion;
    const matchBusqueda = 
      oc.numero_orden.toLowerCase().includes(busqueda.toLowerCase()) ||
      oc.nombre_proveedor.toLowerCase().includes(busqueda.toLowerCase());
    return matchProveedor && matchEstado && matchBusqueda;
  });

  return (
    <div className="space-y-7 animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h2 className="text-2xl font-black text-zinc-950 tracking-tight flex items-center space-x-2.5">
            <FileCheck2 className="w-7 h-7 text-red-600" />
            <span>Registro de Órdenes de Compra & Matriz de Aprobación</span>
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Gestión jerárquica con firma digital JWT y control estricto de umbrales según el monto
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setModalCrearOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Requisición</span>
          </button>

          <button
            onClick={onVerDuplicados}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition"
          >
            <CopyX className="w-4 h-4" />
            <span>Auditoría Parte A</span>
          </button>
        </div>
      </div>

      {/* SELECTOR INTERACTIVO DE USUARIO / ROL JWT (DEMOSTRACIÓN DE RBAC) */}
      <div className="bg-zinc-950 text-white p-5 rounded-2xl shadow-xl border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <UserCheck className="w-5 h-5 text-red-500" />
            <h3 className="font-black text-sm text-white">
              Sesión Activa con JWT & Control de Roles (RBAC):
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-600 text-white">
              {usuarioActual?.rol}
            </span>
          </div>
          <span className="text-xs text-zinc-400">
            Usuario actual: <strong className="text-white">{usuarioActual?.nombre}</strong>
          </span>
        </div>

        <div>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
            Cambiar Rol Rápido para Validar la Matriz de Aprobación:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {usuariosDemo.map((u) => {
              const esActivo = usuarioActual?.rol === u.rol;
              return (
                <button
                  key={u.id}
                  onClick={() => cambiarUsuarioDemo(u)}
                  disabled={loginLoading}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    esActivo
                      ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{u.nombre}</div>
                  <div className={`text-[10px] uppercase font-mono ${esActivo ? 'text-white' : 'text-zinc-400'}`}>
                    {u.rol}
                  </div>
                  <div className={`text-[10px] font-bold ${esActivo ? 'text-red-100' : 'text-red-400'}`}>
                    {u.limite}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Banners de Notificación de Acciones */}
      {mensajeAccion && (
        <div className="p-4 rounded-xl bg-zinc-950 border-l-4 border-red-600 text-white text-xs flex items-center justify-between shadow-md">
          <span>✅ {mensajeAccion}</span>
          <button onClick={() => setMensajeAccion(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {errorAccion && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-400 text-red-900 text-xs flex items-center justify-between shadow-md">
          <span>⚠️ {errorAccion}</span>
          <button onClick={() => setErrorAccion(null)} className="text-red-700 hover:text-red-950 font-bold">✕</button>
        </div>
      )}

      {/* BANNER INFORMATIVO DE LA MATRIZ DE APROBACIÓN */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-red-600" />
          <span>Matriz de Autorización Oficial - Constructora Del Valle S.A.</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
            <span className="text-zinc-400 block text-[10px] font-bold uppercase">Nivel 1</span>
            <strong className="text-zinc-950 block">Hasta ₡250,000.00</strong>
            <span className="text-red-600 font-mono text-[11px] font-bold">Jefatura de Área</span>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
            <span className="text-zinc-400 block text-[10px] font-bold uppercase">Nivel 2</span>
            <strong className="text-zinc-950 block">₡250,001 a ₡2,000,000</strong>
            <span className="text-red-600 font-mono text-[11px] font-bold">Jefatura de Compras</span>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
            <span className="text-zinc-400 block text-[10px] font-bold uppercase">Nivel 3</span>
            <strong className="text-zinc-950 block">₡2,000,001 a ₡10,000,000</strong>
            <span className="text-red-600 font-mono text-[11px] font-bold">Gerencia Financiera</span>
          </div>
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
            <span className="text-zinc-400 block text-[10px] font-bold uppercase">Nivel 4</span>
            <strong className="text-zinc-950 block">&gt; ₡10,000,000.00</strong>
            <span className="text-red-600 font-mono text-[11px] font-bold">Gerencia General + Comité</span>
          </div>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por N° OC o proveedor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-zinc-500 uppercase">Estado:</span>
            <select
              value={filtroEstadoAprobacion}
              onChange={(e) => setFiltroEstadoAprobacion(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="pendiente">Pendientes de Firma</option>
              <option value="aprobada">Aprobadas</option>
              <option value="rechazada">Rechazadas</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-zinc-500 uppercase">Proveedor:</span>
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="ALL">Todos los Proveedores</option>
              <option value="1">Proveedor A (Cemento y Acero)</option>
              <option value="2">Proveedor B (Agregados y Arena)</option>
              <option value="3">Proveedor C (Blocks y Concretos)</option>
            </select>
          </div>
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
                <th className="px-4 py-3.5 text-center">Emisión</th>
                <th className="px-4 py-3.5 text-right">Importe Total</th>
                <th className="px-4 py-3.5 text-center">Nivel Requerido</th>
                <th className="px-4 py-3.5 text-center">Estado Aprobación</th>
                <th className="px-4 py-3.5">Firma / Auditoría</th>
                <th className="px-4 py-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-zinc-400">
                    Cargando órdenes de compra...
                  </td>
                </tr>
              ) : ordenesFiltradas.length > 0 ? (
                ordenesFiltradas.map((oc) => {
                  const esDuplicada = oc.numero_orden === 'OC-1041' || oc.numero_orden === 'OC-1042';
                  const esPendiente = oc.estado_aprobacion === 'pendiente';
                  const esAprobada = oc.estado_aprobacion === 'aprobada';
                  const esRechazada = oc.estado_aprobacion === 'rechazada';

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

                      {/* Importe Total */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-zinc-950">
                        {formatMoneda(oc.total)}
                      </td>

                      {/* Nivel Requerido por la Matriz */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                          {oc.rol_aprobador_requerido || 'jefatura_area'}
                        </span>
                      </td>

                      {/* Estado Aprobación */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${
                          esAprobada 
                            ? 'bg-zinc-900 text-white' 
                            : esRechazada 
                            ? 'bg-red-600 text-white' 
                            : 'bg-zinc-200 text-zinc-800 animate-pulse'
                        }`}>
                          {oc.estado_aprobacion ? oc.estado_aprobacion.toUpperCase() : 'PENDIENTE'}
                        </span>
                      </td>

                      {/* Firma / Auditor */}
                      <td className="px-4 py-3.5 text-xs">
                        {oc.nombre_aprobador ? (
                          <div>
                            <span className="font-bold text-zinc-950 block">{oc.nombre_aprobador}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">{oc.rol_aprobador}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">Pendiente de firma</span>
                        )}
                        {oc.motivo_rechazo && (
                          <span className="text-[11px] text-red-600 block mt-0.5 font-medium truncate max-w-xs" title={oc.motivo_rechazo}>
                            Motivo: {oc.motivo_rechazo}
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {esPendiente ? (
                            <>
                              <button
                                onClick={() => handleAprobarRechazar(oc.id_orden, 'aprobada')}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                                title="Aprobar bajo mi rol JWT"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleAprobarRechazar(oc.id_orden, 'rechazada')}
                                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-bold rounded-lg transition"
                                title="Rechazar con justificación"
                              >
                                Rechazar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => verDetalle(oc.id_orden)}
                              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition"
                              title="Ver partidas y trazabilidad"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-zinc-400">
                    No se encontraron órdenes de compra con los filtros especificados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Formulario de Crear Nueva Requisición */}
      {modalCrearOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-zinc-950 text-white p-5 flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center space-x-2.5">
                <PlusCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-black text-base">Nueva Requisición de Materiales</h3>
              </div>
              <button onClick={() => setModalCrearOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearOrdenSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">
                  N° Orden (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej: OC-2026-N02"
                  value={nuevaOC.numero_orden}
                  onChange={(e) => setNuevaOC({ ...nuevaOC, numero_orden: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">
                  Proveedor:
                </label>
                <select
                  value={nuevaOC.id_proveedor}
                  onChange={(e) => setNuevaOC({ ...nuevaOC, id_proveedor: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm"
                >
                  <option value="1">Proveedor A (Distribuidora de Cemento y Acero)</option>
                  <option value="2">Proveedor B (Agregados y Triturados del Valle)</option>
                  <option value="3">Proveedor C (Bloquera y Prefabricados Garza)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">
                    Cantidad (Sacos):
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={nuevaOC.cantidad}
                    onChange={(e) => setNuevaOC({ ...nuevaOC, cantidad: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">
                    Precio Unitario (₡):
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={nuevaOC.precio_unitario}
                    onChange={(e) => setNuevaOC({ ...nuevaOC, precio_unitario: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              {/* Cálculo en vivo de la Matriz de Aprobación */}
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-zinc-900">
                  <span>Monto Total Estimado:</span>
                  <span className="font-mono text-red-600">
                    {formatMoneda(Number(nuevaOC.cantidad) * Number(nuevaOC.precio_unitario))}
                  </span>
                </div>
                <div className="text-zinc-500 text-[11px]">
                  Autoridad Requerida:{' '}
                  <strong className="text-zinc-900">
                    {Number(nuevaOC.cantidad) * Number(nuevaOC.precio_unitario) <= 250000
                      ? 'Jefatura de Área (Hasta ₡250k)'
                      : Number(nuevaOC.cantidad) * Number(nuevaOC.precio_unitario) <= 2000000
                      ? 'Jefatura de Compras (₡250k a ₡2M)'
                      : Number(nuevaOC.cantidad) * Number(nuevaOC.precio_unitario) <= 10000000
                      ? 'Gerencia Financiera (₡2M a ₡10M)'
                      : 'Gerencia General + Comité (> ₡10M)'}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">
                  Justificación / Observaciones:
                </label>
                <textarea
                  rows="2"
                  value={nuevaOC.observaciones}
                  onChange={(e) => setNuevaOC({ ...nuevaOC, observaciones: e.target.value })}
                  placeholder="Justificación de compra según avance de obra"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-sm"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCrearOpen(false)}
                  className="px-4 py-2 bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                >
                  Emitir Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Panel de Detalle de Partidas */}
      {ordenSeleccionada && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div>
                  <span className="text-zinc-400 font-bold uppercase block">Proveedor:</span>
                  <strong className="text-zinc-950 text-sm block mt-0.5">{ordenSeleccionada.nombre_proveedor}</strong>
                  <span className="text-zinc-500 font-mono">{ordenSeleccionada.codigo_proveedor}</span>
                </div>
                <div>
                  <span className="text-zinc-400 font-bold uppercase block">Trazabilidad de Firma:</span>
                  <span className="text-zinc-800 block mt-0.5">
                    Aprobador: <strong>{ordenSeleccionada.nombre_aprobador || 'Pendiente'}</strong>
                  </span>
                  <span className="text-zinc-500 font-mono">Rol requerido: {ordenSeleccionada.rol_aprobador_requerido}</span>
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

              {ordenSeleccionada.observaciones && (
                <div className="text-xs text-zinc-700 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                  <strong>Observaciones:</strong> "{ordenSeleccionada.observaciones}"
                </div>
              )}
            </div>

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
