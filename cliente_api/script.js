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

    // Función para cargar los datos desde el endpoint
    async function loadData() {
        try {
            const response = await fetch('http://localhost:5000/api/ritmo');
            if (!response.ok) throw new Error('Error al cargar los datos');
            
            const data = await response.json();
            // Si el endpoint devuelve un array de registros
            // Si devuelve un solo objeto, lo convertimos a array
            const registros = Array.isArray(data) ? data : [data];
            
            // Procesar los datos
            processData(registros);
        } catch (error) {
            console.error('Error:', error);
            M.toast({html: 'Error al cargar los datos', classes: 'red'});
        }
    }

    // Función para procesar los datos y actualizar la UI
    function processData(registros) {
        // Ordenar por defecto por timestamp descendente
        registros.sort((a, b) => b.timestamp - a.timestamp);
        
        // Actualizar tabla
        updateTable(registros);
        
        // Calcular estadísticas
        calculateStats(registros);
        
        // Agrupar por dispositivo
        groupByDevice(registros);
        
        // Preparar datos para gráfico cronológico
        prepareTimeChart(registros);
    }

    // Función para actualizar la tabla
    function updateTable(registros) {
        const tbody = document.getElementById('registros-tbody');
        tbody.innerHTML = '';
        
        registros.forEach(registro => {
            const anomaly = detectAnomaly(registro.ritmo.valor);
            const row = document.createElement('tr');
            
            if (anomaly) {
                row.classList.add(anomaly.type === 'high' ? 'anomaly-high' : 'anomaly-low');
            }
            
            row.innerHTML = `
                <td>${registro.id}</td>
                <td>${registro.dispositivo}</td>
                <td>${registro.ritmo.valor} <span class="grey-text">${registro.ritmo.unidad}</span></td>
                <td>${formatTimestamp(registro.timestamp)}</td>
            `;
            
            tbody.appendChild(row);
        });
    }
});