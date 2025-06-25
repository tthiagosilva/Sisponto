// Módulo de Configurações
class Configuracoes {
    constructor() {
        this.currentUser = null;
        this.settings = {};
        this.init();
    }

    init() {
        // O refresh inicial será chamado pelo app.js ou auth.js após o login
    }

    async refresh() { // Tornar assíncrono
        this.currentUser = window.auth.getCurrentUser(); // Usar window.auth
        if (!this.currentUser) return;

        await this.loadSettings(); // Aguardar
        this.loadConfiguracoesContent();
        this.setupEventListeners();
        this.activateTab(this.activeTabId || "schedule-tab"); // Ativar a última aba visitada ou a padrão
    }

    async loadSettings() { // Tornar assíncrono
        this.settings = await window.storage.getSettings(); // Usar window.storage
    }

    getDefaultSettings() {
        return {
            workHours: {
                workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
                startTime: "08:00",
                endTime: "17:00",
                lunchBreak: 60, // minutos
                weeklyHours: 44,
                toleranceMinutes: 15
            },
            notifications: {
                emailNotifications: true,
                browserNotifications: true,
                reminderBeforeEnd: 30,
                overtimeAlert: true,
                absenceAlert: true
            },
            system: {
                theme: "light",
                language: "pt-BR",
                dateFormat: "DD/MM/YYYY",
                timeFormat: "24h",
                autoLogout: 480 // minutos
            },
            holidays: [],
            company: {
                name: "Empresa",
                cnpj: "",
                address: "",
                phone: "",
                email: ""
            }
        };
    }

