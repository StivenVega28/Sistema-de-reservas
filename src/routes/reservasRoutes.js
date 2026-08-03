const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const ctrl = require('../controllers/reservasController');

router.get('/', auth, roleGuard('administrador', 'mesero'), ctrl.listar);
router.get('/calendario', auth, roleGuard('administrador', 'mesero'), ctrl.calendario);
router.post('/', auth, roleGuard('administrador', 'mesero'), ctrl.crear);
router.put('/:id/estado', auth, roleGuard('administrador', 'mesero'), ctrl.cambiarEstado);

module.exports = router;
