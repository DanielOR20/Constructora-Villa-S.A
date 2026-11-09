/**
 * =============================================================================
 * MIDDLEWARE GLOBAL DE MANEJO DE ERRORES Y EXCEPCIONES
 * Gestión de Inventarios - Constructora Del Valle S.A.
 * =============================================================================
 */

/**
 * Middleware centralizado para captura de errores HTTP y de base de datos
 */
const errorHandler = (err, req, res, next) => {
  // Timestamp del evento
  const timestamp = new Date().toISOString();

  // Log detallado en consola para trazabilidad técnica
  console.error('[Error Middleware] Excepción interceptada:', {
    timestamp,
    metodo: req.method,
    url: req.originalUrl,
    nombreError: err.name,
    mensaje: err.message,
    codigoError: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // 1. Errores con código de estado HTTP explícito establecido en controladores/servicios
  let statusCode = err.statusCode || err.status || 500;
  let mensaje = err.message || 'Error interno en el servidor';
  let detalles = err.detalles || null;

  // 2. Mapeo especializado de errores comunes de MySQL (mysql2)
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409; // Conflicto
    mensaje = 'Violación de restricción de unicidad: El registro con esos datos ya existe en la base de datos.';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    statusCode = 400; // Bad Request por llave foránea inexistente
    mensaje = 'Violación de integridad referencial: El registro foráneo asociado no existe.';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 409;
    mensaje = 'No se puede eliminar o modificar el registro porque está siendo referenciado por otras transacciones.';
  } else if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    statusCode = 503; // Servicio no disponible
    mensaje = 'El servicio de base de datos MySQL no se encuentra disponible temporalmente.';
  } else if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    statusCode = 400;
    mensaje = 'Cuerpo de la petición JSON malformado o inválido.';
  }

  // 3. Respuesta JSON estandarizada para clientes y frontend
  return res.status(statusCode).json({
    success: false,
    error: {
      codigo: err.code || (statusCode === 400 ? 'BAD_REQUEST' : statusCode === 404 ? 'NOT_FOUND' : statusCode === 409 ? 'CONFLICT' : 'INTERNAL_SERVER_ERROR'),
      mensaje,
      detalles,
      statusCode,
      timestamp,
      ruta: req.originalUrl
    }
  });
};

/**
 * Middleware para rutas no encontradas (404)
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      codigo: 'ROUTE_NOT_FOUND',
      mensaje: `La ruta solicitada ${req.method} ${req.originalUrl} no existe en este servidor.`,
      statusCode: 404,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};

