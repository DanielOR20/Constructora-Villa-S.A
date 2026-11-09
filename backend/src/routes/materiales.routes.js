const { Router } = require('express');
const {
  getMateriales,
  getMaterialById,
  getStockIndividual,
  getReordenMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial
} = require('../controllers/materiales.controller');

const router = Router();

/**
 * Rutas de Catálogo de Materiales
 */
router.get('/', getMateriales);
router.get('/:id/stock', getStockIndividual);
router.get('/:id/reorden', getReordenMaterial);
router.get('/:id', getMaterialById);
router.post('/', createMaterial);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

module.exports = router;
