// ./public/js/crearProducto.js

document.addEventListener('DOMContentLoaded', () => {
  // Verificar token o redirigir al login
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // Obtener ID de usuario desde el payload del token
  const payload = JSON.parse(atob(token.split('.')[1]));
  const userId = payload.id;

  const form = document.getElementById('form-crear-producto');
  const errorContainer = document.getElementById('error');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorContainer.textContent = ''; // limpiar mensajes previos

    // 1. Recoger valores del formulario
    const titulo = document.getElementById('titulo').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const precioInicialRaw = document.getElementById('precioInicial').value;
    const imagenesRaw = document.getElementById('imagenes').value.trim();
    const fechaExpiracionRaw = document.getElementById('fechaExpiracion').value;

    // 2. Validar campos obligatorios
    if (!titulo) {
      errorContainer.textContent = 'El campo "Título" es obligatorio.';
      return;
    }
    if (!precioInicialRaw) {
      errorContainer.textContent = 'Debes indicar un "Precio inicial".';
      return;
    }
    const precioInicial = parseFloat(precioInicialRaw);
    if (isNaN(precioInicial) || precioInicial < 0) {
      errorContainer.textContent = 'El "Precio inicial" debe ser un número positivo.';
      return;
    }
    if (!fechaExpiracionRaw) {
      errorContainer.textContent = 'La "Fecha de expiración" es obligatoria.';
      return;
    }
    const fechaExpiracion = new Date(fechaExpiracionRaw);
    if (isNaN(fechaExpiracion.getTime()) || fechaExpiracion <= new Date()) {
      errorContainer.textContent = 'La "Fecha de expiración" debe ser una fecha válida y futura.';
      return;
    }

    // 3. Preparar array de nombres de imágenes
    let imagenes = [];
    if (imagenesRaw) {
      imagenes = imagenesRaw
        .split(',')
        .map(nombre => nombre.trim())
        .filter(nombre => nombre);

      // Validar extensiones (jpg, jpeg, png, gif)
      const invalidas = imagenes.filter(nombre => {
        return !/\.(jpe?g|png|gif)$/i.test(nombre);
      });
      if (invalidas.length) {
        errorContainer.textContent = `Estos nombres no son válidos (deben terminar en .jpg, .png o .gif): ${invalidas.join(', ')}`;
        return;
      }
    }

    // 4. Formar el payload JSON
    const payloadBody = {
      titulo,
      descripcion,
      precioInicial,
      imagenes: imagenesRaw,    // el back convertirá a array y a rutas /uploads/...
      vendedor: userId,
      fechaExpiracion: fechaExpiracion.toISOString()
    };

    // 5. Enviar petición a la API
    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payloadBody)
      });
      const data = await res.json();

      if (!res.ok) {
        errorContainer.textContent = data.error || 'Error desconocido al crear el producto.';
        return;
      }

      alert('Producto creado con éxito');
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      errorContainer.textContent = 'Error de red o servidor, inténtalo de nuevo.';
    }
  });
});
