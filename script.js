// Clases
class Usuario {
    constructor(nombre, usuario, password) {
        Object.assign(this, { nombre, usuario, password, historial: [] });
    }
}

class Simulacion {
    constructor(monto, cuotas, interes, usuario) {
        Object.assign(this, {
            monto: parseFloat(monto),
            cuotas: parseInt(cuotas),
            interes: parseFloat(interes),
            usuario: usuario.usuario,
            fecha: new Date()
        });
        this.calcularResultados();
    }

    toJSON() {
        const { monto, cuotas, interes, usuario, fecha, cuotaMensual, totalPagado, totalInteres } = this;
        return { monto, cuotas, interes, usuario, fecha, cuotaMensual, totalPagado, totalInteres };
    }

    calcularResultados() {
        const tasaMensual = this.interes / 12 / 100;
        const factor = Math.pow(1 + tasaMensual, this.cuotas);
        this.cuotaMensual = (this.monto * tasaMensual * factor) / (factor - 1);
        this.totalPagado = this.cuotaMensual * this.cuotas;
        this.totalInteres = this.totalPagado - this.monto;
    }
}

// Manejo de localStorage
const DEFAULT_USER = { nombre: 'Elon Musk', usuario: 'elonmusk', password: 'TeslaSpaceX', historial: [] };

const Storage = {
    guardarUsuarios: (usuarios) => {
        try {
            localStorage.setItem('usuarios', JSON.stringify(usuarios));
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
        }
    },
    obtenerUsuarios: () => {
        let usuarios = null;
        try {
            usuarios = JSON.parse(localStorage.getItem('usuarios'));
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
        }
        return usuarios || [DEFAULT_USER];
    }
};

// Variables globales
let usuarios = Storage.obtenerUsuarios();
let usuarioActual = null;

// Formateo de moneda
const formatoMoneda = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

// Funciones de utilidad
const getInputValue = (id, trim = true) => {
    const input = document.getElementById(id);
    return input ? (trim ? input.value.trim() : input.value) : '';
};

const validarCampos = (campos) => campos.every(campo => campo);

function mostrarMensaje(elementId, mensaje, esError = true) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.textContent = mensaje;
        elemento.className = esError ? 'error' : 'success';
        elemento.style.display = mensaje ? 'block' : 'none';

        if (esError && mensaje) {
            elemento.style.color = 'red';
            elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function limpiarFormulario(formId) {
    const form = document.getElementById(formId);
    if (form) {
        const inputs = form.getElementsByTagName('input');
        Array.from(inputs).forEach(input => input.value = '');
    }
}

function mostrarComponente(id, mostrar = true) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.classList.toggle('hidden', !mostrar);
    }
}

// Funciones principales
function registrarUsuario(event) {
    event.preventDefault();
    const nombre = getInputValue('regNombre');
    const usuario = getInputValue('regUsuario');
    const password = getInputValue('regPassword', false);

    if (!validarCampos([nombre, usuario, password])) {
        mostrarMensaje('mensajeRegistro', 'Por favor, complete todos los campos');
        return;
    }

    if (usuarios.some(u => u.usuario === usuario)) {
        mostrarMensaje('mensajeRegistro', 'El usuario ya existe');
        return;
    }

    usuarios.push(new Usuario(nombre, usuario, password));
    Storage.guardarUsuarios(usuarios);

    mostrarMensaje('mensajeRegistro', 'Usuario registrado exitosamente', false);
    limpiarFormulario('registroForm');
}

function iniciarSesion(event) {
    event.preventDefault();
    const usuario = getInputValue('loginUsuario');
    const password = getInputValue('loginPassword', false);

    if (!validarCampos([usuario, password])) {
        mostrarMensaje('mensajeLogin', 'Por favor, complete todos los campos');
        return;
    }

    const usuarioEncontrado = usuarios.find(u => u.usuario === usuario && u.password === password);

    if (usuarioEncontrado) {
        usuarioActual = usuarioEncontrado;
        usuarioActual.historial = usuarioActual.historial || [];
        mostrarInterfazSimulador();
        actualizarHistorial();
    } else {
        mostrarMensaje('mensajeLogin', 'Usuario o contraseña incorrectos');
    }
}

function mostrarInterfazSimulador() {
    mostrarComponente('registroForm', false);
    mostrarComponente('loginForm', false);
    mostrarComponente('simuladorContainer', true);
    mostrarComponente('historialContainer', true);

    const datosUsuarioElement = document.getElementById('datosUsuario');
    if (datosUsuarioElement) {
        datosUsuarioElement.textContent = `Bienvenido, ${usuarioActual.nombre}`;
    }
}

