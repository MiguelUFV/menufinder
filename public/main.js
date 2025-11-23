// --- 1. CONFIGURACIÓN DE IMÁGENES DEL HERO ---
const imagenesFondo = {
  default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80',
  italiana: 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?auto=format&fit=crop&w=1920&q=80',
  sushi: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1920&q=80',
  japonesa: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1920&q=80',
  vegana: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1920&q=80'
};

let heroRotateIndex = 0;
let heroLastInteraction = Date.now();

let mapa;
let marcadores = [];
let datosGlobales = [];
let ultimoRestauranteAbierto = null;

// --- 2. AUTOCORRECCIÓN BÁSICA (ITALIANO VEGANOO, ETC.) ---
const diccionarioKeywords = [
  'italiano',
  'italiana',
  'vegano',
  'vegana',
  'sushi',
  'japonesa',
  'japones',
  'japonés',
  'burger',
  'hamburguesa',
  'veg',
  'veganoo',
  'vegetariano',
  'plant-based',
  'sin gluten',
  'celiaco',
  'celíaco'
];

// Función Levenshtein simple
function distanciaLevenshtein(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

// Corrige cada palabra aproximándola al diccionario si está muy cerca
function autoCorregirTexto(texto) {
  const palabras = texto.toLowerCase().split(/\s+/).filter(Boolean);
  const corregidas = palabras.map((palabra) => {
    let mejor = palabra;
    let mejorDist = Infinity;
    diccionarioKeywords.forEach((k) => {
      const d = distanciaLevenshtein(palabra, k);
      if (d < mejorDist) {
        mejorDist = d;
        mejor = k;
      }
    });
    if (mejorDist <= 2) {
      return mejor;
    }
    return palabra;
  });
  return corregidas.join(' ');
}

// --- 3. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  // Mostrar Newsletter a los 2 segundos
  setTimeout(() => {
    const modal = document.getElementById('popup-newsletter');
    if (modal) modal.classList.remove('hidden');
  }, 2000);

  // Hero input -> cambio de fondo dinámico
  const inputHero = document.getElementById('input-hero');
  if (inputHero) {
    inputHero.addEventListener('input', (e) => {
      heroLastInteraction = Date.now();
      cambiarFondoDinamico(e.target.value);
    });
  }

  // Rotación automática de fondos cada 15 segundos si no hay interacción
  setInterval(() => {
    const ahora = Date.now();
    const sinInteraccion = ahora - heroLastInteraction > 15000;
    const vistaInicioActiva = document.getElementById('vista-inicio')?.classList.contains('activa');
    const textoHero = document.getElementById('input-hero').value.trim();

    if (vistaInicioActiva && sinInteraccion && !textoHero) {
      const keys = ['italiana', 'sushi', 'vegana'];
      heroRotateIndex = (heroRotateIndex + 1) % keys.length;
      cambiarFondoDinamico(keys[heroRotateIndex]);
    }
  }, 15000);
});

// --- 4. LÓGICA VISUAL HERO ---
function cambiarFondoDinamico(texto) {
  const termino = texto.toLowerCase();
  const hero = document.getElementById('vista-inicio');
  if (!hero) return;

  let url = imagenesFondo.default;
  if (termino.includes('italian')) url = imagenesFondo.italiana;
  else if (termino.includes('sushi') || termino.includes('japon')) url = imagenesFondo.sushi;
  else if (termino.includes('vegan') || termino.includes('vegano')) url = imagenesFondo.vegana;

  hero.style.backgroundImage =
    `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('${url}')`;
}

// --- 5. NAVEGACIÓN ENTRE VISTAS ---
function cambiarVista(id) {
  document.querySelectorAll('.vista').forEach((v) => {
    v.classList.remove('activa');
    v.classList.add('oculta');
  });
  const vista = document.getElementById(id);
  if (vista) {
    vista.classList.remove('oculta');
    vista.classList.add('activa');
  }
  window.scrollTo(0, 0);
}

function irAInicio() {
  cambiarVista('vista-inicio');
}

function volverAlMapa() {
  cambiarVista('vista-mapa');
  setTimeout(() => {
    if (mapa) mapa.invalidateSize();
  }, 100);
}

// --- 6. MODALES ---
function abrirModalVentajas() {
  document.getElementById('modal-ventajas').classList.remove('hidden');
}
function cerrarModalVentajas() {
  document.getElementById('modal-ventajas').classList.add('hidden');
}

