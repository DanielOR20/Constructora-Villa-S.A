const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { determinarRolAprobadorRequerido } = require('../src/services/ordenes.service');
const { cumpleJerarquiaMinima, JERARQUIA_ROLES, JWT_SECRET } = require('../src/middlewares/auth.middleware');

test.describe('Pruebas Unitarias - Matriz de Aprobación Jerárquica de Órdenes de Compra', () => {

  test('Caso 1: Montos hasta ₡250,000 asignan autoridad a Jefatura de Área (Nivel 1)', () => {
    const res1 = determinarRolAprobadorRequerido(50000);
    assert.equal(res1.rol_requerido, 'jefatura_area');
    assert.equal(res1.nivel_jerarquico, 1);
    assert.equal(res1.requiere_comite, false);

    const resLimite = determinarRolAprobadorRequerido(250000);
    assert.equal(resLimite.rol_requerido, 'jefatura_area');
    assert.equal(resLimite.nivel_jerarquico, 1);
  });

  test('Caso 2: Montos de ₡250,001 a ₡2,000,000 asignan autoridad a Jefatura de Compras (Nivel 2)', () => {
    const resBajo = determinarRolAprobadorRequerido(250001);
    assert.equal(resBajo.rol_requerido, 'jefatura_compras');
    assert.equal(resBajo.nivel_jerarquico, 2);

    const resMedio = determinarRolAprobadorRequerido(925000);
    assert.equal(resMedio.rol_requerido, 'jefatura_compras');

    const resLimite = determinarRolAprobadorRequerido(2000000);
    assert.equal(resLimite.rol_requerido, 'jefatura_compras');
  });

  test('Caso 3: Montos de ₡2,000,001 a ₡10,000,000 asignan autoridad a Gerencia Financiera (Nivel 3)', () => {
    const resBajo = determinarRolAprobadorRequerido(2000001);
    assert.equal(resBajo.rol_requerido, 'gerencia_financiera');
    assert.equal(resBajo.nivel_jerarquico, 3);

    const resMedio = determinarRolAprobadorRequerido(4800000);
    assert.equal(resMedio.rol_requerido, 'gerencia_financiera');

    const resLimite = determinarRolAprobadorRequerido(10000000);
    assert.equal(resLimite.rol_requerido, 'gerencia_financiera');
  });

  test('Caso 4: Montos superiores a ₡10,000,000 asignan autoridad a Gerencia General + Comité (Nivel 4)', () => {
    const res = determinarRolAprobadorRequerido(10000001);
    assert.equal(res.rol_requerido, 'gerencia_general');
    assert.equal(res.nivel_jerarquico, 4);
    assert.equal(res.requiere_comite, true);

    const resMacro = determinarRolAprobadorRequerido(25000000);
    assert.equal(resMacro.rol_requerido, 'gerencia_general');
  });

  test('Caso 5: Validación de Jerarquía - Un rol inferior NO puede autorizar montos de niveles superiores', () => {
    // Jefatura de área (nivel 1) intentando aprobar orden de jefatura de compras (nivel 2)
    assert.equal(cumpleJerarquiaMinima('jefatura_area', 'jefatura_compras'), false);

    // Jefatura de compras (nivel 2) intentando aprobar orden de gerencia financiera (nivel 3)
    assert.equal(cumpleJerarquiaMinima('jefatura_compras', 'gerencia_financiera'), false);

    // Gerencia financiera (nivel 3) intentando aprobar orden de gerencia general (nivel 4)
    assert.equal(cumpleJerarquiaMinima('gerencia_financiera', 'gerencia_general'), false);
  });

  test('Caso 6: Validación de Jerarquía - Un rol superior SÍ puede autorizar órdenes de niveles inferiores o iguales', () => {
    // Gerencia General puede aprobar cualquier nivel (1, 2, 3, 4)
    assert.equal(cumpleJerarquiaMinima('gerencia_general', 'jefatura_area'), true);
    assert.equal(cumpleJerarquiaMinima('gerencia_general', 'jefatura_compras'), true);
    assert.equal(cumpleJerarquiaMinima('gerencia_general', 'gerencia_financiera'), true);
    assert.equal(cumpleJerarquiaMinima('gerencia_general', 'gerencia_general'), true);

    // Jefatura de compras puede aprobar nivel 1 y nivel 2
    assert.equal(cumpleJerarquiaMinima('jefatura_compras', 'jefatura_area'), true);
    assert.equal(cumpleJerarquiaMinima('jefatura_compras', 'jefatura_compras'), true);
  });
});

test.describe('Pruebas Unitarias - Cifrado Bcrypt y Emisión de JWT', () => {

  test('Caso 7: Cifrado y verificación de contraseñas con bcryptjs', async () => {
    const passwordOriginal = 'Password123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(passwordOriginal, salt);

    assert.ok(hash.startsWith('$2'));
    assert.notEqual(hash, passwordOriginal);

    const esValida = await bcrypt.compare(passwordOriginal, hash);
    assert.equal(esValida, true);

    const esInvalida = await bcrypt.compare('PasswordErronea', hash);
    assert.equal(esInvalida, false);
  });

  test('Caso 8: Emisión y decodificación de tokens JWT con roles de usuario', () => {
    const payload = {
      id_usuario: 1,
      nombre: 'Ing. Carlos Mendoza',
      email: 'carlos.mendoza@constructoradelvalle.com',
      rol: 'jefatura_area'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    assert.ok(typeof token === 'string' && token.length > 20);

    const decoded = jwt.verify(token, JWT_SECRET);
    assert.equal(decoded.id_usuario, 1);
    assert.equal(decoded.nombre, 'Ing. Carlos Mendoza');
    assert.equal(decoded.rol, 'jefatura_area');
  });
});