    loadConfiguracoesContent() {
        const configContent = document.querySelector("#configuracoes-section .configuracoes-content");
        if (!configContent) return;

        configContent.innerHTML = `
            <div class="configuracoes-container">
                <!-- Navegação por abas -->
                <div class="config-tabs">
                    <button class="tab-btn active" data-tab="schedule">
                        <i class="fas fa-clock"></i>
                        Horários
                    </button>
                    <button class="tab-btn" data-tab="notifications">
                        <i class="fas fa-bell"></i>
                        Notificações
                    </button>
                    <button class="tab-btn" data-tab="system">
                        <i class="fas fa-cog"></i>
                        Sistema
                    </button>
                    <button class="tab-btn" data-tab="holidays">
                        <i class="fas fa-calendar"></i>
                        Feriados
                    </button>
                    ${this.currentUser.role === "admin" ? `
                        <button class="tab-btn" data-tab="company">
                            <i class="fas fa-building"></i>
                            Empresa
                        </button>
                    ` : ""}
                </div>

                <!-- Conteúdo das abas -->
                <div class="config-content">
                    <!-- Aba Horários -->
                    <div id="schedule-tab" class="tab-content active">
                        <div class="config-section">
                            <h3>Configurações de Horário</h3>
                            <p>Configure os horários de trabalho e tolerâncias</p>
                            
                            <div class="config-grid">
                                <div class="config-card">
                                    <h4>Horário de Trabalho</h4>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="start-time">Horário de Entrada</label>
                                            <input type="time" id="start-time" value="${this.settings.workHours.startTime}">
                                        </div>
                                        <div class="form-group">
                                            <label for="end-time">Horário de Saída</label>
                                            <input type="time" id="end-time" value="${this.settings.workHours.endTime}">
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="lunch-break">Intervalo de Almoço (minutos)</label>
                                            <input type="number" id="lunch-break" value="${this.settings.workHours.lunchBreak}" min="30" max="120">
                                        </div>
                                        <div class="form-group">
                                            <label for="weekly-hours">Horas Semanais</label>
                                            <input type="number" id="weekly-hours" value="${this.settings.workHours.weeklyHours}" min="20" max="60">
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="tolerance">Tolerância para Atrasos (minutos)</label>
                                        <input type="number" id="tolerance" value="${this.settings.workHours.toleranceMinutes}" min="0" max="30">
                                    </div>
                                </div>

                                <div class="config-card">
                                    <h4>Dias de Trabalho</h4>
                                    <div class="work-days">
                                        ${this.generateWorkDaysCheckboxes()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Aba Notificações -->
                    <div id="notifications-tab" class="tab-content">
                        <div class="config-section">
                            <h3>Configurações de Notificações</h3>
                            <p>Configure como e quando receber notificações</p>
                            
                            <div class="config-grid">
                                <div class="config-card">
                                    <h4>Tipos de Notificação</h4>
                                    <div class="notification-options">
                                        <label class="switch-item">
                                            <input type="checkbox" id="email-notifications" ${this.settings.notifications.emailNotifications ? "checked" : ""}>
                                            <span class="switch"></span>
                                            <span>Notificações por E-mail</span>
                                        </label>
                                        <label class="switch-item">
                                            <input type="checkbox" id="browser-notifications" ${this.settings.notifications.browserNotifications ? "checked" : ""}>
                                            <span class="switch"></span>
                                            <span>Notificações do Navegador</span>
                                        </label>
                                        <label class="switch-item">
                                            <input type="checkbox" id="overtime-alert" ${this.settings.notifications.overtimeAlert ? "checked" : ""}>
                                            <span class="switch"></span>
                                            <span>Alertas de Horas Extras</span>
                                        </label>
                                        <label class="switch-item">
                                            <input type="checkbox" id="absence-alert" ${this.settings.notifications.absenceAlert ? "checked" : ""}>
                                            <span class="switch"></span>
                                            <span>Alertas de Faltas</span>
                                        </label>
                                    </div>
                                </div>

                                <div class="config-card">
                                    <h4>Lembretes</h4>
                                    <div class="form-group">
                                        <label for="reminder-time">Lembrete antes do fim do expediente (minutos)</label>
                                        <input type="number" id="reminder-time" value="${this.settings.notifications.reminderBeforeEnd}" min="0" max="120">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Aba Sistema -->
                    <div id="system-tab" class="tab-content">
                        <div class="config-section">
                            <h3>Configurações do Sistema</h3>
                            <p>Configure a aparência e comportamento do sistema</p>
                            
                            <div class="config-grid">
                                <div class="config-card">
                                    <h4>Aparência</h4>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="theme">Tema</label>
                                            <select id="theme">
                                                <option value="light" ${this.settings.system.theme === "light" ? "selected" : ""}>Claro</option>
                                                <option value="dark" ${this.settings.system.theme === "dark" ? "selected" : ""}>Escuro</option>
                                                <option value="auto" ${this.settings.system.theme === "auto" ? "selected" : ""}>Automático</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label for="language">Idioma</label>
                                            <select id="language">
                                                <option value="pt-BR" ${this.settings.system.language === "pt-BR" ? "selected" : ""}>Português (Brasil)</option>
                                                <option value="en-US" ${this.settings.system.language === "en-US" ? "selected" : ""}>English (US)</option>
                                                <option value="es-ES" ${this.settings.system.language === "es-ES" ? "selected" : ""}>Español</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div class="config-card">
                                    <h4>Formatos</h4>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="date-format">Formato de Data</label>
                                            <select id="date-format">
                                                <option value="DD/MM/YYYY" ${this.settings.system.dateFormat === "DD/MM/YYYY" ? "selected" : ""}>DD/MM/AAAA</option>
                                                <option value="MM/DD/YYYY" ${this.settings.system.dateFormat === "MM/DD/YYYY" ? "selected" : ""}>MM/DD/AAAA</option>
                                                <option value="YYYY-MM-DD" ${this.settings.system.dateFormat === "YYYY-MM-DD" ? "selected" : ""}>AAAA-MM-DD</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label for="time-format">Formato de Hora</label>
                                            <select id="time-format">
                                                <option value="24h" ${this.settings.system.timeFormat === "24h" ? "selected" : ""}>24 horas</option>
                                                <option value="12h" ${this.settings.system.timeFormat === "12h" ? "selected" : ""}>12 horas (AM/PM)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div class="config-card">
                                    <h4>Segurança</h4>
                                    <div class="form-group">
                                        <label for="auto-logout">Logout automático (minutos de inatividade)</label>
                                        <input type="number" id="auto-logout" value="${this.settings.system.autoLogout}" min="30" max="1440">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Aba Feriados -->
                    <div id="holidays-tab" class="tab-content">
                        <div class="config-section">
                            <h3>Gestão de Feriados</h3>
                            <p>Configure os feriados da empresa</p>
                            
                            <div class="holidays-header">
                                <button id="add-holiday-btn" class="btn btn-primary">
                                    <i class="fas fa-plus"></i>
                                    Adicionar Feriado
                                </button>
                                <button id="import-holidays-btn" class="btn btn-secondary">
                                    <i class="fas fa-download"></i>
                                    Importar Feriados Nacionais
                                </button>
                            </div>

                            <div class="holidays-list" id="holidays-list">
                                ${this.generateHolidaysList()}
                            </div>
                        </div>
                    </div>

                    ${this.currentUser.role === "admin" ? `
                        <!-- Aba Empresa -->
                        <div id="company-tab" class="tab-content">
                            <div class="config-section">
                                <h3>Informações da Empresa</h3>
                                <p>Configure os dados da sua empresa</p>
                                
                                <div class="config-card">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="company-name">Nome da Empresa</label>
                                            <input type="text" id="company-name" value="${this.settings.company.name}">
                                        </div>
                                        <div class="form-group">
                                            <label for="company-cnpj">CNPJ</label>
                                            <input type="text" id="company-cnpj" value="${this.settings.company.cnpj}" placeholder="00.0>
                                        </div>
