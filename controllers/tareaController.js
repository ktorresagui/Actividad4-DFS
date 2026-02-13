const Tarea = require('../models/Tarea');

const tareasCtrl = {};

tareasCtrl.listar = async (req, res, next) => {
    try {
        const tareas = await Tarea.find({ usuarioId: req.user.sub }).sort({ createdAt: -1 });
        res.json(tareas);
    } catch (err) {
        next(err);
    }
};

tareasCtrl.crear = async (req, res, next) => {
    try {
        const nueva = await Tarea.create({
            ...req.body,
            usuarioId: req.user.sub,
            creadoPor: req.user.username 
        });
        res.status(201).json(nueva);
    } catch (err) {
        next(err);
    }
};

tareasCtrl.actualizar = async (req, res, next) => {
    try {
        const tarea = await Tarea.findOneAndUpdate(
            { _id: req.params.id, usuarioId: req.user.sub },
            req.body,
            { new: true }
        );
        if (!tarea) return res.status(404).json({ error: 'No encontrado' });
        res.json(tarea);
    } catch (err) {
        next(err);
    }
};

tareasCtrl.eliminar = async (req, res, next) => {
    try {
        const tarea = await Tarea.findOneAndDelete({ _id: req.params.id, usuarioId: req.user.sub });
        if (!tarea) return res.status(404).json({ error: 'No encontrado' });
        res.json({ mensaje: 'Tarea eliminada' });
    } catch (err) {
        next(err);
    }
};

tareasCtrl.eliminarTodo = async (req, res, next) => {
    try {
        await Tarea.deleteMany({ usuarioId: req.user.sub });
        res.json({ mensaje: 'Todas las tareas eliminadas' });
    } catch (err) {
        next(err);
    }
};

module.exports = tareasCtrl;