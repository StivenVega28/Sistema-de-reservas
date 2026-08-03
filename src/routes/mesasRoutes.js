const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const ctrl = require('../controllers/mesasController');

router.get('/', auth, ctrl.listar);
router.put('/trasladar', auth, roleGuard('administrador', 'mesero'), ctrl.trasladar);
router.get('/:id', auth, ctrl.obtener);
router.put('/:id', auth, roleGuard('administrador', 'mesero'), ctrl.actualizar);
router.put('/:id/asignar-mesero', auth, roleGuard('administrador', 'mesero'), ctrl.asignarMesero);

module.exports = router;
