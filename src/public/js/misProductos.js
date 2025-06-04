// public/js/misProductos.js

document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificar token. Si no existe, redirigir a login.
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

  // 3. Elemento contenedor donde pondremos las tarjetas
  const listaContainer = document.getElementById('lista-mis-productos');

  // 4. Función para cargar productos propios
  async function cargarMisProductos() {
    try {
      const res = await fetch('/api/productos/mios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          // token inválido o caducado
          localStorage.removeItem('token');
          window.location.href = '/login.html';
        }
        throw new Error('No autorizado o error en servidor');
      }
      const data = await res.json();
      const productos = data.productos || data; // dependiendo de tu respuesta API

      // Si tu API devuelve { metadata: {...}, productos: [...] }, usa data.productos
      // Si devuelve directamente un array, usa data.

      listaContainer.innerHTML = ''; // limpiamos antes de renderizar

      if (!productos.length) {
        listaContainer.innerHTML = '<p>No tienes productos a la venta.</p>';
        return;
      }

      // Por cada producto, creamos una tarjeta
      productos.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'producto-card';

        // Si hay imágenes, usamos la primera; si no, placeholder
        const primeraImagen = (prod.imagenes && prod.imagenes.length)
          ? prod.imagenes[0]
          : '/css/placeholder.png';

        // Determinar estado (activo/cerrado) según fechaExpiracion
        const fechaExp = new Date(prod.fechaExpiracion);
        const ahora = new Date();
        const estado = (prod.estado === 'activo' && fechaExp > ahora)
          ? 'Activo'
          : 'Cerrado';

        card.innerHTML = `
          <img src="${primeraImagen}" alt="${prod.titulo}" class="thumb" />
          <div class="contenido">
            <h2>${prod.titulo}</h2>
            <p>${prod.descripcion ? prod.descripcion.substring(0, 60) + '…' : ''}</p>
            <p class="precio">Precio inicial: €${prod.precioInicial.toFixed(2)}</p>
            <p class="estado-producto">Estado: <strong>${estado}</strong></p>
            <a href="producto.html?id=${prod._id}">Ver detalle</a>
          </div>
        `;

        listaContainer.appendChild(card);
      });

    } catch (err) {
      console.error(err);
      listaContainer.innerHTML = '<p>Error al cargar tus productos.</p>';
    }
  }

  // 5. Carga inicial
  cargarMisProductos();
});
