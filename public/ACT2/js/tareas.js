const $ = (sel, parent = document) => parent.querySelector(sel);
const getToken = () => localStorage.getItem("token");

const decodeJwtPayload = (token) => {
    try {
        const part = token.split(".")[1];
        return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    } catch { return null; }
};

const token = getToken();
if (!token) location.replace("/index.html");

const payload = decodeJwtPayload(token);
const LOGGED_USER = payload?.username;

if (LOGGED_USER) {
    const inputCreadoPor = $("#creado-por");
    if (inputCreadoPor) inputCreadoPor.value = LOGGED_USER;
}

const form = $("#form-tarea");
const listaUI = $("#lista-tareas");
const statTotal = $("#stat-total"), statPend = $("#stat-pend"), statDone = $("#stat-done");
const btnAgregar = $("#btn-agregar"), btnCancelarEdicion = $("#btn-cancelar-edicion");

let tareaEditandoId = null;
let todasLasTareas = [];
let filtroEstado = "todas"; 
let filtroScope = "todas";

const formatDate = (dateStr) => {
    if (!dateStr) return "---";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(d).toUpperCase();
};

async function api(url, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    if (res.status === 401) {
        localStorage.removeItem("token");
        location.replace("/index.html");
    }
    return res.json();
}

const cargarTareas = async () => {
    todasLasTareas = await api('/api/tareas');
    render();
};

const render = () => {
    let filtradas = todasLasTareas;

    if (filtroScope === "creadas") filtradas = filtradas.filter(t => t.creadoPor === LOGGED_USER);
    if (filtroScope === "asignadas") filtradas = filtradas.filter(t => t.asignadoA === LOGGED_USER);
    
    if (filtroEstado === "pendientes") filtradas = filtradas.filter(t => t.estado === "pendiente");
    if (filtroEstado === "completadas") filtradas = filtradas.filter(t => t.estado === "completada");

    statTotal.textContent = filtradas.length;
    statDone.textContent = filtradas.filter(t => t.estado === "completada").length;
    statPend.textContent = filtradas.filter(t => t.estado === "pendiente").length;

    listaUI.innerHTML = filtradas.map(t => `
        <li class="task-item">
            <div class="task-left">
                <div class="task-topline">
                    <span class="badge ${t.estado === "completada" ? "done" : "todo"}">${t.estado.toUpperCase()}</span>
                    <span class="task-name ${t.estado === "completada" ? "is-done" : ""}">${t.nombre}</span>
                </div>
                <div class="task-meta">
                    <span>Creación: <strong>${formatDate(t.fechaCreacion || t.createdAt)}</strong></span>
                    <span>Creado por: <strong>${t.creadoPor}</strong></span>
                    <span>Para: <strong>${t.asignadoA || "---"}</strong></span>
                    <span>Límite: <strong style="color:#e74c3c">${formatDate(t.deadline)}</strong></span>
                </div>
                ${t.descripcion ? `<p>${t.descripcion}</p>` : ""}
            </div>
            <div class="task-actions">
                <button class="icon-btn primary" onclick="toggleTarea('${t._id}', '${t.estado}')">
                    ${t.estado === "completada" ? "Reabrir" : "Completar"}
                </button>
                <button class="icon-btn" onclick="prepararEdicion('${t._id}')">Editar</button>
                <button class="icon-btn danger" onclick="eliminarTarea('${t._id}')">Eliminar</button>
            </div>
        </li>
    `).join("") || `<li class="task-item"><em>No hay tareas</em></li>`;
};

form.onsubmit = async (e) => {
    e.preventDefault();
    const datos = {
        nombre: $("#nombre-tarea").value,
        descripcion: $("#desc-tarea").value,
        asignadoA: $("#asignado-a").value,
        deadline: $("#fecha-limite").value,
        creadoPor: LOGGED_USER,
        fechaCreacion: new Date().toISOString(),
        estado: $("#tarea-completa").checked ? "completada" : "pendiente"
    };

    if (tareaEditandoId) {
        delete datos.fechaCreacion; 
        await api(`/api/tareas/${tareaEditandoId}`, 'PUT', datos);
    } else {
        await api('/api/tareas', 'POST', datos);
    }
    resetForm();
    cargarTareas();
};

window.prepararEdicion = (id) => {
    const t = todasLasTareas.find(t => t._id === id);
    if (!t) return;
    tareaEditandoId = id;
    $("#nombre-tarea").value = t.nombre;
    $("#desc-tarea").value = t.descripcion;
    $("#asignado-a").value = t.asignadoA;
    if (t.deadline) $("#fecha-limite").value = t.deadline.split("T")[0];
    $("#tarea-completa").checked = t.estado === "completada";
    
    btnAgregar.textContent = "Guardar cambios";
    btnCancelarEdicion.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
};

window.toggleTarea = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === "pendiente" ? "completada" : "pendiente";
    await api(`/api/tareas/${id}`, 'PUT', { estado: nuevoEstado });
    cargarTareas();
};

window.eliminarTarea = async (id) => {
    if (confirm("¿Eliminar tarea?")) {
        await api(`/api/tareas/${id}`, 'DELETE');
        cargarTareas();
    }
};

$("#btn-borrar-todo").onclick = async () => {
    if (confirm("¿Borrar TODO?")) {
        await api('/api/tareas-todas', 'DELETE');
        cargarTareas();
    }
};

const resetForm = () => {
    form.reset();
    tareaEditandoId = null;
    if (LOGGED_USER) $("#creado-por").value = LOGGED_USER;
    btnAgregar.textContent = "Agregar Tarea";
    btnCancelarEdicion.hidden = true;
};

document.querySelectorAll('.chip').forEach(btn => {
    btn.onclick = (e) => {
        const id = e.target.id;
        e.target.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
        e.target.classList.add('is-active');

        if (id === 'btn-todas') filtroEstado = "todas";
        if (id === 'btn-pendientes') filtroEstado = "pendientes";
        if (id === 'btn-completadas') filtroEstado = "completadas";
        if (id === 'btn-ver-todas') filtroScope = "todas";
        if (id === 'btn-creadas-mi') filtroScope = "creadas";
        if (id === 'btn-asignadas-mi') filtroScope = "asignadas";
        render();
    };
});

$("#logoutLink").onclick = () => { 
    localStorage.removeItem("token"); 
    location.replace("/index.html"); 
};

btnCancelarEdicion.onclick = resetForm;
$("#btn-limpiar").onclick = resetForm;

cargarTareas();
