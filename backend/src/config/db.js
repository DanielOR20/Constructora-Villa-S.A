const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

/**
 * =============================================================================
 * GESTIÓN DE INVENTARIOS - CONSTRUCTORA DEL VALLE S.A.
 * Módulo de Configuración de Base de Datos MySQL (mysql2/promise)
 * =============================================================================
 */

// Parámetros de conexión desde variables de entorno con valores de contingencia
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'constructora_del_valle',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

// Instanciación del Pool de conexiones
const pool = mysql.createPool(dbConfig);

/**
 * Prueba la conectividad con el servidor MySQL implementando reintentos exponenciales
 * @param {number} maxRetries Número máximo de intentos antes de fallar
 * @param {number} delayMs Tiempo en milisegundos entre cada reintento
 * @returns {Promise<boolean>}
 */
const testConnection = async (maxRetries = 5, delayMs = 2000) => {
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      console.log(`[Database] Intentando conectar a MySQL (Intento ${attempt}/${maxRetries}) en ${dbConfig.host}:${dbConfig.port}...`);
      const connection = await pool.getConnection();
      console.log(`[Database] ✅ Conexión exitosa a la base de datos "${dbConfig.database}" en ${dbConfig.host}:${dbConfig.port}`);
      connection.release();
      return true;
    } catch (error) {
      console.error(`[Database] ❌ Error en el intento ${attempt}/${maxRetries}: ${error.message}`);
      
      if (attempt === maxRetries) {
        console.error('[Database] 🚨 Se agotaron los reintentos de conexión. Verifica que el servicio MySQL esté iniciado y las credenciales en .env sean correctas.');
        return false;
      }

      console.log(`[Database] Esperando ${delayMs / 1000}s antes de reintentar...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempt++;
    }
  }

  return false;
};

module.exports = {
  pool,
  testConnection,
  dbConfig
};
