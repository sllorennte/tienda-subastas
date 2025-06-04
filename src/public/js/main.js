document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });
  }

  const contentArea = document.querySelector('.content-area');
  contentArea.innerHTML = `
    <section id="busqueda" class="busqueda-contenedor">
      <div class="busqueda-input-wrapper">
        <svg class="icono-lupa" xmlns="http://www.w3.org/2000/svg"
             fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 19a8 8 0 100-16 8 8 0 000 16zm6-4l4 4"/>
        </svg>
        <input type="text" id="search-input" placeholder="Buscar por título o descripción...">
      </div>
      <button id="search-btn">Buscar</button>
      <button id="btn-mis-productos" style="margin-left: 1rem;">Mis productos</button>
    </section>

    <section id="lista-productos" class="lista-productos"></section>

    <nav id="paginacion" class="paginacion-nav"></nav>
  `;

  let currentPage = 1;
  const limit = 5;
  let currentSearch = '';
  let mostrarSoloMios = false;

  const listaProductos = document.getElementById('lista-productos');
  const paginacionNav = document.getElementById('paginacion');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const btnMisProductos = document.getElementById('btn-mis-productos');

  async function cargarProductos() {
    try {
      const params = new URLSearchParams({ page: currentPage, limit: limit });
      if (currentSearch) params.set('search', currentSearch);

      // Cambiar URL según si mostrar solo productos propios
      const url = mostrarSoloMios ? '/api/productos/mios' : `/api/productos?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al obtener productos');
      const data = await res.json();
      const { metadata, productos } = data;

      mostrarProductos(productos);
      generarPaginacion(metadata);
    } catch (err) {
      console.error(err);
      alert('No se pudieron cargar los productos.');
    }
  }

  function mostrarProductos(productos) {
    listaProductos.innerHTML = '';
    if (productos.length === 0) {
      listaProductos.innerHTML = '<p class="sin-productos">No se encontraron productos.</p>';
      return;
    }

    productos.forEach(p => {
      const card = document.createElement('article');
      card.className = 'producto-card';

      const primeraImagen = p.imagenes && p.imagenes.length
        ? p.imagenes[0]
        : 'uploads/mesa.jpg';

      card.innerHTML = `
        <img src="${primeraImagen}" alt="${p.titulo}" class="thumb" />
        <div class="contenido">
          <h2>${p.titulo}</h2>
          <p>${p.descripcion || ''}</p>
          <p class="precio"><strong>Precio inicial:</strong> €${p.precioInicial}</p>
          <p class="vendedor"><strong>Vendedor:</strong> ${p.vendedor.username}</p>
          <a href="producto.html?id=${p._id}">Ver subasta ➔</a>
        </div>
      `;
      listaProductos.appendChild(card);
    });
  }

  function generarPaginacion({ page, limit, totalPages }) {
    paginacionNav.innerHTML = '';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Anterior';
    prevBtn.disabled = page <= 1;
    prevBtn.className = 'btn-pagina';
    prevBtn.addEventListener('click', () => {
      if (page > 1) {
        currentPage = page - 1;
        cargarProductos();
      }
    });
    paginacionNav.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = 'btn-pagina';
      if (i === page) {
        pageBtn.disabled = true;
        pageBtn.classList.add('page-active');
      }
      pageBtn.addEventListener('click', () => {
        currentPage = i;
        cargarProductos();
      });
      paginacionNav.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Siguiente';
    nextBtn.disabled = page >= totalPages;
    nextBtn.className = 'btn-pagina';
    nextBtn.addEventListener('click', () => {
      if (page < totalPages) {
        currentPage = page + 1;
        cargarProductos();
      }
    });
    paginacionNav.appendChild(nextBtn);
  }

  searchBtn.addEventListener('click', () => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    cargarProductos();
  });

  searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchBtn.click();
    }
  });

  btnMisProductos.addEventListener('click', () => {
    mostrarSoloMios = !mostrarSoloMios;
    btnMisProductos.textContent = mostrarSoloMios ? 'Ver todos' : 'Mis productos';
    currentPage = 1;
    cargarProductos();
  });

  cargarProductos();
});