function realizarSimulacion(event) {
    event.preventDefault();

    try {
        const montoInput = document.getElementById('monto');
        const cuotasInput = document.getElementById('cuotas');
        const interesInput = document.getElementById('interes');

        const { monto, cuotas, interes } = validarSimulacionInputs(montoInput, cuotasInput, interesInput);

        const simulacion = new Simulacion(monto, cuotas, interes, usuarioActual);
        usuarioActual.historial.push(simulacion.toJSON());
        actualizarUsuarioEnStorage(usuarioActual);

        mostrarResultadoSimulacion(simulacion);
        mostrarMensaje('mensajeSimulacion', '', false);
        actualizarHistorial();

    } catch (error) {
        console.error('Error al realizar la simulación:', error);
        mostrarMensaje('mensajeSimulacion', error.message || 'Ocurrió un error al realizar la simulación');
    }
}

const validarSimulacionInputs = (montoInput, cuotasInput, interesInput) => {
    if (!montoInput || !cuotasInput || !interesInput) {
        throw new Error('No se encontraron los campos del formulario');
    }

    const monto = parseFloat(montoInput.value.replace(/[^\d.-]/g, ''));
    const cuotas = parseInt(cuotasInput.value);
    const interes = parseFloat(interesInput.value);

    if (isNaN(monto) || monto <= 0) throw new Error('El monto debe ser un número mayor a 0');
    if (isNaN(cuotas) || cuotas <= 0) throw new Error('El número de cuotas debe ser un número mayor a 0');
    if (isNaN(interes) || interes < 0) throw new Error('La tasa de interés debe ser un número mayor o igual a 0');

    return { monto, cuotas, interes };
};

const actualizarUsuarioEnStorage = (usuario) => {
    const indiceUsuario = usuarios.findIndex(u => u.usuario === usuario.usuario);
    if (indiceUsuario !== -1) {
        usuarios[indiceUsuario] = { ...usuario };
        Storage.guardarUsuarios(usuarios);
    }
};

function mostrarResultadoSimulacion(simulacion) {
    const resultadoDiv = document.getElementById('resultadoSimulacion');
    if (!resultadoDiv) return;

    const { fecha, monto, cuotas, interes, cuotaMensual, totalPagado, totalInteres } = simulacion;
    resultadoDiv.innerHTML = `
        <h3>Resultado de la Simulación</h3>
        <p>Fecha: ${fecha.toLocaleDateString()}</p>
        <p>Monto solicitado: ${formatoMoneda.format(monto)}</p>
        <p>Número de cuotas: ${cuotas}</p>
        <p>Tasa de interés anual: ${interes}%</p>
        <p>Cuota mensual: ${formatoMoneda.format(cuotaMensual)}</p>
        <p>Total a pagar: ${formatoMoneda.format(totalPagado)}</p>
        <p>Total de intereses: ${formatoMoneda.format(totalInteres)}</p>
        <div class="aviso-nueva-simulacion">
            <p>Para realizar una nueva simulación, modifique los valores y haga clic en "Calcular" nuevamente.</p>
        </div>
    `;

    mostrarComponente('resultadoSimulacion', true);
}

function actualizarHistorial() {
    const tbody = document.querySelector('#historialTable tbody');
    if (!tbody || !usuarioActual.historial) return;

    tbody.innerHTML = usuarioActual.historial.map(simulacion => `
        <tr>
            <td>${new Date(simulacion.fecha).toLocaleDateString()}</td>
            <td>${formatoMoneda.format(simulacion.monto)}</td>
            <td>${simulacion.cuotas}</td>
            <td>${simulacion.interes}%</td>
            <td>${formatoMoneda.format(simulacion.cuotaMensual)}</td>
            <td>${formatoMoneda.format(simulacion.totalPagado)}</td>
        </tr>
    `).join('');
}

function cerrarSesion(event) {
    if (event) event.preventDefault();
    usuarioActual = null;
    mostrarComponente('registroForm', true);
    mostrarComponente('loginForm', true);
    mostrarComponente('simuladorContainer', false);
    mostrarComponente('historialContainer', false);
    mostrarComponente('resultadoSimulacion', false);
    limpiarFormulario('simuladorContainer');
    limpiarFormulario('loginForm');
    limpiarFormulario('registroForm');
}

// Asignación de eventos
document.addEventListener('DOMContentLoaded', () => {
    const eventos = [
        { id: 'btnRegistrar', evento: registrarUsuario },
        { id: 'btnLogin', evento: iniciarSesion },
        { id: 'btnSimular', evento: realizarSimulacion },
        { id: 'btnCerrarSesion', evento: cerrarSesion }
    ];

    eventos.forEach(({ id, evento }) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.addEventListener('click', evento);
    });
});