const {
  registrarUsuario,
  loginUsuario,
  obtenerUsuarioPorId,
  listarUsuarios
} = require('../services/auth.service');

/**
 * =============================================================================
 * CONTROLADOR DE AUTENTICACIÓN Y ROLES (JWT)
 * Constructora Del Valle S.A.
 * =============================================================================
 */

const register = async (req, res, next) => {
  try {
    const { nombre, email, password, rol } = req.body;
    const nuevoUsuario = await registrarUsuario({ nombre, email, password, rol });

    return res.status(201).json({
      success: true,
      mensaje: 'Usuario registrado exitosamente.',
      data: nuevoUsuario
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const resultado = await loginUsuario({ email, password });

    return res.status(200).json({
      success: true,
      mensaje: 'Autenticación exitosa.',
      data: resultado
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const perfil = await obtenerUsuarioPorId(req.user.id_usuario);

    if (!perfil) {
      return res.status(404).json({
        success: false,
        error: {
          codigo: 'USUARIO_NO_ENCONTRADO',
          mensaje: 'El usuario autenticado no existe en la base de datos.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: perfil
    });
  } catch (error) {
    next(error);
  }
};

const getUsuarios = async (req, res, next) => {
  try {
    const usuarios = await listarUsuarios();

    return res.status(200).json({
      success: true,
      total: usuarios.length,
      data: usuarios
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getUsuarios
};
