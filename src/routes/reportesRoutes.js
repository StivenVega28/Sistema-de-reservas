const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const ctrl = require('../controllers/reportesController');

router.get('/estadisticas', auth, ctrl.estadisticas);
router.get('/ventas', auth, roleGuard('administrador'), ctrl.ventasPorPeriodo);
router.get('/platos-vendidos', auth, roleGuard('administrador'), ctrl.platosMasVendidos);
router.get('/mesas-rotacion', auth, roleGuard('administrador'), ctrl.mesasRotacion);
router.get('/auditoria', auth, roleGuard('administrador'), ctrl.auditoria);

module.exports = router;
