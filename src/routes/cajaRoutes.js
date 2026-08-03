const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const ctrl = require('../controllers/cajaController');

router.get('/cierres', auth, roleGuard('administrador'), ctrl.listarCierres);
router.get('/resumen-dia', auth, roleGuard('administrador'), ctrl.resumenDia);
router.post('/cierre', auth, roleGuard('administrador'), ctrl.cierreCaja);

module.exports = router;
