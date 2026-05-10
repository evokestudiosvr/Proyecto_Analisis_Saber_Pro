/**
 * Shared utility functions and constants for Saber Pro Analytics
 */

const APP_UTILS = {
    // Competency definitions
    competencies: [
        { id: 'comunicacion_escrita', label: 'Comunicación Escrita', shortLabel: 'Com. Escrita', isEnglish: false },
        { id: 'competencias_ciudadanas', label: 'Competencias Ciudadanas', shortLabel: 'Comp. Ciudadanas', isEnglish: false },
        { id: 'razonamiento_cuantitativo', label: 'Razonamiento Cuantitativo', shortLabel: 'Raz. Cuantitativo', isEnglish: false },
        { id: 'ingles', label: 'Inglés', shortLabel: 'Inglés', isEnglish: true },
        { id: 'lectura_critica', label: 'Lectura Crítica', shortLabel: 'Lectura Crítica', isEnglish: false }
    ],

    // Evaluation phases
    phases: ['saber11', 'simulacro1', 'simulacro2', 'simulacro3', 'saberPro'],

    /**
     * Converts a qualitative level string to a numeric value for charting and analysis.
     * @param {string|number} levelStr 
     * @returns {number}
     */
    levelToNumber: (levelStr) => {
        if (levelStr === null || levelStr === undefined) return 0;
        const str = String(levelStr).trim().toUpperCase();
        
        // Generic Levels
        if (str.includes('NIVEL 1')) return 1;
        if (str.includes('NIVEL 2')) return 2;
        if (str.includes('NIVEL 3')) return 3;
        if (str.includes('NIVEL 4')) return 4;
        
        // English Levels
        if (str === '-A1' || str === 'A-') return 0.5;
        if (str === 'A1') return 1;
        if (str === 'A2') return 2;
        if (str === 'B1') return 3;
        if (str === 'B2') return 4;
        if (str === 'B+') return 4.5;
        if (str === 'C1') return 5;
        
        // Quantitative scores
        if (!isNaN(parseFloat(str))) return parseFloat(str);

        return 0;
    },

    /**
     * Flattens a student object into a flat row for Excel export.
     * @param {Object} s Student object
     * @returns {Object} Flat object
     */
    flattenStudentToRow: (s) => {
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
    },

    /**
     * Calculates average of an array of numbers.
     * @param {number[]} arr 
     * @returns {number}
     */
    average: (arr) => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length,

    /**
     * Shows a toast notification.
     * @param {string} msg 
     * @param {string} elementId 
     */
    showToast: (msg, elementId = 'toast') => {
        const toast = document.getElementById(elementId);
        if (toast) {
            toast.textContent = msg;
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 3000);
        }
    }
};
