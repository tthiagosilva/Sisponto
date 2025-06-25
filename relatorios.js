// Módulo de Relatórios
class Relatorios {
    constructor() {
        this.currentUser = null;
        this.currentFilter = {
            startDate: "",
            endDate: "",
            type: "all"
        };
        this.allRecords = []; // Armazenar todos os registros para paginação/busca
        this.filteredRecords = [];
        this.paginatedRecords = [];
        this.currentPage = 1;
        this.recordsPerPage = 10;
        this.sortColumn = null;
        this.sortDirection = "asc";
        this.init();
    }

    init() {
        // O refresh inicial será chamado pelo app.js ou auth.js após o login
    }

    async refresh() {
        this.currentUser = window.auth.getCurrentUser(); // Usar window.auth
        if (!this.currentUser) return;

        this.loadRelatoriosContent();
        this.setupEventListeners();
        await this.loadDefaultReport(); // Tornar assíncrono
    }

    loadRelatoriosContent() {
        const relatoriosContent = document.querySelector("#relatorios-section .relatorios-content");
        if (!relatoriosContent) return;

        relatoriosContent.innerHTML = `
            <div class="relatorios-container">
                <!-- Filtros -->
                <div class="filters-card">
                    <h3>Filtros</h3>
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label for="start-date">Data Inicial</label>
                            <input type="date" id="start-date" name="startDate">
                        </div>
                        <div class="filter-group">
                            <label for="end-date">Data Final</label>
                            <input type="date" id="end-date" name="endDate">
                        </div>
                        <div class="filter-group">
                            <label for="report-type">Tipo de Relatório</label>
                            <select id="report-type" name="type">
                                <option value="all">Todos os Registros</option>
                                <option value="daily">Relatório Diário</option>
                                <option value="weekly">Relatório Semanal</option>
                                <option value="monthly">Relatório Mensal</option>
                                <option value="overtime">Horas Extras</option>
                                <option value="absences">Faltas e Atrasos</option>
                            </select>
                        </div>
                        <div class="filter-actions">
                            <button id="apply-filters" class="btn btn-primary">
                                <i class="fas fa-filter"></i>
                                Aplicar Filtros
                            </button>
                            <button id="clear-filters" class="btn btn-secondary">
                                <i class="fas fa-times"></i>
                                Limpar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Resumo do Período -->
                <div class="period-summary">
                    <div class="summary-cards">
                        <div class="summary-card">
                            <div class="summary-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="summary-content">
                                <h4 id="period-total-hours">0h 00min</h4>
                                <p>Total de Horas</p>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-icon">
                                <i class="fas fa-plus-circle"></i>
                            </div>
                            <div class="summary-content">
                                <h4 id="period-overtime">0h 00min</h4>
                                <p>Horas Extras</p>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-icon">
                                <i class="fas fa-calendar-times"></i>
                            </div>
                            <div class="summary-content">
                                <h4 id="period-absences">0</h4>
                                <p>Faltas</p>
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-icon">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <div class="summary-content">
                                <h4 id="period-delays">0</h4>
                                <p>Atrasos</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Ações de Exportação -->
                <div class="export-actions">
                    <button id="export-pdf" class="btn btn-primary">
                        <i class="fas fa-file-pdf"></i>
                        Exportar PDF
                    </button>
                    <button id="export-csv" class="btn btn-secondary">
                        <i class="fas fa-file-csv"></i>
                        Exportar CSV
                    </button>
                    <button id="export-excel" class="btn btn-secondary">
                        <i class="fas fa-file-excel"></i>
                        Exportar Excel
                    </button>
                    <button id="print-report" class="btn btn-secondary">
                        <i class="fas fa-print"></i>
                        Imprimir
                    </button>
                </div>

                <!-- Tabela de Dados -->
                <div class="report-table-container">
                    <div class="table-header">
                        <h3>Registros do Período</h3>
                        <div class="table-controls">
                            <input type="text" id="search-records" placeholder="Buscar registros..." class="search-input">
                            <select id="records-per-page" class="records-select">
                                <option value="10">10 por página</option>
                                <option value="25">25 por página</option>
                                <option value="50">50 por página</option>
                                <option value="100">100 por página</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="table-wrapper">
                        <table id="records-table" class="records-table">
                            <thead>
                                <tr>
                                    <th onclick="window.relatorios.sortTable(\'date\')">
                                        Data <i class="fas fa-sort"></i>
                                    </th>
                                    <th onclick="window.relatorios.sortTable(\'entrada\')">
                                        Entrada <i class="fas fa-sort"></i>
                                    </th>
                                    <th onclick="window.relatorios.sortTable(\'saida_almoco\')">
                                        Saída Almoço <i class="fas fa-sort"></i>
                                    </th>
                                    <th onclick="window.relatorios.sortTable(\'volta_almoco\')">
                                        Volta Almoço <i class="fas fa-sort"></i>
                                    </th>
                                    <th onclick="window.relatorios.sortTable(\'saida\')">
                                        Saída <i class="fas fa-sort"></i>
                                    </th>
                                    <th onclick="window.relatorios.sortTable(\'total_hours\')">
                                        Total <i class="fas fa-sort"></i>
                                    </th>
                                    <th onclick="window.relatorios.sortTable(\'overtime\')">
                                        Extras <i class="fas fa-sort"></i>
                                    </th>
                                    <th onclick="window.relatorios.sortTable(\'status\')">
                                        Status <i class="fas fa-sort"></i>
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="records-tbody">
                                <!-- Dados serão inseridos aqui -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="table-pagination">
                        <div class="pagination-info">
                            <span id="pagination-info">Mostrando 0 de 0 registros</span>
                        </div>
                        <div class="pagination-controls">
                            <button id="prev-page" class="btn btn-sm btn-secondary" disabled>
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <span id="page-numbers"></span>
                            <button id="next-page" class="btn btn-sm btn-secondary" disabled>
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Gráfico de Tendências -->
                <div class="trends-chart">
                    <div class="chart-card">
                        <h3>Tendência de Horas Trabalhadas</h3>
                        <div class="chart-container">
                            <canvas id="trends-chart" width="800" height="300"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Filtros
        document.getElementById("apply-filters")?.addEventListener("click", async () => { // Tornar assíncrono
            await this.applyFilters();
        });

        document.getElementById("clear-filters")?.addEventListener("click", async () => { // Tornar assíncrono
            await this.clearFilters();
        });

        // Exportação
        document.getElementById("export-pdf")?.addEventListener("click", () => {
            this.exportToPDF();
        });

        document.getElementById("export-csv")?.addEventListener("click", () => {
            this.exportToCSV();
        });

        document.getElementById("export-excel")?.addEventListener("click", () => {
            this.exportToExcel();
        });

        document.getElementById("print-report")?.addEventListener("click", () => {
            this.printReport();
        });

        // Busca e paginação
        document.getElementById("search-records")?.addEventListener("input", (e) => {
            this.searchRecords(e.target.value);
        });

        document.getElementById("records-per-page")?.addEventListener("change", (e) => {
            this.changeRecordsPerPage(parseInt(e.target.value));
        });

        // Paginação
        document.getElementById("prev-page")?.addEventListener("click", () => {
            this.previousPage();
        });

        document.getElementById("next-page")?.addEventListener("click", () => {
            this.nextPage();
        });
    }

    async loadDefaultReport() { // Tornar assíncrono
        // Carregar relatório do mês atual por padrão
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        this.currentFilter = {
            startDate: Utils.getDateString(startOfMonth),
            endDate: Utils.getDateString(endOfMonth),
            type: "monthly"
        };

        // Atualizar campos de filtro
        document.getElementById("start-date").value = this.currentFilter.startDate;
        document.getElementById("end-date").value = this.currentFilter.endDate;
        document.getElementById("report-type").value = this.currentFilter.type;

        await this.generateReport(); // Tornar assíncrono
    }

    async applyFilters() { // Tornar assíncrono
        const startDate = document.getElementById("start-date").value;
        const endDate = document.getElementById("end-date").value;
        const type = document.getElementById("report-type").value;

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            notifications.show("error", "Erro nos filtros", "A data inicial deve ser anterior à data final.");
            return;
        }

        this.currentFilter = {
            startDate: startDate,
            endDate: endDate,
            type: type
        };

        await this.generateReport(); // Tornar assíncrono
    }

    async clearFilters() { // Tornar assíncrono
        document.getElementById("start-date").value = "";
        document.getElementById("end-date").value = "";
        document.getElementById("report-type").value = "all";
        
        this.currentFilter = {
            startDate: "",
            endDate: "",
            type: "all"
        };

        await this.generateReport(); // Tornar assíncrono
    }

    async generateReport() { // Tornar assíncrono
        const data = await this.getReportData(); // Tornar assíncrono
        this.updatePeriodSummary(data);
        this.populateTable(data.records);
        await this.createTrendsChart(data.records); // Tornar assíncrono
    }

    async getReportData() { // Tornar assíncrono
        let records = await window.storage.getTimeRecords(this.currentUser.uid); // Usar window.storage e UID

        // Aplicar filtros de data
        if (this.currentFilter.startDate) {
            records = records.filter(r => r.date >= this.currentFilter.startDate);
        }
        if (this.currentFilter.endDate) {
            records = records.filter(r => r.date <= this.currentFilter.endDate);
        }

        // Agrupar registros por data e calcular estatísticas
        const dailyReports = {};
        const dates = [...new Set(records.map(r => r.date))].sort();

        for (const date of dates) { // Usar for...of para await
            dailyReports[date] = await window.storage.getDailyReport(this.currentUser.uid, date); // Usar window.storage e UID
        }

        // Calcular totais
        const summary = {
            totalHours: 0,
            overtimeHours: 0,
            absences: 0,
            delays: 0
        };

        const processedRecords = Object.keys(dailyReports).map(date => {
            const report = dailyReports[date];
            
            summary.totalHours += report.horasTrabalhadas;
            summary.overtimeHours += report.horasExtras;
            
            // Verificar faltas e atrasos
            // Precisamos das configurações para verificar dias úteis
            // Por simplicidade, vamos assumir dias úteis padrão (seg-sex) por enquanto
            // Ou buscar as configurações aqui, mas isso adicionaria mais awaits
            // Para este módulo, vamos simplificar e assumir que o isWorkDay já tem a lógica
            if (Utils.isWorkDay(new Date(date))) {
                if (report.horasTrabalhadas === 0) {
                    summary.absences++;
                } else if (report.entrada) {
                    const entradaMinutes = Utils.timeToMinutes(report.entrada);
                
(Content truncated due to size limit. Use line ranges to read in chunks)