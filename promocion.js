document.addEventListener('DOMContentLoaded', () => {
    let promoEvolutionChartInstance = null;
    let promoRadarChartInstance = null;
    let currentPromoStudents = [];

    const promoSelect = document.getElementById('promoSelect');
    const promoTitle = document.getElementById('promoTitle');
    const promoSubtitle = document.getElementById('promoSubtitle');
    const promocionContent = document.getElementById('promocionContent');
    const promoEmptyState = document.getElementById('promoEmptyState');
    const emptyStateTitle = document.getElementById('emptyStateTitle');

    function checkAndRender() {
        const selectedPromo = promoSelect ? promoSelect.value : '2023-1';
        if (promoTitle) promoTitle.textContent = `Rendimiento de la Promoción ${selectedPromo}`;
        if (promoSubtitle) promoSubtitle.textContent = `Promoción ${selectedPromo}`;

        let studentsData = [];
        const storedData = localStorage.getItem('saberProData');
        if (storedData) {
            studentsData = JSON.parse(storedData);
        } else if (typeof localStudentsData !== 'undefined') {
            studentsData = localStudentsData;
        }

        const filteredStudents = studentsData.filter(s => {
            const studentPromo = s.promocion || '2023-1';
            return studentPromo === selectedPromo;
        });

        if (filteredStudents.length > 0) {
            currentPromoStudents = filteredStudents;
            if (promocionContent) promocionContent.classList.remove('hidden');
            if (promoEmptyState) promoEmptyState.classList.add('hidden');
            renderPromotionDashboard(filteredStudents);
        } else {
            currentPromoStudents = [];
            if (promocionContent) promocionContent.classList.add('hidden');
            if (promoEmptyState) promoEmptyState.classList.remove('hidden');
            if (emptyStateTitle) emptyStateTitle.textContent = `Datos no disponibles (${selectedPromo})`;
        }
    }

    if (promoSelect) {
        promoSelect.addEventListener('change', checkAndRender);
        checkAndRender();
    } else if (typeof localStudentsData !== 'undefined') {
        renderPromotionDashboard(localStudentsData);
    }

    function renderPromotionDashboard(data) {
        const validStudents = data.filter(s => s.nombres || s.apellidos);
        const totalStudentsEl = document.getElementById('totalStudents');
        if (totalStudentsEl) totalStudentsEl.textContent = `Estudiantes Evaluados: ${validStudents.length}`;

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
                    projectedScores.push(APP_UTILS.average(sims) * 1.05);
                }
            }
        });

        const avgSaber11El = document.getElementById('avgSaber11');
        const avgProjectedEl = document.getElementById('avgProjected');

        if (avgSaber11El) avgSaber11El.textContent = saber11Scores.length > 0 ? Math.round(APP_UTILS.average(saber11Scores)) : 'N/A';
        if (avgProjectedEl) avgProjectedEl.textContent = projectedScores.length > 0 ? Math.round(APP_UTILS.average(projectedScores)) : 'N/A';

        updatePromoEvolutionChart({
            s11: APP_UTILS.average(saber11Scores),
            s1: APP_UTILS.average(sim1Scores),
            s2: APP_UTILS.average(sim2Scores),
            s3: APP_UTILS.average(sim3Scores),
            sp: APP_UTILS.average(saberProScores)
        }, saber11Scores.length > 0, saberProScores.length > 0);

        updatePromoRadarChart(validStudents);
        updatePromoAnalysis(validStudents);
    }

    function updatePromoEvolutionChart(avgs, hasS11, hasSP) {
        const evolutionEl = document.getElementById('promoEvolutionChart');
        if (!evolutionEl) return;
        const ctx = evolutionEl.getContext('2d');
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
        const radarEl = document.getElementById('promoRadarChart');
        if (!radarEl) return;
        const ctx = radarEl.getContext('2d');
        if (promoRadarChartInstance) promoRadarChartInstance.destroy();

        let sim1Data = [], sim2Data = [], sim3Data = [], spData = [];

        APP_UTILS.competencies.forEach(comp => {
            let s1Vals = [], s2Vals = [], s3Vals = [], spVals = [];
            validStudents.forEach(student => {
                const scores = student.scores[comp.id];
                if (scores) {
                    let v1 = APP_UTILS.levelToNumber(scores.simulacro1); if (v1 > 0) s1Vals.push(v1);
                    let v2 = APP_UTILS.levelToNumber(scores.simulacro2); if (v2 > 0) s2Vals.push(v2);
                    let v3 = APP_UTILS.levelToNumber(scores.simulacro3); if (v3 > 0) s3Vals.push(v3);
                    let vp = APP_UTILS.levelToNumber(scores.saberPro); if (vp > 0) spVals.push(vp);
                }
            });
            sim1Data.push(s1Vals.length > 0 ? APP_UTILS.average(s1Vals) : null);
            sim2Data.push(s2Vals.length > 0 ? APP_UTILS.average(s2Vals) : null);
            sim3Data.push(s3Vals.length > 0 ? APP_UTILS.average(s3Vals) : null);
            spData.push(spVals.length > 0 ? APP_UTILS.average(spVals) : null);
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
            const chartContainer = radarEl.parentElement;
            msgEl = document.createElement('p');
            msgEl.id = 'promoMissingPhasesMsg';
            msgEl.className = 'missing-data-msg';
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

    function updatePromoAnalysis(validStudents) {
        let compAverages = [];

        APP_UTILS.competencies.forEach(comp => {
            let maxLevels = [];
            validStudents.forEach(student => {
                const scores = student.scores[comp.id];
                if (scores) {
                    const levels = [
                        APP_UTILS.levelToNumber(scores.simulacro1),
                        APP_UTILS.levelToNumber(scores.simulacro2),
                        APP_UTILS.levelToNumber(scores.simulacro3)
                    ].filter(v => v > 0);
                    if (levels.length > 0) {
                        maxLevels.push(Math.max(...levels));
                    }
                }
            });
            compAverages.push({
                label: comp.label,
                avg: APP_UTILS.average(maxLevels)
            });
        });

        const strengthsList = document.getElementById('promoStrengthsList');
        const weaknessesList = document.getElementById('promoWeaknessesList');
        const recommendationText = document.getElementById('promoRecommendationText');
        
        if (strengthsList) strengthsList.innerHTML = '';
        if (weaknessesList) weaknessesList.innerHTML = '';

        let strengths = [];
        let weaknesses = [];

        compAverages.forEach(c => {
            if (c.avg >= 3.0) {
                strengths.push(c.label);
                if (strengthsList) {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${c.label}</strong> (Promedio: ${c.avg.toFixed(1)}) - Excelente consolidación grupal.`;
                    strengthsList.appendChild(li);
                }
            } else if (c.avg <= 2.5) {
                weaknesses.push(c.label);
                if (weaknessesList) {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${c.label}</strong> (Promedio: ${c.avg.toFixed(1)}) - Rendimiento por debajo de lo esperado.`;
                    weaknessesList.appendChild(li);
                }
            }
        });

        if (strengthsList && strengths.length === 0) strengthsList.innerHTML = '<li>Aún no hay competencias en nivel de excelencia (Promedio > 3.0).</li>';
        if (weaknessesList && weaknesses.length === 0) weaknessesList.innerHTML = '<li>Excelente progreso general, ninguna competencia está en nivel crítico.</li>';

        if (recommendationText) {
            if (weaknesses.length > 0) {
                recommendationText.textContent = `A nivel institucional, se sugiere dirigir esfuerzos de tutorías grupales y talleres de refuerzo intensivo en los módulos de ${weaknesses.join(' y ')}. Esto permitirá equilibrar el rendimiento de la cohorte antes del examen final Saber Pro.`;
            } else if (strengths.length > 0) {
                recommendationText.textContent = `La cohorte presenta un rendimiento muy sólido y parejo. Se recomienda continuar con los simulacros programados y enfocarse en simulaciones de examen real para mejorar la resistencia y gestión del tiempo de los estudiantes.`;
            } else {
                recommendationText.textContent = `Los estudiantes se encuentran en un nivel medio. Se recomienda incrementar la frecuencia de uso del simulador para detectar tendencias más claras en las próximas semanas.`;
            }
        }
    }

    const btnExportPromo = document.getElementById('btnExportPromo');
    if (btnExportPromo) {
        btnExportPromo.addEventListener('click', () => {
            if (currentPromoStudents.length === 0) {
                alert("No hay datos en esta promoción para exportar.");
                return;
            }
            const selectedPromo = promoSelect.value;
            const flatData = currentPromoStudents.map(APP_UTILS.flattenStudentToRow);
            const ws = XLSX.utils.json_to_sheet(flatData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, `Promoción ${selectedPromo}`);
            XLSX.writeFile(wb, `Analisis_SaberPro_Promocion_${selectedPromo}.xlsx`);
        });
    }
});