function abrirModalRestaurante() {
  document.getElementById('modal-restaurante').classList.remove('hidden');
}
function cerrarModalRestaurante() {
  document.getElementById('modal-restaurante').classList.add('hidden');
}

function cerrarNewsletter() {
  document.getElementById('popup-newsletter').classList.add('hidden');
}

function abrirModalEjemploFicha() {
  document.getElementById('modal-ejemplo-ficha').classList.remove('hidden');
}
function cerrarModalEjemploFicha() {
  document.getElementById('modal-ejemplo-ficha').classList.add('hidden');
}

function abrirMenuPopup() {
  if (!ultimoRestauranteAbierto) return;
  const r = datosGlobales.find((x) => x.id === ultimoRestauranteAbierto);
  if (!r) return;

  const cont = document.getElementById('menu-popup-contenido');
  const titulo = document.getElementById('menu-popup-titulo');
  titulo.innerText = `Menú de ${r.nombre}`;
  cont.innerHTML = '';

  if (r.menu) {
    for (const [cat, platos] of Object.entries(r.menu)) {
      if (!platos || !platos.length) continue;
      const tituloCat = cat.charAt(0).toUpperCase() + cat.slice(1);
      const bloque = document.createElement('div');
      bloque.className = 'bloque-menu';
      bloque.innerHTML = `<h4>${tituloCat}</h4>`;

      platos.forEach((p) => {
        const row = document.createElement('div');
        row.className = 'plato-row';
        row.innerHTML = `
          <span>${p.nombre}</span>
          <strong>${p.precio.toFixed(2)} €</strong>
        `;
        bloque.appendChild(row);
      });

      cont.appendChild(bloque);
    }
  } else {
    cont.innerHTML = '<p>Este restaurante aún no tiene carta cargada.</p>';
  }

  document.getElementById('modal-menu-popup').classList.remove('hidden');
}

function cerrarMenuPopup() {
  document.getElementById('modal-menu-popup').classList.add('hidden');
}

// Scroll dentro del modal "Soy restaurante" a la zona de subir menú
function scrollToMenuUpload() {
  const zona = document.getElementById('zona-menu-upload');
  if (zona) zona.scrollIntoView({ behavior: 'smooth' });
}

// --- 7. NEWSLETTER ---
async function suscribirse(e) {
  e.preventDefault();
  const email = document.getElementById('email-newsletter').value;
  await fetch('/api/suscribir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  cerrarNewsletter();
  Swal.fire('¡Listo!', 'Tu código MENU10 ha sido enviado a tu correo 📩', 'success');
}

// --- 8. BÚSQUEDA DESDE HERO Y MAPA ---
function buscarDesdeHero() {
  heroLastInteraction = Date.now();
  const inputHero = document.getElementById('input-hero');
  const corregido = autoCorregirTexto(inputHero.value);
  inputHero.value = corregido;
  document.getElementById('input-mapa').value = corregido;
  ejecutarBusqueda();
}

function buscarDirecto(val) {
  heroLastInteraction = Date.now();
  const inputHero = document.getElementById('input-hero');
  inputHero.value = val;
  document.getElementById('input-mapa').value = val;
  cambiarFondoDinamico(val);
  ejecutarBusqueda();
}

function actualizarBusqueda() {
  ejecutarBusqueda();
}

// Construir parámetros de búsqueda a partir de inputs y filtros
function construirParametrosBusqueda() {
  const params = new URLSearchParams();

  const textoOriginal = document.getElementById('input-mapa').value.trim();
  const texto = autoCorregirTexto(textoOriginal);
  if (texto !== textoOriginal) {
    document.getElementById('input-mapa').value = texto;
    document.getElementById('input-hero').value = texto;
  }
  if (texto) params.set('q', texto);

  // Alergias
  const alergias = [...document.querySelectorAll('input[name="filtro-alergeno"]:checked')].map(
    (el) => el.value
  );
  alergias.forEach((a) => params.append('alergenos', a));

  // Intolerancias
  const intols = [...document.querySelectorAll('input[name="filtro-intol"]:checked')].map(
    (el) => el.value
  );
  intols.forEach((i) => params.append('intolerancias', i));

  // Dietas
  const dietas = [...document.querySelectorAll('input[name="filtro-dieta"]:checked')].map(
    (el) => el.value
  );
  dietas.forEach((d) => params.append('dietas', d));

  // Precio
  const precioSel = document.getElementById('filtro-precio').value;
  if (precioSel === '1') {
    params.set('precioMax', '15');
  } else if (precioSel === '2') {
    params.set('precioMin', '15');
    params.set('precioMax', '25');
  } else if (precioSel === '3') {
    params.set('precioMin', '25');
  }

  return params;
}

function aplicarFiltros() {
  ejecutarBusqueda();
}

// --- 9. EJECUTAR BÚSQUEDA (LLAMADA AL BACKEND) ---
async function ejecutarBusqueda() {
  cambiarVista('vista-mapa');

  if (!mapa) {
    mapa = L.map('mapa').setView([40.416, -3.703], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; MenuFinder'
    }).addTo(mapa);
  } else {
    setTimeout(() => mapa.invalidateSize(), 100);
  }

  const params = construirParametrosBusqueda();
  const url = `/api/restaurantes?${params.toString()}`;

  const res = await fetch(url);
  datosGlobales = await res.json();
  renderizarResultados(datosGlobales);
}

