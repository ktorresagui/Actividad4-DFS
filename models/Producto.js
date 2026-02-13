const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: true,
        trim: true 
    },
    descripcion: { 
        type: String,
        trim: true 
    },
    imagen: { 
        type: String, 
        default: "" 
    },
    categoria: { 
        type: String, 
        required: true,
        trim: true 
    },
    precio: { 
        type: Number, 
        required: true,
        min: 0 
    },
    stock: { 
        type: Number, 
        required: true,
        min: 0 
    },
    usuarioId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario',
        required: true 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Producto', ProductoSchema);