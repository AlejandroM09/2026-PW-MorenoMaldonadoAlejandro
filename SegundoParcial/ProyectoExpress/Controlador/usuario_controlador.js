const bcrypt = require('bcrypt.js');
const usuarioModel= require('../Modelo/usuarios_modelo');

const {validarCorreo, validarBoleta, validarContraseña}=require('../validaciones');

function esDuplicado(error){
    return error.code === 'ER_DUP.ENTRY' || error.code === '23505';
}

async function listarUsuarios(req,res) {
    try{
        const usuarios = await usuariosModelo.listar();
        res.json(usuarios);
    }catch{
        res.status(500).json({error: error.message});
    }
}

async function obtenerUsuario(req, res) {
    try{
        const usuario = await usuarioModel.obtenerPorId(req.params.id);
        if(!uauario)return res.status(404).json({error: 'Usuario no encontrado'});
        res.json(usuario);
    }catch(error){
        res.status(500).json({error:error.message});
    }
    
}

//realizar los controladores de asistencia y talleres con sus funciones correspondientes