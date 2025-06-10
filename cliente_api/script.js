document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes de Materialize
    M.AutoInit();
    
    // Función para formatear timestamp a fecha legible
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    }

    // Función para detectar anomalías
    function detectAnomaly(valor) {
        if (valor > 120) return { type: 'high', message: 'Ritmo alto' };
        if (valor < 60) return { type: 'low', message: 'Ritmo bajo' };
        return null;
    }
});