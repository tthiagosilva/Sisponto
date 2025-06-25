// Utilitários gerais do sistema
class Utils {
    /**
     * Formata um objeto Date para uma string de data localizada.
     * @param {Date} date - O objeto Date a ser formatado.
     * @param {string} locale - O locale a ser usado (ex: 'pt-BR').
     * @param {object} options - Opções de formatação (ex: { year: 'numeric', month: 'long', day: 'numeric' }).
     * @returns {string}
     */
    static formatDate(date, locale = 'pt-BR', options = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
        if (!(date instanceof Date) || isNaN(date)) {
            date = new Date(date); // Tenta converter se não for Date
            if (isNaN(date)) return ''; // Retorna vazio se a conversão falhar
        }
        return date.toLocaleDateString(locale, options);
    }

    /**
     * Formata um objeto Date para uma string de hora localizada.
     * @param {Date} date - O objeto Date a ser formatado.
     * @param {string} locale - O locale a ser usado (ex: 'pt-BR').
     * @param {object} options - Opções de formatação (ex: { hour: '2-digit', minute: '2-digit' }).
     * @returns {string}
     */
    static formatTime(date, locale = 'pt-BR', options = { hour: '2-digit', minute: '2-digit', second: '2-digit' }) {
        if (!(date instanceof Date) || isNaN(date)) {
            date = new Date(date); // Tenta converter se não for Date
            if (isNaN(date)) return ''; // Retorna vazio se a conversão falhar
        }
        return date.toLocaleTimeString(locale, options);
    }

    /**
     * Formata um objeto Date para uma string de hora curta (HH:MM).
     * @param {Date} date - O objeto Date a ser formatado.
     * @returns {string}
     */
    static formatTimeShort(date) {
        return Utils.formatTime(date, 'pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Converte minutos totais para o formato HH:MM.
     * @param {number} totalMinutes - O número total de minutos.
     * @returns {string}
     */
    static minutesToTime(totalMinutes) {
        if (typeof totalMinutes !== 'number' || isNaN(totalMinutes)) return '--:--';
        const sign = totalMinutes < 0 ? '-' : '';
        const absMinutes = Math.abs(totalMinutes);
        const hours = Math.floor(absMinutes / 60);
        const minutes = absMinutes % 60;
        return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    /**
     * Converte uma string de hora (HH:MM) para minutos totais.
     * @param {string} timeString - A string de hora no formato HH:MM.
     * @returns {number}
     */
    static timeToMinutes(timeString) {
        if (!timeString || typeof timeString !== 'string' || !Utils.isValidTime(timeString)) return 0;
        const [hours, minutes] = timeString.split(':').map(Number);
        return (hours * 60) + minutes;
    }

    /**
     * Calcula a diferença em minutos entre dois horários (HH:MM).
     * @param {string} startTime - O horário de início (HH:MM).
     * @param {string} endTime - O horário de fim (HH:MM).
     * @returns {number} A diferença em minutos.
     */
    static timeDifference(startTime, endTime) {
        const startMinutes = Utils.timeToMinutes(startTime);
        const endMinutes = Utils.timeToMinutes(endTime);
        return endMinutes - startMinutes;
    }

    /**
     * Adiciona minutos a uma string de hora (HH:MM).
     * @param {string} timeString - A string de hora (HH:MM).
     * @param {number} minutesToAdd - Os minutos a serem adicionados.
     * @returns {string}
     */
    static addMinutesToTime(timeString, minutesToAdd) {
        const totalMinutes = Utils.timeToMinutes(timeString) + minutesToAdd;
        return Utils.minutesToTime(totalMinutes);
    }

    /**
     * Verifica se uma data é um dia de trabalho com base nas configurações.
     * @param {Date} date - O objeto Date a ser verificado.
     * @param {Array<string>} workDaysConfig - Array de strings com os dias de trabalho (ex: ['monday', 'tuesday']).
     * @returns {boolean}
     */
    static isWorkDay(date, workDaysConfig) {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = dayNames[date.getDay()];
        return workDaysConfig.includes(dayOfWeek);
    }

    /**
     * Obtém uma string de data no formato YYYY-MM-DD.
     * @param {Date} date - O objeto Date.
     * @returns {string}
     */
    static getDateString(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            date = new Date(date); // Tenta converter se não for Date
            if (isNaN(date)) return ''; // Retorna vazio se a conversão falhar
        }
        return date.toISOString().split('T')[0];
    }

    /**
     * Gera um ID único.
     * @returns {string}
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Implementa a função debounce para otimizar chamadas de função.
     * @param {Function} func - A função a ser 'debounced'.
     * @param {number} wait - O tempo de espera em milissegundos.
     * @returns {Function}
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Valida se uma string está no formato de hora HH:MM.
     * @param {string} timeString - A string a ser validada.
     * @returns {boolean}
     */
    static isValidTime(timeString) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(timeString);
    }

    /**
     * Capitaliza a primeira letra de uma string.
     * @param {string} str - A string a ser capitalizada.
     * @returns {string}
     */
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Escapa caracteres HTML para prevenir ataques XSS.
     * @param {string} text - O texto a ser escapado.
     * @returns {string}
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Obtém uma saudação baseada na hora atual.
     * @returns {string}
     */
    static getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    }

    /**
     * Verifica se uma data é um fim de semana.
     * @param {Date} date - O objeto Date.
     * @returns {boolean}
     */
    static isWeekend(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            date = new Date(date); // Tenta converter se não for Date
            if (isNaN(date)) return false;
        }
        const day = date.getDay();
        return day === 0 || day === 6; // 0 = domingo, 6 = sábado
    }

    /**
     * Remove acentos de uma string.
     * @param {string} str - A string com acentos.
     * @returns {string}
     */
    static removeAccents(str) {
        return str.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    }

    /**
     * Converte uma string para um formato 'slug' (para URLs, IDs, etc.).
     * @param {string} str - A string a ser convertida.
     * @returns {string}
     */
    static toSlug(str) {
        return Utils.removeAccents(str)
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres não alfanuméricos, exceto espaço e hífen
            .trim()
            .replace(/\s+/g, '-') // Substitui espaços por hífens
            .replace(/-+/g, '-'); // Remove hífens duplicados
    }

    /**
     * Formata um número adicionando zeros à esquerda.
     * @param {number} num - O número a ser formatado.
     * @param {number} size - O tamanho total desejado da string.
     * @returns {string}
     */
    static padZero(num, size = 2) {
        return String(num).padStart(size, '0');
    }

    /**
     * Converte um objeto Timestamp do Firebase para um objeto Date.
     * @param {firebase.firestore.Timestamp} timestamp - O objeto Timestamp.
     * @returns {Date}
     */
    static convertTimestampToDate(timestamp) {
        if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
        }
        return null;
    }

    /**
     * Converte um objeto Date para um objeto Timestamp do Firebase.
     * @param {Date} date - O objeto Date.
     * @returns {firebase.firestore.Timestamp}
     */
    static convertDateToTimestamp(date) {
        if (date instanceof Date && !isNaN(date)) {
            return firebase.firestore.Timestamp.fromDate(date);
        }
        return null;
    }
}

// Exportar para uso global
window.Utils = Utils;


