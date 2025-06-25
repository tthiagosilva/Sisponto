// Módulo de Dashboard
class Dashboard {
    constructor() {
        this.currentUser = null;
        this.chartInstances = {};
        this.init();
    }

    init() {
        // O refresh inicial será chamado pelo app.js ou auth.js após o login
    }

    async refresh() {
        this.currentUser = window.auth.getCurrentUser(); // Usar window.auth
        if (!this.currentUser) return;

        this.loadDashboardContent();
        await this.updateStatistics(); // Tornar assíncrono
        await this.createCharts(); // Tornar assíncrono
    }

    loadDashboardContent() {
        const dashboardContent = document.querySelector("#dashboard-section .dashboard-content");
        if (!dashboardContent) return;

        dashboardContent.innerHTML = `
            <div class="dashboard-grid">
                <!-- Cards de Estatísticas -->
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="total-hours-month">0h</h3>
                            <p>Horas Este Mês</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-plus-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="overtime-month">0h</h3>
                            <p>Horas Extras</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-piggy-bank"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="hour-bank-balance">0h</h3>
                            <p>Banco de Horas</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="stat-content">
                            <h3 id="attendance-rate">0%</h3>
                            <p>Taxa de Presença</p>
                        </div>
                    </div>
                </div>

                <!-- Gráficos -->
                <div class="charts-row">
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3>Horas Trabalhadas - Últimos 7 Dias</h3>
                            <div class="chart-controls">
                                <select id="period-selector">
                                    <option value="7">Últimos 7 dias</option>
                                    <option value="30">Últimos 30 dias</option>
                                    <option value="90">Últimos 90 dias</option>
                                </select>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="hours-chart" width="400" height="200"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3>Distribuição de Horários</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="schedule-chart" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Resumo Semanal -->
                <div class="weekly-summary">
                    <div class="summary-card">
                        <h3>Resumo da Semana</h3>
                        <div id="weekly-summary-content">
                            <!-- Conteúdo será preenchido dinamicamente -->
                        </div>
                    </div>
                    
                    <div class="summary-card">
                        <h3>Próximos Alertas</h3>
                        <div id="upcoming-alerts">
                            <!-- Alertas serão preenchidos dinamicamente -->
                        </div>
                    </div>
                </div>

                <!-- Atividade Recente -->
                <div class="recent-activity">
                    <div class="activity-card">
                        <h3>Atividade Recente</h3>
                        <div id="recent-activity-list">
                            <!-- Lista será preenchida dinamicamente -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Configurar eventos
        this.setupEventListeners();
    }

    setupEventListeners() {
        const periodSelector = document.getElementById("period-selector");
        if (periodSelector) {
            periodSelector.addEventListener("change", async () => { // Tornar assíncrono
                await this.updateChartsForPeriod(parseInt(periodSelector.value)); // Aguardar
            });
        }
    }

    async updateStatistics() { // Tornar assíncrono
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Obter registros do mês atual
        const monthlyRecords = await this.getMonthlyRecords(currentYear, currentMonth); // Aguardar
        
        // Calcular estatísticas
        const stats = await this.calculateStatistics(monthlyRecords); // Aguardar
        
        // Atualizar elementos da interface
        this.updateStatElements(stats);
    }

    async getMonthlyRecords(year, month) { // Tornar assíncrono
        const allRecords = await window.storage.getTimeRecords(this.currentUser.uid); // Usar window.storage e UID
        return allRecords.filter(record => {
            const recordDate = new Date(record.timestamp);
            return recordDate.getFullYear() === year && recordDate.getMonth() === month;
        });
    }

    async calculateStatistics(records) { // Tornar assíncrono
        const stats = {
            totalHours: 0,
            overtimeHours: 0,
            workDays: 0,
            attendanceRate: 0,
            hourBankBalance: 0
        };

        // Agrupar registros por data
        const recordsByDate = {};
        records.forEach(record => {
            if (!recordsByDate[record.date]) {
                recordsByDate[record.date] = [];
            }
            recordsByDate[record.date].push(record);
        });

        // Calcular horas para cada dia
        for (const date of Object.keys(recordsByDate)) { // Usar for...of para await
            const dayRecords = recordsByDate[date];
            const dayReport = await window.storage.getDailyReport(this.currentUser.uid, date); // Usar window.storage e UID
            
            if (dayReport.horasTrabalhadas > 0) {
                stats.totalHours += dayReport.horasTrabalhadas;
                stats.overtimeHours += dayReport.horasExtras;
                stats.workDays++;
            }
        }

        // Calcular taxa de presença
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const workDaysInMonth = await this.countWorkDaysInMonth(now.getFullYear(), now.getMonth()); // Aguardar
        stats.attendanceRate = workDaysInMonth > 0 ? (stats.workDays / workDaysInMonth) * 100 : 0;

        // Obter saldo do banco de horas
        const hourBank = await window.storage.getHourBank(this.currentUser.uid); // Usar window.storage e UID
        stats.hourBankBalance = hourBank ? hourBank.balance : 0;

        return stats;
    }

    async countWorkDaysInMonth(year, month) { // Tornar assíncrono
        let count = 0;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const settings = await window.storage.getSettings(); // Aguardar
        const workDaysConfig = settings.workHours.workDays;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            if (Utils.isWorkDay(date, workDaysConfig)) { // Passar workDaysConfig
                count++;
            }
        }
        
        return count;
    }

    updateStatElements(stats) {
        const elements = {
            "total-hours-month": Utils.minutesToTime(stats.totalHours),
            "overtime-month": Utils.minutesToTime(stats.overtimeHours),
            "hour-bank-balance": (stats.hourBankBalance >= 0 ? "+" : "") + Utils.minutesToTime(stats.hourBankBalance),
            "attendance-rate": Math.round(stats.attendanceRate) + "%"
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
                
                // Adicionar classes de cor baseadas no valor
                if (id === "hour-bank-balance") {
                    element.className = stats.hourBankBalance >= 0 ? "positive" : "negative";
                }
            }
        });

        // Atualizar resumo semanal
        this.updateWeeklySummary();
        
        // Atualizar alertas
        this.updateUpcomingAlerts();
        
        // Atualizar atividade recente
        this.updateRecentActivity();
    }

    async updateWeeklySummary() { // Tornar assíncrono
        const summaryContent = document.getElementById("weekly-summary-content");
        if (!summaryContent) return;

        const weekData = await this.getWeeklyData(); // Aguardar
        
        summaryContent.innerHTML = `
            <div class="summary-item">
                <span>Dias Trabalhados:</span>
                <span>${weekData.workDays}/5</span>
            </div>
            <div class="summary-item">
                <span>Horas Trabalhadas:</span>
                <span>${Utils.minutesToTime(weekData.totalHours)}</span>
            </div>
            <div class="summary-item">
                <span>Horas Extras:</span>
                <span>${Utils.minutesToTime(weekData.overtimeHours)}</span>
            </div>
            <div class="summary-item">
                <span>Média Diária:</span>
                <span>${Utils.minutesToTime(weekData.workDays > 0 ? weekData.totalHours / weekData.workDays : 0)}</span>
            </div>
        `;
    }

    async getWeeklyData() { // Tornar assíncrono
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1); // Segunda-feira
        
        const weekData = {
            workDays: 0,
            totalHours: 0,
            overtimeHours: 0
        };

        const settings = await window.storage.getSettings(); // Aguardar
        const workDaysConfig = settings.workHours.workDays;

        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            
            if (Utils.isWorkDay(date, workDaysConfig) && date <= now) { // Passar workDaysConfig
                const dateString = Utils.getDateString(date);
                const dayReport = await window.storage.getDailyReport(this.currentUser.uid, dateString); // Aguardar
                
                if (dayReport.horasTrabalhadas > 0) {
                    weekData.workDays++;
                    weekData.totalHours += dayReport.horasTrabalhadas;
                    weekData.overtimeHours += dayReport.horasExtras;
                }
            }
        }

        return weekData;
    }

    async updateUpcomingAlerts() { // Tornar assíncrono
        const alertsContainer = document.getElementById("upcoming-alerts");
        if (!alertsContainer) return;

        const alerts = await this.generateUpcomingAlerts(); // Aguardar
        
        if (alerts.length === 0) {
            alertsContainer.innerHTML = 
                `<div class="no-alerts-card">
                    <i class="fas fa-check-circle"></i>
                    <p>Nenhum alerta pendente</p>
                </div>`;
            return;
        }

        alertsContainer.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <i class="fas ${alert.icon}"></i>
                <div class="alert-content">
                    <strong>${alert.title}</strong>
                    <p>${alert.message}</p>
                </div>
            </div>
        `).join("");
    }

    async generateUpcomingAlerts() { // Tornar assíncrono
        const alerts = [];
        const now = new Date();
        const today = Utils.getDateString(now);
        const todayRecords = await window.storage.getTimeRecords(this.currentUser.uid, today); // Aguardar
        const settings = await window.storage.getSettings(); // Aguardar
        const workDaysConfig = settings.workHours.workDays;

        // Verificar se é dia útil
        if (!Utils.isWorkDay(now, workDaysConfig)) { // Passar workDaysConfig
            return alerts;
        }

        // Alerta de entrada não registrada
        if (now.getHours() >= 9 && !todayRecords.find(r => r.type === "entrada")) {
            alerts.push({
                type: "warning",
                icon: "fa-exclamation-triangle",
                title: "Entrada não registrada",
                message: "Você ainda não registrou sua entrada hoje."
            });
        }

        // Alerta de almoço
        if (now.getHours() >= 12 && now.getHours() < 14 && 
            todayRecords.find(r => r.type === "entrada") && 
            !todayRecords.find(r => r.type === "saida_almoco")) {
            alerts.push({
                type: "info",
                icon: "fa-utensils",
                title: "Hora do almoço",
                message: "Considere registrar sua saída para o almoço."
            });
        }

        // Alerta de horas extras
        const hourBank = await window.storage.getHourBank(this.currentUser.uid); // Aguardar
        if (hourBank.balance < -480) { // Menos de 8 horas negativas
            alerts.push({
                type: "error",
                icon: "fa-clock",
                title: "Déficit de horas",
                message: `Você tem ${Utils.minutesToTime(Math.abs(hourBank.balance))} de déficit no banco de horas.`
            });
        }

        return alerts;
    }

    async updateRecentActivity() { // Tornar assíncrono
        const activityList = document.getElementById("recent-activity-list");
        if (!activityList) return;

        const recentRecords = (await window.storage.getTimeRecords(this.currentUser.uid)) // Aguardar
            .slice(-10)
            .reverse();

        if (recentRecords.length === 0) {
            activityList.innerHTML = 
                `<div class="no-activity-card">
                    <i class="fas fa-history"></i>
                    <p>Nenhuma atividade recente</p>
                </div>`;
            return;
        }

        const typeNames = {
            "entrada": "Entrada",
            "saida_almoco": "Saída Almoço",
            "volta_almoco": "Volta Almoço",
            "saida": "Saída"
        };

    }
}
    
