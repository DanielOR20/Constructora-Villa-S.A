// Re-exportación para retrocompatibilidad con la nueva arquitectura en reorden.service.js
const {
  calcularPuntoReordenMatematico,
  calcularReordenTodosLosMateriales,
  calcularReordenPorMaterialId
} = require('./reorden.service');

module.exports = {
  calcularMetricasReorden: calcularPuntoReordenMatematico,
  calcularPuntoReordenMatematico,
  analizarReordenMateriales: calcularReordenTodosLosMateriales,
  calcularReordenTodosLosMateriales,
  analizarReordenPorMaterialId: calcularReordenPorMaterialId,
  calcularReordenPorMaterialId
};
