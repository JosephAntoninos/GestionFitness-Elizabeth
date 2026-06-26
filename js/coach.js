// ================== PANEL DEL COACH - CON FIRESTORE ==================

let clientes = [];           // Todos los clientes (cargados desde Firestore)
let clienteSeleccionado = null;
let unsubscribeClientes = null; // Para limpiar la suscripción

// ================== FUNCIONES AUXILIARES DE CÁLCULO ==================

function calcularScore(completedDays, diaPrograma) {
    if (!completedDays || completedDays.length === 0) return 0;
    const disponibles = Math.min(completedDays.length, diaPrograma);
    const completados = completedDays.slice(0, disponibles).filter(d => d).length;
    return disponibles === 0 ? 0 : Math.round((completados / disponibles) * 100);
}

function calcularRacha(completedDays, diaPrograma) {
    if (!completedDays || completedDays.length === 0) return 0;
    let racha = 0;
    for (let i = Math.min(diaPrograma - 1, completedDays.length - 1); i >= 0; i--) {
        if (completedDays[i]) racha++;
        else break;
    }
    return racha;
}

function calcularRiesgo(score, racha, ultimoAcceso) {
    if (score >= 90) return { nivel: 'bajo', clase: 'riesgo-bajo', texto: 'Bajo' };
    if (score >= 75) return { nivel: 'medio', clase: 'riesgo-medio', texto: 'Medio' };
    if (score >= 50) return { nivel: 'medio', clase: 'riesgo-medio', texto: 'Medio' };
    return { nivel: 'alto', clase: 'riesgo-alto', texto: 'Alto' };
}

// ================== CARGAR CLIENTES DESDE FIRESTORE ==================

function cargarClientes() {
    if (unsubscribeClientes) {
        unsubscribeClientes(); // Limpiar suscripción previa
    }
    
    // Suscripción en tiempo real a todos los clientes
    unsubscribeClientes = db.collection('clients')
        .onSnapshot((snapshot) => {
            clientes = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                const id = doc.id;
                const diaPrograma = data.startDate ? 
                    Math.floor((new Date() - new Date(data.startDate + 'T00:00:00')) / (1000*60*60*24)) + 1 : 1;
                const score = calcularScore(data.completedDays || [], diaPrograma);
                const racha = calcularRacha(data.completedDays || [], diaPrograma);
                const riesgo = calcularRiesgo(score, racha, data.lastAccess);
                
                clientes.push({
                    id: id,
                    ...data,
                    score: score,
                    racha: racha,
                    riesgo: riesgo
                });
            });
            renderizarListaClientes();
            console.log('✅ Lista de clientes actualizada desde Firestore');
        }, (error) => {
            console.error('❌ Error al cargar clientes:', error);
        });
}

// ================== RENDERIZAR LISTA DE CLIENTES ==================

function renderizarListaClientes() {
    const grid = document.getElementById('clientesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    if (clientes.length === 0) {
        grid.innerHTML = '<div style="text-align:center; color:#6eb2cc; padding:40px;">No hay clientes registrados aún.</div>';
        return;
    }
    
    clientes.forEach(cliente => {
        const card = document.createElement('div');
        card.className = 'cliente-card';
        
        const ultimo = cliente.lastAccess ? new Date(cliente.lastAccess) : new Date();
        const hoy = new Date();
        const diffDias = Math.floor((hoy - ultimo) / (1000*60*60*24));
        let ultimoTexto = diffDias === 0 ? 'Hoy' : diffDias === 1 ? 'Ayer' : `Hace ${diffDias} días`;
        
        card.innerHTML = `
            <div class="cliente-nombre">${cliente.name || 'Sin nombre'}</div>
            <div class="cliente-estado">
                <span class="cliente-score" style="color: ${cliente.score >= 75 ? '#22c55e' : cliente.score >= 50 ? '#eab308' : '#ef4444'}">${cliente.score}%</span>
                <span class="cliente-ultimo">🔥 ${cliente.racha} días</span>
            </div>
            <div class="cliente-estado">
                <span>Último acceso: ${ultimoTexto}</span>
            </div>
            <span class="cliente-riesgo ${cliente.riesgo.clase}">Riesgo ${cliente.riesgo.texto}</span>
        `;
        card.dataset.id = cliente.id;
        card.addEventListener('click', () => abrirPerfil(cliente.id));
        grid.appendChild(card);
    });
}

// ================== ABRIR PERFIL DE CLIENTE ==================

