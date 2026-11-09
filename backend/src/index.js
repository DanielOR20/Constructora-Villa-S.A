const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');

// Importación de módulos de enrutamiento
const materialesRoutes = require('./routes/materiales.routes');
const movimientosRoutes = require('./routes/movimientos.routes');
const alertasRoutes = require('./routes/alertas.routes');
const ordenesRoutes = require('./routes/ordenes.routes');
const inventarioRoutes = require('./routes/inventario.routes');

// Importación de middlewares globales de error
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();
const PORT = process.env.PORT || 4000;

// =============================================================================
// MIDDLEWARES GLOBALES DE SEGURIDAD Y PARSEO
// =============================================================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger HTTP de auditoría en consola
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    const duracion = Date.now() - inicio;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> Código: ${res.statusCode} (${duracion}ms)`);
  });
  next();
});

// =============================================================================
// DOCUMENTACIÓN Y CATÁLOGO RAÍZ
// =============================================================================
app.get('/', (req, res) => {
  res.status(200).json({
    sistema: 'Gestión de Inventarios - Constructora Del Valle S.A.',
    subtitulo: 'Sistema Transaccional y Motor de Reorden - Nivel Empresarial',
    caso_estudio: 'Auditoría de Inventarios y Compras (Quiz Barry Vega - Parte B)',
    estado: 'EN_LINEA',
    puerto: PORT,
    documentacion_endpoints: {
      materiales: {
        listar: 'GET /api/materiales',
        detalle: 'GET /api/materiales/:id',
        stock_individual: 'GET /api/materiales/:id/stock',
        reorden_matematico: 'GET /api/materiales/:id/reorden',
        crear: 'POST /api/materiales',
        actualizar: 'PUT /api/materiales/:id',
        eliminar: 'DELETE /api/materiales/:id'
      },
      movimientos: {
        listar: 'GET /api/movimientos (?limit=50&tipo=ENTRADA)',
        detalle: 'GET /api/movimientos/:id',
        registrar_transaccional: 'POST /api/movimientos (ACID con validación estricta de saldo)',
        stock_ubicaciones: 'GET /api/movimientos/stock/ubicaciones'
      },
      alertas: {
        resumen_ejecutivo: 'GET /api/alertas/resumen',
        analisis_reorden_completo: 'GET /api/alertas/reorden (Fórmulas con Math.ceil)',
        insumos_criticos: 'GET /api/alertas/reorden/criticos (Stock <= PR)',
        insumos_advertencia: 'GET /api/alertas/reorden/advertencias (PR < Stock <= PR * 1.25)',
        reorden_individual: 'GET /api/alertas/reorden/:id',
        auditoria_fugas_valor: 'GET /api/alertas/duplicados (Cuantificación en colones ₡)'
      },
      ordenes: {
        listar: 'GET /api/ordenes',
        detalle_con_partidas: 'GET /api/ordenes/:id',
        motor_auditoria_fugas: 'GET /api/ordenes/duplicadas'
      }
    }
  });
});

// =============================================================================
// REGISTRO DE RUTAS DE LA API REST
// =============================================================================
app.use('/api/materiales', materialesRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/ordenes-compra', ordenesRoutes); // Alias
app.use('/api/inventario', inventarioRoutes);   // Compatibilidad con frontend

// =============================================================================
// MANEJO DE RUTAS NO ENCONTRADAS (404)
// =============================================================================
app.use(notFoundHandler);

// =============================================================================
// MIDDLEWARE GLOBAL ROBUSTO DE MANEJO DE ERRORES (500 / CONTROLADOS)
// =============================================================================
app.use(errorHandler);

// =============================================================================
// INICIALIZACIÓN DEL SERVIDOR HTTP Y COMPROBACIÓN DE BASE DE DATOS
// =============================================================================
const server = app.listen(PORT, async () => {
  console.log('============================================================');
  console.log(`🚀 Servidor Express iniciado y escuchando en: http://localhost:${PORT}`);
  console.log(`📁 Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log('============================================================');

  // Comprobación resiliente de base de datos MySQL
  await testConnection();
});

// Manejo de señales para apagado ordenado (graceful shutdown)
process.on('SIGINT', () => {
  console.log('\n[Servidor] Recibida señal SIGINT. Cerrando servidor de forma ordenada...');
  server.close(() => {
    console.log('[Servidor] Servidor HTTP cerrado.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n[Servidor] Recibida señal SIGTERM. Cerrando servidor de forma ordenada...');
  server.close(() => {
    console.log('[Servidor] Servidor HTTP cerrado.');
    process.exit(0);
  });
});

module.exports = app;
