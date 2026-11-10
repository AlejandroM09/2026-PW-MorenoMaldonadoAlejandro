import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { pedirJSON } from '../../lib/api';
import { formatearFecha, ocultarBoleta } from '../../lib/formato';
import estilos from '../../styles/Talleres.module.css';

export default function Asistencias() {
  const router = useRouter();
  const { id } = router.query;
  const [taller, setTaller] = useState(null);
  const [inscritos, setInscritos] = useState([]);
  const [marcados, setMarcados] = useState([]); 
  const [error, setError] = useState('');

    useEffect(() => {
    if (!router.isReady) return;
    cargar();
  }, [router.isReady, id]);

  async function cargar() {
    try {
      setTaller(await pedirJSON(`/talleres/${id}`));
      setInscritos(await pedirJSON(`/talleres/${id}/asistencias`));
      try {
        const guardado = localStorage.getItem(`asistencia-taller-${id}`);
        setMarcados(guardado ? JSON.parse(guardado) : []);
      } catch {
        setMarcados([]);
      }
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  function alternar(idInscripcion) {
    const nuevos = marcados.includes(idInscripcion)
      ? marcados.filter((m) => m !== idInscripcion)
      : [...marcados, idInscripcion];

    setMarcados(nuevos);
    try {
      localStorage.setItem(`asistencia-taller-${id}`, JSON.stringify(nuevos));
    } catch {
    }
  }

  if (error) {
    return (
      <main className={estilos.contenedor}>
        <p className="error">{error}</p>
        <Link href="/asistencias">← Volver a asistencias</Link>
      </main>
    );
  }
  if (!taller) return <main className={estilos.contenedor}><p>Cargando taller…</p></main>;

  return (
    <main className={estilos.contenedor}>
      <Link href="/asistencias">← Volver a asistencias</Link>
      <h1>{taller.nombre}</h1>
      <p>
        <strong>Fecha:</strong> {formatearFecha(taller.fecha)} ·{' '}
        <strong>Asistieron:</strong> {marcados.length} de {inscritos.length}
      </p>

      {inscritos.length === 0 ? (
        <p>Todavía no hay inscritos en este taller.</p>
      ) : (
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Boleta</th>
              <th>Asistió</th>
            </tr>
          </thead>
          <tbody>
            {inscritos.map((a, i) => (
              <tr key={a.id}>
                <td>{i + 1}</td>
                <td>{a.nombre_alumno}</td>
                <td>{ocultarBoleta(a.boleta)}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={marcados.includes(a.id)}
                    onChange={() => alternar(a.id)}
                    aria-label={`Asistencia de ${a.nombre_alumno}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