function abrirPerfil(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;
    clienteSeleccionado = cliente;
    const container = document.getElementById('perfilContainer');
    container.classList.add('visible');
    document.getElementById('perfilTitulo').textContent = `👤 ${cliente.name || 'Cliente'}`;
    
    // Rellenar datos de configuración
    document.getElementById('perfil-nombre').value = cliente.name || '';
    document.getElementById('perfil-pin').value = cliente.pin || '';
    document.getElementById('perfil-peso').value = cliente.initialWeight || '';
    document.getElementById('perfil-musculo').value = cliente.initialMuscle || '';
    document.getElementById('perfil-grasa').value = cliente.initialFat || '';
    document.getElementById('perfil-diagnostico').value = cliente.diagnosis || '';
    document.getElementById('perfil-programa').value = cliente.program || 'Fuerza y Composición 28 días';
    
    // Rellenar métricas de seguimiento
    document.getElementById('perfil-score').textContent = cliente.score + '%';
    document.getElementById('perfil-racha').textContent = cliente.racha + ' días';
    document.getElementById('perfil-ultimo').textContent = cliente.lastAccess ? 
        new Date(cliente.lastAccess).toLocaleDateString('es-ES') : 'Sin acceso';
    
    // Evaluaciones
    const evalContainer = document.getElementById('perfil-evaluaciones');
    evalContainer.innerHTML = '';
    const evals = cliente.evaluations || {};
    if (evals.week1) {
        evalContainer.innerHTML += `<div>Semana 1: ${evals.week1.peso} kg | ${evals.week1.musculo} kg músculo | ${evals.week1.grasa}% grasa</div>`;
    }
    if (evals.week2) {
        evalContainer.innerHTML += `<div>Semana 2: ${evals.week2.peso} kg | ${evals.week2.musculo} kg músculo | ${evals.week2.grasa}% grasa</div>`;
    }
    if (evals.week4) {
        evalContainer.innerHTML += `<div>Final: ${evals.week4.peso} kg | ${evals.week4.musculo} kg músculo | ${evals.week4.grasa}% grasa</div>`;
    }
    if (!evals.week1 && !evals.week2 && !evals.week4) {
        evalContainer.innerHTML = '<div style="color:#6eb2cc;">Aún no hay evaluaciones registradas</div>';
    }
    
    // Check-ins
    const checkinContainer = document.getElementById('perfil-checkins');
    checkinContainer.innerHTML = '';
    const checkins = cliente.checkins || [];
    if (checkins.length === 0) {
        checkinContainer.innerHTML = '<div style="color:#6eb2cc;">Aún no hay check-ins registrados</div>';
    } else {
        const emoji = { excelente: '😀', bien: '🙂', regular: '😐', dificil: '😕', 'muy-dificil': '😫' };
        checkins.forEach(c => {
            checkinContainer.innerHTML += `<div>Semana ${c.semana}: ${emoji[c.estado] || '❓'} ${c.estado}</div>`;
        });
    }
}

// ================== CERRAR PERFIL ==================

function cerrarPerfil() {
    document.getElementById('perfilContainer').classList.remove('visible');
    clienteSeleccionado = null;
}

// ================== GUARDAR CONFIGURACIÓN ==================

async function guardarConfiguracion() {
    if (!clienteSeleccionado) {
        alert('❌ No hay cliente seleccionado.');
        return;
    }
    
    const perfilData = {
        name: document.getElementById('perfil-nombre').value,
        pin: document.getElementById('perfil-pin').value,
        initialWeight: parseFloat(document.getElementById('perfil-peso').value) || 0,
        initialMuscle: parseFloat(document.getElementById('perfil-musculo').value) || 0,
        initialFat: parseFloat(document.getElementById('perfil-grasa').value) || 0,
        diagnosis: document.getElementById('perfil-diagnostico').value,
        program: document.getElementById('perfil-programa').value
    };
    
    try {
        await db.collection('clients').doc(clienteSeleccionado.id).update(perfilData);
        alert('✅ Configuración guardada correctamente en Firestore');
        // Actualizar cliente local
        Object.assign(clienteSeleccionado, perfilData);
        renderizarListaClientes();
    } catch (error) {
        console.error('❌ Error al guardar configuración:', error);
        alert('❌ Error al guardar. Revisa la consola.');
    }
}

// ================== INICIALIZACIÓN ==================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar clientes desde Firestore
    cargarClientes();
    
    // Eventos UI
    document.getElementById('btnCerrarPerfil').addEventListener('click', cerrarPerfil);
    document.getElementById('btnGuardarConfig').addEventListener('click', guardarConfiguracion);
    
    document.getElementById('logoutCoach').addEventListener('click', function() {
        if (confirm('¿Cerrar sesión?')) {
            if (unsubscribeClientes) unsubscribeClientes();
            window.location.href = 'index.html';
        }
    });
});