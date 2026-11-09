const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { JWT_SECRET } = require('../middlewares/auth.middleware');

/**
 * =============================================================================
 * SERVICIO DE AUTENTICACIÓN Y GESTIÓN DE USUARIOS (RBAC)
 * Constructora Del Valle S.A.
 * =============================================================================
 */

const ROLES_PERMITIDOS = [
  'jefatura_area',
  'jefatura_compras',
  'gerencia_financiera',
  'gerencia_general'
];

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Registra un nuevo usuario en la base de datos con contraseña cifrada
 * @param {Object} datos
 * @param {string} datos.nombre
 * @param {string} datos.email
 * @param {string} datos.password
 * @param {string} datos.rol
 * @returns {Promise<Object>} Usuario creado sin password_hash
 */
const registrarUsuario = async ({ nombre, email, password, rol }) => {
  if (!nombre || !nombre.trim()) {
    const error = new Error('El nombre completo del usuario es obligatorio.');
    error.status = 400;
    error.codigo = 'NOMBRE_REQUERIDO';
    throw error;
  }

  if (!email || !email.trim()) {
    const error = new Error('El correo electrónico es obligatorio.');
    error.status = 400;
    error.codigo = 'EMAIL_REQUERIDO';
    throw error;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    const error = new Error('El formato del correo electrónico es inválido.');
    error.status = 400;
    error.codigo = 'FORMATO_EMAIL_INVALIDO';
    throw error;
  }

  if (!password || password.length < 6) {
    const error = new Error('La contraseña debe contener al menos 6 caracteres.');
    error.status = 400;
    error.codigo = 'PASSWORD_INVALIDO';
    throw error;
  }

  const rolNormalizado = (rol || 'jefatura_area').toLowerCase().trim();
  if (!ROLES_PERMITIDOS.includes(rolNormalizado)) {
    const error = new Error(`El rol especificado es inválido. Roles permitidos: [${ROLES_PERMITIDOS.join(', ')}].`);
    error.status = 400;
    error.codigo = 'ROL_INVALIDO';
    throw error;
  }

  // Verificar unicidad de email
  const [existentes] = await pool.query(
    'SELECT id_usuario FROM usuarios WHERE email = ?',
    [email.trim().toLowerCase()]
  );

  if (existentes.length > 0) {
    const error = new Error(`Ya existe un usuario registrado con el correo: ${email}.`);
    error.status = 409;
    error.codigo = 'EMAIL_DUPLICADO';
    throw error;
  }

  // Generar hash seguro con bcrypt
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const queryInsert = `
    INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
    VALUES (?, ?, ?, ?, TRUE)
  `;

  const [result] = await pool.query(queryInsert, [
    nombre.trim(),
    email.trim().toLowerCase(),
    passwordHash,
    rolNormalizado
  ]);

  return {
    id_usuario: result.insertId,
    nombre: nombre.trim(),
    email: email.trim().toLowerCase(),
    rol: rolNormalizado,
    activo: true,
    mensaje: 'Usuario registrado exitosamente en el sistema.'
  };
};

/**
 * Autentica un usuario y genera su token JWT firmado
 * @param {Object} credenciales
 * @param {string} credenciales.email
 * @param {string} credenciales.password
 * @returns {Promise<Object>} Token JWT y perfil del usuario
 */
const loginUsuario = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error('Debe proporcionar tanto el correo electrónico como la contraseña.');
    error.status = 400;
    error.codigo = 'CREDENCIALES_INCOMPLETAS';
    throw error;
  }

  const [rows] = await pool.query(
    'SELECT id_usuario, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = ?',
    [email.trim().toLowerCase()]
  );

  if (rows.length === 0) {
    const error = new Error('Credenciales inválidas: No se encontró ningún usuario con ese correo electrónico.');
    error.status = 401;
    error.codigo = 'CREDENCIALES_INVALIDAS';
    throw error;
  }

  const usuario = rows[0];

  if (!usuario.activo) {
    const error = new Error('Su cuenta de usuario ha sido desactivada. Comuníquese con la administración.');
    error.status = 403;
    error.codigo = 'CUENTA_DESACTIVADA';
    throw error;
  }

  const passwordValido = await bcrypt.compare(password, usuario.password_hash);

  if (!passwordValido) {
    const error = new Error('Credenciales inválidas: La contraseña ingresada es incorrecta.');
    error.status = 401;
    error.codigo = 'CREDENCIALES_INVALIDAS';
    throw error;
  }

  // Payload seguro dentro del token JWT
  const payload = {
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  return {
    token,
    token_tipo: 'Bearer',
    expira_en: JWT_EXPIRES_IN,
    usuario: {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    }
  };
};

/**
 * Obtiene el perfil de un usuario por su ID
 * @param {number} id_usuario 
 * @returns {Promise<Object|null>}
 */
const obtenerUsuarioPorId = async (id_usuario) => {
  const [rows] = await pool.query(
    'SELECT id_usuario, nombre, email, rol, activo, created_at, updated_at FROM usuarios WHERE id_usuario = ?',
    [Number(id_usuario)]
  );

  return rows.length > 0 ? rows[0] : null;
};

/**
 * Lista todos los usuarios registrados en el sistema
 * @returns {Promise<Array<Object>>}
 */
const listarUsuarios = async () => {
  const [rows] = await pool.query(
    'SELECT id_usuario, nombre, email, rol, activo, created_at, updated_at FROM usuarios ORDER BY rol ASC, nombre ASC'
  );

  return rows;
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  obtenerUsuarioPorId,
  listarUsuarios,
  ROLES_PERMITIDOS
};

