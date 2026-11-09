require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const runMigrationAndSeed = async () => {
  console.log('🔄 Iniciando migración de esquema y siembra de datos...');

  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true
  };

  let connection;

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');

    if (!fs.existsSync(schemaPath) || !fs.existsSync(seedPath)) {
      throw new Error('No se encontraron los archivos schema.sql o seed.sql');
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log(`📡 Conectando a MySQL en ${connectionConfig.host}:${connectionConfig.port}...`);
    connection = await mysql.createConnection(connectionConfig);

    console.log('⏳ Ejecutando schema.sql (creación de base de datos y tablas normalizadas)...');
    await connection.query(schemaSql);

    console.log('⏳ Ejecutando seed.sql (inserción de datos de Constructora Del Valle S.A.)...');
    await connection.query(seedSql);

    console.log('------------------------------------------------------------');
    console.log('✅ Esquema y datos semilla aplicados con éxito:');
    console.log('   - Base de datos: constructora_del_valle');
    console.log('   - Tablas: usuarios (RBAC/JWT), materiales, proveedores, ordenes_compra (Matriz Aprobación), orden_compra_detalles, movimientos, inventario_stock');
    console.log('   - Insumos: Cemento gris 50 kg, Varilla #3 grado 40, Block 12x20x40, Arena');
    console.log('   - Auditoría: Casos de compras duplicadas de la Parte A (OC-1041 y OC-1042)');
    console.log('   - Seguridad: Usuarios semilla por rol con contraseña "Password123!"');
    console.log('------------------------------------------------------------');
  } catch (error) {
    console.error('❌ Error durante la migración y siembra:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Conexión cerrada.');
    }
  }
};

runMigrationAndSeed();
