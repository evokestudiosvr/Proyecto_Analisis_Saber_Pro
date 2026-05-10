document.addEventListener('DOMContentLoaded', () => {
    let promoEvolutionChartInstance = null;
    let promoRadarChartInstance = null;
    let currentPromoStudents = [];

    // Helper functions
    const levelToNumber = (levelStr) => {
        if (!levelStr) return 0;
        const str = String(levelStr).trim().toUpperCase();
        if (str.includes('NIVEL 1')) return 1;
        if (str.includes('NIVEL 2')) return 2;
        if (str.includes('NIVEL 3')) return 3;
        if (str.includes('NIVEL 4')) return 4;
        if (str === '-A1' || str === 'A-') return 0.5;
        if (str === 'A1') return 1;
        if (str === 'A2') return 2;
        if (str === 'B1') return 3;
        if (str === 'B2') return 4;
        if (str === 'C1') return 5;
        if (!isNaN(parseFloat(str))) return parseFloat(str);
        return 0;
    };

    const average = (arr) => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

    const promoSelect = document.getElementById('promoSelect');
    const promoTitle = document.getElementById('promoTitle');
    const promoSubtitle = document.getElementById('promoSubtitle');
    const promocionContent = document.getElementById('promocionContent');
    const promoEmptyState = document.getElementById('promoEmptyState');
    const emptyStateTitle = document.getElementById('emptyStateTitle');

    function checkAndRender() {
        const selectedPromo = promoSelect.value;
        promoTitle.textContent = `Rendimiento de la Promoción ${selectedPromo}`;
        promoSubtitle.textContent = `Promoción ${selectedPromo}`;

        // Cargar de localStorage o base de datos local
        let studentsData = [];
        const storedData = localStorage.getItem('saberProData');
        if (storedData) {
            studentsData = JSON.parse(storedData);
        } else if (typeof localStudentsData !== 'undefined') {
            studentsData = localStudentsData;
        }

        // Filtrar por la promoción seleccionada (por defecto 2023-1 si no tiene)
        const filteredStudents = studentsData.filter(s => {
            const studentPromo = s.promocion || '2023-1';
            return studentPromo === selectedPromo;
        });

        if (filteredStudents.length > 0) {
            currentPromoStudents = filteredStudents;
            promocionContent.classList.remove('hidden');
            promoEmptyState.classList.add('hidden');
            renderPromotionDashboard(filteredStudents);
        } else {
            currentPromoStudents = [];
            promocionContent.classList.add('hidden');
            promoEmptyState.classList.remove('hidden');
            emptyStateTitle.textContent = `Datos no disponibles (${selectedPromo})`;
        }
    }

    if (promoSelect) {
        promoSelect.addEventListener('change', checkAndRender);
        checkAndRender();
    } else {
        if (typeof localStudentsData !== 'undefined') renderPromotionDashboard(localStudentsData);
    }

    function renderPromotionDashboard(data) {
        // Filter valid students
        const validStudents = data.filter(s => s.nombres || s.apellidos);
        document.getElementById('totalStudents').textContent = `Estudiantes Evaluados: ${validStudents.length}`;

        // Aggregate Global Scores
        let saber11Scores = [];
        let sim1Scores = [];
        let sim2Scores = [];
        let sim3Scores = [];
        let saberProScores = [];
        let projectedScores = [];

        validStudents.forEach(student => {
            const g = student.scores.global;
            
            let s11 = parseFloat(g.saber11);
            if (!isNaN(s11)) saber11Scores.push(s11);

            let s1 = parseFloat(g.simulacro1);
            if (!isNaN(s1)) sim1Scores.push(s1);

            let s2 = parseFloat(g.simulacro2);
            if (!isNaN(s2)) sim2Scores.push(s2);

            let s3 = parseFloat(g.simulacro3);
            if (!isNaN(s3)) sim3Scores.push(s3);

            let sp = parseFloat(g.saberPro);
            if (!isNaN(sp)) {
                saberProScores.push(sp);
                projectedScores.push(sp);
            } else {
                const sims = [s1, s2, s3].filter(v => !isNaN(v));
                if (sims.length > 0) {
                    projectedScores.push((sims.reduce((a,b)=>a+b,0)/sims.length) * 1.05);
                }
            }
        });

        // Basic Info
        document.getElementById('avgSaber11').textContent = saber11Scores.length > 0 ? Math.round(average(saber11Scores)) : 'N/A';
        document.getElementById('avgProjected').textContent = projectedScores.length > 0 ? Math.round(average(projectedScores)) : 'N/A';

        updatePromoEvolutionChart({
            s11: average(saber11Scores),
            s1: average(sim1Scores),
            s2: average(sim2Scores),
            s3: average(sim3Scores),
            sp: average(saberProScores)
        }, saber11Scores.length > 0, saberProScores.length > 0);

        updatePromoRadarChart(validStudents);
        updatePromoAnalysis(validStudents);
    }

    function updatePromoEvolutionChart(avgs, hasS11, hasSP) {
        const ctx = document.getElementById('promoEvolutionChart').getContext('2d');
        if (promoEvolutionChartInstance) promoEvolutionChartInstance.destroy();

        let s11Norm = hasS11 ? Math.round(avgs.s11 * 300 / 500) : null;

        const dataPoints = [
            s11Norm,
            avgs.s1 ? Math.round(avgs.s1) : null,
            avgs.s2 ? Math.round(avgs.s2) : null,
            avgs.s3 ? Math.round(avgs.s3) : null,
            hasSP ? Math.round(avgs.sp) : null
        ];

        promoEvolutionChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Saber 11 (Norm.)', 'Simulacro 1', 'Simulacro 2', 'Simulacro 3', 'Saber Pro'],
                datasets: [{
                    label: 'Promedio Grupal',
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

    function updatePromoRadarChart(validStudents) {
        const ctx = document.getElementById('promoRadarChart').getContext('2d');
        if (promoRadarChartInstance) promoRadarChartInstance.destroy();

        const competencies = [
            { id: 'comunicacion_escrita', label: 'Com. Escrita' },
            { id: 'competencias_ciudadanas', label: 'Comp. Ciudadanas' },
            { id: 'razonamiento_cuantitativo', label: 'Raz. Cuantitativo' },
            { id: 'ingles', label: 'Inglés' },
            { id: 'lectura_critica', label: 'Lectura Crítica' }
        ];

        let sim1Data = [], sim2Data = [], sim3Data = [], spData = [];

        competencies.forEach(comp => {
            let s1Vals = [], s2Vals = [], s3Vals = [], spVals = [];
            validStudents.forEach(student => {
                const scores = student.scores[comp.id];
                let v1 = levelToNumber(scores.simulacro1); if (v1 > 0) s1Vals.push(v1);
                let v2 = levelToNumber(scores.simulacro2); if (v2 > 0) s2Vals.push(v2);
                let v3 = levelToNumber(scores.simulacro3); if (v3 > 0) s3Vals.push(v3);
                let vp = levelToNumber(scores.saberPro); if (vp > 0) spVals.push(vp);
            });
            sim1Data.push(s1Vals.length > 0 ? average(s1Vals) : null);
            sim2Data.push(s2Vals.length > 0 ? average(s2Vals) : null);
            sim3Data.push(s3Vals.length > 0 ? average(s3Vals) : null);
            spData.push(spVals.length > 0 ? average(spVals) : null);
        });

        const hasSim1 = sim1Data.some(v => v !== null);
        const hasSim2 = sim2Data.some(v => v !== null);
        const hasSim3 = sim3Data.some(v => v !== null);
        const hasSP = spData.some(v => v !== null);

        const missingPhases = [];
        if (!hasSim1) missingPhases.push('Simulacro 1');
        if (!hasSim2) missingPhases.push('Simulacro 2');
        if (!hasSim3) missingPhases.push('Simulacro 3');
        if (!hasSP) missingPhases.push('Saber Pro');

        let msgEl = document.getElementById('promoMissingPhasesMsg');
        if (!msgEl) {
            const chartContainer = document.getElementById('promoRadarChart').parentElement;
            msgEl = document.createElement('p');
            msgEl.id = 'promoMissingPhasesMsg';
            msgEl.style.fontSize = '0.85rem';
            msgEl.style.color = '#ef4444';
            msgEl.style.textAlign = 'center';
            msgEl.style.marginTop = '0.5rem';
            msgEl.style.fontWeight = '600';
            chartContainer.appendChild(msgEl);
        }
        msgEl.textContent = missingPhases.length > 0 ? `⚠️ Hacen falta datos de: ${missingPhases.join(', ')}` : '';

        const datasets = [];
        if (hasSim1) datasets.push({ label: 'Simulacro 1', data: sim1Data, backgroundColor: 'rgba(148, 163, 184, 0.1)', borderColor: '#94a3b8', borderWidth: 2 });
        if (hasSim2) datasets.push({ label: 'Simulacro 2', data: sim2Data, backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: '#38bdf8', borderWidth: 2 });
        if (hasSim3) datasets.push({ label: 'Simulacro 3', data: sim3Data, backgroundColor: 'rgba(0, 69, 124, 0.2)', borderColor: '#00457C', borderWidth: 2, pointBackgroundColor: '#00457C' });
        if (hasSP) datasets.push({ label: 'Saber Pro', data: spData, backgroundColor: 'rgba(253, 242, 28, 0.3)', borderColor: '#fdf21c', borderWidth: 3, pointBackgroundColor: '#fdf21c' });

        promoRadarChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: competencies.map(c => c.label),
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

    function updatePromoAnalysis(validStudents) {
        const competencies = [
            { id: 'comunicacion_escrita', label: 'Comunicación Escrita' },
            { id: 'competencias_ciudadanas', label: 'Competencias Ciudadanas' },
            { id: 'razonamiento_cuantitativo', label: 'Razonamiento Cuantitativo' },
            { id: 'ingles', label: 'Inglés' },
            { id: 'lectura_critica', label: 'Lectura Crítica' }
        ];

        let compAverages = [];

        competencies.forEach(comp => {
            let maxLevels = [];
            validStudents.forEach(student => {
                const scores = student.scores[comp.id];
                const levels = [
                    levelToNumber(scores.simulacro1),
                    levelToNumber(scores.simulacro2),
                    levelToNumber(scores.simulacro3)
                ].filter(v => v > 0);
                if (levels.length > 0) {
                    maxLevels.push(Math.max(...levels));
                }
            });
            compAverages.push({
                label: comp.label,
                avg: average(maxLevels)
            });
        });

        const strengthsList = document.getElementById('promoStrengthsList');
        const weaknessesList = document.getElementById('promoWeaknessesList');
        const recommendationText = document.getElementById('promoRecommendationText');
        
        strengthsList.innerHTML = '';
        weaknessesList.innerHTML = '';

        let strengths = [];
        let weaknesses = [];

        // Definimos fortalezas grupal como promedio > 3.0, y debilidad como < 2.5
        compAverages.forEach(c => {
            if (c.avg >= 3.0) {
                strengths.push(c.label);
                const li = document.createElement('li');
                li.innerHTML = `<strong>${c.label}</strong> (Promedio: ${c.avg.toFixed(1)}) - Excelente consolidación grupal.`;
                strengthsList.appendChild(li);
            } else if (c.avg <= 2.5) {
                weaknesses.push(c.label);
                const li = document.createElement('li');
                li.innerHTML = `<strong>${c.label}</strong> (Promedio: ${c.avg.toFixed(1)}) - Rendimiento por debajo de lo esperado.`;
                weaknessesList.appendChild(li);
            }
        });

        if (strengths.length === 0) strengthsList.innerHTML = '<li>Aún no hay competencias en nivel de excelencia (Promedio > 3.0).</li>';
        if (weaknesses.length === 0) weaknessesList.innerHTML = '<li>Excelente progreso general, ninguna competencia está en nivel crítico.</li>';

        // Generar recomendación institucional
        if (weaknesses.length > 0) {
            recommendationText.textContent = `A nivel institucional, se sugiere dirigir esfuerzos de tutorías grupales y talleres de refuerzo intensivo en los módulos de ${weaknesses.join(' y ')}. Esto permitirá equilibrar el rendimiento de la cohorte antes del examen final Saber Pro.`;
        } else if (strengths.length > 0) {
            recommendationText.textContent = `La cohorte presenta un rendimiento muy sólido y parejo. Se recomienda continuar con los simulacros programados y enfocarse en simulaciones de examen real para mejorar la resistencia y gestión del tiempo de los estudiantes.`;
        } else {
            recommendationText.textContent = `Los estudiantes se encuentran en un nivel medio. Se recomienda incrementar la frecuencia de uso del simulador para detectar tendencias más claras en las próximas semanas.`;
        }
    }

    // Exportar Promoción a Excel
    const btnExportPromo = document.getElementById('btnExportPromo');
    if (btnExportPromo) {
        btnExportPromo.addEventListener('click', () => {
            if (currentPromoStudents.length === 0) {
                alert("No hay datos en esta promoción para exportar.");
                return;
            }
            const selectedPromo = promoSelect.value;
            const flatData = currentPromoStudents.map(flattenStudentToRow);
            const ws = XLSX.utils.json_to_sheet(flatData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, `Promoción ${selectedPromo}`);
            XLSX.writeFile(wb, `Analisis_SaberPro_Promocion_${selectedPromo}.xlsx`);
        });
    }

    function flattenStudentToRow(s) {
        return {
            "DOCUMENTO": s.documento,
            "NOMBRES": s.nombres,
            "APELLIDOS": s.apellidos,
            "PROMOCION": s.promocion || '2023-1',
            "SABER11": s.scores.global?.saber11 || '',
            "SIM1_GLOBAL": s.scores.global?.simulacro1 || '',
            "SIM2_GLOBAL": s.scores.global?.simulacro2 || '',
            "SIM3_GLOBAL": s.scores.global?.simulacro3 || '',
            "SABERPRO_GLOBAL": s.scores.global?.saberPro || '',
            "COMUNICACION_SIM1": s.scores.comunicacion_escrita?.simulacro1 || '',
            "COMUNICACION_SIM2": s.scores.comunicacion_escrita?.simulacro2 || '',
            "COMUNICACION_SIM3": s.scores.comunicacion_escrita?.simulacro3 || '',
            "COMUNICACION_SABERPRO": s.scores.comunicacion_escrita?.saberPro || '',
            "CIUDADANAS_SIM1": s.scores.competencias_ciudadanas?.simulacro1 || '',
            "CIUDADANAS_SIM2": s.scores.competencias_ciudadanas?.simulacro2 || '',
            "CIUDADANAS_SIM3": s.scores.competencias_ciudadanas?.simulacro3 || '',
            "CIUDADANAS_SABERPRO": s.scores.competencias_ciudadanas?.saberPro || '',
            "RAZONAMIENTO_SIM1": s.scores.razonamiento_cuantitativo?.simulacro1 || '',
            "RAZONAMIENTO_SIM2": s.scores.razonamiento_cuantitativo?.simulacro2 || '',
            "RAZONAMIENTO_SIM3": s.scores.razonamiento_cuantitativo?.simulacro3 || '',
            "RAZONAMIENTO_SABERPRO": s.scores.razonamiento_cuantitativo?.saberPro || '',
            "INGLES_SIM1": s.scores.ingles?.simulacro1 || '',
            "INGLES_SIM2": s.scores.ingles?.simulacro2 || '',
            "INGLES_SIM3": s.scores.ingles?.simulacro3 || '',
            "INGLES_SABERPRO": s.scores.ingles?.saberPro || '',
            "LECTURA_SIM1": s.scores.lectura_critica?.simulacro1 || '',
            "LECTURA_SIM2": s.scores.lectura_critica?.simulacro2 || '',
            "LECTURA_SIM3": s.scores.lectura_critica?.simulacro3 || '',
            "LECTURA_SABERPRO": s.scores.lectura_critica?.saberPro || ''
        };
    }
});
