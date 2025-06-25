// Módulo de Registro de Ponto
class Registro {
    constructor() {
        this.currentUser = null;
        this.todayRecords = [];
        this.currentStatus = 'fora'; // fora, trabalhando, almoco
        this.init();
    }

    init() {
        this.setupEventListeners();
        // O refresh inicial será chamado pelo app.js ou auth.js após o login
    }

    setupEventListeners() {
        // Botões de registro
        document.getElementById('btn-entrada')?.addEventListener('click', async () => {
            await this.registrarPonto('entrada');
        });

        document.getElementById('btn-saida-almoco')?.addEventListener('click', async () => {
            await this.registrarPonto('saida_almoco');
        });

        document.getElementById('btn-volta-almoco')?.addEventListener('click', async () => {
            await this.registrarPonto('volta_almoco');
        });

        document.getElementById('btn-saida')?.addEventListener('click', async () => {
            await this.registrarPonto('saida');
        });
    }

    async refresh() {
        this.currentUser = window.auth.getCurrentUser(); // Usar window.auth
        if (!this.currentUser) return;

        await this.loadTodayRecords(); // Tornar assíncrono
        this.updateInterface();
        this.updateButtonStates();
        await this.updateSummary(); // Tornar assíncrono
    }

    async loadTodayRecords() {
        const today = Utils.getDateString();
        this.todayRecords = await window.storage.getTimeRecords(this.currentUser.uid, today); // Usar window.storage e UID
        this.updateCurrentStatus();
    }

    updateCurrentStatus() {
        const lastRecord = this.todayRecords[this.todayRecords.length - 1];
        
        if (!lastRecord) {
            this.currentStatus = 'fora';
        } else {
            switch (lastRecord.type) {
                case 'entrada':
                    this.currentStatus = 'trabalhando';
                    break;
                case 'saida_almoco':
                    this.currentStatus = 'almoco';
                    break;
                case 'volta_almoco':
                    this.currentStatus = 'trabalhando';
                    break;
                case 'saida':
                    this.currentStatus = 'fora';
                    break;
                default:
                    this.currentStatus = 'fora';
            }
        }
    }

    updateInterface() {
        this.updateStatusIndicator();
        this.updateLastRecord();
        this.updateTodayRecordsList();
    }

    updateStatusIndicator() {
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        
        if (!statusIndicator || !statusText) return;

        // Remover classes anteriores
        statusIndicator.classList.remove('working', 'break');
        
        switch (this.currentStatus) {
            case 'trabalhando':
                statusIndicator.classList.add('working');
                statusText.textContent = 'Trabalhando';
                break;
            case 'almoco':
                statusIndicator.classList.add('break');
                statusText.textContent = 'Em intervalo';
                break;
            case 'fora':
            default:
                statusText.textContent = 'Fora do expediente';
                break;
        }
    }

    updateLastRecord() {
        const lastRegistroElement = document.getElementById('last-registro');
        if (!lastRegistroElement) return;

        const lastRecord = this.todayRecords[this.todayRecords.length - 1];
        
        if (lastRecord) {
            const typeNames = {
                'entrada': 'Entrada',
                'saida_almoco': 'Saída Almoço',
                'volta_almoco': 'Volta Almoço',
                'saida': 'Saída'
            };
            
            lastRegistroElement.textContent = `Último registro: ${typeNames[lastRecord.type]} às ${lastRecord.time}`;
        } else {
            lastRegistroElement.textContent = 'Último registro: --:--';
        }
    }

    updateTodayRecordsList() {
        const registrosContainer = document.getElementById('registros-hoje');
        if (!registrosContainer) return;

        if (this.todayRecords.length === 0) {
            registrosContainer.innerHTML = '<p class="no-records">Nenhum registro hoje</p>';
            return;
        }

        const typeNames = {
            'entrada': 'Entrada',
            'saida_almoco': 'Saída Almoço',
            'volta_almoco': 'Volta Almoço',
            'saida': 'Saída'
        };

        registrosContainer.innerHTML = this.todayRecords.map(record => `
            <div class="registro-item">
                <span class="registro-tipo">${typeNames[record.type]}</span>
                <span class="registro-horario">${record.time}</span>
            </div>
        `).join('');
    }

    updateButtonStates() {
        const buttons = {
            entrada: document.getElementById('btn-entrada'),
            saidaAlmoco: document.getElementById('btn-saida-almoco'),
            voltaAlmoco: document.getElementById('btn-volta-almoco'),
            saida: document.getElementById('btn-saida')
        };

        // Resetar todos os botões
        Object.values(buttons).forEach(btn => {
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('disabled');
            }
        });

