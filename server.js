const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- TUS CREDENCIALES ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'miguelmartincaro@gmail.com',
    pass: 'bccyqrnswsxaaerh'
  }
});

const FILES = {
    leads: path.join(__dirname, 'leads.json'),
    restaurantes: path.join(__dirname, 'restaurantes.json'),
    users: path.join(__dirname, 'users.json'),
    bookings: path.join(__dirname, 'bookings.json')
};

// Helper DB
const db = {
    read: (file) => {
        try {
            if (!fs.existsSync(file)) { fs.writeFileSync(file, '[]'); return []; }
            return JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch (e) { return []; }
    },
    write: (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2))
};

const normalizar = (t) => t ? t.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

// --- ENDPOINTS ---

app.get('/api/restaurantes', (req, res) => {
    const { q } = req.query;
    let r = db.read(FILES.restaurantes);
    if (q) {
        const t = normalizar(q);
        r = r.filter(i => 
            normalizar(i.nombre).includes(t) || 
            normalizar(i.cocina).includes(t) ||
            normalizar(i.descripcion || "").includes(t)
        );
    }
    res.json(r);
});

app.get('/api/restaurantes/:id', (req, res) => {
    const r = db.read(FILES.restaurantes).find(i => i.id === Number(req.params.id));
    r ? res.json(r) : res.status(404).json({error:'No encontrado'});
});

app.post('/api/admin/restaurantes', (req, res) => {
    const list = db.read(FILES.restaurantes);
    req.body.id = Date.now();
    list.push(req.body);
    db.write(FILES.restaurantes, list);
    res.json({ status: 'ok' });
});

// Suscripción (Newsletter)
app.post('/api/suscribir', async (req, res) => {
    const { email, preferencia } = req.body;
    let codigo = 'MENU10';
    if(preferencia === 'italiana') codigo = 'PASTA10';
    else if(preferencia === 'japonesa') codigo = 'SUSHI10';
    else if(preferencia === 'vegana') codigo = 'GREEN10';
    
    try {
        const leads = db.read(FILES.leads);
        leads.push({ email, preferencia, codigo, date: new Date() });
        db.write(FILES.leads, leads);
        
        // Email HTML Bonito
        await transporter.sendMail({
            from: 'MenuFinder Club', 
            to: email, 
            subject: `🎁 Tu código: ${codigo}`, 
            html: `
                <div style="font-family:sans-serif; padding:20px; border:1px solid #eee; border-radius:10px; text-align:center;">
                    <h1 style="color:#ff385c;">¡Bienvenido!</h1>
                    <p>Aquí tienes tu descuento para comida <strong>${preferencia}</strong>.</p>
                    <div style="background:#f9f9f9; padding:15px; margin:20px 0; font-size:24px; font-weight:bold; letter-spacing:2px;">${codigo}</div>
                    <p style="color:#777; font-size:12px;">Válido por 30 días.</p>
                </div>
            `
        });
        res.json({ status: 'ok' });
    } catch (e) { res.status(500).json({error: e.message}); }
});

// Reservas
app.post('/api/reservar-completa', async (req, res) => {
    const { restaurante, fecha, hora, personas, userEmail } = req.body;
    const bookings = db.read(FILES.bookings);
    bookings.push({ id: Date.now(), restaurante, fecha, hora, personas, userEmail, status:'Confirmada' });
    db.write(FILES.bookings, bookings);
    
    try {
        await transporter.sendMail({
            from: 'Reservas MenuFinder', to: userEmail, subject: 'Reserva Confirmada ✅',
            html: `<h1>Reserva en ${restaurante}</h1><p>${fecha} a las ${hora} (${personas} pers.)</p>`
        });
    } catch(e) { console.error(e); }
    
    res.json({ status: 'ok' });
});

// Auth
app.post('/api/auth/register', (req, res) => {
    const { nombre, email, password } = req.body;
    const users = db.read(FILES.users);
    if(users.find(u => u.email === email)) return res.status(400).json({error:'Email existe'});
    const user = { id:Date.now(), nombre, email, password };
    users.push(user);
    db.write(FILES.users, users);
    
    transporter.sendMail({
        from: 'MenuFinder', to: email, subject: 'Bienvenido a la familia',
        html: `<h1>Hola ${nombre}!</h1><p>Gracias por registrarte.</p>`
    }).catch(console.error);

    res.json({ status:'ok', user });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.read(FILES.users).find(u => u.email === email && u.password === password);
    user ? res.json({ status:'ok', user }) : res.status(401).json({error:'Error login'});
});

app.listen(port, () => console.log(`🚀 MenuFinder LISTO en http://localhost:${port}`));