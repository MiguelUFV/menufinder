const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- BASE DE DATOS SIMULADA (dummy) ---
const restaurantes = [
  {
    id: 1,
    nombre: "La Trattoria de Luigi",
    cocina: "Italiana",
    ciudad: "Madrid",
    direccion: "Calle Mayor 10, Madrid",
    precio: "€€",
    precioMedio: 20,
    puntuacion: 4.8,
    resenas: 124,
    promo: "-30% en carta",
    alergenos: ["Gluten", "Leche", "Huevos"],
    intolerancias: ["Lactosa", "Sin gluten (opciones)"],
    dietas: ["Omnivoro", "Vegetariano"],
    coords: { lat: 40.4167, lng: -3.7036 },
    descripcion: "Pasta fresca artesanal amasada a mano.",
    menu: {
      entrantes: [
        { nombre: "Carpaccio trufado", precio: 14, alergenos: ["Gluten"], dietas: ["Omnivoro"] },
        { nombre: "Provolone al horno", precio: 10, alergenos: ["Leche"], dietas: ["Vegetariano"] }
      ],
      principales: [
        { nombre: "Carbonara auténtica", precio: 14, alergenos: ["Gluten", "Leche", "Huevos"], dietas: ["Omnivoro"] },
        { nombre: "Pizza Diavola", precio: 12, alergenos: ["Gluten", "Leche"], dietas: ["Omnivoro"] }
      ],
      postres: [
        { nombre: "Tiramisú clásico", precio: 6, alergenos: ["Gluten", "Leche", "Huevos"], dietas: ["Omnivoro"] }
      ],
      bebidas: [
        { nombre: "Copa de vino tinto", precio: 3.5, alergenos: [], dietas: ["Omnivoro", "Vegetariano", "Vegano"] }
      ]
    }
  },
  {
    id: 2,
    nombre: "Gino's Plaza",
    cocina: "Italiana",
    ciudad: "Madrid",
    direccion: "Plaza de Santa Ana 2, Madrid",
    precio: "€€",
    precioMedio: 18,
    puntuacion: 4.2,
    resenas: 85,
    promo: null,
    alergenos: ["Gluten", "Leche"],
    intolerancias: ["Sin gluten (opciones)"],
    dietas: ["Omnivoro", "Vegetariano"],
    coords: { lat: 40.4148, lng: -3.7005 },
    descripcion: "Clásicos italianos en una terraza céntrica.",
    menu: {
      entrantes: [
        { nombre: "Ensalada Caprese", precio: 11, alergenos: ["Leche"], dietas: ["Vegetariano"] }
      ],
      principales: [
        { nombre: "Lasaña de la Nonna", precio: 13, alergenos: ["Gluten", "Leche"], dietas: ["Omnivoro"] }
      ],
      postres: [
        { nombre: "Panna Cotta", precio: 5, alergenos: ["Leche"], dietas: ["Omnivoro", "Vegetariano"] }
      ],
      bebidas: [
        { nombre: "Refresco", precio: 2.5, alergenos: [], dietas: ["Omnivoro", "Vegetariano", "Vegano"] }
      ]
    }
  },
  {
    id: 3,
    nombre: "El Rincón Vegano",
    cocina: "Vegana",
    ciudad: "Madrid",
    direccion: "Plaza España 5, Madrid",
    precio: "€",
    precioMedio: 15,
    puntuacion: 4.9,
    resenas: 310,
    promo: "2x1 en postres",
    alergenos: ["Soja", "Frutos de cascara"],
    intolerancias: ["Sin lactosa"],
    dietas: ["Vegano", "Vegetariano", "Plant-based"],
    coords: { lat: 40.4222, lng: -3.7123 },
    descripcion: "Cocina creativa 100% plant-based.",
    menu: {
      entrantes: [
        { nombre: "Hummus arcoíris", precio: 8, alergenos: [], dietas: ["Vegano", "Plant-based"] }
      ],
      principales: [
        { nombre: "Burger Beyond", precio: 13, alergenos: ["Gluten", "Soja"], dietas: ["Vegano"] }
      ],
      postres: [
        { nombre: "Cheesecake vegana", precio: 6, alergenos: ["Frutos de cascara"], dietas: ["Vegano"] }
      ],
      bebidas: [
        { nombre: "Kombucha de frambuesa", precio: 4, alergenos: [], dietas: ["Vegano", "Plant-based"] }
      ]
    }
  },
  {
    id: 4,
    nombre: "Sushi Master",
    cocina: "Japonesa",
    ciudad: "Madrid",
    direccion: "Gran Vía 22, Madrid",
    precio: "€€€",
    precioMedio: 28,
    puntuacion: 4.7,
    resenas: 200,
    promo: "-20% los martes",
    alergenos: ["Pescado", "Soja", "Gluten"],
    intolerancias: [],
    dietas: ["Omnivoro", "Pescetariano"],
    coords: { lat: 40.4197, lng: -3.7004 },
    descripcion: "Sushi premium y cortes frescos.",
    menu: {
      entrantes: [
        { nombre: "Edamame spicy", precio: 6, alergenos: ["Soja"], dietas: ["Vegano", "Vegetariano"] }
      ],
      principales: [
        { nombre: "Barco variado", precio: 35, alergenos: ["Pescado", "Soja", "Gluten"], dietas: ["Pescetariano", "Omnivoro"] }
      ],
      postres: [
        { nombre: "Mochis surtidos", precio: 5, alergenos: ["Gluten"], dietas: ["Omnivoro", "Vegetariano"] }
      ],
      bebidas: [
        { nombre: "Sake", precio: 4.5, alergenos: [], dietas: ["Omnivoro", "Vegetariano", "Vegano"] }
      ]
    }
  }
];