        // Verificar quais registros já foram feitos hoje
        const recordTypes = this.todayRecords.map(r => r.type);
        
        // Lógica de habilitação dos botões
        switch (this.currentStatus) {
            case 'fora':
                // Só pode registrar entrada se não tiver saída final
                if (recordTypes.includes('saida')) {
                    this.disableAllButtons();
                } else {
                    this.disableButton(buttons.saidaAlmoco);
                    this.disableButton(buttons.voltaAlmoco);
                    this.disableButton(buttons.saida);
                }
                break;
                
            case 'trabalhando':
                this.disableButton(buttons.entrada);
                
                // Se já voltou do almoço, não pode sair para almoço novamente
                if (recordTypes.includes('volta_almoco')) {
                    this.disableButton(buttons.saidaAlmoco);
                    this.disableButton(buttons.voltaAlmoco);
                } else if (recordTypes.includes('saida_almoco')) {
                    // Se saiu para almoço, só pode voltar
                    this.disableButton(buttons.saidaAlmoco);
                    this.disableButton(buttons.saida);
                } else {
                    // Pode sair para almoço ou sair definitivamente
                    this.disableButton(buttons.voltaAlmoco);
                }
                break;
                
            case 'almoco':
                this.disableButton(buttons.entrada);
                this.disableButton(buttons.saidaAlmoco);
                this.disableButton(buttons.saida);
                break;
        }

