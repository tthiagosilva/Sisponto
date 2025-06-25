// Módulo de Horários
class Horarios {
    constructor() {
        this.currentUser = null;
        this.schedules = [];
        this.workSchedule = null;
        this.init();
    }

    init() {
        // O refresh inicial será chamado pelo app.js ou auth.js após o login
    }

    async refresh() { // Tornar assíncrono
        this.currentUser = window.auth.getCurrentUser(); // Usar window.auth
        if (!this.currentUser) return;

        await this.loadWorkSchedule(); // Aguardar
        this.loadHorariosContent();
        this.setupEventListeners();
    }

    async loadWorkSchedule() { // Tornar assíncrono
        const settings = await window.storage.getSettings(); // Usar window.storage
        this.workSchedule = settings ? settings.workHours : window.storage.getDefaultSettings().workHours; // Usar workHours
    }

    loadHorariosContent() {
        const horariosContent = document.querySelector("#horarios-section .horarios-content");
        if (!horariosContent) return;

        horariosContent.innerHTML = `
            <div class="horarios-container">
                <!-- Header -->
                <div class="horarios-header">
                    <div class="header-left">
                        <h3>Gestão de Horários</h3>
                        <p>Configure horários de trabalho e escalas</p>
                    </div>
                    ${this.currentUser.role === "admin" || this.currentUser.role === "manager" ? `
                        <div class="header-actions">
                            <button id="add-schedule-btn" class="btn btn-primary">
                                <i class="fas fa-plus"></i>
                                Nova Escala
                            </button>
                        </div>
                    ` : ""}
                </div>

                <!-- Configuração de Horário Padrão -->
                <div class="work-schedule-card">
                    <h4>Horário de Trabalho Padrão</h4>
                    <div class="schedule-info">
                        <div class="schedule-item">
                            <div class="schedule-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="schedule-details">
                                <h5>Horário de Funcionamento</h5>
                                <p>${this.workSchedule.startTime} às ${this.workSchedule.endTime}</p>
                            </div>
                        </div>
                        
                        <div class="schedule-item">
                            <div class="schedule-icon">
                                <i class="fas fa-utensils"></i>
                            </div>
                            <div class="schedule-details">
                                <h5>Intervalo de Almoço</h5>
                                <p>${this.workSchedule.lunchBreak} minutos</p>
                            </div>
                        </div>
                        
                        <div class="schedule-item">
                            <div class="schedule-icon">
                                <i class="fas fa-calendar-week"></i>
                            </div>
                            <div class="schedule-details">
                                <h5>Carga Horária Semanal</h5>
                                <p>${this.workSchedule.weeklyHours} horas</p>
                            </div>
                        </div>
                        
                        <div class="schedule-item">
                            <div class="schedule-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="schedule-details">
                                <h5>Tolerância para Atrasos</h5>
                                <p>${this.workSchedule.toleranceMinutes} minutos</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="work-days">
                        <h5>Dias de Trabalho</h5>
                        <div class="days-grid">
                            ${this.generateWorkDaysDisplay()}
                        </div>
                    </div>
                </div>

                <!-- Horário do Usuário Atual -->
                <div class="user-schedule-card">
                    <h4>Meu Horário</h4>
                    <div class="current-schedule">
                        ${this.generateUserSchedule()}
                    </div>
                </div>

                <!-- Calendário de Horários -->
                <div class="schedule-calendar">
                    <div class="calendar-header">
                        <h4>Calendário de Horários</h4>
                        <div class="calendar-controls">
                            <button id="prev-month" class="btn-icon">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <span id="current-month">${this.getCurrentMonthYear()}</span>
                            <button id="next-month" class="btn-icon">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    <div class="calendar-grid" id="calendar-grid">
                        ${this.generateCalendar()}
                    </div>
                </div>

                <!-- Estatísticas de Horário -->
                <div class="schedule-stats">
                    <h4>Estatísticas do Mês</h4>
                    <div class="stats-grid">
                        ${this.generateScheduleStats()}
                    </div>
                </div>

                ${this.currentUser.role === "admin" || this.currentUser.role === "manager" ? `
                    <!-- Gestão de Escalas (apenas para admin/manager) -->
                    <div class="schedules-management">
                        <h4>Escalas Especiais</h4>
                        <div class="schedules-list" id="schedules-list">
                            ${this.generateSchedulesList()}
                        </div>
                    </div>
                ` : ""}
            </div>

            <!-- Modal para criar/editar escala -->
            <div id="schedule-modal" class="modal hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Nova Escala</h3>
                        <button class="modal-close" id="close-schedule-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="schedule-form">
                            <div class="form-group">
                                <label for="schedule-name">Nome da Escala</label>
                                <input type="text" id="schedule-name" name="name" required>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="schedule-start-date">Data Inicial</label>
                                    <input type="date" id="schedule-start-date" name="startDate" required>
                                </div>
                                <div class="form-group">
                                    <label for="schedule-end-date">Data Final</label>
                                    <input type="date" id="schedule-end-date" name="endDate" required>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="schedule-start-time">Horário de Entrada</label>
                                    <input type="time" id="schedule-start-time" name="startTime" required>
                                </div>
                                <div class="form-group">
                                    <label for="schedule-end-time">Horário de Saída</label>
                                    <input type="time" id="schedule-end-time" name="endTime" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="schedule-users">Usuários</label>
                                <select id="schedule-users" name="users" multiple>
                                    ${this.generateUsersOptions()}
                                </select>
                                <small>Mantenha Ctrl pressionado para selecionar múltiplos usuários</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="schedule-description">Descrição</label>
                                <textarea id="schedule-description" name="description" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancel-schedule-btn">Cancelar</button>
                        <button type="submit" form="schedule-form" class="btn btn-primary">Salvar</button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Botões de navegação do calendário
        document.getElementById("prev-month")?.addEventListener("click", () => this.navigateMonth(-1));
        document.getElementById("next-month")?.addEventListener("click", () => this.navigateMonth(1));

        // Botão de adicionar escala
        document.getElementById("add-schedule-btn")?.addEventListener("click", () => this.showScheduleModal());

        // Modal
        document.getElementById("close-schedule-modal")?.addEventListener("click", () => this.hideScheduleModal());
        document.getElementById("cancel-schedule-btn")?.addEventListener("click", () => this.hideScheduleModal());
        document.getElementById("schedule-form")?.addEventListener("submit", async (e) => { // Tornar assíncrono
            e.preventDefault();
            await this.saveSchedule(); // Aguardar
        });
        document.getElementById("schedule-modal")?.addEventListener("click", (e) => {
            if (e.target.id === "schedule-modal") {
                this.hideScheduleModal();
            }
        });
    }

    generateWorkDaysDisplay() {
        const dayLabels = {
            "monday": "Seg",
            "tuesday": "Ter",
            "wednesday": "Qua",
            "thursday": "Qui",
            "friday": "Sex",
            "saturday": "Sáb",
            "sunday": "Dom"
        };

        const allDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        
        return allDays.map(day => {
            const isWorkDay = this.workSchedule.workDays.includes(day);
            return `
                <div class="day-badge ${isWorkDay ? "work-day" : "off-day"}">
                    ${dayLabels[day]}
                </div>
            `;
        }).join("");
    }

    generateUserSchedule() {
        const today = new Date();
        const dayName = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        const isWorkDay = this.workSchedule.workDays.includes(dayName);

        if (!isWorkDay) {
            return `
                <div class="schedule-status off-day">
                    <i class="fas fa-calendar-times"></i>
                    <h5>Dia de Folga</h5>
                    <p>Hoje não é um dia de trabalho</p>
                </div>
            `;
        }

        return `
            <div class="schedule-status work-day">
                <i class="fas fa-briefcase"></i>
                <h5>Dia de Trabalho</h5>
                <div class="schedule-times">
                    <div class="time-item">
                        <span class="time-label">Entrada:</span>
                        <span class="time-value">${this.workSchedule.startTime}</span>
                    </div>
                    <div class="time-item">
                        <span class="time-label">Saída:</span>
                        <span class="time-value">${this.workSchedule.endTime}</span>
                    </div>
                    <div class="time-item">
                        <span class="time-label">Almoço:</span>
                        <span class="time-value">${this.workSchedule.lunchBreak} min</span>
                    </div>
                </div>
            </div>
        `;
    }

    getCurrentMonthYear() {
        const now = new Date();
        return now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    }

    async generateCalendar() { // Tornar assíncrono
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        let calendarHTML = `
            <div class="calendar-weekdays">
                <div class="weekday">Dom</div>
                <div class="weekday">Seg</div>
                <div class="weekday">Ter</div>
                <div class="weekday">Qua</div>
                <div class="weekday">Qui</div>
                <div class="weekday">Sex</div>
                <div class="weekday">Sáb</div>
            </div>
            <div class="calendar-days">
        `;

        const settings = await window.storage.getSettings(); // Aguardar
        const workDaysConfig = settings.workHours.workDays;
        const holidays = settings.holidays || [];

        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = currentDate.toDateString() === now.toDateString();
            const isWorkDay = Utils.isWorkDay(currentDate, workDaysConfig); // Passar workDaysConfig
            const isHoliday = holidays.some(h => h.date === Utils.getDateString(currentDate)); // Verificar feriados
            
            let dayClass = "calendar-day";
            if (!isCurrentMonth) dayClass += " other-month";
            if (isToday) dayClass += " today";
            if (isWorkDay && !isHoliday) dayClass += " work-day";
            if (isHoliday) dayClass += " holiday";
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${Utils.getDateString(currentDate)}">
                    <span class="day-number">${currentDate.getDate()}</span>
                    ${isHoliday ? "<i class=\"fas fa-star holiday-icon\"></i>" : ""}
                </div>
            `;
        }

        calendarHTML += "</div>";
        return calendarHTML;
    }

}
