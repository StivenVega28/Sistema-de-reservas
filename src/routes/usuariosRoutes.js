const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const ctrl = require('../controllers/usuariosController');

router.get('/', auth, roleGuard('administrador'), ctrl.listar);
router.get('/meseros', auth, roleGuard('administrador', 'mesero'), ctrl.listarMeseros);
router.post('/reset-demo', auth, roleGuard('administrador'), ctrl.resetDemo);

module.exports = router;
