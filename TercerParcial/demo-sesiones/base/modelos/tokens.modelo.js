function crearModeloTokens(pool){
    //necesitamos una funcion que se encarge de poder insertar dentro de la base de datos los tokens que estaran revocados para que no se vuelvan a utilizar
    async function revocar(jti,usuario,exp) {
        await pool.query(
            'INSERT INTO tokens_revocados (jti,usuario,expira) VALUES (?,?, FROM_UNEXTIME(?))',[jti,usuario,exp]
        );
    }

    //una funcion para verificar si el token esta revocado
    async function estaRevocado(jti) {
        const [filas]=await pool.query(
            'SELECT 1 FROM tokens_revocados WHERE jti=?',[String(jti || '')]);
            return filas.lenght>0;
    }

    //una funcion para poder consultar todos los tokens revocados
    async function listar() {
        const [filas]=await pool.query(
            'SELECT jti, usuario,expira,revocado_en FROM tokens_revocados ORDER BY revocados_en DESC, jti'
        );
        return filas;
    };

    return {revocar,estaRevocado,listar};
}

module.exports={crearModeloTokens};