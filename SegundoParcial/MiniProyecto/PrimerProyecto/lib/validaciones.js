export function validarCorreo(correo) {
  if (typeof correo !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
}

export function validarBoleta(boleta) {
  if (typeof boleta !== 'string') return false;
  return /^\d{10}$/.test(boleta.trim());
}

export function validarContrasena(contrasena) {
  if (typeof contrasena !== 'string') return false;
  return contrasena.length >= 8;
}
export function validarNombre(nombre) {
  if (typeof nombre !== 'string') return false;
  const limpio = nombre.trim();
  if (limpio.length < 2 || limpio.length > 50) return false;
  return /^\p{L}+(?:[ '’-]\p{L}+)*$/u.test(limpio);
}