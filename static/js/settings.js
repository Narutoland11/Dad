/**
 * Settings management functionality
 */

class SettingsManager {
    constructor() {
        this.settings = {};
        this.pendingAction = null;
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.showSettingsSection('general');
    }
    
    setupEventListeners() {
        // Auto-save on input changes
        document.addEventListener('input', (e) => {
            if (e.target.matches('.form-input, .form-range')) {
                this.saveSetting(e.target.id, e.target.value);
            }
        });
        
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[type="checkbox"], input[type="radio"], select')) {
                const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                this.saveSetting(e.target.id || e.target.name, value);
            }
        });
    }
    
    async loadSettings() {
        try {
            // In a real implementation, this would load from API
            // For now, load from localStorage or use defaults
            const savedSettings = localStorage.getItem('systemSettings');
            
            this.settings = savedSettings ? JSON.parse(savedSettings) : {
                // General
                'system-name': 'Sistema de Correção Automática',
                'institution-name': '',
                'default-language': 'pt-BR',
                'timezone': 'America/Sao_Paulo',
                'auto-save': true,
                'show-tips': true,
                'confirm-actions': false,
                
                // OCR
                'ocr-engine': 'tesseract',
                'image-quality': 'balanced',
                'confidence-threshold': 85,
                'auto-rotate': true,
                'shadow-removal': true,
                'noise-reduction': false,
                'contrast-enhancement': true,
                'max-file-size': 10,
                
                // Grading
                'default-grading-scale': '0-10',
                'passing-grade-default': 60,
                'rounding-method': 'round',
                'decimal-places': 1,
                'partial-credit-default': true,
                'penalty-wrong-answers': false,
                'bonus-points': false,
                
                // Interface
                'theme': 'light',
                'font-size': 'medium',
                'items-per-page': 25,
                'high-contrast': false,
                'reduce-animations': false,
                'screen-reader-optimized': true,
                'show-tooltips': true,
                'compact-mode': false,
                'show-progress-bars': true,
                
                // Notifications
                'notify-completion': true,
                'notify-errors': true,
                'notify-low-confidence': false,
                'notify-batch-complete': true,
                'notification-method': 'browser',
                'notification-email': '',
                'notification-sound': 'default',
                
                // Security
                'session-timeout': 60,
                'require-confirmation': true,
                'log-activities': true,
                'encrypt-data': false,
                'max-login-attempts': 5,
                
                // Backup
                'auto-backup': true,
                'backup-frequency': 'daily',
                'backup-retention': 30
            };
            
            this.applySettings();
            
        } catch (error) {
            console.error('Error loading settings:', error);
            Utils.showAlert('Erro ao carregar configurações', 'error');
        }
    }
    
    applySettings() {
        // Apply all settings to form elements
        Object.entries(this.settings).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (!element) return;
            
            if (element.type === 'checkbox') {
                element.checked = value;
            } else if (element.type === 'radio') {
                if (element.value === value) {
                    element.checked = true;
                }
            } else {
                element.value = value;
            }
        });
        
        // Apply theme immediately
        this.applyTheme(this.settings.theme);
        
        // Apply other visual settings
        this.applyFontSize(this.settings['font-size']);
        this.applyAccessibilitySettings();
    }
    
    saveSetting(key, value) {
        if (!key) return;
        
        this.settings[key] = value;
        
        // Save to localStorage
        localStorage.setItem('systemSettings', JSON.stringify(this.settings));
        
        // Apply setting immediately if it affects UI
        this.applySettingImmediately(key, value);
    }
    
    applySettingImmediately(key, value) {
        switch (key) {
            case 'theme':
                this.applyTheme(value);
                break;
            case 'font-size':
                this.applyFontSize(value);
                break;
            case 'high-contrast':
                this.applyHighContrast(value);
                break;
            case 'reduce-animations':
                this.applyReduceAnimations(value);
                break;
        }
    }
    
    applyTheme(theme) {
        const body = document.body;
        body.classList.remove('theme-light', 'theme-dark');
        
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = prefersDark ? 'dark' : 'light';
        }
        
        body.classList.add(`theme-${theme}`);
    }
    
    applyFontSize(size) {
        const body = document.body;
        body.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
        body.classList.add(`font-${size}`);
    }
    
    applyHighContrast(enabled) {
        document.body.classList.toggle('high-contrast', enabled);
    }
    
    applyReduceAnimations(enabled) {
        document.body.classList.toggle('reduce-animations', enabled);
    }
    
    applyAccessibilitySettings() {
        const settings = this.settings;
        
        if (settings['high-contrast']) {
            this.applyHighContrast(true);
        }
        
        if (settings['reduce-animations']) {
            this.applyReduceAnimations(true);
        }
        
        if (settings['screen-reader-optimized']) {
            document.body.classList.add('screen-reader-optimized');
        }
    }
    
    showSettingsSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.settings-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Remove active class from all nav items
        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show selected section
        const section = document.getElementById(`settings-${sectionId}`);
        if (section) {
            section.style.display = 'block';
        }
        
        // Add active class to nav item
        const navItem = document.getElementById(`nav-${sectionId}`);
        if (navItem) {
            navItem.classList.add('active');
        }
    }
    
    async saveAllSettings() {
        try {
            Utils.showLoading('Salvando configurações...');
            
            // In a real implementation, this would send to API
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Save to localStorage as backup
            localStorage.setItem('systemSettings', JSON.stringify(this.settings));
            
            Utils.showAlert('Configurações salvas com sucesso!', 'success');
            
        } catch (error) {
            console.error('Error saving settings:', error);
            Utils.showAlert('Erro ao salvar configurações', 'error');
        } finally {
            Utils.hideLoading();
        }
    }
    
    resetToDefaults() {
        this.showConfirmation(
            'Restaurar Configurações Padrão',
            'Tem certeza que deseja restaurar todas as configurações para os valores padrão? Esta ação não pode ser desfeita.',
            () => {
                // Clear localStorage
                localStorage.removeItem('systemSettings');
                
                // Reload page to apply defaults
                window.location.reload();
            }
        );
    }
    
    changeTheme() {
        const theme = document.getElementById('theme').value;
        this.applyTheme(theme);
    }
    
    clearAllData() {
        this.showConfirmation(
            'Limpar Todos os Dados',
            'ATENÇÃO: Esta ação irá remover TODOS os dados do sistema, incluindo templates, resultados e configurações. Esta ação NÃO PODE ser desfeita. Tem certeza absoluta?',
            () => {
                // Clear all localStorage
                localStorage.clear();
                
                // In a real implementation, this would call API to clear server data
                Utils.showAlert('Todos os dados foram removidos. A página será recarregada.', 'info');
                
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            },
            'btn-error'
        );
    }
    
    async createBackup() {
        try {
            Utils.showLoading('Criando backup...');
            
            // Simulate backup creation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const backupData = {
                timestamp: new Date().toISOString(),
                settings: this.settings,
                version: '1.0',
                // In a real implementation, would include templates, results, etc.
            };
            
            // Create downloadable backup file
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            Utils.showAlert('Backup criado e baixado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Error creating backup:', error);
            Utils.showAlert('Erro ao criar backup', 'error');
        } finally {
            Utils.hideLoading();
        }
    }
    
    restoreBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                Utils.showLoading('Restaurando backup...');
                
                const text = await file.text();
                const backupData = JSON.parse(text);
                
                // Validate backup format
                if (!backupData.settings || !backupData.timestamp) {
                    throw new Error('Formato de backup inválido');
                }
                
                // Restore settings
                this.settings = backupData.settings;
                localStorage.setItem('systemSettings', JSON.stringify(this.settings));
                
                Utils.showAlert('Backup restaurado com sucesso! A página será recarregada.', 'success');
                
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
                
            } catch (error) {
                console.error('Error restoring backup:', error);
                Utils.showAlert('Erro ao restaurar backup: ' + error.message, 'error');
            } finally {
                Utils.hideLoading();
            }
        };
        
        input.click();
    }
    
    cleanOldResults() {
        this.showConfirmation(
            'Limpar Resultados Antigos',
            'Tem certeza que deseja remover todos os resultados de correção com mais de 90 dias?',
            () => {
                Utils.showAlert('Resultados antigos removidos (simulado)', 'success');
            }
        );
    }
    
    cleanTempFiles() {
        this.showConfirmation(
            'Limpar Arquivos Temporários',
            'Tem certeza que deseja remover todos os arquivos temporários?',
            () => {
                Utils.showAlert('Arquivos temporários removidos (simulado)', 'success');
            }
        );
    }
    
    showConfirmation(title, message, onConfirm, buttonClass = 'btn-primary') {
        const modal = document.getElementById('confirmation-modal');
        const titleEl = document.getElementById('confirmation-title');
        const messageEl = document.getElementById('confirmation-message');
        const confirmBtn = document.getElementById('confirmation-confirm');
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        confirmBtn.className = `btn ${buttonClass}`;
        
        this.pendingAction = onConfirm;
        
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    }
    
    closeConfirmationModal() {
        const modal = document.getElementById('confirmation-modal');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        this.pendingAction = null;
    }
    
    confirmAction() {
        if (this.pendingAction) {
            this.pendingAction();
            this.closeConfirmationModal();
        }
    }
}

// Global functions
function showSettingsSection(sectionId) {
    settingsManager.showSettingsSection(sectionId);
}

function saveAllSettings() {
    settingsManager.saveAllSettings();
}

function resetToDefaults() {
    settingsManager.resetToDefaults();
}

function changeTheme() {
    settingsManager.changeTheme();
}

function clearAllData() {
    settingsManager.clearAllData();
}

function createBackup() {
    settingsManager.createBackup();
}

function restoreBackup() {
    settingsManager.restoreBackup();
}

function cleanOldResults() {
    settingsManager.cleanOldResults();
}

function cleanTempFiles() {
    settingsManager.cleanTempFiles();
}

function closeConfirmationModal() {
    settingsManager.closeConfirmationModal();
}

function confirmAction() {
    settingsManager.confirmAction();
}

// Initialize when DOM is loaded
let settingsManager;
document.addEventListener('DOMContentLoaded', function() {
    settingsManager = new SettingsManager();
});

// Export for global access
window.settingsManager = settingsManager;
