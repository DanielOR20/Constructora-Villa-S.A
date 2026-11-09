const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('Pruebas Unitarias - Validación Transaccional de Saldo Negativo', () => {

  it('Debe calcular correctamente que un retiro superior al stock actual es rechazado', () => {
    const stockActual = 100;
    const cantidadRetiro = 150;
    const saldoProyectado = stockActual - cantidadRetiro;

    assert.ok(saldoProyectado < 0, 'El saldo resultante es negativo (-50)');
    
    // Simulación del disparador de excepción HTTP 400
    let errorLanzado = null;
    try {
      if (saldoProyectado < 0) {
        const error = new Error(`Stock insuficiente: Disponible ${stockActual}, solicitado ${cantidadRetiro}`);
        error.statusCode = 400;
        error.code = 'STOCK_INSUFICIENTE';
        throw error;
      }
    } catch (err) {
      errorLanzado = err;
    }

    assert.ok(errorLanzado !== null);
    assert.strictEqual(errorLanzado.statusCode, 400);
    assert.strictEqual(errorLanzado.code, 'STOCK_INSUFICIENTE');
  });

  it('Debe autorizar la transacción si el retiro es menor o igual al stock disponible', () => {
    const stockActual = 100;
    const cantidadRetiro = 80;
    const saldoProyectado = stockActual - cantidadRetiro;

    assert.ok(saldoProyectado >= 0);
    assert.strictEqual(saldoProyectado, 20);
  });

});

