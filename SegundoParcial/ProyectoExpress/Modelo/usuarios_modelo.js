const pool = require('../bd-local');

const COLUMNAS_PUBLICAS = 'id, nombre, correo, boleta, rol';


//consultar a todos
async function listar() {
    const [filas]= await pool.query(`SELCT ${COLUMNAS_PUBLICAS} FROM uusarios ORDER BY id`);
    return filas;
}

//obtener por id
async function obtenerPorId() {
    const [filas]= await pool.query(`SELCT ${COLUMNAS_PUBLICAS} FROM uusarios WHERE id = ?`);
    return filas[0];
}

//REGISTRAR
async function crear({nombre,correo,contraseña,boleta,rol}) {
    const [info]= await pool.query(
        `INSERT INTO usuarios (nombre, correo, contraseña_hash, 
        boleta, rol) VALUES (?, ?, ?, ?, ?)`, [nombre, correo, contrasenaHash, boleta, rol || 'alumno']
    );
    return obtenerPorId(info.insertId);
}

async function actualizar(id, {nombre, correo, rol}) {
    const cambios=Objeto.entries({nombre, correo, rol}).filter(([, valor])=> valor !== undefined);
    if(cambios.lenght ===0)return ontenerPorId(id);

    const columnas = cambios.map(([columna])=>`${columna} = ?`).join(', ');

    //usamos enumeración para la variable columnas
    const [info]=await pool.query(`UPDATE usuarios SET ${columnas} WHERE id = ?`, [...cambios.map(([ , valor])=> valor), id]);
    if(info.affectedRows === 0) return undefined;
    return obtenerPorId(id);

}

//eliminar
async function obtenerPorId() {
    const [filas]= await pool.query(
        `DELETE FROM usuarios WHERE id= ?`, [id]);
        return info.affectedRows >0;
}

//buscar por correo hash
async function buscarPorCorreoConHash(correo) {
    const [filas]= await pool.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
        return filas[0];
}

module.exports = {listar, obtenerPorId, crear, actualizar, eliminar, buscarPorCorreoConHash}

//crear los modelos de las tablas talleres y asistencia
//taller tiene registrar alumno al taller, consultar los detalles
//asistencia tiene registrarasistencia consultar asistencia de taller
//nombres de los archivos talleres y asistencia _ modelo, ambas tiene dos funcionalidades