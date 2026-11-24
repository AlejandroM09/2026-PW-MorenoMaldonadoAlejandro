// La página solo hace fetch a la API. El navegador manda la cookie solo (misma página, mismo servidor).

const $ = (id) => document.getElementById(id);

//Esta es una sola funcion que habla con la API para que no se repita el fetch en cada boton. Siempre regresa {status, datos} ya que fetch no marca error con 401 o 403
//Solo mando Content-Type cuando hay cuerpo, porque sin él express.json() no lee el body del login.
// No uso credentials: 'include' porque la página y la API están en el mismo servidor y el navegador manda la cookie solo.
async function llamar(metodo,url,body,conToken)
{
    const options={method: metodo,headers:{}};

    // Solo las peticiones de la tarjeta 6 mandan el token (las de sesión usan la cookie).
    if(conToken){
        const token=leerToken();
        if(token) options.headers['Authorization']=`Bearer ${token}`;
    }

    if(body!==undefined){
        options.headers['Content-Type']='application/json';
        options.body=JSON.stringify(body);
    }
    const respuesta=await fetch(url,options);

    let datos=null;

    try{
        datos=await respuesta.json();
    }catch{
        datos=null;
    }
    return {status:respuesta.status,datos};
}

//En esta funcion separo la elección del color para que la bitácora muestre de un vistazo si fue éxito, 401, 403 u otro error,
//usando las clases que ya existen en estilos.css.
function claseDelCodigo(status){
    if(status>=200&&status<300)return 'ok';
    if(status===401)return 'e401';
    if(status===403)return 'e403';
    return 'error';
}

//En esta funcion creo los elementos con createElement y textContent (no innerHTML) porque los datos vienen del servidor
//y podrían traer código; con innerHTML se ejecutaría  y podría robar la cookie si no fuera httpOnly.
//Uso prepend para que la respuesta más nueva quede arriba.
function anotar(method,url,status,datos){
    const li=document.createElement('li');

    const codigo=document.createElement('span');
    codigo.className=`codigo ${claseDelCodigo(status)}`;
    codigo.textContent=status;

    const ruta=document.createElement('span');
    
    ruta.textContent=`${method} ${url}`;

    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(datos, null, 2);

    li.append(codigo, ruta, pre);

    $('bitacora').prepend(li);
}

//Esta funcion le pregunta al servidor quién soy porque mi JS no puede saberlo por sí mismo ya que la cookie es httpOnly.
//Muestro document.cookie para comprobar que, aunque haya sesión, JavaScript no ve la cookie.
async function refrescarEstado() {
    const { status, datos } = await llamar('GET', '/api/sesion');
  const estado = $('estado');

  if (status === 200) {
    const u = datos.usuario;
    estado.textContent = `Con sesión: ${u.nombre} (rol: ${u.rol}) · sesión ${datos.sesion} · vence en ${datos.expiraEnSegundos} s`;
    estado.className = 'estado con-sesion';
  } else {
    estado.textContent = `Sin sesión (el servidor responde ${status})`;
    estado.className = 'estado sin-sesion';
  }

  $('cookie-js').textContent = document.cookie || '(vacío)';
    
}

//Esta funcion la necesito porque si no hay sesiones o algo falla, pongo un mensaje que ocupa toda la fila de la tabla.
function filaUnica(tbody,texto){
    const tr=document.createElement('tr');
    const td=document.createElement('td');
    td.colSpan = 4;
    td.textContent = texto;
    tr.append(td);
    tbody.append(tr);
}

