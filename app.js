import { auth as firebaseAuth } from "./firebase-init.js";

// Aplicação principal do Sistema de Ponto Eletrônico
class App {
    constructor() {
        this.currentSection = null;
        this.isInitialized = false;
        this.clockInterval = null;
        this.modules = {}; // Para armazenar instâncias dos módulos
        this.init();
    }

    async init() {
        try {
            // Mostrar tela de carregamento inicial
            this.showLoading();
            
            // Inicializar componentes estáticos
            this.initializeStaticComponents();
            
            // Configurar navegação
            this.setupNavigation();
            
            // Configurar relógio
            this.setupClock();
            
            // Configurar eventos globais
            this.setupGlobalEvents();
            
            // O auth.js já gerencia o onAuthStateChanged e redireciona para login/app
            // A inicialização dos módulos específicos de cada seção será feita após o login
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error("Erro ao inicializar aplicação:", error);
            notifications.show("error", "Erro Crítico", "Erro ao carregar o sistema. Recarregue a página.");
        }
    }

    showLoading() {
        document.getElementById("loading-screen").classList.remove("hidden");
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("main-app").classList.add("hidden");
    }

    initializeStaticComponents() {
        // Ex: inicializar notificações, se não for feito globalmente
        if (!window.notifications) {
            window.notifications = new Notifications();
        }
        console.log("Componentes estáticos inicializados.");
    }

    async initModules() {
        // Inicializa os módulos após o login bem-sucedido
        // Importa dinamicamente para evitar problemas de dependência circular e carregar apenas quando necessário
        const { default: Registro } = await import("./registro.js");
        const { default: Dashboard } = await import("./dashboard.js");
        const { default: Relatorios } = await import("./relatorios.js");
        const { default: Horarios } = await import("./horarios.js");
        const { default: Usuarios } = await import("./usuarios.js");
        const { default: Configuracoes } = await import("./configuracoes.js");

        this.modules.registro = new Registro();
        this.modules.dashboard = new Dashboard();
        this.modules.relatorios = new Relatorios();
        this.modules.horarios = new Horarios();
        this.modules.usuarios = new Usuarios();
        this.modules.configuracoes = new Configuracoes();

        // Define a seção inicial após o login
        this.navigateToSection("registro");
        console.log("Módulos da aplicação inicializados.");
    }

    setupNavigation() {
        const navItems = document.querySelectorAll(".nav-item");
        
        navItems.forEach(item => {
            item.addEventListener("click", (e) => {
                e.preventDefault(); // Previne o comportamento padrão do link
                const section = item.getAttribute("data-section");
                if (section && window.auth.canAccessSection(section)) {
                    this.navigateToSection(section);
                } else if (section) {
                    notifications.show("error", "Acesso Negado", "Você não tem permissão para acessar esta seção.");
                }
            });
        });
    }

    navigateToSection(sectionName) {
        // Verificar permissão (já feito no setupNavigation, mas bom ter aqui também)
        if (!window.auth.canAccessSection(sectionName)) {
            notifications.show("error", "Acesso Negado", "Você não tem permissão para acessar esta seção.");
            return;
        }

        // Atualizar navegação ativa
        document.querySelectorAll(".nav-item").forEach(item => {
            item.classList.remove("active");
        });
        
        const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add("active");
        }

        // Mostrar seção correspondente
        document.querySelectorAll(".content-section").forEach(section => {
            section.classList.remove("active");
        });
        
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add("active");
            this.currentSection = sectionName;
            
