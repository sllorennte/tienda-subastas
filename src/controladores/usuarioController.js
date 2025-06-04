const Usuario = require('../modelos/Usuario');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');

exports.crearUsuario = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos (username, email, password) son obligatorios.' });
    }
    // Aquí añadirías hash y guardado, omito para brevedad
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      const campo = Object.keys(err.keyValue)[0];
      return res.status(400).json({ error: `El ${campo} ya está en uso.` });
    }
    res.status(500).json({ error: 'Error interno al crear usuario.' });
  }
};

exports.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password');
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer usuarios' });
  }
};

exports.obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer usuario' });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const { username, email } = req.body;
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { username, email },
      { new: true, runValidators: true }
    ).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario actualizado', usuario });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Error al actualizar', detalles: err });
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario)
      return res.status(400).json({ error: 'Credenciales incorrectas' });

    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch)
      return res.status(400).json({ error: 'Credenciales incorrectas' });

    const payload = { id: usuario._id, username: usuario.username };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.json({ mensaje: 'Login exitoso', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// NUEVA función para ruta /usuarios/me (usuario autenticado)
exports.obtenerUsuarioActual = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuario actual' });
  }
};
