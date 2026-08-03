const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const ctrl = require('../controllers/facturacionController');

router.get('/', auth, roleGuard('administrador', 'mesero'), ctrl.listar);
router.get('/cuenta/:pedidoId', auth, roleGuard('administrador', 'mesero'), ctrl.previaCuenta);
router.post('/generar', auth, roleGuard('administrador', 'mesero'), ctrl.generar);
router.get('/:id', auth, roleGuard('administrador', 'mesero'), ctrl.obtener);
router.put('/:id/anular', auth, roleGuard('administrador'), ctrl.anular);

module.exports = router;
