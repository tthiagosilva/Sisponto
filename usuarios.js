// Módulo de Gestão de Usuários
class Usuarios {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.currentPage = 1;
        this.usersPerPage = 10;
        this.searchQuery = "";
        this.init();
    }

    init() {
        // O refresh inicial será chamado pelo app.js ou auth.js após o login
    }

    async refresh() { // Tornar assíncrono
        this.currentUser = window.auth.getCurrentUser(); // Usar window.auth
        if (!this.currentUser || this.currentUser.role !== "admin") {
            this.showAccessDenied();
            return;
        }

        this.loadUsuariosContent();
        await this.loadUsers(); // Aguardar o carregamento dos usuários
        this.setupEventListeners();
    }

    showAccessDenied() {
        const usuariosContent = document.querySelector("#usuarios-section .usuarios-content");
        if (!usuariosContent) return;

        usuariosContent.innerHTML = `
            <div class="access-denied">
                <div class="access-denied-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h3>Acesso Negado</h3>
                <p>Você não tem permissão para acessar esta seção.</p>
                <p>Apenas administradores podem gerenciar usuários.</p>
            </div>
        `;
    }

    loadUsuariosContent() {
        const usuariosContent = document.querySelector("#usuarios-section .usuarios-content");
        if (!usuariosContent) return;

        usuariosContent.innerHTML = `
            <div class="usuarios-container">
                <!-- Header com ações -->
                <div class="usuarios-header">
                    <div class="header-left">
                        <h3>Gestão de Usuários</h3>
                        <p>Gerencie usuários e suas permissões no sistema</p>
                    </div>
                    <div class="header-actions">
                        <button id="add-user-btn" class="btn btn-primary">
                            <i class="fas fa-plus"></i>
                            Novo Usuário
                        </button>
                        <button id="export-users-btn" class="btn btn-secondary">
                            <i class="fas fa-download"></i>
                            Exportar
                        </button>
                    </div>
                </div>

                <!-- Filtros e busca -->
                <div class="usuarios-filters">
                    <div class="filter-group">
                        <input type="text" id="search-users" placeholder="Buscar usuários..." class="search-input">
                        <i class="fas fa-search search-icon"></i>
                    </div>
                    <div class="filter-group">
                        <select id="role-filter" class="filter-select">
                            <option value="">Todos os perfis</option>
                            <option value="admin">Administrador</option>
                            <option value="manager">Gestor</option>
                            <option value="employee">Funcionário</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <select id="status-filter" class="filter-select">
                            <option value="">Todos os status</option>
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                        </select>
                    </div>
                </div>

                <!-- Estatísticas -->
                <div class="usuarios-stats">
                    <div class="stat-card">
                        <div class="stat-icon admin">
                            <i class="fas fa-user-shield"></i>
                        </div>
                        <div class="stat-content">
                            <h4 id="admin-count">0</h4>
                            <p>Administradores</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon manager">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <div class="stat-content">
                            <h4 id="manager-count">0</h4>
                            <p>Gestores</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon employee">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="stat-content">
                            <h4 id="employee-count">0</h4>
                            <p>Funcionários</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon total">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <h4 id="total-users">0</h4>
                            <p>Total de Usuários</p>
                        </div>
                    </div>
                </div>

                <!-- Lista de usuários -->
                <div class="usuarios-list">
                    <div class="list-header">
                        <h4>Lista de Usuários</h4>
                        <div class="list-controls">
                            <select id="users-per-page" class="per-page-select">
                                <option value="10">10 por página</option>
                                <option value="25">25 por página</option>
                                <option value="50">50 por página</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="users-grid" id="users-grid">
                        <!-- Usuários serão inseridos aqui -->
                    </div>
                    
                    <div class="pagination" id="users-pagination">
                        <!-- Paginação será inserida aqui -->
                    </div>
                </div>
            </div>

            <!-- Modal para adicionar/editar usuário -->
            <div id="user-modal" class="modal hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-title">Novo Usuário</h3>
                        <button class="modal-close" id="close-user-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="user-form">
                            <input type="hidden" id="user-id">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="user-name">Nome Completo *</label>
                                    <input type="text" id="user-name" name="name" required>
                                </div>
                                <div class="form-group">
                                    <label for="user-email">E-mail *</label>
                                    <input type="email" id="user-email" name="email" required>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="user-username">Nome de Usuário *</label>
                                    <input type="text" id="user-username" name="username" required>
                                </div>
                                <div class="form-group">
                                    <label for="user-role">Perfil *</label>
                                    <select id="user-role" name="role" required>
                                        <option value="">Selecione um perfil</option>
                                        <option value="admin">Administrador</option>
                                        <option value="manager">Gestor</option>
                                        <option value="employee">Funcionário</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="user-password">Senha *</label>
                                    <input type="password" id="user-password" name="password" required>
                                </div>
                                <div class="form-group">
                                    <label for="user-confirm-password">Confirmar Senha *</label>
                                    <input type="password" id="user-confirm-password" name="confirmPassword" required>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="user-department">Departamento</label>
                                    <input type="text" id="user-department" name="department">
                                </div>
                                <div class="form-group">
                                    <label for="user-position">Cargo</label>
                                    <input type="text" id="user-position" name="position">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="user-phone">Telefone</label>
                                    <input type="tel" id="user-phone" name="phone">
                                </div>
                                <div class="form-group">
                                    <label for="user-status">Status</label>
                                    <select id="user-status" name="active">
                                        <option value="true">Ativo</option>
                                        <option value="false">Inativo</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="permissions-section">
                                <h4>Permissões</h4>
                                <div class="permissions-grid">
                                    <label class="permission-item">
                                        <input type="checkbox" name="permissions" value="view_reports">
                                        <span>Visualizar Relatórios</span>
                                    </label>
                                    <label class="permission-item">
                                        <input type="checkbox" name="permissions" value="export_data">
                                        <span>Exportar Dados</span>
                                    </label>
                                    <label class="permission-item">
                                        <input type="checkbox" name="permissions" value="manage_schedules">
                                        <span>Gerenciar Horários</span>
                                    </label>
                                    <label class="permission-item">
                                        <input type="checkbox" name="permissions" value="view_all_users">
                                        <span>Ver Todos os Usuários</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancel-user-btn">Cancelar</button>
                        <button type="submit" form="user-form" class="btn btn-primary" id="save-user-btn">Salvar</button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Botões principais
        document.getElementById("add-user-btn")?.addEventListener("click", () => {
            this.showUserModal();
        });

        document.getElementById("export-users-btn")?.addEventListener("click", () => {
            this.exportUsers();
        });

        // Busca e filtros
        document.getElementById("search-users")?.addEventListener("input", (e) => {
            this.searchQuery = e.target.value;
            this.filterAndDisplayUsers();
        });

        document.getElementById("role-filter")?.addEventListener("change", () => {
            this.filterAndDisplayUsers();
        });

        document.getElementById("status-filter")?.addEventListener("change", () => {
            this.filterAndDisplayUsers();
        });

        document.getElementById("users-per-page")?.addEventListener("change", (e) => {
            this.usersPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.filterAndDisplayUsers();
        });

        // Modal
        document.getElementById("close-user-modal")?.addEventListener("click", () => {
            this.hideUserModal();
        });

        document.getElementById("cancel-user-btn")?.addEventListener("click", () => {
            this.hideUserModal();
        });

        document.getElementById("user-form")?.addEventListener("submit", async (e) => { // Tornar assíncrono
            e.preventDefault();
            await this.saveUser(); // Aguardar
        });

        // Fechar modal clicando fora
        document.getElementById("user-modal")?.addEventListener("click", (e) => {
            if (e.target.id === "user-modal") {
                this.hideUserModal();
            }
        });
    }

    async loadUsers() { // Tornar assíncrono
        this.users = await window.storage.getAllUsers(); // Usar window.storage
        this.updateStats();
        this.filterAndDisplayUsers();
    }

    updateStats() {
        const stats = {
            admin: 0,
            manager: 0,
            employee: 0,
            total: this.users.length
        };

        this.users.forEach(user => {
            if (stats[user.role] !== undefined) {
                stats[user.role]++;
            }
        });

        document.getElementById("admin-count").textContent = stats.admin;
        document.getElementById("manager-count").textContent = stats.manager;
        document.getElementById("employee-count").textContent = stats.employee;
        document.getElementById("total-users").textContent = stats.total;
    }

    filterAndDisplayUsers() {
        let filteredUsers = [...this.users];

        // Aplicar busca
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filteredUsers = filteredUsers.filter(user => 
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.username.toLowerCase().includes(query)
            );
        }

        // Aplicar filtro de perfil
        const roleFilter = document.getElementById("role-filter")?.value;
        if (roleFilter) {
            filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
        }

        // Aplicar filtro de status
    }
}
