/**
 * Sistema de Correção Automática de Provas - JavaScript Principal
 * Funcionalidades gerais e utilitários
 */

// Global configuration
const API_BASE = '/api';
const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB

// Utility functions
const Utils = {
    /**
     * Show alert message
     */
    showAlert(message, type = 'info', duration = 5000) {
        const container = document.getElementById('alert-container');
        const alertId = 'alert-' + Date.now();
        
        const alertHtml = `
            <div id="${alertId}" class="alert alert-${type}" role="alert">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-${this.getAlertIcon(type)}" aria-hidden="true"></i>
                        <span>${message}</span>
                    </div>
                    <button onclick="Utils.closeAlert('${alertId}')" class="btn-close" aria-label="Fechar alerta">
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', alertHtml);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => this.closeAlert(alertId), duration);
        }
        
        // Announce to screen readers
        this.announceToScreenReader(message);
    },
    
    /**
     * Close alert
     */
    closeAlert(alertId) {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-10px)';
            setTimeout(() => alert.remove(), 300);
        }
    },
    
    /**
     * Get alert icon based on type
     */
    getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },
    
    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
    },
    
    /**
     * Show loading overlay
     */
    showLoading(message = 'Processando...') {
        const overlay = document.getElementById('loading-overlay');
        const text = overlay.querySelector('p');
        if (text) text.textContent = message;
        
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
        
        // Focus trap
        overlay.focus();
    },
    
    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
    },
    
    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * Validate file
     */
    validateFile(file, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']) {
        const errors = [];
        
        if (!allowedTypes.includes(file.type)) {
            errors.push(`Tipo de arquivo não permitido: ${file.type}`);
        }
        
        if (file.size > MAX_FILE_SIZE) {
            errors.push(`Arquivo muito grande: ${this.formatFileSize(file.size)}. Máximo: ${this.formatFileSize(MAX_FILE_SIZE)}`);
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    },
    
    /**
     * Format date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    /**
     * Format percentage
     */
    formatPercentage(value, decimals = 1) {
        return `${parseFloat(value).toFixed(decimals)}%`;
    },
    
    /**
     * Debounce function
     */
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }
};

// API helper functions
const API = {
    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
    
    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    /**
     * POST request
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    
    /**
     * POST form data
     */
    async postFormData(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            headers: {}, // Let browser set content-type for FormData
            body: formData,
        });
    }
};

// File upload handler
class FileUploadHandler {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.options = {
            allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
            maxSize: MAX_FILE_SIZE,
            multiple: false,
            ...options
        };
        
        this.init();
    }
    
    init() {
        // Handle file selection
        this.input.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // Handle drag and drop
        const label = this.input.nextElementSibling;
        if (label && label.classList.contains('file-upload-label')) {
            this.setupDragAndDrop(label);
        }
    }
    
    setupDragAndDrop(dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            }, false);
        });
        
        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        }, false);
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleFiles(files) {
        const fileArray = Array.from(files);
        const validFiles = [];
        const errors = [];
        
        fileArray.forEach(file => {
            const validation = Utils.validateFile(file, this.options.allowedTypes);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.errors.join(', ')}`);
            }
        });
        
        if (errors.length > 0) {
            Utils.showAlert(`Arquivos inválidos:\n${errors.join('\n')}`, 'error');
        }
        
        if (validFiles.length > 0) {
            this.updatePreview(validFiles);
            this.onFilesSelected(validFiles);
        }
    }
    
    updatePreview(files) {
        const label = this.input.nextElementSibling;
        if (!label) return;
        
        if (files.length === 1) {
            const file = files[0];
            label.innerHTML = `
                <i class="fas fa-file-image fa-2x" aria-hidden="true"></i>
                <span>${file.name}</span>
                <small class="text-secondary">${Utils.formatFileSize(file.size)}</small>
            `;
        } else if (files.length > 1) {
            label.innerHTML = `
                <i class="fas fa-images fa-2x" aria-hidden="true"></i>
                <span>${files.length} arquivos selecionados</span>
                <small class="text-secondary">Total: ${Utils.formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}</small>
            `;
        }
    }
    
    onFilesSelected(files) {
        // Override this method in subclasses
        console.log('Files selected:', files);
    }
}

// Form validation
class FormValidator {
    constructor(form) {
        this.form = form;
        this.errors = {};
        this.init();
    }
    
    init() {
        // Add real-time validation
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', Utils.debounce(() => this.validateField(input), 300));
        });
        
        // Handle form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.validateForm();
        });
    }
    
    validateField(field) {
        const value = field.value.trim();
        const rules = this.getFieldRules(field);
        const errors = [];
        
        // Required validation
        if (rules.required && !value) {
            errors.push('Este campo é obrigatório');
        }
        
        // Type-specific validation
        if (value && rules.type) {
            switch (rules.type) {
                case 'email':
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        errors.push('Email inválido');
                    }
                    break;
                case 'number':
                    if (isNaN(value)) {
                        errors.push('Deve ser um número válido');
                    }
                    break;
            }
        }
        
        // Length validation
        if (value && rules.minLength && value.length < rules.minLength) {
            errors.push(`Mínimo de ${rules.minLength} caracteres`);
        }
        
        if (value && rules.maxLength && value.length > rules.maxLength) {
            errors.push(`Máximo de ${rules.maxLength} caracteres`);
        }
        
        this.setFieldError(field, errors);
        return errors.length === 0;
    }
    
    getFieldRules(field) {
        return {
            required: field.hasAttribute('required'),
            type: field.type,
            minLength: field.getAttribute('minlength'),
            maxLength: field.getAttribute('maxlength')
        };
    }
    
    setFieldError(field, errors) {
        const fieldName = field.name || field.id;
        
        // Remove existing error
        const existingError = field.parentNode.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }
        
        field.classList.remove('error');
        
        if (errors.length > 0) {
            this.errors[fieldName] = errors;
            field.classList.add('error');
            
            // Add error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.textContent = errors[0];
            field.parentNode.appendChild(errorDiv);
        } else {
            delete this.errors[fieldName];
        }
    }
    
    validateForm() {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        if (isValid) {
            this.onValidSubmit();
        } else {
            Utils.showAlert('Por favor, corrija os erros no formulário', 'error');
            // Focus first error field
            const firstError = this.form.querySelector('.error');
            if (firstError) {
                firstError.focus();
            }
        }
    }
    
    onValidSubmit() {
        // Override this method in subclasses
        console.log('Form is valid, ready to submit');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize file upload handlers
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        new FileUploadHandler(input, {
            multiple: input.hasAttribute('multiple')
        });
    });
    
    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        // Escape key closes modals
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal-overlay[style*="flex"]');
            if (openModal) {
                const closeButton = openModal.querySelector('.modal-close');
                if (closeButton) closeButton.click();
            }
        }
    });
    
    // Add focus management for modals
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                const closeButton = modal.querySelector('.modal-close');
                if (closeButton) closeButton.click();
            }
        });
    });
    
    // Initialize tooltips and help text
    const helpButtons = document.querySelectorAll('[data-help]');
    helpButtons.forEach(button => {
        button.addEventListener('click', function() {
            const helpText = this.getAttribute('data-help');
            Utils.showAlert(helpText, 'info');
        });
    });
    
    console.log('Sistema de Correção Automática inicializado');
});

// Export for use in other modules
window.Utils = Utils;
window.API = API;
window.FileUploadHandler = FileUploadHandler;
window.FormValidator = FormValidator;
