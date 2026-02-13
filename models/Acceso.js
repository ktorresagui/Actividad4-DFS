const mongoose = require('mongoose');

const AccesoSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    username: { type: String, required: true },
    inicioSesion: { type: Date, default: Date.now },
    finSesion: { type: Date }
});

module.exports = mongoose.model('Acceso', AccesoSchema);