//Esta funcion muestra lo que el servidor tiene guardado para comparar mi cookie con las sesiones reales.
//Vacío el tbody antes de llenarlo para que las filas no se dupliquen al actualizar.
//Convierto expira a hora local porque el servidor la manda en UTC.
async function refrescarTabla() {
  const { status, datos } = await llamar('GET', '/api/diagnostico/sesiones');
  const tbody = $('tabla-sesiones');

  tbody.replaceChildren();

  if (status !== 200 || !datos) {
    $('donde').textContent = `No se pudo leer el diagnóstico (código ${status})`;
    filaUnica(tbody, '(sin datos)');
    return;
  }

  if (datos.almacen === 'memoria') {
    $('donde').textContent = 'En la MEMORIA del servidor (se pierden al reiniciar)';
  } else {
    $('donde').textContent = 'En MySQL, tabla sessions (sobreviven a un reinicio)';
  }

  if (datos.sesiones.length === 0) {
    filaUnica(tbody, '(sin sesiones)');
    return;
  }

  for (const s of datos.sesiones) {
    const tr = document.createElement('tr');

    if (s.esLaTuya) {
      tr.className = 'tuya';
    }

    let vence = '—';
    if (s.expira) {
      vence = new Date(s.expira).toLocaleTimeString();
    }

    let textoSesion = s.sesion;
    if (s.esLaTuya) {
      textoSesion = `${s.sesion} (la tuya)`;
    }

    const valores = [textoSesion, s.usuario, s.visitas, vence];

    for (const valor of valores) {
      const td = document.createElement('td');
      td.textContent = valor;
      tr.append(td);
    }

    tbody.append(tr);
  }
}

//Esta funcion junta estado y tabla porque después de cada acción de los botones hay que actualizar los dos, así no repito las dos llamadas en cada evento.
async function refrescarTodo() {
  await refrescarEstado();
  await refrescarTabla();
}

// Uso preventDefault para evitar que el formulario recargue la página, así hago el login con fetch y no pierdo la bitácora.
$('form-login').addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const cuerpo = {
    usuario: $('usuario').value,
    contrasena: $('contrasena').value,
  };

  const { status, datos } = await llamar('POST', '/api/login', cuerpo);
  anotar('POST', '/api/login', status, datos);
  await refrescarTodo();
});

//Al cambiar de usuario pongo su contraseña de ejemplo para no escribirla a mano en cada prueba.
$('usuario').addEventListener('change', () => {
  $('contrasena').value = `${$('usuario').value}12345`;
});

//En lugar de un addEventListener por botón, recorro todos los que tienen data-url y leo método y URL con dataset, 
// así si se agrega otro botón en el HTML.
document.querySelectorAll('button[data-url]').forEach((boton) => {
  boton.addEventListener('click', async () => {
    const metodo = boton.dataset.metodo;
    const url = boton.dataset.url;

    const { status, datos } = await llamar(metodo, url);
    anotar(metodo, url, status, datos);
    await refrescarTodo();
  });
});

//Paso la función sin paréntesis para que se ejecute en cada clic y no una sola vez al cargar.
$('btn-refrescar').addEventListener('click', refrescarTodo);
$('btn-sesiones').addEventListener('click', refrescarTabla);

//Con esta funcion al abrir la página muestro la configuración y el estado sin esperar un clic.
//Como el <script> está al final del <body> y los elementos ya existen.
async function iniciar() {
    const{datos}=await llamar('GET','/api/config');
    $('config').textContent = JSON.stringify(datos, null, 2);

  await refrescarTodo();
}


// =====================================================================================
// TARJETA 6 · El token JWT
// A diferencia de la cookie, el token lo guarda ESTE JavaScript (en localStorage)
// y lo manda él mismo en el encabezado Authorization. El navegador no lo manda solo.
// =====================================================================================
const CLAVE='token';

// Lee, guarda y borra el token de localStorage. El try/catch es por si el navegador bloquea localStorage.
function leerToken(){
    try{ return localStorage.getItem(CLAVE); }catch{ return null; }
}
function guardarToken(token){
    try{ localStorage.setItem(CLAVE,token); }catch{ /* no se pudo guardar */ }
    pintarToken();
}
function borrarToken(){
    try{ localStorage.removeItem(CLAVE); }catch{ /* nada que borrar */ }
    pintarToken();
}

// El payload de un JWT NO va cifrado: solo está codificado en base64url. Por eso lo podemos leer sin la clave.
function base64urlATexto(parte){
    const base64=parte.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(parte.length/4)*4,'=');
    const bytes=Uint8Array.from(atob(base64),(c)=>c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}
