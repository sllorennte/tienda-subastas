const express    = require('express');
const bodyParser = require('body-parser');
const mongoose   = require('mongoose');
const usuarioRutas = require('./rutas/usuarioRutas');
const productoRutas = require('./rutas/productoRutas');
const pujaRutas = require('./rutas/pujaRutas');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB
mongoose.connect(
  'mongodb+srv://admin:cD53735F@cluster0.tdsqx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log('✔️ MongoDB Atlas conectado'))
.catch(err => console.error('❌ Error MongoDB Atlas:', err));

app.use('/api', usuarioRutas);
app.use('/api', productoRutas);
app.use('/api', pujaRutas);



// Ruta de prueba
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
