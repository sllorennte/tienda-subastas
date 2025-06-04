document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // Botón cerrar sesión
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    });
  }

  // Gestión navegación menú lateral
  const menuBtns = document.querySelectorAll('.menu-btn');
  const secciones = document.querySelectorAll('.contenido-principal > section');

  menuBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      menuBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.section;

      secciones.forEach((sec) => {
        if (sec.id === target) {
          sec.classList.add('seccion-activa');
          sec.classList.remove('seccion-oculta');
        } else {
          sec.classList.remove('seccion-activa');
          sec.classList.add('seccion-oculta');
        }
      });
    });
  });

  // Cargar datos usuario en configuración
  async function cargarDatosUsuario() {
    try {
      const res = await fetch('/api/usuarios/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo obtener datos de usuario');
      const usuario = await res.json();
      document.getElementById('username-config').value = usuario.username;
      document.getElementById('email-config').value = usuario.email;
    } catch (err) {
      console.error(err);
      alert('Error al cargar datos del usuario.');
    }
  }

  // Guardar cambios de configuración
  const formConfig = document.getElementById('form-configuracion');
  formConfig.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = formConfig.username.value.trim();
    const email = formConfig.email.value.trim();
    const password = formConfig.password.value;

    if (!username || !email) {
      alert('El nombre de usuario y email son obligatorios.');
      return;
    }

    try {
      const res = await fetch('/api/usuarios/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, email, password: password || undefined }),
      });
      if (!res.ok) {
        const errData = await res.json();
        alert('Error al actualizar: ' + (errData.error || 'Error desconocido'));
        return;
      }
      alert('Datos actualizados correctamente.');
      formConfig.password.value = ''; // limpiar contraseña
    } catch (err) {
      console.error(err);
      alert('Error al actualizar datos.');
    }
  });

  // Cargar pujas activas
  async function cargarPujasActivas() {
    try {
      const res = await fetch('/api/pujas/mias', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo obtener las pujas');
      const data = await res.json();
      // Suponemos que la API devuelve un array directamente, si no cambia aquí
      const pujas = Array.isArray(data) ? data : data.pujas || [];

      const contenedor = document.getElementById('lista-pujas-activas');
      contenedor.innerHTML = '';

      if (pujas.length === 0) {
        contenedor.innerHTML = '<p>No tienes pujas activas.</p>';
        return;
      }

      pujas.forEach((puja) => {
        const estado =
          puja.producto.estado === 'activo' &&
          new Date(puja.producto.fechaExpiracion) > new Date()
            ? 'Activa'
            : 'Cerrada';

        const card = document.createElement('div');
        card.className = 'puja-card';

        card.innerHTML = `
          <h3>${puja.producto.titulo}</h3>
          <p><strong>Precio inicial:</strong> €${puja.producto.precioInicial}</p>
          <p><strong>Mi puja:</strong> €${puja.cantidad}</p>
          <p class="puja-estado-${estado.toLowerCase()}"><strong>Estado:</strong> ${estado}</p>
          <p><strong>Fecha fin subasta:</strong> ${new Date(
            puja.producto.fechaExpiracion
          ).toLocaleString()}</p>
        `;
        contenedor.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      alert('Error al cargar las pujas.');
    }
  }

  // Cargar pujas creadas (subastas que ha creado el usuario)
  async function cargarPujasCreadas() {
    try {
      const res = await fetch('/api/productos/mios', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo obtener las pujas creadas');
      const data = await res.json();
      const productos = data.productos || [];

      const contenedor = document.getElementById('lista-pujas-creadas');
      contenedor.innerHTML = '';

      if (productos.length === 0) {
        contenedor.innerHTML = '<p>No has creado ninguna puja.</p>';
        return;
      }

      productos.forEach((prod) => {
        const estado =
          prod.estado === 'activo' && new Date(prod.fechaExpiracion) > new Date()
            ? 'Activa'
            : 'Cerrada';

        const card = document.createElement('div');
        card.className = 'puja-card';

        card.innerHTML = `
          <h3>${prod.titulo}</h3>
          <p><strong>Precio inicial:</strong> €${prod.precioInicial}</p>
          <p class="puja-estado-${estado.toLowerCase()}"><strong>Estado:</strong> ${estado}</p>
          <p><strong>Fecha fin subasta:</strong> ${new Date(
            prod.fechaExpiracion
          ).toLocaleString()}</p>
        `;
        contenedor.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      alert('Error al cargar las pujas creadas.');
    }
  }

  // Carga inicial
  cargarDatosUsuario();
  cargarPujasActivas();
  cargarPujasCreadas();
});