// --- 10. RENDERIZAR LISTA + MARCADORES ---
function renderizarResultados(lista) {
  const cont = document.getElementById('contenedor-tarjetas');
  cont.innerHTML = '';

  const contador = document.getElementById('contador-resultados');
  if (lista.length === 0) {
    contador.innerText = 'No hemos encontrado restaurantes con esos filtros 😢';
  } else {
    contador.innerText = `${lista.length} restaurante(s) encontrados`;
  }

  // Limpia marcadores
  marcadores.forEach((m) => mapa.removeLayer(m));
  marcadores = [];

  lista.forEach((r) => {
    // Tarjeta lateral
    const div = document.createElement('div');
    div.className = 'card-lateral';
    div.onclick = () => abrirFicha(r.id);
    div.innerHTML = `
      <div class="info">
        <h4>${r.nombre}</h4>
        <div class="rating">⭐ ${r.puntuacion.toFixed(1)} <span>(${r.resenas})</span></div>
        <div class="meta">${r.cocina} • ${r.precio} • ${r.ciudad}</div>
        ${r.promo ? `<span class="badge-promo-mini">${r.promo}</span>` : ''}
      </div>
      <div class="arrow">➔</div>
    `;
    cont.appendChild(div);

    // Pin en el mapa
    if (r.coords) {
      const marker = L.marker([r.coords.lat, r.coords.lng]).addTo(mapa);
      // Al pinchar en el mapa -> ficha directa
      marker.on('click', () => abrirFicha(r.id));
      marcadores.push(marker);
    }
  });
}

// --- 11. FICHA DETALLE ---
async function abrirFicha(id) {
  let r = datosGlobales.find((x) => x.id === id);

  if (!r) {
    const res = await fetch(`/api/restaurantes/${id}`);
    if (!res.ok) return;
    r = await res.json();
  }

  ultimoRestauranteAbierto = r.id;
  cambiarVista('vista-detalle');

  document.getElementById('ficha-nombre').innerText = r.nombre;
  document.getElementById('ficha-cocina').innerText = r.cocina;
  document.getElementById('ficha-direccion').innerText = '📍 ' + r.direccion;
  document.getElementById('ficha-ciudad').innerText = r.ciudad;

  const stars = '⭐'.repeat(Math.round(r.puntuacion));
  document.getElementById('ficha-stars').innerText = stars;
  document.getElementById('ficha-reviews').innerText = `(${r.resenas} reseñas)`;

  document.getElementById('ficha-precio').innerText = r.precio;

  const promoTag = document.getElementById('ficha-promo');
  if (r.promo) {
    promoTag.innerText = r.promo;
    promoTag.classList.remove('hidden');
  } else {
    promoTag.classList.add('hidden');
  }

  const alerg = r.alergenos && r.alergenos.length ? r.alergenos.join(', ') : 'No especificados';
  document.getElementById('ficha-alergenos').innerText =
    '⚠️ Alérgenos gestionados: ' + alerg;

  const dietas = r.dietas && r.dietas.length ? r.dietas.join(' • ') : 'Sin etiquetas de dieta';
  document.getElementById('ficha-dietas').innerText = dietas;

  // Carta resumida en la ficha
  const menuDiv = document.getElementById('ficha-menu');
  menuDiv.innerHTML = '';

  if (r.menu) {
    for (const [cat, platos] of Object.entries(r.menu)) {
      if (!platos || !platos.length) continue;
      const tituloCat = cat.charAt(0).toUpperCase() + cat.slice(1);
      const bloque = document.createElement('div');
      bloque.className = 'bloque-menu';
      bloque.innerHTML = `<h4>${tituloCat}</h4>`;

      platos.slice(0, 2).forEach((p) => {
        const row = document.createElement('div');
        row.className = 'plato-row';
        row.innerHTML = `
          <span>${p.nombre}</span>
          <strong>${p.precio.toFixed(2)} €</strong>
        `;
        bloque.appendChild(row);
      });

      if (platos.length > 2) {
        const extra = document.createElement('div');
        extra.className = 'plato-extra';
        extra.innerText = `+ ${platos.length - 2} plato(s) más`;
        bloque.appendChild(extra);
      }

      menuDiv.appendChild(bloque);
    }
  }

  // Restaurantes parecidos
  renderizarSimilares(r);
}

