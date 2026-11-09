const { describe, it } = require('node:test');
const assert = require('node:assert');
const { calcularPuntoReordenMatematico } = require('../src/services/reorden.service');

describe('Pruebas Unitarias - Motor Matemático de Reorden Riguroso (Quiz Barry Vega - Parte B)', () => {

  it('Caso 1: Cemento gris 50 kg en Estado CRÍTICO con cálculo Math.ceil', () => {
    // Parámetros: D_max = 50, D_prom = 35, Lead Time = 3, Stock Actual = 100
    // SS = Math.ceil((50 - 35) * 3) = Math.ceil(45) = 45
    // PR = Math.ceil(35 * 3) + 45 = 105 + 45 = 150
    // Stock Actual (100) <= PR (150) -> 'CRITICO'
    // Deficit = Math.max(0, 150 - 100) = 50
    const resultado = calcularPuntoReordenMatematico({
      dMax: 50,
      dProm: 35,
      leadTime: 3,
      stockActual: 100
    });

    assert.strictEqual(resultado.stockActual, 100);
    assert.strictEqual(resultado.stockSeguridad, 45);
    assert.strictEqual(resultado.puntoReorden, 150);
    assert.strictEqual(resultado.deficit, 50);
    assert.strictEqual(resultado.margenNeto, -50);
    assert.strictEqual(resultado.estadoReposicion, 'CRITICO');
    assert.strictEqual(resultado.analitica.requiereCompraInmediata, true);
    assert.strictEqual(resultado.analitica.alertaPreventiva, false);
    assert.strictEqual(resultado.analitica.cantidadSugeridaCompra, 125); // Math.ceil((150 * 1.5) - 100) = 125
  });

  it('Caso 2: Estado ADVERTENCIA cuando el stock supera el PR pero está dentro del umbral de precaución (<= PR * 1.25)', () => {
    // PR = 150, PR * 1.25 = 187.5
    // Si Stock Actual = 170 (150 < 170 <= 188) -> 'ADVERTENCIA'
    const resultado = calcularPuntoReordenMatematico({
      dMax: 50,
      dProm: 35,
      leadTime: 3,
      stockActual: 170
    });

    assert.strictEqual(resultado.stockActual, 170);
    assert.strictEqual(resultado.stockSeguridad, 45);
    assert.strictEqual(resultado.puntoReorden, 150);
    assert.strictEqual(resultado.deficit, 0); // No hay déficit porque stock > PR
    assert.strictEqual(resultado.margenNeto, 20);
    assert.strictEqual(resultado.estadoReposicion, 'ADVERTENCIA');
    assert.strictEqual(resultado.analitica.requiereCompraInmediata, false);
    assert.strictEqual(resultado.analitica.alertaPreventiva, true);
  });

  it('Caso 3: Estado ESTABLE cuando el stock supera holgadamente el punto de reorden (> PR * 1.25)', () => {
    // Stock Actual = 250 (> 188) -> 'ESTABLE'
    const resultado = calcularPuntoReordenMatematico({
      dMax: 50,
      dProm: 35,
      leadTime: 3,
      stockActual: 250
    });

    assert.strictEqual(resultado.stockActual, 250);
    assert.strictEqual(resultado.stockSeguridad, 45);
    assert.strictEqual(resultado.puntoReorden, 150);
    assert.strictEqual(resultado.deficit, 0);
    assert.strictEqual(resultado.margenNeto, 100);
    assert.strictEqual(resultado.estadoReposicion, 'ESTABLE');
    assert.strictEqual(resultado.analitica.requiereCompraInmediata, false);
    assert.strictEqual(resultado.analitica.alertaPreventiva, false);
    assert.strictEqual(resultado.analitica.cantidadSugeridaCompra, 0);
  });

  it('Caso 4: Redondeo hacia arriba (Math.ceil) con valores decimales en demanda', () => {
    // D_max = 18.5, D_prom = 10.2, Lead Time = 2
    // SS = Math.ceil((18.5 - 10.2) * 2) = Math.ceil(8.3 * 2) = Math.ceil(16.6) = 17
    // Consumo LT = Math.ceil(10.2 * 2) = Math.ceil(20.4) = 21
    // PR = 21 + 17 = 38
    const resultado = calcularPuntoReordenMatematico({
      dMax: 18.5,
      dProm: 10.2,
      leadTime: 2,
      stockActual: 30
    });

    assert.strictEqual(resultado.stockSeguridad, 17);
    assert.strictEqual(resultado.puntoReorden, 38);
    assert.strictEqual(resultado.deficit, 8); // 38 - 30 = 8
    assert.strictEqual(resultado.estadoReposicion, 'CRITICO');
  });

});
