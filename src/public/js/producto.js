// ./public/js/producto.js

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // Cerrar sesión
  const btnLogout = document.getElementById('btn-logout');
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
  });

  // Obtener payload y userId
  const payload = JSON.parse(atob(token.split('.')[1]));
  const userId = payload.id;

  // Obtener id producto URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    alert('ID de producto no especificado');
    return;
  }

  // Elementos DOM importantes
  const tituloEl = document.getElementById('titulo');
  const descripcionEl = document.getElementById('descripcion');
  const numSubastaEl = document.getElementById('numero-subasta');
  const estadoSubastaEl = document.getElementById('estado-subasta');
  const pujaActualEl = document.getElementById('puja-actual');
  const precioReservaEl = document.getElementById('precio-reserva');
  const expertoNombreEl = document.getElementById('experto-nombre');
  const estimacionMinEl = document.getElementById('estimacion-min');
  const estimacionMaxEl = document.getElementById('estimacion-max');

  const imagenPrincipalEl = document.getElementById('imagen-principal');
  const thumbnailsEl = document.getElementById('thumbnails');

  const botonesPuja = document.querySelectorAll('.btn-puja-opcion');
  const formPuja = document.getElementById('form-puja');
  const inputCantidad = formPuja.querySelector('#cantidad');
  const btnMaxPuja = document.getElementById('btn-max-puja');
  const errorPuja = document.createElement('p');
  errorPuja.style.color = 'red';
  errorPuja.style.marginTop = '0.5rem';
  formPuja.appendChild(errorPuja);

  let producto;
  let pujas = [];

  // Función para mostrar imagen principal y thumbnails
  function mostrarGaleria(imagenes) {
    imagenPrincipalEl.innerHTML = '';
    thumbnailsEl.innerHTML = '';

    if (!imagenes || imagenes.length === 0) {
      const imgPlaceholder = document.createElement('img');
      imgPlaceholder.src = '/css/placeholder.png';
      imgPlaceholder.alt = 'Sin imagen';
      imgPlaceholder.style.width = '100%';
      imagenPrincipalEl.appendChild(imgPlaceholder);
      return;
    }

    // Imagen principal
    const imgMain = document.createElement('img');
    imgMain.src = imagenes[0];
    imgMain.alt = producto.titulo;
    imgMain.classList.add('imagen-principal-img');
    imagenPrincipalEl.appendChild(imgMain);

    // Miniaturas
    imagenes.forEach((url, idx) => {
      const thumb = document.createElement('img');
      thumb.src = url;
      thumb.alt = producto.titulo + ' miniatura';
      thumb.classList.add('thumbnail-img');
      if (idx === 0) thumb.classList.add('active');

      thumb.addEventListener('click', () => {
        // Cambiar imagen principal
        imgMain.src = url;
        // Marcar miniatura activa
        thumbnailsEl.querySelectorAll('img').forEach(img => img.classList.remove('active'));
        thumb.classList.add('active');
      });

      thumbnailsEl.appendChild(thumb);
    });
  }

  // Función para calcular y mostrar tiempo restante
  function actualizarTiempoRestante(fechaExp) {
    const fin = new Date(fechaExp);
    const ahora = new Date();
    const diffMs = fin - ahora;
    if (diffMs <= 0) {
      estadoSubastaEl.textContent = 'Subasta cerrada';
      return;
    }

    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutos = Math.floor((diffMs / (1000 * 60)) % 60);
    const segundos = Math.floor((diffMs / 1000) % 60);

    estadoSubastaEl.textContent = `Cierra en ${dias}d ${horas}h ${minutos}m ${segundos}s`;
  }

  // Cargar datos del producto
  try {
    const res = await fetch(`/api/productos/${id}`);
    if (!res.ok) throw new Error('Producto no encontrado');
    producto = await res.json();

    tituloEl.textContent = producto.titulo;
    descripcionEl.textContent = producto.descripcion || '';
    numSubastaEl.textContent = producto._id.slice(-8).toUpperCase();

    // Mostrar galería
    mostrarGaleria(producto.imagenes);

    // Estimaciones y experto (puedes modificar esto si lo tienes dinámico)
    expertoNombreEl.textContent = 'Robin Goyeux'; // Ejemplo fijo
    estimacionMinEl.textContent = 500;
    estimacionMaxEl.textContent = 550;

  } catch (err) {
    alert('Error cargando producto');
    console.error(err);
    return;
  }

  // Actualizar tiempo restante cada segundo
  actualizarTiempoRestante(producto.fechaExpiracion);
  const intervaloTiempo = setInterval(() => {
    actualizarTiempoRestante(producto.fechaExpiracion);
  }, 1000);

  // Cargar pujas
  async function cargarPujas() {
    try {
      const resPujas = await fetch(`/api/pujas?producto=${id}`);
      if (!resPujas.ok) throw new Error('Error al cargar pujas');
      pujas = await resPujas.json();

      if (pujas.length > 0) {
        const maxPuja = Math.max(...pujas.map(p => p.cantidad));
        pujaActualEl.textContent = `€ ${maxPuja.toFixed(2)}`;
        if (producto.precioInicial > maxPuja) {
          precioReservaEl.style.display = 'block';
        } else {
          precioReservaEl.style.display = 'none';
        }
      } else {
        pujaActualEl.textContent = `€ ${producto.precioInicial.toFixed(2)}`;
        precioReservaEl.style.display = 'block';
      }
    } catch (err) {
      console.error(err);
      pujaActualEl.textContent = `€ ${producto.precioInicial.toFixed(2)}`;
      precioReservaEl.style.display = 'block';
    }
  }
  await cargarPujas();

  // Deshabilitar puja si subasta cerrada
  const finSubasta = new Date(producto.fechaExpiracion);
  if (producto.estado !== 'activo' || finSubasta <= new Date()) {
    inputCantidad.disabled = true;
    btnMaxPuja.disabled = true;
    formPuja.querySelector('.btn-pujar').disabled = true;
  }

  // Botones puja rápida
  botonesPuja.forEach(btn => {
    btn.addEventListener('click', () => {
      inputCantidad.value = btn.dataset.amount;
      errorPuja.textContent = '';
    });
  });

  // Botón puja máxima
  btnMaxPuja.addEventListener('click', () => {
    if (pujas.length > 0) {
      const maxPuja = Math.max(...pujas.map(p => p.cantidad));
      inputCantidad.value = (maxPuja + 10).toFixed(2);
    } else {
      inputCantidad.value = (producto.precioInicial + 10).toFixed(2);
    }
    errorPuja.textContent = '';
  });

  // Manejar envío de puja
  formPuja.addEventListener('submit', async e => {
    e.preventDefault();
    errorPuja.textContent = '';

    const cantidadRaw = inputCantidad.value;
    if (!cantidadRaw) {
      errorPuja.textContent = 'Debes ingresar una cantidad.';
      return;
    }
    const cantidad = parseFloat(cantidadRaw);
    if (isNaN(cantidad) || cantidad <= 0) {
      errorPuja.textContent = 'La cantidad debe ser un número mayor que cero.';
      return;
    }

    let maxPuja = producto.precioInicial;
    if (pujas.length > 0) {
      maxPuja = Math.max(...pujas.map(p => p.cantidad));
    }

    if (cantidad <= maxPuja) {
      errorPuja.textContent = `La puja debe ser mayor a €${maxPuja.toFixed(2)}.`;
      return;
    }

    // Enviar puja
    try {
      const res = await fetch('/api/pujas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          producto: id,
          pujador: userId,
          cantidad
        })
      });
      const data = await res.json();
      if (!res.ok) {
        errorPuja.textContent = data.error || 'Error al realizar la puja.';
        return;
      }
      alert('Puja realizada con éxito');
      window.location.reload();
    } catch (err) {
      console.error(err);
      errorPuja.textContent = 'Error de red o servidor al pujar.';
    }
  });
});
