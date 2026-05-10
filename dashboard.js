document.addEventListener('DOMContentLoaded', () => {
    let studentsData = [];
    let currentStudent = null;
    let evolutionChartInstance = null;
    let radarChartInstance = null;

    const searchInput = document.getElementById('studentSearchInput');
    const searchResults = document.getElementById('searchResults');
    const dashboardContent = document.getElementById('dashboardContent');
    const emptyState = document.getElementById('emptyState');

    // Load data from localStorage or students_data.js
    const storedData = localStorage.getItem('saberProData');
    if (storedData) {
        studentsData = JSON.parse(storedData).filter(s => s.nombres || s.apellidos || s.documento);
    } else if (typeof localStudentsData !== 'undefined') {
        studentsData = localStudentsData.filter(s => s.nombres || s.apellidos || s.documento);
    } else {
        console.error("Error: no se encontraron datos.");
        if (searchInput) {
            searchInput.placeholder = 'Error al cargar datos';
            searchInput.disabled = true;
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            searchResults.innerHTML = '';
            
            if (query.length < 2) {
                searchResults.classList.add('hidden');
                return;
            }

            const filtered = studentsData.filter(s => {
                const fullName = `${s.nombres || ''} ${s.apellidos || ''}`.toLowerCase();
                const doc = String(s.documento || '').toLowerCase();
                return fullName.includes(query) || doc.includes(query);
            }).slice(0, 50);

            if (filtered.length > 0) {
                filtered.forEach(student => {
                    const li = document.createElement('li');
                    li.textContent = `${student.nombres} ${student.apellidos} - C.C. ${student.documento}`;
                    li.addEventListener('click', () => {
                        searchInput.value = `${student.nombres} ${student.apellidos}`;
                        searchResults.classList.add('hidden');
                        renderDashboard(student);
                    });
                    searchResults.appendChild(li);
                });
                searchResults.classList.remove('hidden');
            } else {
                const li = document.createElement('li');
                li.textContent = 'No se encontraron resultados';
                li.className = 'no-results';
                searchResults.appendChild(li);
                searchResults.classList.remove('hidden');
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (searchInput && !searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });

    function renderDashboard(student) {
        currentStudent = student;
        emptyState.classList.add('hidden');
        dashboardContent.classList.remove('hidden');

        document.getElementById('studentName').textContent = `${student.nombres} ${student.apellidos}`;
        document.getElementById('studentDoc').textContent = `Doc: ${student.documento}`;

        const globalScores = student.scores.global;
        document.getElementById('saber11Score').textContent = globalScores.saber11 || 'N/A';

        const simScores = [
            globalScores.simulacro1,
            globalScores.simulacro2,
            globalScores.simulacro3
        ].map(s => parseFloat(s)).filter(s => !isNaN(s));

        let projected = 'N/A';
        if (globalScores.saberPro) {
            projected = Math.round(parseFloat(globalScores.saberPro));
        } else if (simScores.length > 0) {
            const avg = APP_UTILS.average(simScores);
            projected = Math.round(avg * 1.05);
        }
        document.getElementById('projectedScore').textContent = projected;

        updateEvolutionChart(student);
        updateRadarChart(student);
        updateAnalysis(student);
    }

    function updateEvolutionChart(student) {
        const ctx = document.getElementById('evolutionChart').getContext('2d');
        if (evolutionChartInstance) evolutionChartInstance.destroy();

        const global = student.scores.global;
        let s11 = Math.round(parseFloat(global.saber11));
        const normalizedS11 = Math.round(s11 * 300 / 500);

        const dataPoints = [
            normalizedS11,
            global.simulacro1 ? Math.round(parseFloat(global.simulacro1)) : null,
            global.simulacro2 ? Math.round(parseFloat(global.simulacro2)) : null,
            global.simulacro3 ? Math.round(parseFloat(global.simulacro3)) : null,
            global.saberPro ? Math.round(parseFloat(global.saberPro)) : null
        ];

        evolutionChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Saber 11 (Norm.)', 'Simulacro 1', 'Simulacro 2', 'Simulacro 3', 'Saber Pro'],
                datasets: [{
                    label: 'Puntaje Global',
                    data: dataPoints,
                    borderColor: '#00457C',
                    backgroundColor: 'rgba(0, 69, 124, 0.1)',
                    borderWidth: 4,
                    pointBackgroundColor: '#fdf21c',
                    pointBorderColor: '#00457C',
                    pointRadius: 6,
                    fill: true,
                    tension: 0.4,
                    spanGaps: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 300,
                        grid: { color: 'rgba(0, 69, 124, 0.05)' },
                        ticks: { color: '#00457C', font: { weight: 'bold' } }
                    },
                    x: {
                        grid: { color: 'rgba(0, 69, 124, 0.05)' },
                        ticks: { color: '#00457C' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#00457C', font: { weight: 'bold' } }
                    }
                }
            }
        });
    }

    function updateRadarChart(student) {
        const ctx = document.getElementById('radarChart').getContext('2d');
        if (radarChartInstance) radarChartInstance.destroy();

        const sim1Data = APP_UTILS.competencies.map(comp => APP_UTILS.levelToNumber(student.scores[comp.id].simulacro1) || null);
        const sim2Data = APP_UTILS.competencies.map(comp => APP_UTILS.levelToNumber(student.scores[comp.id].simulacro2) || null);
        const sim3Data = APP_UTILS.competencies.map(comp => APP_UTILS.levelToNumber(student.scores[comp.id].simulacro3) || null);
        const spData = APP_UTILS.competencies.map(comp => APP_UTILS.levelToNumber(student.scores[comp.id].saberPro) || null);

        const hasSim1 = sim1Data.some(v => v !== null);
        const hasSim2 = sim2Data.some(v => v !== null);
        const hasSim3 = sim3Data.some(v => v !== null);
        const hasSP = spData.some(v => v !== null);

        const missingPhases = [];
        if (!hasSim1) missingPhases.push('Simulacro 1');
        if (!hasSim2) missingPhases.push('Simulacro 2');
        if (!hasSim3) missingPhases.push('Simulacro 3');
        if (!hasSP) missingPhases.push('Saber Pro');

        let msgEl = document.getElementById('missingPhasesMsg');
        if (!msgEl) {
            const chartContainer = document.getElementById('radarChart').parentElement;
            msgEl = document.createElement('p');
            msgEl.id = 'missingPhasesMsg';
            msgEl.className = 'missing-data-msg';
            chartContainer.appendChild(msgEl);
        }
        msgEl.textContent = missingPhases.length > 0 ? `⚠️ Hacen falta datos de: ${missingPhases.join(', ')}` : '';

        const datasets = [];
        if (hasSim1) datasets.push({ label: 'Simulacro 1', data: sim1Data, backgroundColor: 'rgba(148, 163, 184, 0.1)', borderColor: '#94a3b8', borderWidth: 2 });
        if (hasSim2) datasets.push({ label: 'Simulacro 2', data: sim2Data, backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: '#38bdf8', borderWidth: 2 });
        if (hasSim3) datasets.push({ label: 'Simulacro 3', data: sim3Data, backgroundColor: 'rgba(0, 69, 124, 0.2)', borderColor: '#00457C', borderWidth: 2, pointBackgroundColor: '#00457C' });
        if (hasSP) datasets.push({ label: 'Saber Pro', data: spData, backgroundColor: 'rgba(253, 242, 28, 0.3)', borderColor: '#fdf21c', borderWidth: 3, pointBackgroundColor: '#fdf21c' });

        radarChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: APP_UTILS.competencies.map(c => c.shortLabel),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        min: 0,
                        max: 4,
                        angleLines: { color: 'rgba(0, 69, 124, 0.1)' },
                        grid: { color: 'rgba(0, 69, 124, 0.1)' },
                        pointLabels: { color: '#00457C', font: { size: 12, weight: 'bold' } },
                        ticks: { display: false, stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#00457C', font: { weight: 'bold' } } }
                }
            }
        });
    }

    function updateAnalysis(student) {
        const strengthsList = document.getElementById('strengthsList');
        const weaknessesList = document.getElementById('weaknessesList');
        const recommendationText = document.getElementById('recommendationText');
        
        strengthsList.innerHTML = '';
        weaknessesList.innerHTML = '';

        let strengths = [];
        let weaknesses = [];

        APP_UTILS.competencies.forEach(comp => {
            const studentComp = student.scores[comp.id];
            const levels = [
                APP_UTILS.levelToNumber(studentComp.simulacro1),
                APP_UTILS.levelToNumber(studentComp.simulacro2),
                APP_UTILS.levelToNumber(studentComp.simulacro3)
            ].filter(v => v > 0);

            if (levels.length > 0) {
                const latestLevel = levels[levels.length - 1];
                if (latestLevel >= 3) {
                    strengths.push(`${comp.label} (Nivel ${latestLevel})`);
                    const li = document.createElement('li');
                    li.textContent = `${comp.label}: Nivel sobresaliente.`;
                    strengthsList.appendChild(li);
                } else if (latestLevel <= 2) {
                    weaknesses.push(`${comp.label}`);
                    const li = document.createElement('li');
                    li.textContent = `${comp.label}: Requiere atención (Nivel ${latestLevel}).`;
                    weaknessesList.appendChild(li);
                }
            }
        });

        if (strengths.length === 0) strengthsList.innerHTML = '<li>Aún no hay datos suficientes de fortalezas.</li>';
        if (weaknesses.length === 0) weaknessesList.innerHTML = '<li>Excelente progreso, no hay debilidades críticas.</li>';

        if (weaknesses.length > 0) {
            recommendationText.textContent = `Saber Pro Sergio Arboleda te recomienda enfocar tus sesiones de estudio en los módulos de ${weaknesses.join(' y ')}. Te sugerimos realizar al menos 2 simulacros cortos por semana en estas áreas específicas.`;
        } else if (strengths.length > 0) {
            recommendationText.textContent = `¡Excelente rendimiento! Mantén la práctica constante para asegurar tus resultados en Saber Pro. Sigue afianzando tus conocimientos en ${strengths[0].split(' (')[0]}.`;
        } else {
            recommendationText.textContent = `Sigue practicando en el simulador para que el sistema pueda recolectar más datos y darte recomendaciones personalizadas.`;
        }
    }

    // Exportar Estudiante Individual
    const btnExportStudent = document.getElementById('btnExportStudent');
    if (btnExportStudent) {
        btnExportStudent.addEventListener('click', () => {
            if (!currentStudent) return;
            const flatData = [APP_UTILS.flattenStudentToRow(currentStudent)];
            const ws = XLSX.utils.json_to_sheet(flatData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Análisis de Estudiante");
            XLSX.writeFile(wb, `Analisis_SaberPro_${currentStudent.documento}.xlsx`);
        });
    }

});
