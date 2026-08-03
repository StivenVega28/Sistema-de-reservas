const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const ctrl = require('../controllers/pedidosController');

router.get('/', auth, roleGuard('administrador', 'mesero'), ctrl.listar);
router.post('/', auth, roleGuard('administrador', 'mesero'), ctrl.crear);
router.put('/detalle/:id', auth, roleGuard('administrador', 'mesero'), ctrl.actualizarItem);
router.put('/detalle/:id/cancelar', auth, roleGuard('administrador', 'mesero'), ctrl.cancelarItem);
router.put('/detalle/:id/dividir-cuenta', auth, roleGuard('administrador', 'mesero'), ctrl.dividirCuenta);
router.get('/:id', auth, roleGuard('administrador', 'mesero'), ctrl.obtener);
router.post('/:id/items', auth, roleGuard('administrador', 'mesero'), ctrl.agregarItems);
router.put('/:id/estado', auth, roleGuard('administrador', 'mesero'), ctrl.cambiarEstado);

module.exports = router;
