const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Pruebas Jest', () => {
    let token;
    const credenciales = { username: 'karol', password: '123' };

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI);
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    test('Registro de Usuario', async () => {
        const res = await request(app)
            .post('/api/register')
            .send(credenciales);
        expect([201, 400,409]).toContain(res.statusCode);
    });

    test('Login y Token', async () => {
        const res = await request(app)
            .post('/api/login')
            .send(credenciales);
        expect(res.statusCode).toBe(200);
        token = res.body.token;
    });

    test('Creación de Producto con validación de precios', async () => {
        const res = await request(app)
            .post('/api/productos')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre: "Producto Test",
                descripcion: "Descripción empresarial",
                categoria: "Oficina",
                precio: 150,
                stock: 20
            });
        expect(res.statusCode).toBe(201);
        expect(res.body.precio).toBe(150);
    });

    test('Creación de Tarea para tecnico1', async () => {
        const res = await request(app)
            .post('/api/tareas')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre: "Mantenimiento",
                descripcion: "Urgente",
                asignadoA: "karol",
                estado: "pendiente",
                deadline: new Date()
            });
        expect(res.statusCode).toBe(201);
        expect(res.body.asignadoA).toBe("karol");
    });

    test('Protección de rutas privadas', async () => {
        const res = await request(app).get('/api/tareas');
        expect(res.statusCode).toBe(401);
    });
});
