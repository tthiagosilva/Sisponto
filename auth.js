import { auth as firebaseAuth } from "./firebase-init.js";
import { db as firebaseDb } from "./firebase-init.js";
import { 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut, 
    createUserWithEmailAndPassword, 
    updatePassword 
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

class Auth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Observar o estado de autenticação do Firebase
        onAuthStateChanged(firebaseAuth, async (user) => {
            if (user) {
                // Usuário logado no Firebase
                // Buscar dados adicionais do usuário no Firestore
                const userDoc = await firebaseDb.collection("users").doc(user.uid).get();
                if (userDoc.exists) {
                    this.currentUser = { ...user.toJSON(), ...userDoc.data(), uid: user.uid };
                    this.loginSuccess(this.currentUser);
                } else {
                    // Se o usuário existe no Auth mas não no Firestore, pode ser um novo registro
                    // Ou um erro. Por enquanto, vamos deslogar e pedir para o admin criar o perfil.
                    console.error("Usuário autenticado, mas dados não encontrados no Firestore.");
                    notifications.show("error", "Erro de Perfil", "Seu perfil não foi encontrado. Contate o administrador.");
                    signOut(firebaseAuth);
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
                        await signOut(firebaseAuth);
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
            await signInWithEmailAndPassword(firebaseAuth, email, password);
            // onAuthStateChanged vai lidar com o loginSuccess
        } catch (error) {
            console.error("Erro de login:", error);
            let errorMessage = "Erro ao fazer login. Verifique suas credenciais.";
            if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                errorMessage = "Usuário ou senha inválidos.";
            } else if (error.code === "auth/invalid-email") {
                errorMessage = "Formato de e-mail inválido.";
            } else if (error.code === "auth/too-many-requests") {
                errorMessage = "Muitas tentativas de login. Tente novamente mais tarde.";
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
        
        // Inicializar módulos após login
        window.app.initModules();
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

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

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

    async changePassword(newPassword) {
        if (!this.currentUser || !firebaseAuth.currentUser) {
            return { success: false, message: "Nenhum usuário logado." };
        }
        
        if (newPassword.length < 6) {
            return { success: false, message: "A nova senha deve ter pelo menos 6 caracteres." };
        }

        try {
            await updatePassword(firebaseAuth.currentUser, newPassword);
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

    async createFirebaseUser(email, password, userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
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

    async deleteFirebaseUser(uid) {
        try {
            // Deletar do Firestore primeiro
            await firebaseDb.collection("users").doc(uid).delete();
            
            // Para deletar do Firebase Auth, é mais complexo no frontend
            // Requer que o usuário esteja logado ou um admin SDK
            // Para simplicidade, a deleção do Auth pode ser feita manualmente no console
            // ou via Cloud Functions para produção.
            
            return { success: true };
        } catch (error) {
            console.error("Erro ao deletar usuário Firebase:", error);
            return { success: false, message: "Erro ao deletar usuário." };
        }
    }
}

// Criar instância global
window.auth = new Auth();


