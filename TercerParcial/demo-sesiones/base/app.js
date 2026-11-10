// La aplicación de la demo. server.js la arranca; las pruebas la arrancan con otras configuraciones.
// Lo que dice "(en clase)" lo programamos juntos, paso por paso. Mientras no esté, esa ruta responde 501.
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { crearModeloUsuarios } = require('./modelos/usuarios.modelo');

const NOMBRE_COOKIE = 'connect.sid';

//Una sesion se guarda en servior, una cookie en el navegador solo tiene un id de sesion. La cookie se manda al servidor en cada request.
//En una cookie se puede guardar cualquier cosa, pero no es seguro. Por eso se guarda solo el id de sesion y la sesion se guarda en el servidor.
//Las cookies se crean cada vez que se mete a un navegador.
//Una cookie es un archivo que se guarda en el navegador y se manda al servidor en cada request. Una sesion es un objeto que se guarda en el servidor y se asocia a una cookie. Una sesion puede tener cualquier cantidad de datos, pero una cookie solo tiene un id de sesion.


//SI HAY UNA SESION PREXISTENTE,OBTENERLA DEL ALMACEN SINO CREARLAS
function todasLasSesiones(almacen) {
  return new Promise((resolve, reject) => {
      const promesa=almacen.all((error, sesiones) => (error? reject(error) 
      : resolve(sesiones)));
      if (promesa && typeof promesa.catch === 'function') promesa.then(resolve,reject);
    });
}

function crearApp(config,pool) {
  const app=express();
  app.use(express.json());
  //primero debemos obtener el modelo de la bd
  const usuarios=crearModeloUsuarios(pool);

  //aquie nosotros debemos de identificar la sesion sera por tabla en bd, o la sesion seran una cookie en memoria 
  // del navegador, o es una mezcla, sesion en memoria de servidor y por tabla en bd y cookie en navegador y bd

  const almacen=config.almacen==='memoria'?new session.MemoryStore():new MySQLStore({createDatabaseTable: false,clearExpired: false},pool);
  app.locals.almacen=almacen;
}

app.use(
  session({
    name: NOMBRE_COOKIE,
    secret: process.env.SESSION_SECRET||'secreto-solo.para-la-demo',
    store: almacen,
    resave: false,
    //no se crea la sesion ni la cookie
    saveUninitialized: false,
    rolling:config.roling||false,
    cookie: {
      maxAge: config.maxAge||1000*60*60*24, //1 dia
      httpOnly: config.httpOnly||true, //no se puede acceder a la cookie desde el navegador
      sameSite: config.sameSite||'lax', //solo se manda la cookie si es la misma pagina y mismo servidor
      secure: config.secure||false, //solo https
    },
  })
);

//necesitamos visualizar el id de la sesion para compararla en la pantalla.
const cortoId=(id)=>(id? `${id.slice(0,8)}...` : null);

//nosotros estamos ocupando un middleware, el cual es el que se encarga de comunicar el back y el fornt, para ello nosotros debemos obtener la sesion a partir de express, pero en cada éticion debe,ps de devolver la sesion, para ello el atrivuto rolling, la extiende y anque le hayamos dado false, no se puede confiar an que lo expire, para ello debe,os de idenntificaral y validarla en sus diferentes momentos

function vencida(sesion) {
  const desde=config.rolling?sesion.ultimoUso:sesion.creada;
  return Date.now()-desde>config.maxAge;
}

function requiereSesion(req,res,next) {
  if (!req.session.usuario) {
    res.clearCookie(NOMBRE_COOKIE);
    res.status(401).json({error:'401 Tu sesion ya expiro vuelve a iniciar sesion'});
  }
  if(!req.session.usuario){
    res.clearCookie(NOMBRE_COOKIE);
    res.status(401).json({error:'401 No has iniciado sesion con la cuenta correcta'});
  }
  req.session.ultimoUso=Date.now();
  next();
}  