// Lógica para "restaurantes parecidos"
function renderizarSimilares(restauranteBase) {
  const simDiv = document.getElementById('grid-similares');
  simDiv.innerHTML = '';

  const fuente = datosGlobales.length ? datosGlobales : [];

  const similares = fuente
    .filter((item) => item.id !== restauranteBase.id)
    .filter((item) => {
      const mismaCocina = item.cocina === restauranteBase.cocina;
      const mismaCiudad = item.ciudad === restauranteBase.ciudad;
      return mismaCocina || mismaCiudad;
    });

  if (!similares.length) {
    simDiv.innerHTML = '<p>No hemos encontrado restaurantes parecidos en esta zona.</p>';
    return;
  }

  similares.forEach((s) => {
    const card = document.createElement('div');
    card.className = 'card-sim';
    card.onclick = () => abrirFicha(s.id);
    const dietas = s.dietas && s.dietas.length ? s.dietas.slice(0, 2).join(' • ') : '';
    card.innerHTML = `
      <div>
        <strong>${s.nombre}</strong>
        <div class="sim-meta">${s.cocina} • ${s.precio}</div>
        <div class="sim-dietas">${dietas}</div>
      </div>
      <div class="sim-rating">⭐ ${s.puntuacion.toFixed(1)}</div>
    `;
    simDiv.appendChild(card);
  });
}

// --- 12. RESERVA ---
async function hacerReserva(e) {
  e.preventDefault();
  if (!ultimoRestauranteAbierto) {
    Swal.fire('Ups', 'Algo ha fallado con el restaurante seleccionado.', 'error');
    return;
  }

  const fecha = document.getElementById('res-fecha').value;
  const hora = document.getElementById('res-hora').value;
  const personas = document.getElementById('res-personas').value;

  await fetch('/api/reservar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restauranteId: ultimoRestauranteAbierto,
      fecha,
      hora,
      personas
    })
  });

  Swal.fire('¡Reservado!', 'Te hemos enviado la confirmación de la mesa 🎉', 'success');
}

// --- 13. SUBIR MENÚ Y GENERAR PLANTILLA (SIMULACIÓN) ---
function generarPlantillaDesdePDF() {
  const nombre = document.getElementById('upload-nombre-restaurante').value.trim() || 'Tu restaurante';
  const inputFile = document.getElementById('upload-pdf');
  const resultado = document.getElementById('resultado-plantilla');

  let archivo = 'Ningún archivo seleccionado';
  if (inputFile.files && inputFile.files[0]) {
    archivo = inputFile.files[0].name;
  }

  resultado.innerHTML = `
    <p><strong>Archivo recibido:</strong> ${archivo}</p>
    <div class="plantilla-card">
      <h3>${nombre}</h3>
      <p class="plantilla-subtitle">Plantilla de menú generada por MenuFinder</p>

      <h4>Entrantes</h4>
      <ul>
        <li>Nombre del plato – Precio</li>
        <li>Nombre del plato – Precio</li>
      </ul>

      <h4>Principales</h4>
      <ul>
        <li>Nombre del plato – Precio</li>
        <li>Nombre del plato – Precio</li>
      </ul>

      <h4>Postres</h4>
      <ul>
        <li>Nombre del plato – Precio</li>
      </ul>

      <h4>Bebidas</h4>
      <ul>
        <li>Nombre de la bebida – Precio</li>
      </ul>
    </div>
  `;
  resultado.classList.remove('hidden');
}
