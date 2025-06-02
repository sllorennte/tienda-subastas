const Puja     = require('../modelos/Puja');
const Producto = require('../modelos/Producto');

// Crear una nueva puja
exports.crearPuja = async (req, res) => {
  try {
    const { producto: productoId, pujador, cantidad } = req.body;

    // 1. Comprobar que el producto existe y está activo
    const producto = await Producto.findById(productoId);
    if (!producto) 
      return res.status(404).json({ error: 'Producto no encontrado' });

    if (producto.estado !== 'activo' || new Date() > producto.fechaExpiracion)
      return res.status(400).json({ error: 'No se puede pujar: subasta cerrada' });

    // 2. Obtener la puja más alta actual
    const ultimaPuja = await Puja.find({ producto: productoId })
      .sort({ cantidad: -1 })
      .limit(1);

    const maxActual = ultimaPuja.length 
      ? ultimaPuja[0].cantidad 
      : producto.precioInicial;

    if (cantidad <= maxActual)
      return res.status(400).json({
        error: `La puja debe ser superior a ${maxActual}`
      });

    // 3. Crear y guardar la nueva puja
    const puja = new Puja({ producto: productoId, pujador, cantidad });
    await puja.save();

    res.status(201).json({ mensaje: 'Puja registrada', puja });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear puja', detalles: err });
  }
};

// Obtener todas las pujas (opcionalmente filtrar por producto)
exports.obtenerPujas = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.producto) filtro.producto = req.query.producto;

    const pujas = await Puja.find(filtro)
      .populate('pujador', 'username email')
      .populate('producto', 'titulo precioInicial')
      .sort({ cantidad: -1 });

    res.json(pujas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer pujas' });
  }
};

// Obtener una puja por ID
exports.obtenerPujaPorId = async (req, res) => {
  try {
    const puja = await Puja.findById(req.params.id)
      .populate('pujador', 'username email')
      .populate('producto', 'titulo precioInicial');
    if (!puja) return res.status(404).json({ error: 'Puja no encontrada' });
    res.json(puja);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer puja' });
  }
};

// Eliminar una puja
exports.eliminarPuja = async (req, res) => {
  try {
    const puja = await Puja.findByIdAndDelete(req.params.id);
    if (!puja) return res.status(404).json({ error: 'Puja no encontrada' });
    res.json({ mensaje: 'Puja eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar puja' });
  }
};
