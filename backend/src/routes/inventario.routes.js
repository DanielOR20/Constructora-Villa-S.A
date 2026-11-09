const { Router } = require('express');
const { getStockPorUbicacion, getMovimientos } = require('../controllers/movimientos.controller');
const { getAllMateriales } = require('../services/materiales.service');

const router = Router();

// Endpoints complementarios de inventario para el dashboard
router.get('/stock', getStockPorUbicacion);
router.get('/consolidado', async (req, res, next) => {
  try {
    const materiales = await getAllMateriales();
    res.status(200).json({
      success: true,
      data: materiales
    });
  } catch (error) {
    next(error);
  }
});
router.get('/movimientos', getMovimientos);

module.exports = router;
