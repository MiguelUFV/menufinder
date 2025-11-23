let currentUser = null;
const imagenesFondo = { default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920' };
const todasLasCategorias = ["Americana", "Italiana", "Japonesa", "Sushi", "Vegana", "Hamburguesas", "Pizza", "Poke", "Asiática"];
let mapa, marcadores = [], datosGlobales = [];

document.addEventListener('DOMContentLoaded', () => {
    cambiarFondo('');
    const savedUser = localStorage.getItem('menuFinderUser');
    if (savedUser) { currentUser = JSON.parse(savedUser); actualizarUIUsuario(); }
    setTimeout(() => { if(!currentUser) document.getElementById('popup-newsletter').classList.remove('hidden'); }, 3000);
    document.getElementById('input-hero').addEventListener('input', (e) => cambiarFondo(e.target.value));
    document.getElementById('input-categorias').addEventListener('input', (e) => filtrarCategorias(e.target.value));
});

// --- NAVEGACIÓN ---
function cambiarVista(id) {
    document.querySelectorAll('.vista').forEach(v => { v.classList.remove('activa'); v.classList.add('oculta'); });
    document.getElementById(id).classList.remove('oculta');
    document.getElementById(id).classList.add('activa');
    window.scrollTo(0, 0);
}
function irAInicio() { cambiarVista('vista-inicio'); }
function volverAlMapa() { cambiarVista('vista-mapa'); setTimeout(() => { if(mapa) mapa.invalidateSize(); }, 200); }

// --- BUSCADOR ---
function buscarDesdeHero() { ejecutarBusqueda(document.getElementById('input-hero').value); }
function buscarDirecto(val) { document.getElementById('input-hero').value = val; ejecutarBusqueda(val); }
function actualizarBusqueda() { ejecutarBusqueda(document.getElementById('input-mapa').value); }

async function ejecutarBusqueda(q) {
    cambiarVista('vista-mapa');
    if (!mapa) { mapa = L.map('mapa').setView([40.416, -3.703], 13); L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: 'MenuFinder' }).addTo(mapa); }
    const res = await fetch(`/api/restaurantes?q=${q || ''}`);
    datosGlobales = await res.json();
    renderizarResultados(datosGlobales);
}

function renderizarResultados(lista) {
    const cont = document.getElementById('contenedor-tarjetas'); cont.innerHTML = '';
    document.getElementById('contador-resultados').innerText = `${lista.length} encontrados`;
    marcadores.forEach(m => mapa.removeLayer(m)); marcadores = [];
    lista.forEach(r => {
        const div = document.createElement('div'); div.className = 'card-visual';
        div.onclick = () => abrirFicha(r.id);
        div.innerHTML = `<div class="card-image" style="background-image: url('${r.imagen || 'https://source.unsplash.com/random/400x300/?food'}')"></div><div class="card-info"><h3>${r.nombre}</h3><p>${r.cocina}</p></div>`;
        cont.appendChild(div);
        if (r.coords) { const m = L.marker(r.coords).addTo(mapa); m.on('click', () => abrirFicha(r.id)); marcadores.push(m); }
    });
}

async function abrirFicha(id) {
    let r = datosGlobales.find(x => x.id === id);
    if (!r) { const res = await fetch(`/api/restaurantes/${id}`); r = await res.json(); }
    cambiarVista('vista-detalle');
    document.getElementById('ficha-nombre').innerText = r.nombre;
    document.getElementById('ficha-cocina').innerText = r.cocina;
    document.getElementById('ficha-direccion').innerText = r.direccion;
    document.getElementById('ficha-precio').innerText = r.precio;
    document.getElementById('ficha-alergenos').innerText = '⚠️ ' + (r.alergenos || []).join(', ');
    document.getElementById('detalle-hero-image').style.backgroundImage = `url('${r.imagen}')`;
    const menuDiv = document.getElementById('ficha-menu'); menuDiv.innerHTML = '';
    if (r.menu) { for (const [cat, platos] of Object.entries(r.menu)) { if(platos.length) { menuDiv.innerHTML += `<h4>${cat.toUpperCase()}</h4>`; platos.forEach(p => menuDiv.innerHTML += `<div class="plato-row"><span>${p.nombre}</span><strong>${p.precio}€</strong></div>`); } } }
}

