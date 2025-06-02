const Producto = require('../modelos/Producto');

exports.crearProducto = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      precioInicial,
      imagenes,        // string con nombres separados por comas
      vendedor,
      fechaExpiracion
    } = req.body;

    // Validaciones (idem al caso manual)
    if (!titulo || precioInicial == null || !vendedor || !fechaExpiracion) {
      return res.status(400).json({
        error: 'Título, precio inicial, vendedor y fecha de expiración son obligatorios.'
      });
    }
    const fecha = new Date(fechaExpiracion);
    if (isNaN(fecha.getTime()) || fecha <= new Date()) {
      return res.status(400).json({ error: 'Fecha de expiración inválida o ya pasada.' });
    }

    // Procesar campo "imagenes" como antes
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

/**
 * Obtener productos con paginación y búsqueda.
 * Query params:
 *   - page: página actual (default 1)
 *   - limit: ítems por página (default 10)
 *   - search: cadena a buscar en título o descripción (opcional)
 */
exports.obtenerProductos = async (req, res) => {
  try {
    // 1. Leer parámetros de consulta
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const search = req.query.search ? req.query.search.trim() : '';

    // 2. Construir filtro
    const filtro = {};
    if (search) {
      // Búsqueda insensible en título o descripción
      filtro.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } }
      ];
    }

    // 3. Contar total de documentos que cumplen el filtro
    const totalItems = await Producto.countDocuments(filtro);

    // 4. Calcular saltar (skip) y total de páginas
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    // 5. Consultar productos con skip/limit, poblando vendedor
    const productos = await Producto.find(filtro)
      .populate('vendedor', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 6. Devolver JSON con metadatos y array de productos
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

    // Procesar campo "imagenes" si viene como string
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
