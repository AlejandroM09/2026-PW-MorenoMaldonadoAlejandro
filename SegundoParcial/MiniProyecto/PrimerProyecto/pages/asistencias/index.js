import Link from 'next/link';
import { useEffect, useState } from 'react';
import { pedirJSON } from '../../lib/api';
import { formatearFecha, yaPaso } from '../../lib/formato';
import estilos from '../../styles/Talleres.module.css';

export default function Asistencias() {
  const [talleres, setTalleres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      const lista = await pedirJSON('/talleres');
      // Activos = los que todavía no pasan (el de hoy cuenta como activo).
      setTalleres(lista.filter((t) => !yaPaso(t.fecha)));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className={estilos.contenedor}>
      <h1>Asistencias</h1>
      <p>Elige un taller para marcar la asistencia de sus inscritos.</p>

      {cargando && <p>Cargando talleres…</p>}
      {error && <p className="error">{error}</p>}
      {!cargando && !error && talleres.length === 0 && <p>No hay talleres activos.</p>}

      <ul className={estilos.lista}>
        {talleres.map((t) => (
          <li key={t.id}>
            <Link href={`/asistencias/${t.id}`}>{t.nombre}</Link> — {formatearFecha(t.fecha)}
          </li>
        ))}
      </ul>
    </main>
  );
}