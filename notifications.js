// Sistema de Notificações
class Notifications {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 5000; // 5 segundos
        this.init();
    }

    init() {
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            console.error('Container de notificações não encontrado');
            return;
        }
    }

    show(type = 'info', title = '', message = '', duration = null) {
        if (!this.container) return;

        const notification = this.createNotification(type, title, message, duration);
        this.addNotification(notification);
        
        return notification.id;
    }

    createNotification(type, title, message, duration) {
        const id = Utils.generateId();
        const notificationDuration = duration || this.defaultDuration;
        
        const notification = {
            id: id,
            type: type,
            title: title,
            message: message,
            duration: notificationDuration,
            element: null,
            timeout: null
        };

        // Criar elemento DOM
        const element = document.createElement('div');
        element.className = `notification ${type}`;
        element.setAttribute('data-id', id);
        
        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <div class="notification-icon">
                        ${this.getIcon(type)}
                    </div>
                    <div class="notification-title">${Utils.escapeHtml(title)}</div>
                    <button class="notification-close" onclick="notifications.close('${id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                ${message ? `<div class="notification-message">${Utils.escapeHtml(message)}</div>` : ''}
            </div>
            <div class="notification-progress">
                <div class="notification-progress-bar"></div>
            </div>
        `;

        notification.element = element;

        // Configurar auto-close
        if (notificationDuration > 0) {
            this.setAutoClose(notification);
        }

        // Configurar eventos
        this.setupNotificationEvents(notification);

        return notification;
    }

    getIcon(type) {
        const icons = {
            'success': '<i class="fas fa-check-circle"></i>',
            'error': '<i class="fas fa-exclamation-circle"></i>',
            'warning': '<i class="fas fa-exclamation-triangle"></i>',
            'info': '<i class="fas fa-info-circle"></i>'
        };
        
        return icons[type] || icons['info'];
    }

    addNotification(notification) {
        // Limitar número de notificações
        if (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications[0];
            this.close(oldest.id);
        }

        // Adicionar à lista
        this.notifications.push(notification);

        // Adicionar ao DOM
        this.container.appendChild(notification.element);

        // Animar entrada
        setTimeout(() => {
            notification.element.classList.add('show');
        }, 10);
    }

    setAutoClose(notification) {
        if (notification.duration <= 0) return;

        const progressBar = notification.element.querySelector('.notification-progress-bar');
        
        // Animar barra de progresso
        if (progressBar) {
            progressBar.style.transition = `width ${notification.duration}ms linear`;
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 10);
        }

        // Configurar timeout
        notification.timeout = setTimeout(() => {
            this.close(notification.id);
        }, notification.duration);
    }

    setupNotificationEvents(notification) {
        const element = notification.element;
        
        // Pausar auto-close ao passar o mouse
        element.addEventListener('mouseenter', () => {
            if (notification.timeout) {
                clearTimeout(notification.timeout);
                notification.timeout = null;
                
                const progressBar = element.querySelector('.notification-progress-bar');
                if (progressBar) {
                    progressBar.style.transition = 'none';
                }
            }
        });

        // Retomar auto-close ao sair o mouse
        element.addEventListener('mouseleave', () => {
            if (notification.duration > 0 && !notification.timeout) {
                this.setAutoClose(notification);
            }
        });

        // Click para fechar
        element.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-close')) {
                this.close(notification.id);
            }
        });
    }

    close(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;

        // Limpar timeout
        if (notification.timeout) {
            clearTimeout(notification.timeout);
        }

        // Animar saída
        notification.element.classList.add('closing');
        
        setTimeout(() => {
            // Remover do DOM
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }

            // Remover da lista
            const index = this.notifications.findIndex(n => n.id === id);
            if (index !== -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    closeAll() {
        const notificationIds = this.notifications.map(n => n.id);
        notificationIds.forEach(id => this.close(id));
    }

    // Métodos de conveniência
    success(title, message = '', duration = null) {
        return this.show('success', title, message, duration);
    }

    error(title, message = '', duration = null) {
        return this.show('error', title, message, duration || 8000); // Erros ficam mais tempo
    }

    warning(title, message = '', duration = null) {
        return this.show('warning', title, message, duration);
    }

    info(title, message = '', duration = null) {
        return this.show('info', title, message, duration);
    }

    // Notificação persistente (não fecha automaticamente)
    persistent(type, title, message = '') {
        return this.show(type, title, message, 0);
    }

    // Notificação com ação
    showWithAction(type, title, message, actionText, actionCallback, duration = null) {
        const id = this.show(type, title, message, duration || 10000);
        const notification = this.notifications.find(n => n.id === id);
        
        if (notification) {
            const actionButton = document.createElement('button');
            actionButton.className = 'notification-action btn btn-sm btn-primary';
            actionButton.textContent = actionText;
            actionButton.onclick = () => {
                actionCallback();
                this.close(id);
            };

            const content = notification.element.querySelector('.notification-content');
            content.appendChild(actionButton);
        }

        return id;
    }

    // Notificação de confirmação
    confirm(title, message, confirmCallback, cancelCallback = null) {
        const id = Utils.generateId();
        
        const element = document.createElement('div');
        element.className = 'notification confirm';
        element.setAttribute('data-id', id);
        
        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <div class="notification-icon">
                        <i class="fas fa-question-circle"></i>
                    </div>
                    <div class="notification-title">${Utils.escapeHtml(title)}</div>
                </div>
                ${message ? `<div class="notification-message">${Utils.escapeHtml(message)}</div>` : ''}
                <div class="notification-actions">
                    <button class="btn btn-sm btn-secondary" onclick="notifications.closeConfirm('${id}', false)">
                        Cancelar
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="notifications.closeConfirm('${id}', true)">
                        Confirmar
                    </button>
                </div>
            </div>
        `;

        const notification = {
            id: id,
            type: 'confirm',
            element: element,
            confirmCallback: confirmCallback,
            cancelCallback: cancelCallback
        };

        this.notifications.push(notification);
        this.container.appendChild(element);

        setTimeout(() => {
            element.classList.add('show');
        }, 10);

        return id;
    }

    closeConfirm(id, confirmed) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;

        if (confirmed && notification.confirmCallback) {
            notification.confirmCallback();
        } else if (!confirmed && notification.cancelCallback) {
            notification.cancelCallback();
        }

        this.close(id);
    }

    // Notificação de progresso
    showProgress(title, message = '') {
        const id = Utils.generateId();
        
        const element = document.createElement('div');
        element.className = 'notification progress';
        element.setAttribute('data-id', id);
        
        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <div class="notification-icon">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <div class="notification-title">${Utils.escapeHtml(title)}</div>
                </div>
                ${message ? `<div class="notification-message">${Utils.escapeHtml(message)}</div>` : ''}
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
            </div>
        `;

        const notification = {
            id: id,
            type: 'progress',
            element: element
        };

        this.notifications.push(notification);
        this.container.appendChild(element);

        setTimeout(() => {
            element.classList.add('show');
        }, 10);

        return id;
    }

    updateProgress(id, percentage, message = null) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;

        const progressFill = notification.element.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }

        if (message) {
            const messageElement = notification.element.querySelector('.notification-message');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }

        // Se chegou a 100%, fechar após um tempo
        if (percentage >= 100) {
            setTimeout(() => {
                this.close(id);
            }, 2000);
        }
    }

    // Configurações
    setMaxNotifications(max) {
        this.maxNotifications = max;
    }

    setDefaultDuration(duration) {
        this.defaultDuration = duration;
    }

    // Verificar se há notificações ativas
    hasActiveNotifications() {
        return this.notifications.length > 0;
    }

    // Obter estatísticas
    getStats() {
        return {
            total: this.notifications.length,
            byType: this.notifications.reduce((acc, n) => {
                acc[n.type] = (acc[n.type] || 0) + 1;
                return acc;
            }, {})
        };
    }
}

// Adicionar estilos CSS específicos para notificações
const notificationStyles = `
    .notification {
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        margin-bottom: var(--spacing-sm);
        overflow: hidden;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease-out;
        position: relative;
    }

    .notification.show {
        transform: translateX(0);
        opacity: 1;
    }

    .notification.closing {
        transform: translateX(100%);
        opacity: 0;
    }

    .notification-content {
        padding: var(--spacing-lg);
    }

    .notification-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-sm);
    }

    .notification-icon {
        font-size: 1.2rem;
    }

    .notification.success .notification-icon {
        color: var(--success-color);
    }

    .notification.error .notification-icon {
        color: var(--error-color);
    }

    .notification.warning .notification-icon {
        color: var(--warning-color);
    }

    .notification.info .notification-icon {
        color: var(--info-color);
    }

    .notification-title {
        font-weight: 600;
        flex: 1;
    }

    .notification-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: var(--spacing-xs);
        border-radius: var(--border-radius);
        transition: var(--transition-fast);
    }

    .notification-close:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }

    .notification-message {
        color: var(--text-secondary);
        font-size: 0.9rem;
        line-height: 1.4;
    }

    .notification-progress {
        height: 3px;
        background: var(--bg-secondary);
        overflow: hidden;
    }

    .notification-progress-bar {
        height: 100%;
        width: 100%;
        background: var(--primary-color);
        transition: width 0.3s ease;
    }

    .notification.success .notification-progress-bar {
        background: var(--success-color);
    }

    .notification.error .notification-progress-bar {
        background: var(--error-color);
    }

    .notification.warning .notification-progress-bar {
        background: var(--warning-color);
    }

    .notification-action {
        margin-top: var(--spacing-md);
    }

    .notification-actions {
        display: flex;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-md);
        justify-content: flex-end;
    }

    .progress-bar {
        height: 8px;
        background: var(--bg-secondary);
        border-radius: 4px;
        overflow: hidden;
        margin-top: var(--spacing-sm);
    }

    .progress-fill {
        height: 100%;
        background: var(--primary-color);
        transition: width 0.3s ease;
        border-radius: 4px;
    }

    @media (max-width: 480px) {
        .notification {
            margin-left: 0;
            margin-right: 0;
        }
        
        .notification-content {
            padding: var(--spacing-md);
        }
        
        .notification-actions {
            flex-direction: column;
        }
    }
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Criar instância global
window.notifications = new Notifications();

