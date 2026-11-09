// Re-exportación para retrocompatibilidad con la nueva arquitectura en duplicados.service.js
const {
  auditarComprasDuplicadas,
  auditarComprasDuplicadasYFugas,
  formatearColones
} = require('./duplicados.service');

module.exports = {
  detectarOrdenesDuplicadas: auditarComprasDuplicadas,
  auditarComprasDuplicadas,
  auditarComprasDuplicadasYFugas,
  formatearColones
};