function textoABase64url(texto){
    const bytes=new TextEncoder().encode(texto);
    let binario='';
    bytes.forEach((b)=>{ binario+=String.fromCharCode(b); });
    return btoa(binario).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
// Separa el token en sus 3 partes y decodifica la cabecera y el payload. Si no es un JWT, regresa null.
function decodificar(token){
    const partes=(token||'').split('.');
    if(partes.length!==3) return null;
    try{
        return { partes, cabecera: JSON.parse(base64urlATexto(partes[0])), carga: JSON.parse(base64urlATexto(partes[1])) };
    }catch{
        return null;
    }
}

// Pinta el token, sus 3 partes de colores, la cabecera y el payload decodificados.
function pintarToken(){
    const token=leerToken();
    $('token').value=token||'';

    const jwt=decodificar(token);
    const partes=$('partes');
    partes.textContent='';
    if(!jwt){
        partes.textContent=token ? '(no es un JWT: deben ser 3 partes separadas por puntos)' : '—';
        $('cabecera').textContent='—';
        $('carga').textContent='—';
    }else{
        ['jwt-cabecera','jwt-carga','jwt-firma'].forEach((clase,i)=>{
            if(i>0) partes.append('.');
            const span=document.createElement('span');
            span.className=clase;
            span.textContent=jwt.partes[i];
            partes.append(span);
        });
        $('cabecera').textContent=JSON.stringify(jwt.cabecera,null,2);
        const carga={ ...jwt.carga };
        if(carga.iat) carga.iat=`${carga.iat}  (${new Date(carga.iat*1000).toLocaleTimeString()})`;
        if(carga.exp) carga.exp=`${carga.exp}  (${new Date(carga.exp*1000).toLocaleTimeString()})`;
        $('carga').textContent=JSON.stringify(carga,null,2);
    }
    pintarEstadoJwt();
}

// El reloj del NAVEGADOR: solo informa. Quien decide si el token sirve es el servidor.
function pintarEstadoJwt(){
    const jwt=decodificar(leerToken());
    const estado=$('estado-jwt');
    if(!jwt){
        estado.textContent='Sin token: para el servidor eres anónimo (401)';
        estado.className='estado sin-sesion';
        return;
    }
    const faltan=jwt.carga.exp-Math.floor(Date.now()/1000);
    if(faltan>0){
        estado.textContent=`Token de ${jwt.carga.usuario} · rol ${jwt.carga.rol} · vence en ${faltan} s (según el reloj del navegador)`;
        estado.className='estado con-sesion';
    }else{
        estado.textContent=`Token de ${jwt.carga.usuario} VENCIDO hace ${-faltan} s`;
        estado.className='estado sin-sesion';
    }
}

// Pedir token: usa el usuario y la contraseña de la tarjeta 2. NO crea sesión: la tarjeta 1 sigue igual.
$('btn-pedir-token').addEventListener('click', async ()=>{
    const cuerpo={ usuario: $('usuario').value, contrasena: $('contrasena').value };
    const { status, datos }=await llamar('POST','/api/jwt/login',cuerpo);
    anotar('POST','/api/jwt/login',status,datos);
    if(status===200 && datos && datos.token) guardarToken(datos.token);
    await refrescarTodo();
});

// Las dos rutas protegidas con JWT: el 4º parámetro (true) hace que llamar mande el token.
$('btn-perfil-token').addEventListener('click', async ()=>{
    const { status, datos }=await llamar('GET','/api/jwt/perfil',undefined,true);
    anotar('GET','/api/jwt/perfil',status,datos);
});
$('btn-admin-token').addEventListener('click', async ()=>{
    const { status, datos }=await llamar('GET','/api/jwt/admin/reporte',undefined,true);
    anotar('GET','/api/jwt/admin/reporte',status,datos);
});

// Usar lo que esté escrito en el cuadro de texto como token (para pegar uno viejo o alterado).
$('btn-usar').addEventListener('click', ()=>{
    const token=$('token').value.trim();
    if(token) guardarToken(token); else borrarToken();
});

// Cambia el rol DENTRO del payload y deja la firma original. El servidor lo rechaza: la firma ya no coincide.
$('btn-alterar').addEventListener('click', ()=>{
    const jwt=decodificar(leerToken());
    if(!jwt) return;
    const carga={ ...jwt.carga, rol:'admin' };
    guardarToken(`${jwt.partes[0]}.${textoABase64url(JSON.stringify(carga))}.${jwt.partes[2]}`);
});

$('btn-borrar').addEventListener('click', borrarToken);

pintarToken();
setInterval(pintarEstadoJwt,1000);   // actualiza el "vence en" cada segundo

// Al final de todo, cuando ya existen todas las funciones y constantes.
iniciar();