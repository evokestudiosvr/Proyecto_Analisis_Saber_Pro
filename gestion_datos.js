document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicialización de datos
    // Primero intentamos cargar desde localStorage, si no, usamos localStudentsData
    let currentData = [];
    const storedData = localStorage.getItem('saberProData');
    if (storedData) {
        currentData = JSON.parse(storedData);
    } else if (typeof localStudentsData !== 'undefined') {
        currentData = [...localStudentsData];
    } else {
        console.error("No se encontró base de datos.");
    }

    // --- Lógica de Pestañas (Tabs) ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            
            // Update buttons
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update contents
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === target) {
                    content.classList.add('active');
                }
            });
        });
    });

    const competencies = [
        { id: 'comunicacion_escrita', label: 'Comunicación Escrita', isEnglish: false },
        { id: 'competencias_ciudadanas', label: 'Competencias Ciudadanas', isEnglish: false },
        { id: 'razonamiento_cuantitativo', label: 'Razonamiento Cuantitativo', isEnglish: false },
        { id: 'ingles', label: 'Inglés', isEnglish: true },
        { id: 'lectura_critica', label: 'Lectura Crítica', isEnglish: false }
    ];

    const phases = ['saber11', 'simulacro1', 'simulacro2', 'simulacro3', 'saberPro'];

    // 2. Renderizar tabla de competencias
    const tbody = document.getElementById('competenciesBody');
    competencies.forEach(comp => {
        const tr = document.createElement('tr');
        
        const tdLabel = document.createElement('td');
        tdLabel.textContent = comp.label;
        tr.appendChild(tdLabel);

        // Omitimos saber11 para competencias específicas ya que la base de datos actual suele tener null
        phases.slice(1).forEach(phase => {
            const td = document.createElement('td');
            const select = document.createElement('select');
            select.id = `${comp.id}_${phase}`;
            
            let options = '<option value="">(Ninguno)</option>';
            if (comp.isEnglish) {
                options += `
                    <option value="A-">A-</option>
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="B+">B+</option>
                `;
            } else {
                options += `
                    <option value="NIVEL 1">NIVEL 1</option>
                    <option value="NIVEL 2">NIVEL 2</option>
                    <option value="NIVEL 3">NIVEL 3</option>
                    <option value="NIVEL 4">NIVEL 4</option>
                `;
            }
            select.innerHTML = options;
            td.appendChild(select);
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    // 3. Lógica del Buscador
    const searchInput = document.getElementById('searchEditStudent');
    const searchResults = document.getElementById('searchEditResults');

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        searchResults.innerHTML = '';
        
        if (term.length < 2) {
            searchResults.classList.add('hidden');
            return;
        }

        const matches = currentData.filter(s => 
            s.nombres.toLowerCase().includes(term) || 
            s.apellidos.toLowerCase().includes(term) || 
            s.documento.includes(term)
        ).slice(0, 10); // Mostrar máximo 10

        if (matches.length > 0) {
            searchResults.classList.remove('hidden');
            matches.forEach(student => {
                const li = document.createElement('li');
                li.textContent = `${student.nombres} ${student.apellidos} (${student.documento})`;
                li.addEventListener('click', () => {
                    loadStudentIntoForm(student);
                    searchResults.classList.add('hidden');
                    searchInput.value = '';
                });
                searchResults.appendChild(li);
            });
        } else {
            searchResults.classList.add('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            searchResults.classList.add('hidden');
        }
    });

    // 4. Cargar estudiante en el formulario
    function loadStudentIntoForm(student) {
        document.getElementById('docId').value = student.documento || '';
        document.getElementById('nombres').value = student.nombres || '';
        document.getElementById('apellidos').value = student.apellidos || '';
        document.getElementById('promocion').value = student.promocion || '2023-1';

        document.getElementById('global_saber11').value = student.scores.global.saber11 || '';
        document.getElementById('global_simulacro1').value = student.scores.global.simulacro1 || '';
        document.getElementById('global_simulacro2').value = student.scores.global.simulacro2 || '';
        document.getElementById('global_simulacro3').value = student.scores.global.simulacro3 || '';
        document.getElementById('global_saberPro').value = student.scores.global.saberPro || '';

        competencies.forEach(comp => {
            phases.slice(1).forEach(phase => {
                const el = document.getElementById(`${comp.id}_${phase}`);
                if (el) {
                    el.value = student.scores[comp.id]?.[phase] || '';
                }
            });
        });

        document.getElementById('btnDelete').classList.remove('hidden');
        showToast("Datos cargados para edición.");
    }

    // 5. Guardar formulario
    document.getElementById('studentForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const documento = document.getElementById('docId').value.trim();
        const nombres = document.getElementById('nombres').value.trim().toUpperCase();
        const apellidos = document.getElementById('apellidos').value.trim().toUpperCase();

        if (!documento || !nombres || !apellidos) return;

        const parseVal = (val) => val === '' ? null : Math.round(parseFloat(val));

        const newStudent = {
            documento: documento,
            nombres: nombres,
            apellidos: apellidos,
            promocion: document.getElementById('promocion').value,
            scores: {
                global: {
                    saber11: parseVal(document.getElementById('global_saber11').value),
                    simulacro1: parseVal(document.getElementById('global_simulacro1').value),
                    simulacro2: parseVal(document.getElementById('global_simulacro2').value),
                    simulacro3: parseVal(document.getElementById('global_simulacro3').value),
                    saberPro: parseVal(document.getElementById('global_saberPro').value)
                }
            }
        };

        competencies.forEach(comp => {
            newStudent.scores[comp.id] = {
                saber11: null // Usualmente null en la db actual
            };
            phases.slice(1).forEach(phase => {
                const val = document.getElementById(`${comp.id}_${phase}`).value;
                newStudent.scores[comp.id][phase] = val === '' ? null : val;
            });
        });

        // Actualizar o añadir
        const existingIndex = currentData.findIndex(s => s.documento === documento);
        if (existingIndex !== -1) {
            currentData[existingIndex] = newStudent;
            showToast("Registro actualizado correctamente.");
        } else {
            currentData.push(newStudent);
            showToast("Nuevo estudiante agregado correctamente.");
        }

        // Guardar en localStorage
        localStorage.setItem('saberProData', JSON.stringify(currentData));
        
        // Limpiar
        document.getElementById('studentForm').reset();
        document.getElementById('btnDelete').classList.add('hidden');
    });

    document.getElementById('btnCancel').addEventListener('click', () => {
        document.getElementById('studentForm').reset();
        document.getElementById('btnDelete').classList.add('hidden');
    });

    // Eliminar estudiante
    document.getElementById('btnDelete').addEventListener('click', () => {
        const docId = document.getElementById('docId').value.trim();
        if (docId && confirm("¿Estás seguro de que deseas eliminar permanentemente a este estudiante?")) {
            currentData = currentData.filter(s => s.documento !== docId);
            localStorage.setItem('saberProData', JSON.stringify(currentData));
            document.getElementById('studentForm').reset();
            document.getElementById('btnDelete').classList.add('hidden');
            showToast("Estudiante eliminado correctamente.");
        }
    });

    // 6. Utilidades
    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }

    // Exportar Base de Datos Completa (Descargar como Excel)
    document.getElementById('btnExportData').addEventListener('click', () => {
        if (currentData.length === 0) {
            alert("No hay datos para exportar.");
            return;
        }
        
        const flatData = currentData.map(flattenStudentToRow);
        const ws = XLSX.utils.json_to_sheet(flatData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Base de Datos Completa");
        XLSX.writeFile(wb, "base_datos_saberpro.xlsx");
    });

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

    // --- Carga Masiva y Modal ---
    const modal = document.getElementById('excelHelpModal');
    document.getElementById('btnShowHelp').addEventListener('click', () => modal.classList.remove('hidden'));
    document.getElementById('closeModal').addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.add('hidden'); });

    document.getElementById('btnDownloadTemplate').addEventListener('click', () => {
        const headers = ["DOCUMENTO", "NOMBRES", "APELLIDOS", "SABER11", "SIM1_GLOBAL", "SIM2_GLOBAL", "SIM3_GLOBAL", "SABERPRO_GLOBAL", "COMUNICACION_SIM1", "COMUNICACION_SIM2", "COMUNICACION_SIM3", "COMUNICACION_SABERPRO", "CIUDADANAS_SIM1", "CIUDADANAS_SIM2", "CIUDADANAS_SIM3", "CIUDADANAS_SABERPRO", "RAZONAMIENTO_SIM1", "RAZONAMIENTO_SIM2", "RAZONAMIENTO_SIM3", "RAZONAMIENTO_SABERPRO", "INGLES_SIM1", "INGLES_SIM2", "INGLES_SIM3", "INGLES_SABERPRO", "LECTURA_SIM1", "LECTURA_SIM2", "LECTURA_SIM3", "LECTURA_SABERPRO"];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
        XLSX.writeFile(wb, "plantilla_saberpro.xlsx");
    });

    document.getElementById('btnUploadExcel').addEventListener('click', () => {
        const fileInput = document.getElementById('excelFile');
        const file = fileInput.files[0];
        if (!file) {
            alert("Por favor, selecciona un archivo Excel (.xlsx o .xls).");
            return;
        }

        const selectedPromo = document.getElementById('bulkPromocion').value;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet, {defval: null});

                let added = 0;
                let updated = 0;

                rows.forEach(row => {
                    if (!row.DOCUMENTO || !row.NOMBRES || !row.APELLIDOS) return;
                    
                    const docStr = String(row.DOCUMENTO).trim();
                    const newStudent = {
                        documento: docStr,
                        nombres: String(row.NOMBRES).trim(),
                        apellidos: String(row.APELLIDOS).trim(),
                        promocion: selectedPromo,
                        scores: {
                            global: {
                                saber11: row.SABER11 !== null && row.SABER11 !== "" ? Math.round(parseFloat(row.SABER11)) : null,
                                simulacro1: row.SIM1_GLOBAL !== null && row.SIM1_GLOBAL !== "" ? Math.round(parseFloat(row.SIM1_GLOBAL)) : null,
                                simulacro2: row.SIM2_GLOBAL !== null && row.SIM2_GLOBAL !== "" ? Math.round(parseFloat(row.SIM2_GLOBAL)) : null,
                                simulacro3: row.SIM3_GLOBAL !== null && row.SIM3_GLOBAL !== "" ? Math.round(parseFloat(row.SIM3_GLOBAL)) : null,
                                saberPro: row.SABERPRO_GLOBAL !== null && row.SABERPRO_GLOBAL !== "" ? Math.round(parseFloat(row.SABERPRO_GLOBAL)) : null
                            },
                            comunicacion_escrita: { saber11: null, simulacro1: row.COMUNICACION_SIM1 || null, simulacro2: row.COMUNICACION_SIM2 || null, simulacro3: row.COMUNICACION_SIM3 || null, saberPro: row.COMUNICACION_SABERPRO || null },
                            competencias_ciudadanas: { saber11: null, simulacro1: row.CIUDADANAS_SIM1 || null, simulacro2: row.CIUDADANAS_SIM2 || null, simulacro3: row.CIUDADANAS_SIM3 || null, saberPro: row.CIUDADANAS_SABERPRO || null },
                            razonamiento_cuantitativo: { saber11: null, simulacro1: row.RAZONAMIENTO_SIM1 || null, simulacro2: row.RAZONAMIENTO_SIM2 || null, simulacro3: row.RAZONAMIENTO_SIM3 || null, saberPro: row.RAZONAMIENTO_SABERPRO || null },
                            ingles: { saber11: null, simulacro1: row.INGLES_SIM1 || null, simulacro2: row.INGLES_SIM2 || null, simulacro3: row.INGLES_SIM3 || null, saberPro: row.INGLES_SABERPRO || null },
                            lectura_critica: { saber11: null, simulacro1: row.LECTURA_SIM1 || null, simulacro2: row.LECTURA_SIM2 || null, simulacro3: row.LECTURA_SIM3 || null, saberPro: row.LECTURA_SABERPRO || null }
                        }
                    };

                    const existingIndex = currentData.findIndex(s => String(s.documento) === docStr);
                    if (existingIndex !== -1) {
                        currentData[existingIndex] = newStudent;
                        updated++;
                    } else {
                        currentData.push(newStudent);
                        added++;
                    }
                });

                localStorage.setItem('saberProData', JSON.stringify(currentData));
                fileInput.value = '';
                showToast(`Carga masiva completada: ${added} nuevos, ${updated} actualizados.`);
                
            } catch (err) {
                console.error(err);
                alert("Ocurrió un error al leer el archivo Excel. Asegúrate de usar la plantilla descargable.");
            }
        };
        reader.readAsArrayBuffer(file);
    });

});