            // Carregar conteúdo da seção
            this.loadSectionContent(sectionName);
        }
    }

    async loadSectionContent(sectionName) {
        // Chama o método refresh do módulo correspondente
        if (this.modules[sectionName] && typeof this.modules[sectionName].refresh === "function") {
            try {
                await this.modules[sectionName].refresh();
            } catch (error) {
                console.error(`Erro ao carregar seção ${sectionName}:`, error);
                notifications.show("error", "Erro", `Não foi possível carregar a seção ${Utils.capitalize(sectionName)}.`);
            }
        } else {
            console.warn(`Módulo ${sectionName} não encontrado ou sem método refresh.`);
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
        
        const dateElement = document.getElementById("current-date");
        if (dateElement) {
            dateElement.textContent = Utils.formatDate(now);
        }
        
        const timeElement = document.getElementById("current-time");
        if (timeElement) {
            timeElement.textContent = Utils.formatTime(now);
        }
    }

    setupGlobalEvents() {
        // Atalhos de teclado
        document.addEventListener("keydown", (e) => {
            // Ctrl + L para logout
            if (e.ctrlKey && e.key === "l") {
                e.preventDefault();
                if (window.auth.isLoggedIn()) {
                    window.auth.logout(); // auth.js já tem o método signOut
                }
            }
            
            // Esc para fechar modais
            if (e.key === "Escape") {
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
                if (window.auth.isLoggedIn()) {
                    notifications.show("warning", "Sessão inativa", "Sua sessão será encerrada em breve por inatividade.");
                    
                    setTimeout(() => {
                        window.auth.logout();
                    }, 60000); // 1 minuto de aviso
                }
            }, inactivityTime);
        };
        
        // Eventos que resetam o timer
        ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
        
        resetTimer();
    }

    setupResponsiveEvents() {
        // Toggle sidebar em mobile
        const createMobileMenuButton = () => {
            const header = document.querySelector(".header-left");
            if (header && !header.querySelector(".mobile-menu-btn")) {
                const menuBtn = document.createElement("button");
                menuBtn.className = "mobile-menu-btn";
                menuBtn.innerHTML = 
                    `<i class="fas fa-bars"></i>`;
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
                
                menuBtn.addEventListener("click", () => {
                    const sidebar = document.querySelector(".sidebar");
                    sidebar.classList.toggle("open");
                });
                
                header.insertBefore(menuBtn, header.firstChild);
            }
        };
        
        const updateMobileMenu = () => {
            const menuBtn = document.querySelector(".mobile-menu-btn");
            if (window.innerWidth <= 768) {
                if (menuBtn) menuBtn.style.display = "block";
            } else {
                if (menuBtn) menuBtn.style.display = "none";
                document.querySelector(".sidebar").classList.remove("open");
            }
        };
        
        createMobileMenuButton();
        updateMobileMenu();
        
        window.addEventListener("resize", updateMobileMenu);
        
        // Fechar sidebar ao clicar fora em mobile
        document.addEventListener("click", (e) => {
            if (window.innerWidth <= 768) {
                const sidebar = document.querySelector(".sidebar");
                const menuBtn = document.querySelector(".mobile-menu-btn");
                
                if (!sidebar.contains(e.target) && !menuBtn.contains(e.target) && sidebar.classList.contains("open")) {
                    sidebar.classList.remove("open");
                }
            }
        });
    }

    setupVisibilityChange() {
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) {
                // Página ficou visível
                // Pode ser útil para re-sincronizar dados ou reativar timers
                console.log("Página visível. Reativando...");
                if (window.auth.isLoggedIn() && this.modules.registro) {
                    this.modules.registro.refresh();
                }
            }
        });
    }

    closeAllModals() {
        const modalContainer = document.getElementById("modal-container");
        if (modalContainer) {
            modalContainer.classList.add("hidden");
            modalContainer.innerHTML = ""; // Limpa o conteúdo do modal
        }
    }

    // Métodos para abrir modais (chamados por onclick no HTML)
    async showAddUserModal() {
        if (!window.auth.hasPermission("manage_users")) {
            notifications.show("error", "Acesso Negado", "Você não tem permissão para adicionar usuários.");
            return;
        }
        this.modules.usuarios.showAddUserModal();
    }

    async editUser(userId) {
        if (!window.auth.hasPermission("manage_users")) {
            notifications.show("error", "Acesso Negado", "Você não tem permissão para editar usuários.");
            return;
        }
        this.modules.usuarios.editUser(userId);
    }

    async deleteUser(userId) {
        if (!window.auth.hasPermission("manage_users")) {
            notifications.show("error", "Acesso Negado", "Você não tem permissão para deletar usuários.");
            return;
        }
        this.modules.usuarios.deleteUser(userId);
    }

    async showAddHolidayModal() {
        if (!window.auth.hasPermission("manage_settings")) {
            notifications.show("error", "Acesso Negado", "Você não tem permissão para adicionar feriados.");
            return;
        }
        this.modules.configuracoes.showAddHolidayModal();
    }

    async editHoliday(holidayId) {
        if (!window.auth.hasPermission("manage_settings")) {
            notifications.show("error", "Acesso Negado", "Você não tem permissão para editar feriados.");
            return;
        }
        this.modules.configuracoes.editHoliday(holidayId);
    }

    async deleteHoliday(holidayId) {
        if (!window.auth.hasPermission("manage_settings")) {
            notifications.show("error", "Acesso Negado", "Você não tem permissão para deletar feriados.");
            return;
        }
        this.modules.configuracoes.deleteHoliday(holidayId);
    }

    async showChangePasswordModal() {
        this.modules.usuarios.showChangePasswordModal(); // Pode ser um modal genérico ou no módulo de usuários
    }
}

// Criar instância global da aplicação
window.app = new App();


