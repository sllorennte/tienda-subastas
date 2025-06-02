const express = require('express');
const router  = express.Router();
const ctrl    = require('../controladores/pujaController');
const { verifyToken } = require('../middlewares/auth');

// CRUD de pujas
router.post('/pujas', verifyToken,       ctrl.crearPuja);          // Crear puja
router.get('/pujas',         ctrl.obtenerPujas);       // Leer todas (o filtrar por ?producto=ID)
router.get('/pujas/:id',     ctrl.obtenerPujaPorId);   // Leer una
router.delete('/pujas/:id', verifyToken,  ctrl.eliminarPuja);       // Eliminar

module.exports = router;
