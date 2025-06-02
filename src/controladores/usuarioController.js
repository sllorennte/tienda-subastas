const Usuario = require('../modelos/Usuario');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');

// Crear un nuevo usuario
exports.crearUsuario = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos (username, email, password) son obligatorios.' });
    }
    // Hasheamos y creamos usuario…
  } catch (err) {
    console.error(err);
    // Si es error de “unique” en email o username:
    if (err.code === 11000) {
      const campo = Object.keys(err.keyValue)[0];
      return res.status(400).json({ error: `El ${campo} ya está en uso.` });
    }
    res.status(500).json({ error: 'Error interno al crear usuario.' });
  }
};

// Obtener todos los usuarios
exports.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password');
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al leer usuarios' });
  }
};

// Obtener un usuario por ID
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

// Actualizar usuario (excepto contraseña)
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

// Eliminar usuario
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

// Login: email + password → token
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
