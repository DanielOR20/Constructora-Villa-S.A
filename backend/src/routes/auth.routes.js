const { Router } = require('express');
const {
  register,
  login,
  getProfile,
  getUsuarios
} = require('../controllers/auth.controller');
const { verifyToken, requireRoles } = require('../middlewares/auth.middleware');

const router = Router();

/**
 * =============================================================================
 * RUTAS DE AUTENTICACIÓN Y SEGURIDAD JWT
 * Prefijo base: /api/auth
 * =============================================================================
 */

// Registro de nuevos usuarios
router.post('/register', register);

// Inicio de sesión y emisión de JWT
router.post('/login', login);

// Obtener perfil del usuario autenticado actual
router.get('/me', verifyToken, getProfile);

// Listar usuarios del sistema (solo roles directivos y compras)
router.get(
  '/usuarios',
  verifyToken,
  requireRoles('gerencia_general', 'gerencia_financiera', 'jefatura_compras'),
  getUsuarios
);

module.exports = router;
