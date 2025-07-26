/**
 * Template management functionality
 */

class TemplateManager {
    constructor() {
        this.templates = [];
        this.currentTemplate = null;
        this.init();
    }
    
    init() {
        this.loadAvailableTemplates();
        this.setupTemplateSearch();
    }
    
    async loadAvailableTemplates() {
        try {
            const response = await API.get('/templates');
            this.templates = response;
            this.displayTemplates();
        } catch (error) {
            console.error('Error loading templates:', error);
            Utils.showAlert('Erro ao carregar templates', 'error');
        }
    }
    
    displayTemplates() {
        // This method updates the template displays across the interface
        this.updateTemplateGrid();
        this.updateTemplateSelects();
    }
    
    updateTemplateGrid() {
        const grid = document.getElementById('templates-grid');
        if (!grid) return;
        
        if (this.templates.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <i class="fas fa-file-alt fa-3x text-secondary mb-4" aria-hidden="true"></i>
                    <h3 class="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
                    <p class="text-secondary mb-4">Crie seu primeiro template para começar</p>
                    <button class="btn btn-primary" onclick="showTemplateBuilder()">
                        <i class="fas fa-plus" aria-hidden="true"></i>
                        Criar Template
                    </button>
                </div>
            `;
            return;
        }
        
        const templatesHtml = this.templates.map(template => `
            <div class="card template-card" data-template-id="${template.id}">
                <div class="card-header">
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="card-title">${template.name}</h3>
                            <p class="card-subtitle">
                                Versão ${template.version} • ${template.questions} questões
                            </p>
                        </div>
                        <div class="flex gap-1">
                            <button class="btn btn-sm btn-secondary" 
                                    onclick="templateManager.editTemplate('${template.id}')"
                                    aria-label="Editar ${template.name}">
                                <i class="fas fa-edit" aria-hidden="true"></i>
                            </button>
                            <button class="btn btn-sm btn-secondary" 
                                    onclick="templateManager.duplicateTemplate('${template.id}')"
                                    aria-label="Duplicar ${template.name}">
                                <i class="fas fa-copy" aria-hidden="true"></i>
                            </button>
                            <button class="btn btn-sm btn-error" 
                                    onclick="templateManager.deleteTemplate('${template.id}')"
                                    aria-label="Excluir ${template.name}">
                                <i class="fas fa-trash" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="text-center">
                            <div class="text-lg font-semibold text-primary">${template.questions}</div>
                            <div class="text-xs text-secondary">Questões</div>
                        </div>
                        <div class="text-center">
                            <div class="text-lg font-semibold text-info">${template.created_by || 'Anônimo'}</div>
                            <div class="text-xs text-secondary">Criado por</div>
                        </div>
                    </div>
                    
                    <div class="text-xs text-secondary mb-3">
                        Criado em ${Utils.formatDate(template.created_at)}
                    </div>
                    
                    <div class="flex gap-2">
                        <button class="btn btn-primary btn-sm flex-1" 
                                onclick="templateManager.useTemplate('${template.id}')">
                            <i class="fas fa-play" aria-hidden="true"></i>
                            Usar Template
                        </button>
                        <button class="btn btn-secondary btn-sm" 
                                onclick="templateManager.previewTemplate('${template.id}')">
                            <i class="fas fa-eye" aria-hidden="true"></i>
                            Visualizar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        grid.innerHTML = templatesHtml;
    }
    
    updateTemplateSelects() {
        const selects = document.querySelectorAll('select[name="template_id"]');
        
        selects.forEach(select => {
            // Clear existing options except the first one
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            this.templates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.id;
                option.textContent = `${template.name} (v${template.version})`;
                select.appendChild(option);
            });
        });
    }
    
    setupTemplateSearch() {
        const searchInput = document.getElementById('template-search');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', Utils.debounce((e) => {
            this.filterTemplates(e.target.value);
        }, 300));
    }
    
    filterTemplates(searchTerm) {
        const cards = document.querySelectorAll('.template-card');
        const term = searchTerm.toLowerCase();
        
        cards.forEach(card => {
            const templateId = card.dataset.templateId;
            const template = this.templates.find(t => t.id === templateId);
            
            if (!template) return;
            
            const matchesSearch = 
                template.name.toLowerCase().includes(term) ||
                template.created_by.toLowerCase().includes(term) ||
                template.version.toLowerCase().includes(term);
            
            card.style.display = matchesSearch ? 'block' : 'none';
        });
    }
    
    async editTemplate(templateId) {
        try {
            Utils.showLoading('Carregando template...');
            
            // In a real implementation, this would fetch the full template data
            const template = this.templates.find(t => t.id === templateId);
            if (!template) {
                throw new Error('Template não encontrado');
            }
            
            // For now, show a placeholder
            Utils.showAlert('Funcionalidade de edição em desenvolvimento', 'info');
            
        } catch (error) {
            console.error('Error editing template:', error);
            Utils.showAlert('Erro ao editar template', 'error');
        } finally {
            Utils.hideLoading();
        }
    }
    
    async duplicateTemplate(templateId) {
        try {
            Utils.showLoading('Duplicando template...');
            
            const template = this.templates.find(t => t.id === templateId);
            if (!template) {
                throw new Error('Template não encontrado');
            }
            
            // Create a copy with modified name
            const duplicatedTemplate = {
                ...template,
                name: `${template.name} (Cópia)`,
                id: undefined // Will be generated by server
            };
            
            const response = await API.post('/templates', duplicatedTemplate);
            
            if (response.success) {
                Utils.showAlert('Template duplicado com sucesso!', 'success');
                this.loadAvailableTemplates();
            } else {
                throw new Error(response.error || 'Erro ao duplicar template');
            }
            
        } catch (error) {
            console.error('Error duplicating template:', error);
            Utils.showAlert('Erro ao duplicar template', 'error');
        } finally {
            Utils.hideLoading();
        }
    }
    
    async deleteTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;
        
        const confirmed = confirm(
            `Tem certeza que deseja excluir o template "${template.name}"?\n\n` +
            'Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.'
        );
        
        if (!confirmed) return;
        
        try {
            Utils.showLoading('Excluindo template...');
            
            // In a real implementation, this would call the delete API
            // await API.delete(`/templates/${templateId}`);
            
            // For now, just remove from local array
            this.templates = this.templates.filter(t => t.id !== templateId);
            this.displayTemplates();
            
            Utils.showAlert('Template excluído com sucesso', 'success');
            
        } catch (error) {
            console.error('Error deleting template:', error);
            Utils.showAlert('Erro ao excluir template', 'error');
        } finally {
            Utils.hideLoading();
        }
    }
    
    useTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;
        
        // Set the template in correction forms
        const selects = document.querySelectorAll('select[name="template_id"]');
        selects.forEach(select => {
            select.value = templateId;
        });
        
        // Scroll to correction section
        const correctionSection = document.getElementById('correction-section');
        if (correctionSection) {
            correctionSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        Utils.showAlert(`Template "${template.name}" selecionado para correção`, 'success');
    }
    
    previewTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;
        
        this.showTemplatePreview(template);
    }
    
    showTemplatePreview(template) {
        const modal = document.getElementById('template-preview-modal') || this.createPreviewModal();
        const modalContent = modal.querySelector('.modal-body');
        const modalTitle = modal.querySelector('.modal-title');
        
        modalTitle.textContent = `Preview: ${template.name}`;
        
        const previewHtml = `
            <div class="space-y-6">
                <!-- Template Info -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-semibold mb-2">Informações Gerais</h4>
                        <div class="space-y-1 text-sm">
                            <div><strong>Nome:</strong> ${template.name}</div>
                            <div><strong>Versão:</strong> ${template.version}</div>
                            <div><strong>Criado por:</strong> ${template.created_by || 'Não informado'}</div>
                            <div><strong>Data:</strong> ${Utils.formatDate(template.created_at)}</div>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-2">Estatísticas</h4>
                        <div class="space-y-1 text-sm">
                            <div><strong>Questões:</strong> ${template.questions}</div>
                            <div><strong>Tipo:</strong> Misto</div>
                            <div><strong>Status:</strong> <span class="text-success">Ativo</span></div>
                        </div>
                    </div>
                </div>
                
                <!-- Instructions -->
                <div>
                    <h4 class="font-semibold mb-2">Instruções</h4>
                    <div class="p-3 bg-secondary rounded text-sm">
                        ${template.instructions || 'Nenhuma instrução específica fornecida.'}
                    </div>
                </div>
                
                <!-- Sample Questions Preview -->
                <div>
                    <h4 class="font-semibold mb-3">Exemplo de Questões</h4>
                    <div class="space-y-3">
                        <div class="border rounded p-3">
                            <div class="font-medium mb-2">Questão 1 - Múltipla Escolha</div>
                            <div class="text-sm text-secondary mb-2">Peso: 1.0 ponto</div>
                            <div class="grid grid-cols-5 gap-2 text-sm">
                                <div class="p-2 border rounded text-center">A</div>
                                <div class="p-2 border rounded text-center">B</div>
                                <div class="p-2 border rounded text-center bg-success text-white">C</div>
                                <div class="p-2 border rounded text-center">D</div>
                                <div class="p-2 border rounded text-center">E</div>
                            </div>
                        </div>
                        
                        <div class="border rounded p-3">
                            <div class="font-medium mb-2">Questão 2 - Verdadeiro/Falso</div>
                            <div class="text-sm text-secondary mb-2">Peso: 1.0 ponto</div>
                            <div class="flex gap-4 text-sm">
                                <div class="p-2 border rounded bg-success text-white">V</div>
                                <div class="p-2 border rounded">F</div>
                            </div>
                        </div>
                        
                        <div class="text-center text-sm text-secondary">
                            ... e mais ${Math.max(0, template.questions - 2)} questões
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modalContent.innerHTML = previewHtml;
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    }
    
    createPreviewModal() {
        const modalHtml = `
            <div id="template-preview-modal" class="modal-overlay" style="display: none;" 
                 role="dialog" aria-labelledby="preview-modal-title" aria-hidden="true">
                <div class="modal">
                    <div class="modal-header">
                        <h3 id="preview-modal-title" class="modal-title">Preview do Template</h3>
                        <button class="modal-close" onclick="templateManager.closePreviewModal()" 
                                aria-label="Fechar preview">
                            <i class="fas fa-times" aria-hidden="true"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <!-- Content will be inserted here -->
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="templateManager.closePreviewModal()">
                            Fechar
                        </button>
                        <button class="btn btn-primary" onclick="templateManager.useTemplateFromPreview()">
                            <i class="fas fa-play" aria-hidden="true"></i>
                            Usar Este Template
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        return document.getElementById('template-preview-modal');
    }
    
    closePreviewModal() {
        const modal = document.getElementById('template-preview-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
    }
    
    useTemplateFromPreview() {
        // Get the currently previewed template and use it
        this.closePreviewModal();
        // Implementation would depend on how we track the current preview
        Utils.showAlert('Template selecionado para uso', 'success');
    }
}

