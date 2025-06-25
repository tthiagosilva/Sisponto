// Aplicação principal do Sistema de Ponto Eletrônico
class App {
    constructor() {
        this.currentSection = 'registro';
        this.isInitialized = false;
        this.clockInterval = null;
        this.init();
    }

    async init() {
        try {
            // Mostrar loading
            this.showLoading();
            
            // Não precisamos mais do sleep, o Firebase onAuthStateChanged vai lidar com o carregamento
            
            // Inicializar componentes
            this.initializeComponents();
            
            // Configurar navegação
            this.setupNavigation();
            
            // Configurar relógio
            this.setupClock();
            
            // Configurar eventos globais
            this.setupGlobalEvents();
            
            // A autenticação agora é gerenciada pelo onAuthStateChanged no auth.js
            // O auth.js vai chamar showMainApp ou showLoginScreen
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
            this.showError('Erro ao carregar o sistema. Recarregue a página.');
        }
    }

    showLoading() {
        document.getElementById('loading-screen').classList.remove('hidden');
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }

    initializeComponents() {
        console.log('Componentes inicializados');
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.getAttribute('data-section');
                if (section && window.auth.canAccessSection(section)) { // Usar window.auth
                    this.navigateToSection(section);
                }
            });
        });
    }

    navigateToSection(sectionName) {
        // Verificar permissão
        if (!window.auth.canAccessSection(sectionName)) { // Usar window.auth
            notifications.show('error', 'Acesso negado', 'Você não tem permissão para acessar esta seção.');
            return;
        }

        // Atualizar navegação ativa
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Mostrar seção correspondente
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Carregar conteúdo da seção se necessário
            this.loadSectionContent(sectionName);
        }
    }

    async loadSectionContent(sectionName) { // Tornar assíncrono
        switch (sectionName) {
            case 'registro':
                if (window.registro) {
                    registro.refresh();
                }
                break;
            case 'dashboard':
                if (window.dashboard) {
                    await dashboard.refresh(); // Aguardar refresh
                }
                break;
            case 'relatorios':
                if (window.relatorios) {
                    await relatorios.refresh(); // Aguardar refresh
                }
                break;
            case 'horarios':
                await this.loadHorariosContent(); // Aguardar carregamento
                break;
            case 'usuarios':
                await this.loadUsuariosContent(); // Aguardar carregamento
                break;
            case 'configuracoes':
                await this.loadConfiguracoesContent(); // Aguardar carregamento
                break;
        }
    }

    setupClock() {
        this.updateClock();
        this.clockInterval = setInterval(() => {
            this.updateClock();
        }, 1000);
    }

    updateClock() {
        const now = new Date();
        
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = Utils.formatDate(now);
        }
        
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = Utils.formatTime(now);
        }
    }

    setupGlobalEvents() {
        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            // Ctrl + L para logout
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                if (window.auth.isLoggedIn()) { // Usar window.auth
                    window.auth.logout(); // Usar window.auth
                }
            }
            
            // Esc para fechar modais
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Detectar inatividade
        this.setupInactivityDetection();
        
        // Configurar responsividade
        this.setupResponsiveEvents();
        
        // Configurar notificações de visibilidade da página
        this.setupVisibilityChange();
    }

    setupInactivityDetection() {
        let inactivityTimer;
        const inactivityTime = 30 * 60 * 1000; // 30 minutos
        
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                if (window.auth.isLoggedIn()) { // Usar window.auth
                    notifications.show('warning', 'Sessão inativa', 'Sua sessão será encerrada em breve por inatividade.');
                    
                    setTimeout(() => {
                        window.auth.logout(); // Usar window.auth
                    }, 60000); // 1 minuto de aviso
                }
            }, inactivityTime);
        };
        
        // Eventos que resetam o timer
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
        
        resetTimer();
    }

    setupResponsiveEvents() {
        // Toggle sidebar em mobile
        const createMobileMenuButton = () => {
            const header = document.querySelector('.header-left');
            if (header && !header.querySelector('.mobile-menu-btn')) {
                const menuBtn = document.createElement('button');
                menuBtn.className = 'mobile-menu-btn';
                menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                menuBtn.style.cssText = `
                    display: none;
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    color: var(--primary-color);
                    cursor: pointer;
                    padding: 8px;
                    margin-right: 12px;
                `;
                
                menuBtn.addEventListener('click', () => {
                    const sidebar = document.querySelector('.sidebar');
                    sidebar.classList.toggle('open');
                });
                
                header.insertBefore(menuBtn, header.firstChild);
            }
        };
        
        const updateMobileMenu = () => {
            const menuBtn = document.querySelector('.mobile-menu-btn');
            if (window.innerWidth <= 768) {
                if (menuBtn) menuBtn.style.display = 'block';
            } else {
                if (menuBtn) menuBtn.style.display = 'none';
                document.querySelector('.sidebar').classList.remove('open');
            }
        };
        
        createMobileMenuButton();
        updateMobileMenu();
        
        window.addEventListener('resize', updateMobileMenu);
        
        // Fechar sidebar ao clicar fora em mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const sidebar = document.querySelector('.sidebar');
                const menuBtn = document.querySelector('.mobile-menu-btn');
                
                if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }

    setupVisibilityChange() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Página ficou oculta
                console.log('Página oculta');
            } else {
                // Página ficou visível
                console.log('Página visível');
                if (window.auth.isLoggedIn() && window.registro) { // Usar window.auth
                    registro.refresh();
                }
            }
        });
    }

    // checkAuthentication() {
    //     // Esta função agora é gerenciada pelo onAuthStateChanged no auth.js
    // }

    closeAllModals() {
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.classList.add('hidden');
            modalContainer.innerHTML = '';
        }
    }

    showError(message) {
        notifications.show('error', 'Erro do Sistema', message);
    }

    // Métodos para carregar conteúdo das seções

    async loadHorariosContent() { // Tornar assíncrono
        const content = document.querySelector('#horarios-section .horarios-content');
        if (!content) return;

        const user = window.auth.getCurrentUser(); // Usar window.auth
        const settings = await window.storage.getSettings(); // Usar window.storage e await
        
        if (!user || !settings) { // Adicionar verificação
            content.innerHTML = '<p>Erro ao carregar dados de horário. Tente novamente.</p>';
            return;
        }

        content.innerHTML = `
            <div class="horarios-grid">
                <div class="horario-card">
                    <h3><i class="fas fa-clock"></i> Horário de Trabalho</h3>
                    <div class="horario-info">
                        <div class="horario-item">
                            <span>Entrada:</span>
                            <span>${settings.workHours.startTime}</span>
                        </div>
                        <div class="horario-item">
                            <span>Saída:</span>
                            <span>${settings.workHours.endTime}</span>
                        </div>
                        <div class="horario-item">
                            <span>Almoço:</span>
                            <span>${settings.workHours.lunchStart} às ${settings.workHours.lunchEnd}</span>
                        </div>
                        <div class="horario-item">
                            <span>Carga Horária Diária:</span>
                            <span>${Utils.minutesToTime(settings.workHours.dailyHours)}</span>
                        </div>
                        <div class="horario-item">
                            <span>Carga Horária Semanal:</span>
                            <span>${Utils.minutesToTime(settings.workHours.weeklyHours)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="banco-horas-card">
                    <h3><i class="fas fa-piggy-bank"></i> Banco de Horas</h3>
                    <div class="banco-info">
                        ${await this.renderBancoHoras(user.uid)} <!-- Passar UID e await -->
                    </div>
                </div>
            </div>
        `;
    }

    async renderBancoHoras(userId) { // Tornar assíncrono
        const hourBank = await window.storage.getHourBank(userId); // Usar window.storage e await
        const balance = hourBank ? hourBank.balance : 0;
        const transactions = hourBank ? hourBank.transactions : [];
        const isPositive = balance >= 0;
        
        return `
            <div class="banco-saldo ${isPositive ? 'positive' : 'negative'}">
                <span>Saldo Atual:</span>
                <span>${isPositive ? '+' : ''}${Utils.minutesToTime(balance)}</span>
            </div>
            <div class="banco-transactions">
                <h4>Últimas Movimentações</h4>
                ${transactions.slice(-5).reverse().map(t => `
                    <div class="transaction-item">
                        <span>${t.date}</span>
                        <span>${t.description}</span>
                        <span class="${t.minutes >= 0 ? 'positive' : 'negative'}">
                            ${t.minutes >= 0 ? '+' : ''}${Utils.minutesToTime(t.minutes)}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async loadUsuariosContent() { // Tornar assíncrono
        if (!window.auth.hasPermission('manage_users')) { // Usar window.auth
            const content = document.querySelector('#usuarios-section .usuarios-content');
            content.innerHTML = '<p>Você não tem permissão para acessar esta seção.</p>';
            return;
        }

        const content = document.querySelector('#usuarios-section .usuarios-content');
        const users = await window.storage.getUsers(); // Usar window.storage e await
        
        content.innerHTML = `
            <div class="usuarios-header">
                <button class="btn btn-primary" onclick="app.showAddUserModal()">
                    <i class="fas fa-plus"></i> Adicionar Usuário
                </button>
            </div>
            
            <div class="usuarios-table">
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th> <!-- Alterado de Usuário para Email -->
                            <th>Departamento</th>
                            <th>Função</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.name}</td>
                                <td>${user.email}</td> <!-- Alterado de username para email -->
                                <td>${user.department || 'N/A'}</td>
                                <td>${this.getRoleName(user.role)}</td>
                                <td>
                                    <span class="status ${user.active ? 'active' : 'inactive'}">
                                        ${user.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-icon" onclick="app.editUser('${user.id}')" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon" onclick="app.deleteUser('${user.id}')" title="Excluir">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getRoleName(role) {
        const roles = {
            'admin': 'Administrador',
            'manager': 'Gestor',
            'employe
(Content truncated due to size limit. Use line ranges to read in chunks)