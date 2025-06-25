// Sistema de armazenamento usando Firebase Firestore
class Storage {
    constructor() {
        // Não inicializamos dados padrão aqui, pois o Firebase gerencia isso.
        // A inicialização de dados padrão será feita em um método separado ou via Cloud Functions.
    }

    // Métodos para usuários
    async getUsers() {
        try {
            const usersRef = firebaseDb.collection("users");
            const snapshot = await usersRef.get();
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return users;
        } catch (error) {
            console.error("Erro ao buscar usuários do Firestore:", error);
            return [];
        }
    }

    async getUserById(uid) {
        try {
            const userDoc = await firebaseDb.collection("users").doc(uid).get();
            if (userDoc.exists) {
                return { id: userDoc.id, ...userDoc.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error("Erro ao buscar usuário por ID do Firestore:", error);
            return null;
        }
    }

    async getUserByEmail(email) {
        try {
            const usersRef = firebaseDb.collection("users");
            const snapshot = await usersRef.where("email", "==", email).limit(1).get();
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error("Erro ao buscar usuário por email do Firestore:", error);
            return null;
        }
    }

    async addUser(userData) {
        try {
            // userData deve incluir email, name, role, etc.
            // O UID será gerado pelo Firebase Auth e usado como ID do documento no Firestore
            // Este método será chamado após a criação do usuário no Firebase Auth
            const docRef = await firebaseDb.collection("users").doc(userData.uid).set({
                name: userData.name,
                email: userData.email,
                role: userData.role || "employee",
                active: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            return { success: true, id: userData.uid, ...userData };
        } catch (error) {
            console.error("Erro ao adicionar usuário ao Firestore:", error);
            return { success: false, message: error.message };
        }
    }

    async updateUser(uid, userData) {
        try {
            await firebaseDb.collection("users").doc(uid).update({
                ...userData,
                updatedAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error("Erro ao atualizar usuário no Firestore:", error);
            return { success: false, message: error.message };
        }
    }

    async deleteUser(uid) {
        try {
            await firebaseDb.collection("users").doc(uid).delete();
            return { success: true };
        } catch (error) {
            console.error("Erro ao deletar usuário do Firestore:", error);
            return { success: false, message: error.message };
        }
    }

    // Métodos para registros de ponto
    async getTimeRecords(userId = null, date = null) {
        try {
            let recordsRef = firebaseDb.collection("timeRecords");
            if (userId) {
                recordsRef = recordsRef.where("userId", "==", userId);
            }
            if (date) {
                const dateString = typeof date === "string" ? date : Utils.getDateString(date);
                recordsRef = recordsRef.where("date", "==", dateString);
            }
            const snapshot = await recordsRef.orderBy("timestamp").get();
            const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return records;
        } catch (error) {
            console.error("Erro ao buscar registros de ponto do Firestore:", error);
            return [];
        }
    }

    async addTimeRecord(record) {
        try {
            const newRecord = {
                ...record,
                timestamp: new Date().toISOString(),
                date: Utils.getDateString(new Date()),
                createdAt: new Date().toISOString()
            };
            const docRef = await firebaseDb.collection("timeRecords").add(newRecord);
            return { success: true, id: docRef.id, ...newRecord };
        } catch (error) {
            console.error("Erro ao adicionar registro de ponto ao Firestore:", error);
            return { success: false, message: error.message };
        }
    }

    async updateTimeRecord(id, recordData) {
        try {
            await firebaseDb.collection("timeRecords").doc(id).update({
                ...recordData,
                updatedAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error("Erro ao atualizar registro de ponto no Firestore:", error);
            return { success: false, message: error.message };
        }
    }

    async deleteTimeRecord(id) {
        try {
            await firebaseDb.collection("timeRecords").doc(id).delete();
            return { success: true };
        } catch (error) {
            console.error("Erro ao deletar registro de ponto do Firestore:", error);
            return { success: false, message: error.message };
        }
    }

    // Métodos para banco de horas (simplificado para Firestore)
    async getHourBank(userId) {
        try {
            const doc = await firebaseDb.collection("hourBanks").doc(userId).get();
            if (doc.exists) {
                return { id: doc.id, ...doc.data() };
            } else {
                // Retorna um banco de horas padrão se não existir
                return {
                    userId: userId,
                    balance: 0, // em minutos
                    transactions: []
                };
            }
        } catch (error) {
            console.error("Erro ao buscar banco de horas do Firestore:", error);
            return null;
        }
    }

    async updateHourBank(userId, minutes, description = "") {
        try {
            const hourBankRef = firebaseDb.collection("hourBanks").doc(userId);
            const transaction = {
                id: Utils.generateId(),
                date: Utils.getDateString(),
                minutes: minutes,
                description: description,
                timestamp: new Date().toISOString()
            };

            await hourBankRef.set({
                userId: userId,
                balance: firebase.firestore.FieldValue.increment(minutes),
                transactions: firebase.firestore.FieldValue.arrayUnion(transaction)
            }, { merge: true }); // merge: true para não sobrescrever, apenas atualizar ou criar
            return { success: true };
        } catch (error) {
            console.error("Erro ao atualizar banco de horas no Firestore:", error);
            return { success: false, message: error.message };
        }
    }

    // Métodos para configurações
    async getSettings() {
        try {
            const doc = await firebaseDb.collection("settings").doc("appSettings").get();
            if (doc.exists) {
                return doc.data();
            } else {
                // Retorna configurações padrão se não existirem
                return this.getDefaultSettings();
            }
        } catch (error) {
            console.error("Erro ao buscar configurações do Firestore:", error);
            return this.getDefaultSettings();
        }
    }

    async saveSettings(settings) {
        try {
            await firebaseDb.collection("settings").doc("appSettings").set({
                ...settings,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            return { success: true };
        } catch (error) {
            console.error("Erro ao salvar configurações no Firestore:", error);
            return { success: false, message: error.message };
        }
    }

    // Métodos para feriados (dentro de settings)
    async getHolidays() {
        const settings = await this.getSettings();
        return settings ? settings.holidays || [] : [];
    }

    async addHoliday(holiday) {
        const settings = await this.getSettings();
        const currentHolidays = settings.holidays || [];
        const newHoliday = {
            id: Utils.generateId(),
            ...holiday,
            createdAt: new Date().toISOString()
        };
        currentHolidays.push(newHoliday);
        return this.saveSettings({ holidays: currentHolidays });
    }

    async updateHoliday(holiday) {
        const settings = await this.getSettings();
        let currentHolidays = settings.holidays || [];
        const index = currentHolidays.findIndex(h => h.id === holiday.id);
        if (index !== -1) {
            currentHolidays[index] = { ...currentHolidays[index], ...holiday, updatedAt: new Date().toISOString() };
            return this.saveSettings({ holidays: currentHolidays });
        }
        return { success: false, message: "Feriado não encontrado." };
    }

    async deleteHoliday(id) {
        const settings = await this.getSettings();
        let currentHolidays = settings.holidays || [];
        const filteredHolidays = currentHolidays.filter(h => h.id !== id);
        return this.saveSettings({ holidays: filteredHolidays });
    }

    // Métodos para sessão atual (ainda usando localStorage para o currentUser temporariamente)
    // Idealmente, o currentUser viria do onAuthStateChanged do Firebase Auth
    getCurrentUser() {
        // Este método será menos usado agora que o Auth.currentUser é gerenciado pelo Firebase
        return JSON.parse(localStorage.getItem(this.prefix + 'current_user'));
    }

    setCurrentUser(user) {
        // Este método será menos usado agora que o Auth.currentUser é gerenciado pelo Firebase
        return localStorage.setItem(this.prefix + 'current_user', JSON.stringify(user));
    }

    clearCurrentUser() {
        // Este método será menos usado agora que o Auth.currentUser é gerenciado pelo Firebase
        return localStorage.removeItem(this.prefix + 'current_user');
    }

    // Default settings (se não houver no Firestore)
    getDefaultSettings() {
        return {
            workHours: {
                dailyHours: 528, // 8h48min em minutos (44h/semana ÷ 5 dias)
                weeklyHours: 2640, // 44 horas em minutos
                lunchBreak: 30, // 30 minutos
                workDays: [1, 2, 3, 4, 5], // Segunda a sexta
                startTime: '08:00',
                endTime: '17:48',
                lunchStart: '12:00',
                lunchEnd: '12:30'
            },
            overtime: {
                rate50: 1.5, // 50% adicional
                rate100: 2.0, // 100% adicional
                maxDailyHours: 600, // 10 horas máximas por dia
                maxWeeklyHours: 3000 // 50 horas máximas por semana
            },
            notifications: {
                enabled: true,
                forgottenPunch: true,
                overtime: true,
                lateArrival: true,
                earlyDeparture: true
            },
            company: {
                name: 'Empresa LTDA',
                cnpj: '00.000.000/0001-00',
                address: 'Rua das Empresas, 123',
                city: 'São Paulo',
                state: 'SP'
            },
            holidays: []
        };
    }
}

// Criar instância global
window.storage = new Storage();