// Question type configurations for template builder
const QuestionTypes = {
    multiple_choice: {
        name: 'Múltipla Escolha',
        icon: 'fas fa-list',
        description: 'Questões com alternativas A, B, C, D, E',
        defaultOptions: ['A', 'B', 'C', 'D', 'E']
    },
    true_false: {
        name: 'Verdadeiro/Falso',
        icon: 'fas fa-check-circle',
        description: 'Questões de verdadeiro ou falso',
        defaultOptions: ['V', 'F']
    },
    numeric: {
        name: 'Numérica',
        icon: 'fas fa-calculator',
        description: 'Questões com respostas numéricas',
        defaultOptions: []
    },
    short_text: {
        name: 'Texto Curto',
        icon: 'fas fa-font',
        description: 'Questões com respostas em texto',
        defaultOptions: []
    },
    custom_symbols: {
        name: 'Símbolos Customizados',
        icon: 'fas fa-shapes',
        description: 'Questões com símbolos personalizados',
        defaultOptions: ['■', '●', '▲', '♦']
    }
};

// Template validation functions
const TemplateValidator = {
    validateTemplate(templateData) {
        const errors = [];
        
        // Basic validation
        if (!templateData.name || templateData.name.trim().length < 3) {
            errors.push('Nome do template deve ter pelo menos 3 caracteres');
        }
        
        if (!templateData.questions || templateData.questions.length === 0) {
            errors.push('Template deve ter pelo menos uma questão');
        }
        
        // Validate questions
        templateData.questions.forEach((question, index) => {
            const questionErrors = this.validateQuestion(question, index + 1);
            errors.push(...questionErrors);
        });
        
        return {
            valid: errors.length === 0,
            errors
        };
    },
    
    validateQuestion(question, questionNumber) {
        const errors = [];
        const prefix = `Questão ${questionNumber}:`;
        
        if (!question.type) {
            errors.push(`${prefix} Tipo de questão é obrigatório`);
        }
        
        if (!question.correct_answers || question.correct_answers.length === 0) {
            errors.push(`${prefix} Pelo menos uma resposta correta é obrigatória`);
        }
        
        if (question.weight && (question.weight < 0.1 || question.weight > 100)) {
            errors.push(`${prefix} Peso deve estar entre 0.1 e 100`);
        }
        
        // Type-specific validation
        if (question.type === 'numeric' && question.error_margin && question.error_margin < 0) {
            errors.push(`${prefix} Margem de erro não pode ser negativa`);
        }
        
        return errors;
    }
};

// Initialize template manager when DOM is loaded
let templateManager;
document.addEventListener('DOMContentLoaded', function() {
    templateManager = new TemplateManager();
});

// Export for global access
window.templateManager = templateManager;
window.QuestionTypes = QuestionTypes;
window.TemplateValidator = TemplateValidator;
