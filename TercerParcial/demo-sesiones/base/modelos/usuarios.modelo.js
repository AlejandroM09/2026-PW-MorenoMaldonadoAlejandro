// Consultas a la tabla usuarios. Siempre con ? (consulta parametrizada), nunca pegando texto en el SQL.
const bcrypt = require('bcryptjs');

function crearModeloUsuarios(pool) {
  async function verificar(usuario, contrasena) {
    if (typeof usuario !== 'string' || typeof contrasena !== 'string') return null;

    const [filas] = await pool.query(
      'SELECT id, usuario, nombre, rol, contrasena_hash FROM usuarios WHERE usuario = ?',
      [usuario]
    );
    const fila = filas[0];

    if (!fila) return null;

    const correcta = await bcrypt.compare(contrasena, fila.contrasena_hash);
    if (!correcta) return null;

    return { id: fila.id, usuario: fila.usuario, nombre: fila.nombre, rol: fila.rol };

  }

  return { verificar };
}

module.exports = { crearModeloUsuarios };
