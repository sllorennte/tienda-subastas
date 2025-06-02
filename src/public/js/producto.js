// ./public/js/producto.js

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificar token o redirigir
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // 2. Botón “Cerrar sesión”
  const btnLogout = document.getElementById('btn-logout');
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
  });

  // 3. Obtener ID de usuario del payload
  const payload = JSON.parse(atob(token.split('.')[1]));
  const userId = payload.id;

  // 4. Obtener el ID del producto de la URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  // 5. Cargar datos del producto
  let prod;
  try {
    const resProd = await fetch(`/api/productos/${id}`);
    if (!resProd.ok) throw new Error('Producto no encontrado');
    prod = await resProd.json();

    document.getElementById('titulo').textContent = prod.titulo;
    document.getElementById('descripcion').textContent = prod.descripcion || '';
    document.getElementById('precio-inicial').textContent = prod.precioInicial;
    document.getElementById('vendedor').textContent = prod.vendedor.username;
    document.getElementById('expiracion').textContent = new Date(prod.fechaExpiracion).toLocaleString();
    document.getElementById('estado').textContent = prod.estado;
  } catch (err) {
    console.error(err);
    alert('No se pudo cargar el producto.');
    return;
  }

  // 6. Galería de imágenes o placeholder
  const contFotos = document.getElementById('imagenes-producto');
  contFotos.innerHTML = '';
  if (!prod.imagenes || prod.imagenes.length === 0) {
    // Mostrar placeholder
    const imgPlaceholder = document.createElement('img');
    imgPlaceholder.src = '/css/placeholder.png';
    imgPlaceholder.alt = 'Sin imagen';
    imgPlaceholder.className = 'detalle-imagen';
    contFotos.appendChild(imgPlaceholder);
  } else {
    prod.imagenes.forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.alt = prod.titulo;
      img.className = 'detalle-imagen';
      contFotos.appendChild(img);
    });
  }

  // 7. Deshabilitar formulario de puja si la subasta está cerrada
  const mensajeEstado = document.getElementById('mensaje-estado');
  const formPuja = document.getElementById('form-puja');
  const inputCantidad = formPuja.querySelector('input');
  const botonPujar = formPuja.querySelector('button');

  // Comprobar si fecha de expiración ya pasó o estado distinto de "activo"
  if (prod.estado !== 'activo' || new Date(prod.fechaExpiracion) <= new Date()) {
    inputCantidad.disabled = true;
    botonPujar.disabled = true;
    mensajeEstado.innerHTML = '<p style="color:red; font-weight:bold;">⚠️ Subasta cerrada</p>';
  } else {
    inputCantidad.disabled = false;
    botonPujar.disabled = false;
    mensajeEstado.innerHTML = '';
  }

  // 8. Cargar pujas existentes
  try {
    const resPujas = await fetch(`/api/pujas?producto=${id}`);
    if (!resPujas.ok) throw new Error('Error al cargar pujas');
    const pujas = await resPujas.json();

    const lista = document.getElementById('lista-pujas');
    lista.innerHTML = '';
    pujas.forEach(p => {
      const li = document.createElement('li');
      li.textContent = `€${p.cantidad} - ${p.pujador.username} (${new Date(p.fechaPuja).toLocaleString()})`;
      lista.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    alert('No se pudieron cargar las pujas.');
  }

  // 9. Manejar envío de nueva puja con validaciones
  const errorPuja = document.getElementById('error-puja');
  formPuja.addEventListener('submit', async e => {
    e.preventDefault();
    errorPuja.textContent = '';

    const cantidadRaw = document.getElementById('cantidad').value;
    if (!cantidadRaw) {
      errorPuja.textContent = 'Debes ingresar una cantidad.';
      return;
    }
    const cantidad = parseFloat(cantidadRaw);
    if (isNaN(cantidad) || cantidad <= 0) {
      errorPuja.textContent = 'La cantidad debe ser un número mayor que cero.';
      return;
    }

    // Validar que supera la puja máxima
    let maxPuja = prod.precioInicial;
    try {
      const resumenRes = await fetch(`/api/pujas?producto=${id}`);
      if (resumenRes.ok) {
        const resumen = await resumenRes.json();
        if (resumen.length > 0) {
          maxPuja = resumen[0].cantidad;
        }
      }
    } catch (e) {
      console.warn('No se pudo obtener última puja para validar.', e);
    }

    if (cantidad <= maxPuja) {
      errorPuja.textContent = `La puja debe ser mayor a €${maxPuja}.`;
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
      alert('✅ Puja realizada con éxito');
      window.location.reload();
    } catch (err) {
      console.error(err);
      errorPuja.textContent = 'Error de red o servidor al pujar.';
    }
  });
});
