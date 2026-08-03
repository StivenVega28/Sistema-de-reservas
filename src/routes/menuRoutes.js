const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const roleGuard = require('../middlewares/roleGuard');
const ctrl = require('../controllers/menuController');

// Categorias
router.get('/categorias', auth, ctrl.listarCategorias);
router.post('/categorias', auth, roleGuard('administrador'), ctrl.crearCategoria);

// Platos
router.get('/platos', auth, ctrl.listarPlatos);
router.post('/platos', auth, roleGuard('administrador'), ctrl.crearPlato);
router.put('/platos/:id', auth, roleGuard('administrador'), ctrl.actualizarPlato);
router.delete('/platos/:id', auth, roleGuard('administrador'), ctrl.eliminarPlato);

// Modificadores
router.get('/modificadores', auth, ctrl.listarModificadores);
router.post('/modificadores', auth, roleGuard('administrador'), ctrl.crearModificador);

// Insumos
router.get('/insumos', auth, roleGuard('administrador'), ctrl.listarInsumos);
router.post('/insumos', auth, roleGuard('administrador'), ctrl.crearInsumo);
router.put('/insumos/:id', auth, roleGuard('administrador'), ctrl.actualizarInsumo);

// Recetas
router.get('/recetas/:platoId', auth, roleGuard('administrador'), ctrl.obtenerRecetas);
router.post('/recetas', auth, roleGuard('administrador'), ctrl.crearReceta);

module.exports = router;