        // Verificar horário de trabalho
        this.checkWorkingHours(buttons);
    }

    disableButton(button) {
        if (button) {
            button.disabled = true;
            button.classList.add('disabled');
        }
    }

    disableAllButtons() {
        const buttons = [
            document.getElementById('btn-entrada'),
            document.getElementById('btn-saida-almoco'),
            document.getElementById('btn-volta-almoco'),
            document.getElementById('btn-saida')
        ];
        
        buttons.forEach(btn => this.disableButton(btn));
    }

    async checkWorkingHours(buttons) { // Tornar assíncrono
        const now = new Date();
        const currentTime = Utils.formatTimeShort(now);
        const settings = await window.storage.getSettings(); // Usar window.storage e await
        
        // Verificar se é dia útil
        if (!Utils.isWorkDay(now)) {
            // Em fins de semana, mostrar aviso mas permitir registro
            if (this.todayRecords.length === 0) {
                notifications.show('info', 'Fim de semana', 'Hoje é fim de semana. Registros serão marcados como horas extras.');
            }
            return;
        }

        // Verificar horários específicos
        const currentMinutes = Utils.timeToMinutes(currentTime);
        const startMinutes = Utils.timeToMinutes(settings.workHours.startTime);
        const endMinutes = Utils.timeToMinutes(settings.workHours.endTime);
        
        // Muito cedo para entrada (antes das 6h)
        if (currentMinutes < 360 && this.currentStatus === 'fora') { // 6:00
            this.disableButton(buttons.entrada);
            notifications.show('warning', 'Muito cedo', 'Registros só são permitidos a partir das 06:00.');
        }
        
        // Muito tarde para entrada (depois das 10h)
        if (currentMinutes > 600 && this.currentStatus === 'fora' && !this.todayRecords.length) { // 10:00
            notifications.show('warning', 'Atraso', 'Você está registrando entrada após o horário normal.');
        }
    }

    async registrarPonto(tipo) {
        try {
            // Validações
            if (!this.currentUser) {
                notifications.show('error', 'Erro', 'Usuário não autenticado.');
                return;
            }

            if (!this.canRegisterType(tipo)) {
                notifications.show('error', 'Erro', 'Este tipo de registro não é permitido no momento.');
                return;
            }

            // Confirmar registro
            const typeNames = {
                'entrada': 'Entrada',
                'saida_almoco': 'Saída para Almoço',
                'volta_almoco': 'Volta do Almoço',
                'saida': 'Saída'
            };

            const now = new Date();
            const currentTime = Utils.formatTimeShort(now);
            
            const confirmed = confirm(`Confirmar registro de ${typeNames[tipo]} às ${currentTime}?`);
            if (!confirmed) return;

            // Criar registro
            const record = {
                userId: this.currentUser.uid, // Usar UID do Firebase
                type: tipo,
                time: currentTime,
                timestamp: now.toISOString(),
                date: Utils.getDateString(now),
                location: 'Sistema Web',
                ip: 'localhost',
                userAgent: navigator.userAgent.substring(0, 100)
            };

            // Salvar registro
            const result = await window.storage.addTimeRecord(record); // Usar window.storage e await
            
            if (result.success) {
                // Atualizar interface
                await this.refresh(); // Tornar assíncrono
                
                // Mostrar notificação de sucesso
                notifications.show('success', 'Registro realizado', `${typeNames[tipo]} registrada às ${currentTime}.`);
                
                // Verificar se precisa atualizar banco de horas
                await this.updateHourBankIfNeeded(); // Tornar assíncrono
                
                // Verificar alertas
                await this.checkAlerts(tipo); // Tornar assíncrono
                
            } else {
                notifications.show('error', 'Erro', result.message || 'Não foi possível salvar o registro.');
            }

        } catch (error) {
            console.error('Erro ao registrar ponto:', error);
            notifications.show('error', 'Erro', 'Ocorreu um erro ao registrar o ponto.');
        }
    }

    canRegisterType(tipo) {
        const recordTypes = this.todayRecords.map(r => r.type);
        
        switch (tipo) {
            case 'entrada':
                return !recordTypes.includes('entrada') || recordTypes.includes('saida');
            case 'saida_almoco':
                return recordTypes.includes('entrada') && !recordTypes.includes('saida_almoco');
            case 'volta_almoco':
                return recordTypes.includes('saida_almoco') && !recordTypes.includes('volta_almoco');
            case 'saida':
                return recordTypes.includes('entrada') && !recordTypes.includes('saida');
            default:
                return false;
        }
    }

    async updateSummary() { // Tornar assíncrono
        const today = Utils.getDateString();
        const report = await window.storage.getDailyReport(this.currentUser.uid, today); // Usar window.storage e UID
        
        // Atualizar elementos da interface
        const horasTrabalhadasElement = document.getElementById('horas-trabalhadas');
        if (horasTrabalhadasElement) {
            horasTrabalhadasElement.textContent = Utils.minutesToTime(report.horasTrabalhadas);
        }
        
        const horasExtrasElement = document.getElementById('horas-extras');
        if (horasExtrasElement) {
            horasExtrasElement.textContent = Utils.minutesToTime(report.horasExtras);
        }
        
        const bancoHorasElement = document.getElementById('banco-horas');
        if (bancoHorasElement) {
            const hourBank = await window.storage.getHourBank(this.currentUser.uid); // Usar window.storage e UID
            const balance = hourBank ? hourBank.balance : 0;
            bancoHorasElement.textContent = (balance >= 0 ? '+' : '') + Utils.minutesToTime(balance);
            bancoHorasElement.className = balance >= 0 ? 'positive' : 'negative';
        }
        
        const statusDiaElement = document.getElementById('status-dia');
        if (statusDiaElement) {
            statusDiaElement.textContent = report.status;
            statusDiaElement.className = this.getStatusClass(report.status);
        }
    }

    getStatusClass(status) {
        switch (status) {
            case 'Normal': return 'normal';
            case 'Horas extras': return 'overtime';
            case 'Falta': return 'absence';
            default: return '';
        }
    }

    async updateHourBankIfNeeded() { // Tornar assíncrono
        // Verificar se o dia está completo (tem entrada e saída)
        const recordTypes = this.todayRecords.map(r => r.type);
        
        if (recordTypes.includes('entrada') && recordTypes.includes('saida')) {
            const today = Utils.getDateString();
            const report = await window.storage.getDailyReport(this.currentUser.uid, today); // Usar window.storage e UID
            
            // Se há horas extras ou déficit, atualizar banco de horas
            const settings = await window.storage.getSettings(); // Usar window.storage e await
            const expectedHours = settings.workHours.dailyHours;
            const difference = report.horasTrabalhadas - expectedHours;
            
            if (Math.abs(difference) > 5) { // Só atualizar se diferença for maior que 5 minutos
                const description = difference > 0 ? 
                    `Horas extras - ${Utils.getDateString()}` : 
                    `Déficit de horas - ${Utils.getDateString()}`;
                
                await window.storage.updateHourBank(this.currentUser.uid, difference, description); // Usar window.storage e UID
            }
        }
    }

    async checkAlerts(tipo) { // Tornar assíncrono
        const settings = await window.storage.getSettings(); // Usar window.storage e await
        if (!settings.notifications.enabled) return;

        const now = new Date();
        const currentTime = Utils.formatTimeShort(now);
        const currentMinutes = Utils.timeToMinutes(currentTime);
        
    }
}
