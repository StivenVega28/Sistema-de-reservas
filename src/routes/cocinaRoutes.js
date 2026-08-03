const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const ctrl = require('../controllers/cocinaController');

router.get('/cola', auth, roleGuard('administrador', 'cocina'), ctrl.cola);
router.put('/:detalleId/estado', auth, roleGuard('administrador', 'cocina'), ctrl.cambiarEstado);

module.exports = router;
