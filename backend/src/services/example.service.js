const { pool } = require('../db/connection');

/**
 * Servicio de ejemplo para interactuar con la base de datos o lógica de negocio
 */
const getStatus = async () => {
  return {
    status: 'online',
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  getStatus
};

