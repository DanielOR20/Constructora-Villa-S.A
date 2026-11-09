const jwt = require('jsonwebtoken');

/**
 * =============================================================================
 * MIDDLEWARE DE AUTENTICACIÓN JWT Y CONTROL DE ACCESO BASADO EN ROLES (RBAC)
 * Constructora Del Valle S.A.
 * =============================================================================
 */

const JWT_SECRET = process.env.JWT_SECRET || 'constructora_del_valle_jwt_secret_key_2026_barry_vega';

/**
 * Escala jerárquica de roles para la Matriz de Aprobación de Órdenes de Compra
 */
const JERARQUIA_ROLES = {
  jefatura_area: 1,
  jefatura_compras: 2,
  gerencia_financiera: 3,
  gerencia_general: 4
};

/**
 * Middleware para verificar la validez del token JWT enviado en el header Authorization
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: {
        codigo: 'TOKEN_NO_PROPORCIONADO',
        mensaje: 'Acceso no autorizado: Debe proporcionar un token JWT en el encabezado Authorization (Bearer <token>).'
      }
    });
  }

  const partes = authHeader.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: {
        codigo: 'FORMATO_TOKEN_INVALIDO',
        mensaje: 'Formato de autorización inválido. Debe ser: "Bearer <token>".'
      }
    });
  }

  const token = partes[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id_usuario, nombre, email, rol, iat, exp }
    next();
  } catch (error) {
    let mensaje = 'Token JWT inválido o expirado.';
    let codigo = 'TOKEN_INVALIDO';

    if (error.name === 'TokenExpiredError') {
      codigo = 'TOKEN_EXPIRADO';
      mensaje = 'La sesión ha expirado. Por favor inicie sesión nuevamente para renovar su token.';
    }

    return res.status(401).json({
      success: false,
      error: {
        codigo,
        mensaje,
        detalle: error.message
      }
    });
  }
};

/**
 * Middleware para restringir acceso exclusivamente a ciertos roles específicos
 * @param  {...string} rolesPermitidos - Lista de roles autorizados
 */
const requireRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(401).json({
        success: false,
        error: {
          codigo: 'USUARIO_NO_AUTENTICADO',
          mensaje: 'Se requiere autenticación para verificar los permisos de rol.'
        }
      });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        error: {
          codigo: 'ACCESO_DENEGADO',
          mensaje: `Permisos insuficientes. Su rol actual es '${req.user.rol}', pero esta operación requiere uno de los siguientes roles: [${rolesPermitidos.join(', ')}].`
        }
      });
    }

    next();
  };
};

/**
 * Valida si el rol de un usuario cumple o supera la jerarquía mínima requerida
 * @param {string} rolUsuario 
 * @param {string} rolRequerido 
 * @returns {boolean}
 */
const cumpleJerarquiaMinima = (rolUsuario, rolRequerido) => {
  const nivelUsuario = JERARQUIA_ROLES[rolUsuario] || 0;
  const nivelRequerido = JERARQUIA_ROLES[rolRequerido] || 999;
  return nivelUsuario >= nivelRequerido;
};

module.exports = {
  verifyToken,
  requireRoles,
  cumpleJerarquiaMinima,
  JERARQUIA_ROLES,
  JWT_SECRET
};
