const Producto = require('../modelos/Producto');

exports.crearProducto = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      precioInicial,
      imagenes,
      vendedor,
      fechaExpiracion
    } = req.body;

    if (!titulo || precioInicial == null || !vendedor || !fechaExpiracion) {
      return res.status(400).json({
        error: 'Título, precio inicial, vendedor y fecha de expiración son obligatorios.'
      });
    }
    const fecha = new Date(fechaExpiracion);
    if (isNaN(fecha.getTime()) || fecha <= new Date()) {
      return res.status(400).json({ error: 'Fecha de expiración inválida o ya pasada.' });
    }

    let listaImagenes = [];
    if (imagenes && typeof imagenes === 'string') {
      listaImagenes = imagenes
        .split(',')
        .map(nombre => nombre.trim())
        .filter(nombre => nombre);

      const invalidas = listaImagenes.filter(nombre => {
        return !/\.(jpe?g|png|gif)$/i.test(nombre);
      });
      if (invalidas.length) {
        return res.status(400).json({
          error: `Estos nombres no parecen imágenes válidas: ${invalidas.join(', ')}`
        });
      }

      listaImagenes = listaImagenes.map(nombre => `/uploads/${nombre}`);
    }

    const producto = new Producto({
      titulo,
      descripcion,
      precioInicial: parseFloat(precioInicial),
      imagenes: listaImagenes,
      vendedor,
      fechaExpiracion: fecha
    });

    await producto.save();
    res.status(201).json({ mensaje: 'Producto creado', producto });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno al crear producto.' });
  }
};

exports.obtenerProductos = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const search = req.query.search ? req.query.search.trim() : '';

    const filtro = {};
    if (search) {
      filtro.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } }
      ];
    }

    const totalItems = await Producto.countDocuments(filtro);
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    const productos = await Producto.find(filtro)
      .populate('vendedor', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      metadata: {
        page,
        limit,
        totalPages,
        totalItems
      },
      productos
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer productos' });
  }
};

exports.obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('vendedor', 'username email');
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer producto' });
  }
};

exports.actualizarProducto = async (req, res) => {
  try {
    const datos = (({ titulo, descripcion, precioInicial, imagenes, fechaExpiracion, estado }) =>
      ({ titulo, descripcion, precioInicial, imagenes, fechaExpiracion, estado }))(req.body);

    if (datos.imagenes && typeof datos.imagenes === 'string') {
      let lista = datos.imagenes
        .split(',')
        .map(nombre => nombre.trim())
        .filter(nombre => nombre);
      const invalidas = lista.filter(nombre => !/\.(jpe?g|png|gif)$/i.test(nombre));
      if (invalidas.length) {
        return res.status(400).json({
          error: `Estos nombres no parecen imágenes válidas: ${invalidas.join(', ')}`
        });
      }
      datos.imagenes = lista.map(nombre => `/uploads/${nombre}`);
    }

    if (datos.fechaExpiracion) {
      const fecha = new Date(datos.fechaExpiracion);
      if (isNaN(fecha.getTime()) || fecha <= new Date()) {
        return res.status(400).json({ error: 'Fecha de expiración inválida o ya pasada.' });
      }
      datos.fechaExpiracion = fecha;
    }

    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      datos,
      { new: true, runValidators: true }
    );
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto actualizado', producto });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Error al actualizar producto', detalles: err });
  }
};

exports.eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

// NUEVA función para productos propios
exports.obtenerProductosMios = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const totalItems = await Producto.countDocuments({ vendedor: userId });
    const totalPages = Math.ceil(totalItems / limit);

    const productos = await Producto.find({ vendedor: userId })
      .populate('vendedor', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      metadata: { page, limit, totalPages, totalItems },
      productos
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos propios' });
  }
};
