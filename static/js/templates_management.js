/**
 * Templates Management functionality
 */

class TemplatesManager {
    constructor() {
        this.templates = [];
        this.filteredTemplates = [];
        this.selectedTemplate = null;
        this.importedTemplate = null;
        this.init();
    }
    
    init() {
        this.loadTemplates();
        this.setupEventListeners();
        this.setupSearch();
    }
    
    setupEventListeners() {
        // Search and filters
        document.getElementById('search-templates').addEventListener('input', (e) => {
            this.filterTemplates();
        });
        
        document.getElementById('filter-author').addEventListener('change', (e) => {
            this.filterTemplates();
        });
        
        document.getElementById('filter-subject').addEventListener('change', (e) => {
            this.filterTemplates();
        });
        
        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.sortTemplates();
        });
    }
    
    setupSearch() {
        const searchInput = document.getElementById('search-templates');
        let debounceTimer;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.filterTemplates();
            }, 300);
        });
    }
    
    async loadTemplates() {
        try {
            const response = await fetch('/api/templates');
            this.templates = await response.json();
            this.filteredTemplates = [...this.templates];
            
            this.populateAuthorFilter();
            this.renderTemplates();
            
        } catch (error) {
            console.error('Error loading templates:', error);
            this.showError('Erro ao carregar templates');
        }
    }
    
    populateAuthorFilter() {
        const authorFilter = document.getElementById('filter-author');
        const authors = [...new Set(this.templates.map(t => t.created_by))];
        
        // Clear existing options except first
        while (authorFilter.children.length > 1) {
            authorFilter.removeChild(authorFilter.lastChild);
        }
        
        authors.forEach(author => {
            const option = document.createElement('option');
            option.value = author;
            option.textContent = author;
            authorFilter.appendChild(option);
        });
    }
    
    filterTemplates() {
        const searchTerm = document.getElementById('search-templates').value.toLowerCase();
        const authorFilter = document.getElementById('filter-author').value;
        const subjectFilter = document.getElementById('filter-subject').value;
        
        this.filteredTemplates = this.templates.filter(template => {
            const matchesSearch = !searchTerm || 
                template.name.toLowerCase().includes(searchTerm) ||
                template.created_by.toLowerCase().includes(searchTerm) ||
                (template.instructions && template.instructions.toLowerCase().includes(searchTerm));
            
            const matchesAuthor = !authorFilter || template.created_by === authorFilter;
            
            const matchesSubject = !subjectFilter || 
                template.name.toLowerCase().includes(subjectFilter);
            
            return matchesSearch && matchesAuthor && matchesSubject;
        });
        
        this.sortTemplates();
    }
    
    sortTemplates() {
        const sortBy = document.getElementById('sort-by').value;
        
        this.filteredTemplates.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'created_at':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'last_used':
                    return new Date(b.last_used || b.created_at) - new Date(a.last_used || a.created_at);
                case 'questions':
                    return b.questions - a.questions;
                default:
                    return 0;
            }
        });
        
        this.renderTemplates();
    }
    
    renderTemplates() {
        const grid = document.getElementById('templates-grid');
        const emptyState = document.getElementById('empty-state');
        
        if (this.filteredTemplates.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        const templatesHtml = this.filteredTemplates.map(template => `
            <div class="template-card bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div class="p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900 mb-1">${template.name}</h3>
                            <p class="text-sm text-gray-600">${template.questions} questões • v${template.version}</p>
                        </div>
                        <div class="flex gap-1">
                            <button class="btn btn-xs btn-secondary" 
                                    onclick="templatesManager.previewTemplate('${template.id}')"
                                    title="Visualizar">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-xs btn-secondary" 
                                    onclick="templatesManager.showTemplateActions('${template.id}')"
                                    title="Mais ações">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="space-y-2 mb-4">
                        <div class="flex items-center text-sm text-gray-600">
                            <i class="fas fa-user w-4 mr-2"></i>
                            <span>${template.created_by}</span>
                        </div>
                        <div class="flex items-center text-sm text-gray-600">
                            <i class="fas fa-calendar w-4 mr-2"></i>
                            <span>${this.formatDate(template.created_at)}</span>
                        </div>
                        ${template.last_used ? `
                            <div class="flex items-center text-sm text-gray-600">
                                <i class="fas fa-clock w-4 mr-2"></i>
                                <span>Usado em ${this.formatDate(template.last_used)}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${template.instructions ? `
                        <p class="text-sm text-gray-600 mb-4 line-clamp-2">${template.instructions}</p>
                    ` : ''}
                    
                    <div class="flex gap-2">
                        <button class="btn btn-sm btn-primary flex-1" 
                                onclick="templatesManager.useForCorrection('${template.id}')">
                            <i class="fas fa-play mr-1"></i>
                            Usar
                        </button>
                        <button class="btn btn-sm btn-secondary" 
                                onclick="templatesManager.editTemplate('${template.id}')">
                            <i class="fas fa-edit mr-1"></i>
                            Editar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        grid.innerHTML = templatesHtml;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    async previewTemplate(templateId) {
        try {
            const response = await fetch(`/api/templates/${templateId}`);
            const template = await response.json();
            
            const modal = document.getElementById('template-preview-modal');
            const title = document.getElementById('template-preview-title');
            const content = document.getElementById('template-preview-content');
            
            title.textContent = `Template: ${template.name}`;
            
            const previewHtml = `
                <div class="space-y-6">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-semibold mb-3">Informações Gerais</h4>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Nome:</strong> ${template.name}</div>
                            <div><strong>Versão:</strong> v${template.version}</div>
                            <div><strong>Questões:</strong> ${template.questions}</div>
                            <div><strong>Autor:</strong> ${template.created_by}</div>
                            <div><strong>Criado em:</strong> ${this.formatDate(template.created_at)}</div>
                            <div><strong>Escala:</strong> ${template.grading_scale || '0-10'}</div>
                        </div>
                        ${template.instructions ? `
                            <div class="mt-3">
                                <strong>Instruções:</strong>
                                <p class="mt-1 text-gray-700">${template.instructions}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div>
                        <h4 class="font-semibold mb-3">Configurações de Questões</h4>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div><strong>Total de questões:</strong> ${template.questions}</div>
                                <div><strong>Nota de aprovação:</strong> ${template.passing_grade || 60}%</div>
                                <div><strong>Múltiplas versões:</strong> ${template.multiple_versions ? 'Sim' : 'Não'}</div>
                                ${template.version_count ? `<div><strong>Versões:</strong> ${template.version_count}</div>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold mb-3">Estatísticas de Uso</h4>
                        <div class="grid grid-cols-3 gap-4">
                            <div class="bg-green-50 p-3 rounded text-center">
                                <div class="text-lg font-bold text-green-600">${template.usage_count || 0}</div>
                                <div class="text-xs text-green-600">Vezes usado</div>
                            </div>
                            <div class="bg-blue-50 p-3 rounded text-center">
                                <div class="text-lg font-bold text-blue-600">${template.total_tests || 0}</div>
                                <div class="text-xs text-blue-600">Provas corrigidas</div>
                            </div>
                            <div class="bg-purple-50 p-3 rounded text-center">
                                <div class="text-lg font-bold text-purple-600">${template.avg_score || 0}</div>
                                <div class="text-xs text-purple-600">Média geral</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            content.innerHTML = previewHtml;
            this.selectedTemplate = template;
            modal.style.display = 'flex';
            
        } catch (error) {
            console.error('Error previewing template:', error);
            this.showError('Erro ao visualizar template');
        }
    }
    
    showTemplateActions(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;
        
        this.selectedTemplate = template;
        
        const modal = document.getElementById('template-actions-modal');
        const title = document.getElementById('template-actions-title');
        
        title.textContent = `Ações: ${template.name}`;
        modal.style.display = 'flex';
    }
    
    editTemplate(templateId) {
        const template = templateId ? this.templates.find(t => t.id === templateId) : this.selectedTemplate;
        if (!template) return;
        
        // Redirect to template builder with template ID
        window.location.href = `/templates/builder?edit=${template.id}`;
    }
    
    async duplicateTemplate() {
        if (!this.selectedTemplate) return;
        
        try {
            const duplicatedTemplate = {
                ...this.selectedTemplate,
                name: `${this.selectedTemplate.name} (Cópia)`,
                id: undefined,
                created_at: new Date().toISOString()
            };
            
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(duplicatedTemplate)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Template duplicado com sucesso!');
                this.loadTemplates();
                this.closeTemplateActions();
            } else {
                throw new Error(result.error || 'Erro ao duplicar template');
            }
            
        } catch (error) {
            console.error('Error duplicating template:', error);
            this.showError('Erro ao duplicar template');
        }
    }
    
    async exportTemplate() {
        if (!this.selectedTemplate) return;
        
        try {
            const dataStr = JSON.stringify(this.selectedTemplate, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `template_${this.selectedTemplate.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
            link.click();
            
            this.showSuccess('Template exportado com sucesso!');
            this.closeTemplateActions();
            
        } catch (error) {
            console.error('Error exporting template:', error);
            this.showError('Erro ao exportar template');
        }
    }
    
    viewTemplateHistory() {
        if (!this.selectedTemplate) return;
        
        // This would show a detailed history of the template usage
        alert(`Histórico do template "${this.selectedTemplate.name}":\n\n` +
              `• Criado em: ${this.formatDate(this.selectedTemplate.created_at)}\n` +
              `• Usado ${this.selectedTemplate.usage_count || 0} vezes\n` +
              `• Última utilização: ${this.selectedTemplate.last_used ? this.formatDate(this.selectedTemplate.last_used) : 'Nunca'}\n` +
              `• Total de provas corrigidas: ${this.selectedTemplate.total_tests || 0}`);
        
        this.closeTemplateActions();
    }
    
    useForCorrection(templateId) {
        const template = templateId ? this.templates.find(t => t.id === templateId) : this.selectedTemplate;
        if (!template) return;
        
        // Redirect to correction page with template pre-selected
        window.location.href = `/correction?template=${template.id}`;
    }
    
    useTemplateForCorrection() {
        this.useForCorrection();
    }
    
    deleteTemplate() {
        if (!this.selectedTemplate) return;
        
        const modal = document.getElementById('delete-modal');
        const templateName = document.getElementById('delete-template-name');
        
        templateName.textContent = `Template: "${this.selectedTemplate.name}"`;
        modal.style.display = 'flex';
        
        this.closeTemplateActions();
    }
    
    async confirmDelete() {
        if (!this.selectedTemplate) return;
        
        try {
            const response = await fetch(`/api/templates/${this.selectedTemplate.id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Template excluído com sucesso!');
                this.loadTemplates();
                this.closeDeleteModal();
            } else {
                throw new Error(result.error || 'Erro ao excluir template');
            }
            
        } catch (error) {
            console.error('Error deleting template:', error);
            this.showError('Erro ao excluir template');
        }
    }
    
    handleImportFile(input) {
        const file = input.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const templateData = JSON.parse(e.target.result);
                this.importedTemplate = templateData;
                
                const preview = document.getElementById('import-preview');
                const details = document.getElementById('import-details');
                
                details.innerHTML = `
                    <div class="space-y-2 text-sm">
                        <div><strong>Nome:</strong> ${templateData.name}</div>
                        <div><strong>Versão:</strong> v${templateData.version}</div>
                        <div><strong>Questões:</strong> ${templateData.questions}</div>
                        <div><strong>Autor:</strong> ${templateData.created_by}</div>
                    </div>
                `;
                
                preview.style.display = 'block';
                document.getElementById('confirm-import-btn').disabled = false;
                
            } catch (error) {
                this.showError('Arquivo inválido. Verifique se é um template válido.');
            }
        };
        
        reader.readAsText(file);
    }
    
    async confirmImport() {
        if (!this.importedTemplate) return;
        
        try {
            // Generate new ID and timestamp
            this.importedTemplate.id = undefined;
            this.importedTemplate.created_at = new Date().toISOString();
            this.importedTemplate.name = `${this.importedTemplate.name} (Importado)`;
            
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.importedTemplate)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Template importado com sucesso!');
                this.loadTemplates();
                this.closeImportModal();
            } else {
                throw new Error(result.error || 'Erro ao importar template');
            }
            
        } catch (error) {
            console.error('Error importing template:', error);
            this.showError('Erro ao importar template');
        }
    }
    
    // Modal management
    closeTemplateActions() {
        document.getElementById('template-actions-modal').style.display = 'none';
        this.selectedTemplate = null;
    }
    
    closeTemplatePreview() {
        document.getElementById('template-preview-modal').style.display = 'none';
        this.selectedTemplate = null;
    }
    
    closeImportModal() {
        document.getElementById('import-modal').style.display = 'none';
        document.getElementById('import-preview').style.display = 'none';
        document.getElementById('confirm-import-btn').disabled = true;
        document.getElementById('import-file-input').value = '';
        this.importedTemplate = null;
    }
    
    closeDeleteModal() {
        document.getElementById('delete-modal').style.display = 'none';
    }
    
    editTemplateFromPreview() {
        this.editTemplate();
        this.closeTemplatePreview();
    }
    
    // Utility methods
    showSuccess(message) {
        // This would show a success toast/alert
        alert(message);
    }
    
    showError(message) {
        // This would show an error toast/alert
        alert('Erro: ' + message);
    }
}

// Global functions
function showImportModal() {
    document.getElementById('import-modal').style.display = 'flex';
}

function closeTemplateActions() {
    templatesManager.closeTemplateActions();
}

function closeTemplatePreview() {
    templatesManager.closeTemplatePreview();
}

function closeImportModal() {
    templatesManager.closeImportModal();
}

function closeDeleteModal() {
    templatesManager.closeDeleteModal();
}

function editTemplate() {
    templatesManager.editTemplate();
}

function duplicateTemplate() {
    templatesManager.duplicateTemplate();
}

function exportTemplate() {
    templatesManager.exportTemplate();
}

function viewTemplateHistory() {
    templatesManager.viewTemplateHistory();
}

function useTemplateForCorrection() {
    templatesManager.useTemplateForCorrection();
}

function deleteTemplate() {
    templatesManager.deleteTemplate();
}

function confirmDelete() {
    templatesManager.confirmDelete();
}

function handleImportFile(input) {
    templatesManager.handleImportFile(input);
}

function confirmImport() {
    templatesManager.confirmImport();
}

function editTemplateFromPreview() {
    templatesManager.editTemplateFromPreview();
}

// Initialize when page loads
let templatesManager;
document.addEventListener('DOMContentLoaded', function() {
    templatesManager = new TemplatesManager();
});
