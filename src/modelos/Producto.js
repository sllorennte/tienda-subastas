const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: String,
  precioInicial: {
    type: Number,
    required: true,
    min: 0
  },
  imagenes: [String],       // URLs de las imágenes
  vendedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  fechaExpiracion: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ['activo', 'vendido', 'cancelado'],
    default: 'activo'
  }
});

module.exports = mongoose.model('Producto', productoSchema);
