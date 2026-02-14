require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const mongoose = require("mongoose");

const Usuario = require("./models/Usuario");
const Acceso = require("./models/Acceso");
const productosCtrl = require("./controllers/productoController");
const tareasCtrl = require("./controllers/tareaController");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;
const PUBLIC_DIR = path.join(__dirname, process.env.PUBLIC_DIR || "public");

function auth(req, res, next) {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) return res.status(401).json({ error: "Token requerido" });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) {
        if (e && e.name === "TokenExpiredError") return res.status(403).json({ error: "Token expirado" });
        return res.status(401).json({ error: "Token inválido" });
    }
}

app.use(express.static(PUBLIC_DIR));

app.get("/", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.post(["/register", "/api/register"], async (req, res, next) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) return res.status(400).json({ error: "username y password son requeridos" });
        const existe = await Usuario.findOne({ username });
        if (existe) return res.status(409).json({ error: "Usuario ya existe" });
        const hashedPassword = await bcrypt.hash(password, 10);
        await Usuario.create({ username, password: hashedPassword });
        res.status(201).json({ message: "Registro exitoso" });
    } catch (err) {
        next(err);
    }
});

app.post(["/login", "/api/login"], async (req, res, next) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) return res.status(400).json({ error: "username y password son requeridos" });
        const user = await Usuario.findOne({ username });
        if (!user) return res.status(401).json({ error: "Credenciales inválidas" });
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });
        await Acceso.create({
            usuarioId: user._id,
            username: user.username,
            inicioSesion: new Date()
        });
        const token = jwt.sign({ sub: user._id, username: user.username }, JWT_SECRET, { expiresIn: "2h" });
        res.json({ token });
    } catch (err) {
        next(err);
    }
});

app.post("/api/logout", auth, async (req, res) => {
    try {
        await Acceso.findOneAndUpdate(
            { usuarioId: req.user.sub, finSesion: { $exists: false } },
            { finSesion: new Date() },
            { sort: { inicioSesion: -1 } }
        );
        res.json({ message: "Logout exitoso" });
    } catch (err) {
        res.status(500).json({ error: "Error al cerrar sesión" });
    }
});

app.get("/api/accesos", auth, async (req, res) => {
    try {
        const docs = await Acceso.find().sort({ inicioSesion: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener accesos" });
    }
});

app.get("/api/productos", auth, productosCtrl.listar);
app.post("/api/productos", auth, productosCtrl.crear);
app.put("/api/productos/:id", auth, productosCtrl.actualizar);
app.delete("/api/productos/:id", auth, productosCtrl.eliminar);

app.get("/api/tareas", auth, tareasCtrl.listar);
app.post("/api/tareas", auth, tareasCtrl.crear);
app.put("/api/tareas/:id", auth, tareasCtrl.actualizar);
app.delete("/api/tareas/:id", auth, tareasCtrl.eliminar);
app.delete("/api/tareas-todas", auth, tareasCtrl.eliminarTodo);

app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
});

module.exports = app;

if (require.main === module) {
    (async () => {
        try {
            await mongoose.connect(MONGO_URI);
            app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    })();
}
