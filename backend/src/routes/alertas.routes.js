const { Router } = require('express');
const {
  getAlertasReorden,
  getAlertasCriticos,
  getAlertasAdvertencias,
  getReordenMaterialById,
  getAlertasResumen,
  getAlertasDuplicados
} = require('../controllers/alertas.controller');

const router = Router();

/**
 * Rutas de Alertas, Punto de Reorden y Fugas de Valor
 */
router.get('/resumen', getAlertasResumen);
router.get('/reorden', getAlertasReorden);
router.get('/reorden/criticos', getAlertasCriticos);
router.get('/reorden/advertencias', getAlertasAdvertencias);
router.get('/reorden/:id', getReordenMaterialById);
router.get('/duplicados', getAlertasDuplicados);

module.exports = router;