// --- Helpers ---
function normalizarLista(param) {
  if (!param) return [];
  if (Array.isArray(param)) return param;
  return String(param)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}

function incluyeTodos(filtros, lista) {
  if (!filtros.length) return true;
  if (!lista || !lista.length) return false;
  const lowerLista = lista.map(v => v.toLowerCase());
  return filtros.every(f => lowerLista.includes(f.toLowerCase()));
}

// GET /api/restaurantes
// Parámetros: q, ciudad, cocina, precioMin, precioMax, alergenos[], intolerancias[], dietas[]
app.get('/api/restaurantes', (req, res) => {
  const { q, ciudad, cocina, precioMin, precioMax } = req.query;
  const filtrosAlergenos = normalizarLista(req.query.alergenos);
  const filtrosIntolerancias = normalizarLista(req.query.intolerancias);
  const filtrosDietas = normalizarLista(req.query.dietas);

  let resultados = [...restaurantes];

  if (q) {
    const term = q.toLowerCase();
    resultados = resultados.filter(r =>
      r.nombre.toLowerCase().includes(term) ||
      r.cocina.toLowerCase().includes(term) ||
      r.ciudad.toLowerCase().includes(term) ||
      r.descripcion.toLowerCase().includes(term)
    );
  }

  if (ciudad) {
    const term = ciudad.toLowerCase();
    resultados = resultados.filter(r => r.ciudad.toLowerCase().includes(term));
  }

  if (cocina) {
    const term = cocina.toLowerCase();
    resultados = resultados.filter(r => r.cocina.toLowerCase().includes(term));
  }

  if (precioMin) {
    const min = Number(precioMin);
    resultados = resultados.filter(r => r.precioMedio >= min);
  }
  if (precioMax) {
    const max = Number(precioMax);
    resultados = resultados.filter(r => r.precioMedio <= max);
  }

  if (filtrosAlergenos.length) {
    resultados = resultados.filter(r => incluyeTodos(filtrosAlergenos, r.alergenos));
  }

  if (filtrosIntolerancias.length) {
    resultados = resultados.filter(r => incluyeTodos(filtrosIntolerancias, r.intolerancias));
  }

  if (filtrosDietas.length) {
    resultados = resultados.filter(r => incluyeTodos(filtrosDietas, r.dietas));
  }

  res.json(resultados);
});

// GET detalle
app.get('/api/restaurantes/:id', (req, res) => {
  const id = Number(req.params.id);
  const restaurante = restaurantes.find(r => r.id === id);
  if (!restaurante) return res.status(404).json({ error: 'Restaurante no encontrado' });
  res.json(restaurante);
});

// POST reserva
app.post('/api/reservar', (req, res) => {
  const { restauranteId, fecha, hora, personas } = req.body;
  console.log('Reserva recibida:', { restauranteId, fecha, hora, personas });
  setTimeout(() => {
    res.json({ status: 'ok', mensaje: 'Reserva confirmada' });
  }, 600);
});

// POST newsletter
app.post('/api/suscribir', (req, res) => {
  const { email } = req.body;
  console.log('Nuevo suscriptor:', email);
  res.json({ status: 'ok', mensaje: 'Cupón enviado a tu correo' });
});

app.listen(port, () => {
  console.log(`🚀 MenuFinder corriendo en http://localhost:${port}`);
});
