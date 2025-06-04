document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Botón Cerrar sesión
  const btnLogout = document.getElementById('btn-logout');
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  });

  const listaContenedor = document.getElementById('lista-pujas');
  const sinPujasMsg = document.getElementById('sin-pujas');

  // Carga inicial de pujas
  cargarPujas();

  async function cargarPujas() {
    try {
      const res = await fetch('/api/pujas/mias', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('No se pudo obtener las pujas');

      const pujas = await res.json();

      // Si no hay pujas o la respuesta no es array
      if (!Array.isArray(pujas) || pujas.length === 0) {
        sinPujasMsg.style.display = 'block';
        listaContenedor.innerHTML = '';
        return;
      }

      sinPujasMsg.style.display = 'none';
      listaContenedor.innerHTML = '';

      pujas.forEach(puja => {
        const fechaStr = new Date(puja.fechaPuja).toLocaleString();

        // Crear tarjeta
        const card = document.createElement('div');
        card.className = 'puja-card';
        card.setAttribute('data-id', puja._id);
        card.setAttribute('data-producto', puja.producto._id);
        card.setAttribute('data-precio-inicial', puja.producto.precioInicial);

        // Inner HTML: Nombre, monto, fecha, meta (precio inicial + estado)
        card.innerHTML = `
          <div class="puja-detalle">
            <h3>${puja.producto.titulo}</h3>
            <div>
              <p class="puja-amount">€ <span class="monto-texto">${puja.cantidad.toFixed(2)}</span></p>
              <p class="puja-fecha">${fechaStr}</p>
            </div>
          </div>
          <p class="puja-meta">Precio inicial: € ${puja.producto.precioInicial.toFixed(2)}</p>
          <p class="puja-meta">Estado de subasta: <strong>${puja.producto.estado}</strong></p>
          <div class="puja-acciones">
            <button class="btn-editar">Editar</button>
            <button class="btn-eliminar">Eliminar</button>
          </div>
        `;

        listaContenedor.appendChild(card);
      });

      // Asignamos manejadores después de insertar las cards:
      asignarHandlers();
    } catch (err) {
      console.error(err);
      sinPujasMsg.textContent = 'Error al cargar tus pujas. Intenta más tarde.';
      sinPujasMsg.style.display = 'block';
    }
  }

  function asignarHandlers() {
    // Botones Eliminar
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.puja-card');
        const pujaId = card.getAttribute('data-id');

        // Confirmación antes de borrar
        const confirmar = window.confirm('¿Estás seguro de que quieres eliminar esta puja?');
        if (!confirmar) return;

        fetch(`/api/pujas/${pujaId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => {
            if (res.ok) {
              card.remove();
              // Si ya no quedan tarjetas, mostrar mensaje
              if (listaContenedor.children.length === 0) {
                sinPujasMsg.style.display = 'block';
              }
            } else {
              console.error('Error al eliminar puja.');
            }
          })
          .catch(err => console.error(err));
      });
    });

    // Botones Editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.puja-card');
        iniciarEdicion(card);
      });
    });
  }

  function iniciarEdicion(card) {
    // Si ya estamos editando, no hacemos nada
    if (card.classList.contains('editando')) return;
    card.classList.add('editando');

    // Elementos y datos originales
    const montoTextoElem = card.querySelector('.monto-texto');
    const montoOriginal = parseFloat(montoTextoElem.textContent);
    const precioInicial = parseFloat(card.getAttribute('data-precio-inicial'));
    const fechaElem = card.querySelector('.puja-fecha');

    // Ocultar monto actual y acciones
    montoTextoElem.style.display = 'none';
    const accionesDiv = card.querySelector('.puja-acciones');
    accionesDiv.style.display = 'none';

    // Crear contenedor para inputs y nuevos botones
    const contEdicion = document.createElement('div');
    contEdicion.className = 'edicion-inline';
    contEdicion.style.display = 'flex';
    contEdicion.style.alignItems = 'center';
    contEdicion.style.gap = '0.5rem';
    contEdicion.style.marginTop = '0.75rem';

    // Input para nueva cantidad
    const inputNuevo = document.createElement('input');
    inputNuevo.type = 'number';
    inputNuevo.min = (precioInicial + 0.01).toFixed(2);
    inputNuevo.step = '0.01';
    inputNuevo.value = montoOriginal.toFixed(2);
    inputNuevo.className = 'input-editar';
    inputNuevo.required = true;

    // Botón Guardar
    const btnGuardar = document.createElement('button');
    btnGuardar.textContent = 'Guardar';
    btnGuardar.className = 'btn-guardar-edit';

    // Botón Cancelar
    const btnCancelar = document.createElement('button');
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.className = 'btn-cancelar-edit';

    contEdicion.appendChild(inputNuevo);
    contEdicion.appendChild(btnGuardar);
    contEdicion.appendChild(btnCancelar);

    card.appendChild(contEdicion);

    // Cancelar edición
    btnCancelar.addEventListener('click', () => {
      card.classList.remove('editando');
      contEdicion.remove();
      montoTextoElem.style.display = 'inline';
      accionesDiv.style.display = 'flex';
    });

    // Guardar edición
    btnGuardar.addEventListener('click', async () => {
      const nuevoValor = parseFloat(inputNuevo.value);
      if (isNaN(nuevoValor) || nuevoValor <= precioInicial) {
        inputNuevo.style.borderColor = 'red';
        return;
      }

      const pujaId = card.getAttribute('data-id');
      const productoId = card.getAttribute('data-producto');

      try {
        // 1) Eliminar la puja anterior
        const resDel = await fetch(`/api/pujas/${pujaId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!resDel.ok) throw new Error('Error borrando puja antigua');

        // 2) Crear la puja con el nuevo valor
        const resNew = await fetch('/api/pujas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            producto: productoId,
            cantidad: nuevoValor
            // El pujador se deduce del token en el backend
          })
        });
        if (!resNew.ok) throw new Error('Error creando puja nueva');

        const nuevaPuja = await resNew.json();
        // El backend debería devolver { mensaje: ..., puja: { _id, cantidad, fechaPuja, producto: {...} } }

        // 3) Actualizar la tarjeta “in situ” con los datos de la nueva puja:
        //    - Actualizar data-id al nuevo _id
        card.setAttribute('data-id', nuevaPuja.puja._id);

        //    - Actualizar monto en pantalla
        montoTextoElem.textContent = nuevaPuja.puja.cantidad.toFixed(2);

        //    - Actualizar fecha en pantalla
        const nuevaFechaStr = new Date(nuevaPuja.puja.fechaPuja).toLocaleString();
        fechaElem.textContent = nuevaFechaStr;

        // 4) Salir del modo edición
        card.classList.remove('editando');
        contEdicion.remove();
        montoTextoElem.style.display = 'inline';
        accionesDiv.style.display = 'flex';
      } catch (err) {
        console.error(err);
        inputNuevo.style.borderColor = 'red';
      }
    });
  }
});
