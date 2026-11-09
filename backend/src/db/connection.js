// Re-exportación para retrocompatibilidad con la nueva arquitectura en src/config/db.js
const { pool, testConnection } = require('../config/db');

module.exports = {
  pool,
  testConnection
};
