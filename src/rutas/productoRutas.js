const express = require('express');
const router  = express.Router();
const ctrl    = require('../controladores/productoController');
const { verifyToken } = require('../middlewares/auth');

// Crear producto (protegido)
router.post('/productos', verifyToken, ctrl.crearProducto);

// Listar productos con paginación y búsqueda (público)
router.get('/productos', ctrl.obtenerProductos);

// Obtener productos del usuario autenticado (propios)
router.get('/productos/mios', verifyToken, ctrl.obtenerProductosMios);

// Obtener producto por ID (público)
router.get('/productos/:id', ctrl.obtenerProductoPorId);

// Actualizar producto (protegido)
router.put('/productos/:id', verifyToken, ctrl.actualizarProducto);

// Eliminar producto (protegido)
router.delete('/productos/:id', verifyToken, ctrl.eliminarProducto);

module.exports = router;
