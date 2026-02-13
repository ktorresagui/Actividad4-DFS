const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const msg = document.getElementById("msg");
const msg2 = document.getElementById("msg2");

if (localStorage.getItem("token")) {
    location.href = "../../ACT2/pages/tareas.html";
}

const mostrarMensaje = (elemento, texto, tipo) => {
    if (!elemento) return;
    elemento.textContent = texto;
    elemento.className = `message msg--${tipo}`;
};

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value;

    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (!res.ok) return mostrarMensaje(msg, data.error || "Error al entrar", "err");

        localStorage.setItem("token", data.token);
        mostrarMensaje(msg, "¡Éxito! Redirigiendo...", "ok");
        
        setTimeout(() => {
            location.href = "../../ACT2/pages/tareas.html";
        }, 500);
    } catch (err) {
        mostrarMensaje(msg, "Error de conexión con el servidor", "err");
    }
});

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("regUser").value.trim();
    const password = document.getElementById("regPass").value;

    try {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (!res.ok) return mostrarMensaje(msg2, data.error || "Error al registrar", "err");

        mostrarMensaje(msg2, "Cuenta creada. ¡Ya puedes entrar!", "ok");
        registerForm.reset();

        setTimeout(() => {
            registerForm.classList.add("is-hidden");
            loginForm.classList.remove("is-hidden");
            mostrarMensaje(msg2, "", ""); 
        }, 1500);
    } catch (err) {
        mostrarMensaje(msg2, "Error al registrar", "err");
    }
});

document.getElementById("showRegister").onclick = (e) => {
    e.preventDefault();
    loginForm.classList.add("is-hidden");
    registerForm.classList.remove("is-hidden");
};

document.getElementById("showLogin").onclick = (e) => {
    e.preventDefault();
    registerForm.classList.add("is-hidden");
    loginForm.classList.remove("is-hidden");
};

document.getElementById("togglePass").onclick = () => {
    const input = document.getElementById("loginPass");
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    document.getElementById("togglePass").textContent = isPassword ? "Ocultar" : "Ver";
};