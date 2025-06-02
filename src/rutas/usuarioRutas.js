const express = require('express');
const router  = express.Router();
const ctrl    = require('../controladores/usuarioController');
const { login } = require('../controladores/usuarioController');

router.post('/usuarios',       ctrl.crearUsuario);         // Crear
router.get('/usuarios',        ctrl.obtenerUsuarios);      // Leer todos
router.get('/usuarios/:id',    ctrl.obtenerUsuarioPorId);  // Leer uno
router.put('/usuarios/:id',    ctrl.actualizarUsuario);    // Actualizar
router.delete('/usuarios/:id', ctrl.eliminarUsuario);     // Eliminar
router.post('/login', login); 

module.exports = router;
