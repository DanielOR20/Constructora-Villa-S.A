const { Router } = require('express');
const { getStatus } = require('../services/example.service');

const router = Router();

router.get('/status', async (req, res, next) => {
  try {
    const data = await getStatus();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

