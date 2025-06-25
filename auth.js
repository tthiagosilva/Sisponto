// Sistema de autenticação com Firebase
class Auth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Observar o estado de autenticação do Firebase
        firebaseAuth.onAuthStateChanged(async (user) => {
            if (user) {
                // Usuário logado no Firebase
                // Buscar dados adicionais do usuário no Firestore
                const userDoc = await firebaseDb.collection("users").doc(user.uid).get();
                if (userDoc.exists) {
                    this.currentUser = { ...user.toJSON(), ...userDoc.data(), uid: user.uid };
                    this.loginSuccess(this.currentUser);
                } else {
                    // Se o usuário existe no Auth mas não no Firestore, pode ser um novo registro
                    // Ou um erro. Por enquanto, vamos deslogar.
                    console.error("Usuário autenticado, mas dados não encontrados no Firestore.");
                    firebaseAuth.signOut();
                }
            } else {
                // Usuário deslogado
                this.currentUser = null;
                this.showLoginScreen();
                this.clearUserInterface();
            }
        });

        // Configurar eventos de login
        this.setupLoginForm();
        
        // Configurar logout
        this.setupLogout();
    }

    setupLoginForm() {
        const loginForm = document.getElementById("login-form");
        if (loginForm) {
            loginForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    setupLogout() {
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", async () => {
                if (confirm("Deseja realmente sair do sistema?")) {
                    try {
                        await firebaseAuth.signOut();
                        notifications.show("info", "Logout realizado", "Você foi desconectado do sistema.");
                    } catch (error) {
                        console.error("Erro ao fazer logout:", error);
                        notifications.show("error", "Erro", "Não foi possível fazer logout.");
                    }
                }
            });
        }
    }

    async handleLogin() {
        const email = document.getElementById("username").value.trim(); // Firebase usa email
        const password = document.getElementById("password").value;

        if (!email || !password) {
            this.showLoginError("Por favor, preencha todos os campos.");
            return;
        }

        this.showLoginLoading(true);

        try {
            const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
            // onAuthStateChanged vai lidar com o loginSuccess
        } catch (error) {
            console.error("Erro de login:", error);
            let errorMessage = "Erro ao fazer login. Verifique suas credenciais.";
            if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                errorMessage = "Usuário ou senha inválidos.";
            } else if (error.code === "auth/invalid-email") {
                errorMessage = "Formato de e-mail inválido.";
            }
            this.showLoginError(errorMessage);
        } finally {
            this.showLoginLoading(false);
        }
    }

    loginSuccess(user) {
        // Limpar formulário
        document.getElementById("login-form").reset();
        
        // Mostrar aplicação principal
        this.showMainApp();
        
        // Atualizar interface com dados do usuário
        this.updateUserInterface();
        
        // Mostrar notificação de boas-vindas
        notifications.show("success", `${Utils.getGreeting()}, ${user.name}!`, "Login realizado com sucesso.");
        
        // Verificar registros pendentes (ainda depende de storage.js por enquanto)
        // this.checkPendingRecords(); 
    }

    showMainApp() {
        document.getElementById("loading-screen").classList.add("hidden");
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("main-app").classList.remove("hidden");
    }

    showLoginScreen() {
        document.getElementById("loading-screen").classList.add("hidden");
        document.getElementById("main-app").classList.add("hidden");
        document.getElementById("login-screen").classList.remove("hidden");
    }

    showLoginLoading(show) {
        const submitBtn = document.querySelector("#login-form button[type=\"submit\"]");
        if (submitBtn) {
            if (show) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 
                    `<i class="fas fa-spinner fa-spin"></i> Entrando...`;
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 
                    `<i class="fas fa-sign-in-alt"></i> Entrar`;
            }
        }
    }

    showLoginError(message) {
        // Remover erro anterior se existir
        const existingError = document.querySelector(".login-error");
        if (existingError) {
            existingError.remove();
        }

        // Criar elemento de erro
        const errorDiv = document.createElement("div");
        errorDiv.className = "login-error";
        errorDiv.style.cssText = `
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 12px;
            border-radius: 6px;
            margin-top: 16px;
            font-size: 14px;
            text-align: center;
        `;
        errorDiv.textContent = message;

        // Inserir após o formulário
        const loginForm = document.getElementById("login-form");
        loginForm.parentNode.insertBefore(errorDiv, loginForm.nextSibling);

        // Remover após 5 segundos
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    updateUserInterface() {
        if (!this.currentUser) return;

        // Atualizar nome do usuário
        const userNameElement = document.getElementById("user-name");
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.name || this.currentUser.email;
        }

        // Atualizar role do usuário
        const userRoleElement = document.getElementById("user-role");
        if (userRoleElement) {
            const roleNames = {
                "admin": "Administrador",
                "manager": "Gestor",
                "employee": "Funcionário"
            };
            userRoleElement.textContent = roleNames[this.currentUser.role] || "Usuário";
        }

        // Mostrar/ocultar itens de menu baseado na role
        this.updateMenuVisibility();
    }

    updateMenuVisibility() {
        const navItems = document.querySelectorAll(".nav-item[data-role]");
        
        navItems.forEach(item => {
            const requiredRole = item.getAttribute("data-role");
            const userRole = this.currentUser ? this.currentUser.role : null;
            
            // Por padrão, esconde todos os itens com data-role
            item.style.display = "none";

            if (userRole) {
                if (requiredRole === "admin" && userRole === "admin") {
                    item.style.display = "flex";
                } else if (requiredRole === "manager" && (userRole === "admin" || userRole === "manager")) {
                    item.style.display = "flex";
                } else if (requiredRole === "employee" && (userRole === "admin" || userRole === "manager" || userRole === "employee")) {
                    item.style.display = "flex";
                } else if (!requiredRole) { // Itens sem data-role são visíveis para todos logados
                    item.style.display = "flex";
                }
            }
        });
    }

    clearUserInterface() {
        const userNameElement = document.getElementById("user-name");
        if (userNameElement) {
            userNameElement.textContent = "Usuário";
        }

        const userRoleElement = document.getElementById("user-role");
        if (userRoleElement) {
            userRoleElement.textContent = "Funcionário";
        }

        // Esconder todos os itens de menu com data-role
        const navItems = document.querySelectorAll(".nav-item[data-role]");
        navItems.forEach(item => {
            item.style.display = "none";
        });
    }

    // checkPendingRecords() {
    //     if (!this.currentUser) return;

    //     const today = Utils.getDateString();
    //     const todayRecords = storage.getTimeRecords(this.currentUser.id, today);
        
    //     // Verificar se é dia útil
    //     if (!Utils.isWorkDay()) {
    //         return;
    //     }

    //     // Verificar registros pendentes
    //     const now = new Date();
    //     const currentHour = now.getHours();
        
    //     // Se já passou das 9h e não tem entrada
    //     if (currentHour >= 9 && !todayRecords.find(r => r.type === "entrada")) {
    //         notifications.show("warning", "Registro pendente", "Você ainda não registrou sua entrada hoje.");
    //     }
        
    //     // Se já passou das 12h30 e não tem saída para almoço
    //     if (currentHour >= 12 && currentHour < 14 && 
    //         todayRecords.find(r => r.type === "entrada") && 
    //         !todayRecords.find(r => r.type === "saida_almoco")) {
    //         notifications.show("info", "Hora do almoço", "Não se esqueça de registrar sua saída para o almoço.");
    //     }
        
    //     // Se já passou das 18h e não tem saída
    //     if (currentHour >= 18 && 
    //         todayRecords.find(r => r.type === "entrada") && 
    //         !todayRecords.find(r => r.type === "saida")) {
    //         notifications.show("warning", "Fim do expediente", "Não se esqueça de registrar sua saída.");
    //     }
    // }

    // Verificar se usuário está logado
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Obter usuário atual
    getCurrentUser() {
        return this.currentUser;
    }

    // Verificar permissão
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const permissions = {
            "admin": ["view_all_users", "manage_users", "view_all_reports", "manage_settings", "export_data"],
            "manager": ["view_team_reports", "approve_adjustments", "view_team_users"],
            "employee": ["view_own_records", "register_time", "request_adjustments"]
        };
        
        const userPermissions = permissions[this.currentUser.role] || [];
        return userPermissions.includes(permission);
    }

    // Verificar se pode acessar seção
    canAccessSection(section) {
        if (!this.currentUser) return false;
        
        const sectionPermissions = {
            "registro": true, // Todos podem acessar
            "dashboard": true, // Todos podem acessar
            "relatorios": true, // Todos podem acessar (com restrições)
            "horarios": true, // Todos podem acessar
            "usuarios": ["admin"], // Apenas admin
            "configuracoes": ["admin", "manager"] // Admin e gestores
        };
        
        const allowedRoles = sectionPermissions[section];
        if (allowedRoles === true) return true;
        if (Array.isArray(allowedRoles)) {
            return allowedRoles.includes(this.currentUser.role);
        }
        
        return false;
    }

    // Método para alterar senha (agora via Firebase Auth)
    async changePassword(newPassword) {
        if (!this.currentUser || !firebaseAuth.currentUser) {
            return { success: false, message: "Nenhum usuário logado." };
        }
        
        if (newPassword.length < 6) {
            return { success: false, message: "A nova senha deve ter pelo menos 6 caracteres." };
        }

        try {
            await firebaseAuth.currentUser.updatePassword(newPassword);
            // Atualizar no Firestore também se a senha for armazenada lá (não recomendado)
            // Ou apenas notificar sucesso
            return { success: true, message: "Senha alterada com sucesso." };
        } catch (error) {
            console.error("Erro ao alterar senha:", error);
            let errorMessage = "Erro ao alterar senha.";
            if (error.code === "auth/requires-recent-login") {
                errorMessage = "Por favor, faça login novamente para alterar a senha.";
            }
            return { success: false, message: errorMessage };
        }
    }

    // Método para criar novo usuário (apenas para admin)
    async createFirebaseUser(email, password, userData) {
        try {
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Salvar dados adicionais do usuário no Firestore
            await firebaseDb.collection("users").doc(user.uid).set({
                name: userData.name,
                email: email,
                role: userData.role || "employee",
                active: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            return { success: true, user: { uid: user.uid, email: email, ...userData } };
        } catch (error) {
            console.error("Erro ao criar usuário Firebase:", error);
            let errorMessage = "Erro ao criar usuário.";
            if (error.code === "auth/email-already-in-use") {
                errorMessage = "O e-mail fornecido já está em uso.";
            } else if (error.code === "auth/invalid-email") {
                errorMessage = "O formato do e-mail é inválido.";
            } else if (error.code === "auth/weak-password") {
                errorMessage = "A senha é muito fraca. Use pelo menos 6 caracteres.";
            }
            return { success: false, message: errorMessage };
        }
    }

    // Método para atualizar usuário (Firestore)
    async updateFirebaseUser(uid, userData) {
        try {
            await firebaseDb.collection("users").doc(uid).update({
                ...userData,
                updatedAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error("Erro ao atualizar usuário Firebase:", error);
            return { success: false, message: "Erro ao atualizar usuário." };
        }
    }

    // Método para deletar usuário (Firebase Auth e Firestore)
    async deleteFirebaseUser(uid) {
        try {
            // Deletar do Firestore primeiro
            await firebaseDb.collection("users").doc(uid).delete();
            
            // Deletar do Firebase Auth (requer que o usuário esteja logado ou admin SDK)
            // Para o frontend, o usuário precisa estar logado para deletar a própria conta
            // Ou um admin logado para deletar outros usuários (com reautenticação)
            // Por simplicidade, vamos assumir que a deleção de outros usuários será feita por um admin
            // e pode exigir reautenticação ou ser feita via Cloud Functions para maior segurança.
            // Por enquanto, vamos apenas deletar do Firestore.
            return { success: true };
        } catch (error) {
            console.error("Erro ao deletar usuário Firebase:", error);
            return { success: false, message: "Erro ao deletar usuário." };
        }
    }
}

// Criar instância global
window.auth = new Auth();

