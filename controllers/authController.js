const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await Usuario.create({ username, password: hashedPassword });
        res.status(201).json({ message: "Usuario creado" });
    } catch (e) {
        res.status(400).json({ error: "El usuario ya existe" });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await Usuario.findOne({ username });
        
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign(
                { sub: user._id, username: user.username }, 
                process.env.JWT_SECRET, 
                { expiresIn: '2h' }
            );
            return res.json({ token });
        }
        res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    } catch (e) {
        res.status(500).json({ error: "Error en el servidor" });
    }
};