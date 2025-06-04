document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Botón “Cerrar sesión” (si lo tuviera; si no, no hace falta)
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    });
  }

  // Referencias a elementos
  const listaProductos = document.getElementById('lista-productos');
  const sinProductosMsg = document.getElementById('sin-productos');
  const formFiltros = document.getElementById('form-filtros');
  const btnLimpiar = document.getElementById('btn-limpiar');

  const inputPrecioMin = document.getElementById('precio-min');
  const inputPrecioMax = document.getElementById('precio-max');
  const inputFechaExp = document.getElementById('fecha-expiracion');
  const selectCategoria = document.getElementById('categoria');

  // Array para almacenar TODOS los productos para filtrar en cliente
  let todosProductos = [];

  // 1) Al cargar, obtenemos todos los productos del backend
  cargarTodosProductos();

  async function cargarTodosProductos() {
    try {
      const res = await fetch('/api/productos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al obtener productos');

      const data = await res.json();
      // data structure: { metadata: {...}, productos: [ {...}, {...} ] }
      todosProductos = Array.isArray(data.productos) ? data.productos : [];
      poblarSelectCategorias(todosProductos);
      mostrarListado(todosProductos);
    } catch (err) {
      console.error(err);
      sinProductosMsg.textContent = 'Error al cargar productos. Intenta recargar la página.';
      sinProductosMsg.style.display = 'block';
    }
  }

  // 2) Llenar el dropdown de categorías (sin duplicados)
  function poblarSelectCategorias(productos) {
    const categoriasSet = new Set();
    productos.forEach(p => {
      if (p.categoria) {
        categoriasSet.add(p.categoria);
      }
    });
    // Vaciar primero (menos la opción “-- Todas --”)
    selectCategoria.innerHTML = '<option value="">-- Todas --</option>';

    categoriasSet.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      selectCategoria.appendChild(opt);
    });
  }

  // 3) Función para renderizar “grilla” de productos
  function mostrarListado(productos) {
    listaProductos.innerHTML = '';

    if (!Array.isArray(productos) || productos.length === 0) {
      sinProductosMsg.style.display = 'block';
      return;
    }
    sinProductosMsg.style.display = 'none';

    productos.forEach(p => {
      // Obtener primera imagen o placeholder
      const primeraImagen = Array.isArray(p.imagenes) && p.imagenes.length
        ? p.imagenes[0]
        : 'css/placeholder.png';

      // Fecha de expiración formateada
      const fechaExpStr = new Date(p.fechaExpiracion).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });

      const card = document.createElement('article');
      card.className = 'producto-card';

      card.innerHTML = `
        <img src="${primeraImagen}" alt="${p.titulo}" class="thumb" />
        <div class="contenido">
          <h2>${p.titulo}</h2>
          <p>${p.descripcion || ''}</p>
          <p class="precio"><strong>Precio inicial:</strong> €${p.precioInicial.toFixed(2)}</p>
          <p><strong>Categoría:</strong> ${p.categoria || '—'}</p>
          <p><strong>Caduca:</strong> ${fechaExpStr}</p>
          <a href="producto.html?id=${p._id}">Ver subasta ➔</a>
        </div>
      `;
      listaProductos.appendChild(card);
    });
  }

  // 4) Filtrar en cliente según valores del formulario
  formFiltros.addEventListener('submit', e => {
    e.preventDefault();

    // Obtener valores de filtro
    const vMin = parseFloat(inputPrecioMin.value) || 0;
    const vMax = parseFloat(inputPrecioMax.value) || Infinity;
    const fechaExpFiltro = inputFechaExp.value ? new Date(inputFechaExp.value) : null;
    const catFiltro = selectCategoria.value;

    // Filtrar
    const filtrados = todosProductos.filter(p => {
      const precio = parseFloat(p.precioInicial);
      const fechaExp = new Date(p.fechaExpiracion);
      const cat = p.categoria || '';

      // Chequear precio
      if (precio < vMin || precio > vMax) return false;
      // Chequear fecha (si se seleccionó)
      if (fechaExpFiltro && fechaExp > fechaExpFiltro) return false;
      // Chequear categoría
      if (catFiltro && cat !== catFiltro) return false;

      return true;
    });

    mostrarListado(filtrados);
  });

  // 5) Al hacer click en “Limpiar”, vaciamos campos y mostramos todo
  btnLimpiar.addEventListener('click', () => {
    inputPrecioMin.value = '';
    inputPrecioMax.value = '';
    inputFechaExp.value = '';
    selectCategoria.value = '';
    mostrarListado(todosProductos);
  });
});
