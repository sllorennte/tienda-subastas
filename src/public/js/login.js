// public/js/login.js

document.getElementById('form-login').addEventListener('submit', async e => {
  e.preventDefault();

  // Obtener valores de los inputs
  const usuario = document.getElementById('usuario').value.trim();
  const contrasena = document.getElementById('contrasena').value;

  // Validaciones básicas
  if (!usuario) {
    alert('El campo "Usuario" es obligatorio.');
    return;
  }
  if (!contrasena) {
    alert('El campo "Contraseña" es obligatorio.');
    return;
  }

  try {
    // Hacemos la petición al endpoint de login
    // Asumimos que "usuario" en el frontend corresponde al campo "email" en el backend
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: usuario, password: contrasena })
    });
    const data = await res.json();

    if (!res.ok) {
      // Mostrar error devuelto por el servidor o mensaje genérico
      alert(data.error || 'Credenciales incorrectas.');
      return;
    }

    // Guardar token y redirigir al listado principal
    localStorage.setItem('token', data.token);
    window.location.href = '/';
  } catch (err) {
    console.error(err);
    alert('Error de red o servidor al iniciar sesión.');
  }
});

// Cancelar: limpia los campos o redirige (según preferencia)
document.querySelector('.cancel').addEventListener('click', () => {
  // O bien limpiar campos:
  document.getElementById('usuario').value = '';
  document.getElementById('contrasena').value = '';
  // O redirigir a la página de inicio:
  // window.location.href = '/';
});
