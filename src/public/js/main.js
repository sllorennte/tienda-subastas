// public/js/main.js

document.addEventListener('DOMContentLoaded', () => {
  // 1. Verificar token (mantiene la lógica de redirección si no hay token)
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // 2. Si en tu header tienes un botón de logout, puedes activarlo aquí
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });
  }

  // 3. Inyectar dinámicamente el buscador, la lista de productos y paginación
  // -------------------------------------------------------------------------
  const contentArea = document.querySelector('.content-area');
  contentArea.innerHTML = `
    <!-- Sección de búsqueda -->
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
    </section>

    <!-- Listado de productos -->
    <section id="lista-productos" class="lista-productos">
      <!-- Aquí se insertan dinámicamente las tarjetas -->
    </section>

    <!-- Paginación -->
    <nav id="paginacion" class="paginacion-nav">
      <!-- Botones de páginas se generan dinámicamente -->
    </nav>
  `;

  // 4. Variables globales para paginación y búsqueda
  let currentPage = 1;
  const limit = 5; // productos por página
  let currentSearch = '';

  // 5. Punteros a nuevos elementos inyectados
  const listaProductos = document.getElementById('lista-productos');
  const paginacionNav = document.getElementById('paginacion');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  // 6. Función para cargar productos (misma lógica que antes)
  async function cargarProductos() {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit
      });
      if (currentSearch) {
        params.set('search', currentSearch);
      }
      const url = `/api/productos?${params.toString()}`;

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

  // 7. Renderizar productos dentro de #lista-productos
  function mostrarProductos(productos) {
    listaProductos.innerHTML = ''; // limpiar

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

  // 8. Generar controles de paginación en #paginacion
  function generarPaginacion({ page, limit, totalPages }) {
    paginacionNav.innerHTML = ''; // limpiar

    // Botón “Anterior”
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

    // Botones numerados de página
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

    // Botón “Siguiente”
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

  // 9. Eventos de búsqueda
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

  // 10. Carga inicial de productos
  cargarProductos();
});
