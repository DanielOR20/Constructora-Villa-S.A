const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const fs = require('fs');
const mysql = require('mysql2/promise');

/**
 * =============================================================================
 * SCRIPT DE INICIALIZACIÓN Y POBLADO DE BASE DE DATOS (DBA SEED RUNNER)
 * Constructora Del Valle S.A.
 * Caso de Estudio: Auditoría de Inventarios y Compras (Quiz Barry Vega)
 * =============================================================================
 */

const runMigrationAndSeed = async () => {
  console.log('====================================================================');
  console.log('🔨 INICIALIZADOR DE BASE DE DATOS - CONSTRUCTORA DEL VALLE S.A.');
  console.log('====================================================================');

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
      throw new Error('No se encontraron los archivos schema.sql o seed.sql en la ruta esperada.');
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log(`📡 Conectando a MySQL en ${connectionConfig.host}:${connectionConfig.port} (Usuario: ${connectionConfig.user})...`);
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Conexión establecida.');

    console.log('⏳ Ejecutando DDL (schema.sql: creación limpia de BD y tablas normalizadas)...');
    await connection.query(schemaSql);
    console.log('✅ Esquema DDL aplicado correctamente.');

    console.log('⏳ Ejecutando DML (seed.sql: inserción de datos semilla de Constructora Del Valle S.A.)...');
    await connection.query(seedSql);
    console.log('✅ Datos semilla insertados correctamente.');

    // Auditoría y verificación de datos poblados
    console.log('\n📊 VERIFICACIÓN DE INTEGRIDAD Y RECUENTO DE REGISTROS:');
    console.log('--------------------------------------------------------------------');

    const [usuariosRows] = await connection.query('SELECT id_usuario, nombre, email, rol FROM constructora_del_valle.usuarios');
    console.log(`👤 Usuarios creados (${usuariosRows.length}):`);
    usuariosRows.forEach(u => console.log(`   - ID ${u.id_usuario}: ${u.nombre} | Rol: ${u.rol} | Email: ${u.email}`));

    const [materialesRows] = await connection.query('SELECT codigo, nombre, unidad_medida, precio_unitario, lead_time_dias, demanda_promedio_diaria, demanda_maxima_diaria FROM constructora_del_valle.materiales');
    console.log(`\n🧱 Materiales e Insumos cargados (${materialesRows.length}):`);
    materialesRows.forEach(m => console.log(`   - [${m.codigo}] ${m.nombre} (${m.unidad_medida}) | Contrato: ₡${m.precio_unitario} | LT: ${m.lead_time_dias}d | D_prom: ${m.demanda_promedio_diaria} | D_max: ${m.demanda_maxima_diaria}`));

    const [proveedoresRows] = await connection.query('SELECT codigo, nombre FROM constructora_del_valle.proveedores');
    console.log(`\n🚚 Proveedores comerciales (${proveedoresRows.length}):`);
    proveedoresRows.forEach(p => console.log(`   - [${p.codigo}] ${p.nombre}`));

    const [ordenesRows] = await connection.query(`
      SELECT oc.numero_orden, p.nombre AS proveedor, oc.fecha_emision, oc.total, oc.estado_aprobacion, oc.rol_aprobador_requerido
      FROM constructora_del_valle.ordenes_compra oc
      JOIN constructora_del_valle.proveedores p ON oc.id_proveedor = p.id_proveedor
      ORDER BY oc.id_orden ASC
    `);
    console.log(`\n📑 Órdenes de Compra de Octubre 2026 (${ordenesRows.length}):`);
    ordenesRows.forEach(o => console.log(`   - ${o.numero_orden}: ₡${Number(o.total).toLocaleString()} | ${o.proveedor} | ${o.fecha_emision.toISOString().slice(0,10)} | Aprobación: ${o.estado_aprobacion.toUpperCase()} (Nivel: ${o.rol_aprobador_requerido})`));

    const [movsCount] = await connection.query('SELECT COUNT(*) AS total FROM constructora_del_valle.movimientos');
    console.log(`\n📦 Movimientos históricos registrados: ${movsCount[0].total} transacciones (Entradas y Transferencias a Obras).`);

    const [stockRows] = await connection.query(`
      SELECT s.ubicacion, m.nombre AS material, s.cantidad_actual, m.unidad_medida
      FROM constructora_del_valle.inventario_stock s
      JOIN constructora_del_valle.materiales m ON s.id_material = m.id_material
      ORDER BY s.ubicacion, m.id_material
    `);
    console.log(`\n🏢 Existencias físicas consolidadas en Bodega Central y Frentes de Obra:`);
    stockRows.forEach(s => console.log(`   - ${s.ubicacion}: ${s.cantidad_actual} ${s.unidad_medida} de ${s.material}`));

    console.log('--------------------------------------------------------------------');
    console.log('🎉 BASE DE DATOS POBLADA EXITOSAMENTE Y LISTA PARA PRODUCCIÓN');
    console.log('====================================================================\n');
  } catch (error) {
    console.error('\n❌ Error durante la migración y siembra:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Nota: Asegúrate de que tu servidor MySQL esté ejecutándose en el puerto configurado (3306).');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 Conexión cerrada con el servidor MySQL.');
    }
  }
};

runMigrationAndSeed();
