const mongoose = require('mongoose');

const TareaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    descripcion: { type: String },
    creadoPor: { type: String },
    asignadoA: { type: String },
    estado: { type: String, default: 'pendiente' },
    deadline: { type: Date },
    fechaCreacion: { type: Date, default: Date.now },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
}, { timestamps: true });

module.exports = mongoose.model('Tarea', TareaSchema);
