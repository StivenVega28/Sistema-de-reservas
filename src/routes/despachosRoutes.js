const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const ctrl = require('../controllers/despachosController');

router.get('/', auth, roleGuard('administrador', 'mesero', 'despachador'), ctrl.listar);
router.post('/', auth, roleGuard('administrador', 'mesero', 'despachador'), ctrl.crear);
router.put('/:id/estado', auth, roleGuard('administrador', 'mesero', 'despachador'), ctrl.cambiarEstado);

module.exports = router;
