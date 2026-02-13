const form = document.getElementById('form-tarea');
const lista = document.getElementById('lista-tareas');
const token = localStorage.getItem('token');

const btnSubmit = document.getElementById('btn-agregar');
const btnCancelar = document.getElementById('btn-cancelar-edicion');
const formTitle = document.getElementById('form-title');

let editando = false;
let productoIdEdicion = null;

if (!token) {
    window.location.href = '../../index.html';
}

async function cargarProductos() {
    try {
        const res = await fetch('/api/productos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401 || res.status === 403) {
            window.location.href = '../../index.html';
            return;
        }
        const productos = await res.json();
        renderizarProductos(productos);
    } catch (err) {
        console.error("Error al cargar:", err);
    }
}

function renderizarProductos(productos) {
    lista.innerHTML = '';
    productos.forEach(p => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <div class="task-left">
                <div style="display: flex; align-items: center; gap: 15px;">
                    ${p.imagen 
                        ? `<img src="${p.imagen}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover; background: #f0f0f0;" onerror="this.src='https://placehold.co/60?text=Error'">` 
                        : `<div style="width: 60px; height: 60px; background: #eee; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999;">Sin Foto</div>`
                    }
                    <div>
                        <div class="task-topline">
                            <span class="badge todo">${p.categoria}</span>
                            <span class="task-name">${p.nombre}</span>
                        </div>
                        <div class="task-meta">
                            <span><strong>Precio:</strong> $${p.precio}</span>
                            <span><strong>Stock:</strong> ${p.stock}</span>
                            <p style="margin: 4px 0 0 0; font-size: 0.9em; color: #666;">${p.descripcion || 'Sin descripción'}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="icon-btn primary" onclick="prepararEdicion('${p._id}', '${p.nombre}', '${p.descripcion || ''}', '${p.categoria}', ${p.precio}, ${p.stock}, '${p.imagen || ''}')">Editar</button>
                <button class="icon-btn danger" onclick="eliminarProducto('${p._id}')">Eliminar</button>
            </div>
        `;
        lista.appendChild(li);
    });
    document.getElementById('stat-total').textContent = productos.length;
}

window.prepararEdicion = (id, nombre, desc, cat, precio, stock, img) => {
    editando = true;
    productoIdEdicion = id;

    document.getElementById('nombre-tarea').value = nombre;
    document.getElementById('desc-tarea').value = desc;
    document.getElementById('creado-por').value = cat;
    document.getElementById('asignado-a').value = precio;
    document.getElementById('fecha-limite').value = stock;
    
    const campoImg = document.getElementById('img-producto');
    if(campoImg) campoImg.value = img;

    formTitle.textContent = "Editar Producto";
    btnSubmit.textContent = "Guardar Cambios";
    btnCancelar.hidden = false;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function limpiarFormulario() {
    editando = false;
    productoIdEdicion = null;
    form.reset();
    formTitle.textContent = "Registrar Producto";
    btnSubmit.textContent = "Agregar Producto";
    btnCancelar.hidden = true;
}

btnCancelar.addEventListener('click', limpiarFormulario);

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productoData = {
        nombre: document.getElementById('nombre-tarea').value,
        descripcion: document.getElementById('desc-tarea').value,
        categoria: document.getElementById('creado-por').value,
        precio: parseFloat(document.getElementById('asignado-a').value),
        stock: parseInt(document.getElementById('fecha-limite').value),
        imagen: document.getElementById('img-producto')?.value || ""
    };

    const url = editando ? `/api/productos/${productoIdEdicion}` : '/api/productos';
    const method = editando ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productoData)
        });

        if (res.ok) {
            limpiarFormulario();
            cargarProductos();
        }
    } catch (err) {
        console.error("Error al guardar:", err);
    }
});

window.eliminarProducto = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
        await fetch(`/api/productos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        cargarProductos();
    } catch (err) {
        console.error("Error al eliminar:", err);
    }
};

document.getElementById('logoutLink').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await fetch('/api/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (err) {
        console.error("Error en logout:", err);
    } finally {
        localStorage.removeItem('token');
        window.location.href = '../../index.html';
    }
});

cargarProductos();