// --- AUTH & RESERVAS ---
function abrirLogin() { document.getElementById('modal-auth').classList.remove('hidden'); switchTab('login'); }
function cerrarAuth() { document.getElementById('modal-auth').classList.add('hidden'); }
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('form-login').classList.add('hidden'); document.getElementById('form-register').classList.add('hidden');
    if(tab === 'login') { document.getElementById('tab-login').classList.add('active'); document.getElementById('form-login').classList.remove('hidden'); }
    else { document.getElementById('tab-register').classList.add('active'); document.getElementById('form-register').classList.remove('hidden'); }
}
async function registerUser(e) {
    e.preventDefault();
    const nombre = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;
    const res = await fetch('/api/auth/register', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ nombre, email, password }) });
    const data = await res.json();
    if (data.status === 'ok') { iniciarSesionExitoso(data.user); } else Swal.fire('Error', data.error, 'error');
}
async function loginUser(e) {
    e.preventDefault();
    const res = await fetch('/api/auth/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: document.getElementById('login-email').value, password: document.getElementById('login-pass').value }) });
    const data = await res.json();
    if (data.status === 'ok') iniciarSesionExitoso(data.user); else Swal.fire('Error', 'Login fallido', 'error');
}
function iniciarSesionExitoso(user) { currentUser = user; localStorage.setItem('menuFinderUser', JSON.stringify(user)); cerrarAuth(); cerrarNewsletter(); actualizarUIUsuario(); }
function logout() { currentUser = null; localStorage.removeItem('menuFinderUser'); cerrarProfile(); actualizarUIUsuario(); window.location.reload(); }
function actualizarUIUsuario() {
    const area = document.getElementById('user-area');
    if (currentUser) area.innerHTML = `<div class="user-pill" onclick="abrirPerfil()"><div class="avatar-mini">${currentUser.nombre.charAt(0)}</div><span>${currentUser.nombre}</span></div>`;
    else area.innerHTML = `<button class="btn-login-nav" onclick="abrirLogin()"><i class="fa-regular fa-user"></i> Iniciar Sesión</button>`;
}
async function abrirPerfil() {
    document.getElementById('modal-profile').classList.remove('hidden');
    document.getElementById('profile-name').innerText = currentUser.nombre;
    document.getElementById('profile-email').innerText = currentUser.email;
    document.getElementById('profile-initial').innerText = currentUser.nombre.charAt(0);
    const lista = document.getElementById('bookings-list'); lista.innerHTML = 'Cargando...';
    const res = await fetch(`/api/user/${currentUser.email}/bookings`);
    const bookings = await res.json();
    lista.innerHTML = ''; if(bookings.length === 0) lista.innerHTML = '<p class="text-center">Sin reservas</p>';
    bookings.forEach(b => lista.innerHTML += `<div class="booking-item"><h4>${b.restaurante}</h4><p>📅 ${b.fecha} - ${b.hora}</p></div>`);
}
function cerrarProfile() { document.getElementById('modal-profile').classList.add('hidden'); }
function abrirBookingModal() { document.getElementById('modal-booking').classList.remove('hidden'); document.getElementById('book-rest-name').innerText = document.getElementById('ficha-nombre').innerText; if(currentUser) { document.getElementById('book-email').value=currentUser.email; document.getElementById('guest-email-field').style.display='none'; } else { document.getElementById('book-email').value=''; document.getElementById('guest-email-field').style.display='block'; } }
function cerrarBooking() { document.getElementById('modal-booking').classList.add('hidden'); }
async function confirmarReservaReal(e) {
    e.preventDefault();
    const data = { restaurante: document.getElementById('book-rest-name').innerText, fecha: document.getElementById('book-date').value, hora: document.getElementById('book-time').value, personas: document.getElementById('book-people').value, userEmail: currentUser ? currentUser.email : document.getElementById('book-email').value };
    await fetch('/api/reservar-completa', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
    cerrarBooking(); Swal.fire('Reservado', 'Email enviado', 'success');
}

// UTILS
function cambiarFondo(t) { const hero = document.getElementById('vista-inicio'); if(hero) hero.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${imagenesFondo.default}')`; }
function abrirModalVentajas() { document.getElementById('modal-ventajas').classList.remove('hidden'); }
function cerrarModalVentajas() { document.getElementById('modal-ventajas').classList.add('hidden'); }
function cerrarNewsletter() { document.getElementById('popup-newsletter').classList.add('hidden'); }
function abrirModalCategorias() { document.getElementById('modal-categorias').classList.remove('hidden'); }
function cerrarModalCategorias() { document.getElementById('modal-categorias').classList.add('hidden'); }
function filtrarCategorias(t) {
    const cont = document.getElementById('lista-sugerencias-cat'); cont.innerHTML = ''; if(!t) return;
    const matches = todasLasCategorias.filter(c => c.toLowerCase().includes(t.toLowerCase()));
    matches.forEach(c => { const d = document.createElement('div'); d.className = 'chip-sug'; d.innerText = c; d.onclick = () => { buscarDirecto(c); cerrarModalCategorias(); }; cont.appendChild(d); });
}
async function suscribirse(e) { e.preventDefault(); const email = document.getElementById('email-newsletter').value; const pref = document.getElementById('newsletter-pref').value; await fetch('/api/suscribir', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email, preferencia:pref})}); cerrarNewsletter(); Swal.fire('Enviado', 'Revisa tu correo', 'success'); }