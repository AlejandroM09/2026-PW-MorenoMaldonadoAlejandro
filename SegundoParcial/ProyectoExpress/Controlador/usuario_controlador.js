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
async function crearUsuario(req, res){
    const { nombre, correo, contrasena, boleta, rol } = req.body;
 
    if(!nombre || !correo || !contrasena || !boleta){
        return res.status(400).json({ error: 'Los campos nombre, correo, contraseña y boleta son obligatorios' });
    }
 
    if(!ValidarCorreo(correo)){
        return res.status(400).json({ error: 'El correo no tiene un formato válido' });
    }
 
    if(!ValidarBoleta(boleta)){
        return res.status(400).json({ error: 'La boleta debe tener 10 dígitos' });
    }
 
    if(!ValidarContrasena(contrasena)){
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }
 
    try {
        const contrasenaHash = await bcypt.hash(contrasena, 10);
        const usuario = await usuarioModelo.crear({ nombre, correo, contrasenaHash, boleta, rol });
        res.status(201).json(usuario);
    } catch (error) {
        if (esDuplicado(error)) {
            return res.status(409).json({ error: 'Ya existe un usuario con ese correo o boleta registrado' });
        }
        res.status(500).json({ error: error.message });
    }
}
 
async function actualizarUsuario(req, res){
    const { nombre, correo, rol } = req.body;
 
    if(nombre === undefined && correo === undefined && rol === undefined){
        return res.status(400).json({ error: 'Al menos un campo (nombre, correo o rol) debe ser proporcionado para actualizar' });
    }if(correo!==undefined && correo===undefined&& rol===undefined){
        return res.status(400).json({erro : 'El correo no tiene formato valudo'})
    }
    //aqui manda a llanar la funcion 
    try{
        const usuario = await usuariosModel.actualizar(req.params.id, {nombre,correo,rol});
        if(!usuario)return res.status(404).json({error : 'Usuario no encontrado'});
    }catch(error){
        if(esDuplicado(error))return res.status(400).json({error : 'Ya existe un usuario con ese correo'});
        res.status(500).json({error : error.message});
    }
}

async function eliminarUsuario(req, res) {
    try{
        const eliminado=await usuarioModel.eliminar(req.params.id);
        if(!eliminado)return res.status(404).json({error: 'No se encotro al usuario'});
        res.status(204).send();
    }catch(error){
        res.status(500).json({error: error.message});
    }
}

module.exports={listarUsuarios,obtenerUsuario,crearUsuario,actualizarUsuario,eliminarUsuario}