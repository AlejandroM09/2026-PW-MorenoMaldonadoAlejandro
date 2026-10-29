import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { pedirJSON } from '../lib/api';
import { validarNombre, validarBoleta, validarContrasena, validarCorreo } from '../lib/validaciones';
import estilos from '../styles/Talleres.module.css';

export default function Registro() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [boleta, setBoleta] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (router.query.boleta) setBoleta(String(router.query.boleta));
  }, [router.query.boleta]);

  async function registrar(e) {
    e.preventDefault();
    setError('');
    setExito('');

    const datos = {
      nombre: nombre.trim(),
      correo: correo.trim(),
      boleta: boleta.trim(),
      contrasena,
    };

    if (!validarNombre(datos.nombre)) {
      return setError('El nombre solo puede tener letras y espacios.');
    }
    if (!validarCorreo(datos.correo)) return setError('El correo no tiene un formato válido.');
    if (!validarBoleta(datos.boleta)) return setError('La boleta debe tener 10 dígitos.');
    if (!validarContrasena(datos.contrasena)) {
      return setError('La contraseña debe tener al menos 8 caracteres.');
    }

    setEnviando(true);
    try {
      await pedirJSON('/usuarios', { method: 'POST', body: JSON.stringify(datos) });

      try {
        localStorage.setItem('ultimaBoleta', datos.boleta);
      } catch {
      }

      setExito(`¡Listo! La cuenta de ${datos.nombre} fue creada.`);
      setNombre('');
      setCorreo('');
      setBoleta('');
      setContrasena('');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className={estilos.contenedor}>
      <h1>Crear cuenta</h1>

      <form onSubmit={registrar} className={estilos.formularioPerfil}>
        <input
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <input
          placeholder="Boleta (10 dígitos)"
          value={boleta}
          onChange={(e) => setBoleta(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña (mínimo 8 caracteres)"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
        <button type="submit" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {exito && (
        <p className={estilos.exito}>{exito} 
        </p>
      )}
    </main>
  );
}