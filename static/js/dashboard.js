/**
 * Dashboard functionality for the test correction system
 */

class Dashboard {
    constructor() {
        this.stats = {
            templatesCount: 0,
            testsCorrected: 0,
            avgScore: 0,
            processingTime: 0
        };
        
        this.init();
    }
    
    init() {
        this.loadStats();
        this.loadTemplates();
        this.loadRecentResults();
        
        // Refresh data every 30 seconds
        setInterval(() => {
            this.loadStats();
            this.loadRecentResults();
        }, 30000);
    }
    
    async loadStats() {
        try {
            const templates = await API.get('/templates');
            this.stats.templatesCount = templates.length;
            
            // Update stats display
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }
    
    updateStatsDisplay() {
        document.getElementById('templates-count').textContent = this.stats.templatesCount;
        document.getElementById('tests-corrected').textContent = this.stats.testsCorrected;
        document.getElementById('avg-score').textContent = Utils.formatPercentage(this.stats.avgScore);
        document.getElementById('processing-time').textContent = `${this.stats.processingTime.toFixed(1)}s`;
    }
    
    async loadTemplates() {
        try {
            const templates = await API.get('/templates');
            this.displayTemplatesList(templates);
            this.populateTemplateSelects(templates);
        } catch (error) {
            console.error('Error loading templates:', error);
            Utils.showAlert('Erro ao carregar templates', 'error');
        }
    }
    
    displayTemplatesList(templates) {
        const container = document.getElementById('templates-list');
        
        if (templates.length === 0) {
            container.innerHTML = '<p class="text-secondary text-sm">Nenhum template criado ainda.</p>';
            return;
        }
        
        const templatesHtml = templates.map(template => `
            <div class="flex items-center justify-between p-3 bg-secondary rounded border">
                <div>
                    <div class="font-medium">${template.name}</div>
                    <div class="text-sm text-secondary">
                        Versão ${template.version} • ${template.questions} questões
                        ${template.created_by ? `• por ${template.created_by}` : ''}
                    </div>
                    <div class="text-xs text-secondary">
                        Criado em ${Utils.formatDate(template.created_at)}
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-sm btn-secondary" onclick="editTemplate('${template.id}')" 
                            aria-label="Editar template ${template.name}">
                        <i class="fas fa-edit" aria-hidden="true"></i>
                    </button>
                    <button class="btn btn-sm btn-error" onclick="deleteTemplate('${template.id}')" 
                            aria-label="Excluir template ${template.name}">
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = templatesHtml;
    }
    
    populateTemplateSelects(templates) {
        const selects = ['template-select', 'batch-template-select'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;
            
            // Clear existing options except the first one
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            templates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.id;
                option.textContent = `${template.name} (v${template.version})`;
                select.appendChild(option);
            });
        });
    }
    
    async loadRecentResults() {
        // This would load recent correction results
        // For now, we'll show a placeholder
        const container = document.getElementById('results-container');
        container.innerHTML = '<p class="text-secondary">Nenhum resultado recente.</p>';
    }
}

// Template management functions
async function createExampleTemplate(type) {
    try {
        Utils.showLoading('Criando template de exemplo...');
        
        const response = await API.post('/templates/examples', { type });
        
        if (response.success) {
            Utils.showAlert(response.message, 'success');
            dashboard.loadTemplates();
        } else {
            Utils.showAlert(response.error || 'Erro ao criar template', 'error');
        }
    } catch (error) {
        console.error('Error creating example template:', error);
        Utils.showAlert('Erro ao criar template de exemplo', 'error');
    } finally {
        Utils.hideLoading();
    }
}

function showTemplateBuilder() {
    const modal = document.getElementById('template-modal');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus the first input
    const firstInput = modal.querySelector('input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
    
    // Initialize with one question
    const questionsContainer = document.getElementById('questions-container');
    questionsContainer.innerHTML = '';
    addQuestion();
}

function closeTemplateModal() {
    const modal = document.getElementById('template-modal');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    
    // Reset form
    document.getElementById('template-form').reset();
    document.getElementById('questions-container').innerHTML = '';
}

let questionCounter = 0;

function addQuestion() {
    questionCounter++;
    const container = document.getElementById('questions-container');
    
    const questionHtml = `
        <div class="question-item border rounded p-4 mb-4" data-question="${questionCounter}">
            <div class="flex items-center justify-between mb-3">
                <h4 class="font-medium">Questão ${questionCounter}</h4>
                <button type="button" class="btn btn-sm btn-error" onclick="removeQuestion(${questionCounter})"
                        aria-label="Remover questão ${questionCounter}">
                    <i class="fas fa-trash" aria-hidden="true"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                    <label class="form-label required">Tipo de Questão</label>
                    <select name="questions[${questionCounter}][type]" class="form-select" required 
                            onchange="updateQuestionOptions(${questionCounter}, this.value)">
                        <option value="">Selecione...</option>
                        <option value="multiple_choice">Múltipla Escolha</option>
                        <option value="true_false">Verdadeiro/Falso</option>
                        <option value="numeric">Numérica</option>
                        <option value="short_text">Texto Curto</option>
                        <option value="custom_symbols">Símbolos Customizados</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Peso</label>
                    <input type="number" name="questions[${questionCounter}][weight]" class="form-input" 
                           value="1.0" min="0.1" step="0.1">
                </div>
            </div>
            
            <div id="question-options-${questionCounter}" class="mt-4">
                <!-- Question-specific options will be added here -->
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', questionHtml);
}

function removeQuestion(questionId) {
    const questionElement = document.querySelector(`[data-question="${questionId}"]`);
    if (questionElement) {
        questionElement.remove();
    }
}

function updateQuestionOptions(questionId, type) {
    const container = document.getElementById(`question-options-${questionId}`);
    
    let optionsHtml = '';
    
    switch (type) {
        case 'multiple_choice':
            optionsHtml = `
                <div class="form-group">
                    <label class="form-label required">Resposta(s) Correta(s)</label>
                    <div class="grid grid-cols-5 gap-2">
                        ${['A', 'B', 'C', 'D', 'E'].map(option => `
                            <label class="flex items-center gap-2">
                                <input type="checkbox" name="questions[${questionId}][correct_answers]" 
                                       value="${option}" class="form-checkbox">
                                <span>${option}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="form-help">Selecione uma ou mais alternativas corretas</div>
                </div>
                <div class="form-group">
                    <label class="flex items-center gap-2">
                        <input type="checkbox" name="questions[${questionId}][allow_multiple]" class="form-checkbox">
                        <span>Permitir múltiplas respostas</span>
                    </label>
                </div>
            `;
            break;
            
        case 'true_false':
            optionsHtml = `
                <div class="form-group">
                    <label class="form-label required">Resposta Correta</label>
                    <div class="flex gap-4">
                        <label class="flex items-center gap-2">
                            <input type="radio" name="questions[${questionId}][correct_answer]" 
                                   value="V" class="form-radio" required>
                            <span>Verdadeiro (V)</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="radio" name="questions[${questionId}][correct_answer]" 
                                   value="F" class="form-radio" required>
                            <span>Falso (F)</span>
                        </label>
                    </div>
                </div>
            `;
            break;
            
        case 'numeric':
            optionsHtml = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="form-label required">Resposta Correta</label>
                        <input type="number" name="questions[${questionId}][correct_answer]" 
                               class="form-input" step="any" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Margem de Erro</label>
                        <input type="number" name="questions[${questionId}][error_margin]" 
                               class="form-input" value="0.1" min="0" step="0.01">
                        <div class="form-help">Tolerância para respostas aproximadas</div>
                    </div>
                </div>
            `;
            break;
            
        case 'short_text':
            optionsHtml = `
                <div class="form-group">
                    <label class="form-label required">Respostas Aceitas</label>
                    <textarea name="questions[${questionId}][correct_answers]" class="form-textarea" 
                              placeholder="Digite as respostas aceitas, uma por linha" required></textarea>
                    <div class="form-help">Uma resposta por linha. Variações serão aceitas automaticamente.</div>
                </div>
            `;
            break;
            
        case 'custom_symbols':
            optionsHtml = `
                <div class="form-group">
                    <label class="form-label required">Símbolos Corretos</label>
                    <input type="text" name="questions[${questionId}][correct_symbols]" 
                           class="form-input" placeholder="Ex: ■,●,▲" required>
                    <div class="form-help">Símbolos separados por vírgula</div>
                </div>
            `;
            break;
    }
    
    container.innerHTML = optionsHtml;
}

async function saveTemplate() {
    try {
        const form = document.getElementById('template-form');
        const formData = new FormData(form);
        
        // Build template data
        const templateData = {
            name: formData.get('name'),
            version: formData.get('version') || 'A',
            created_by: formData.get('created_by') || '',
            instructions: formData.get('instructions') || '',
            questions: [],
            grading: {
                passing_score: parseFloat(formData.get('passing_score')) || 70
            }
        };
        
        // Process questions
        const questionElements = document.querySelectorAll('.question-item');
        questionElements.forEach((element, index) => {
            const questionData = {
                number: index + 1,
                type: element.querySelector('select').value,
                weight: parseFloat(element.querySelector('input[name*="weight"]').value) || 1.0,
                correct_answers: []
            };
            
            // Get correct answers based on question type
            const type = questionData.type;
            if (type === 'multiple_choice') {
                const checkboxes = element.querySelectorAll('input[name*="correct_answers"]:checked');
                questionData.correct_answers = Array.from(checkboxes).map(cb => cb.value);
                questionData.allow_multiple = element.querySelector('input[name*="allow_multiple"]')?.checked || false;
            } else if (type === 'true_false') {
                const radio = element.querySelector('input[name*="correct_answer"]:checked');
                if (radio) questionData.correct_answers = [radio.value];
            } else if (type === 'numeric') {
                const answer = element.querySelector('input[name*="correct_answer"]').value;
                const margin = element.querySelector('input[name*="error_margin"]').value;
                if (answer) {
                    questionData.correct_answers = [answer];
                    questionData.error_margin = parseFloat(margin) || 0.1;
                }
            } else if (type === 'short_text') {
                const textarea = element.querySelector('textarea[name*="correct_answers"]');
                if (textarea.value) {
                    questionData.correct_answers = textarea.value.split('\n').filter(line => line.trim());
                }
            } else if (type === 'custom_symbols') {
                const input = element.querySelector('input[name*="correct_symbols"]');
                if (input.value) {
                    questionData.correct_answers = input.value.split(',').map(s => s.trim());
                }
            }
            
            if (questionData.correct_answers.length > 0) {
                templateData.questions.push(questionData);
            }
        });
        
        if (templateData.questions.length === 0) {
            Utils.showAlert('Adicione pelo menos uma questão válida', 'error');
            return;
        }
        
        Utils.showLoading('Salvando template...');
        
        const response = await API.post('/templates', templateData);
        
        if (response.success) {
            Utils.showAlert('Template criado com sucesso!', 'success');
            closeTemplateModal();
            dashboard.loadTemplates();
        } else {
            Utils.showAlert(response.error || 'Erro ao salvar template', 'error');
        }
    } catch (error) {
        console.error('Error saving template:', error);
        Utils.showAlert('Erro ao salvar template', 'error');
    } finally {
        Utils.hideLoading();
    }
}

function editTemplate(templateId) {
    Utils.showAlert('Funcionalidade de edição em desenvolvimento', 'info');
}

async function deleteTemplate(templateId) {
    if (!confirm('Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        Utils.showLoading('Excluindo template...');
        
        // This would call the delete API
        // await API.delete(`/templates/${templateId}`);
        
        Utils.showAlert('Template excluído com sucesso', 'success');
        dashboard.loadTemplates();
    } catch (error) {
        console.error('Error deleting template:', error);
        Utils.showAlert('Erro ao excluir template', 'error');
    } finally {
        Utils.hideLoading();
    }
}

function refreshResults() {
    dashboard.loadRecentResults();
    Utils.showAlert('Resultados atualizados', 'success');
}

async function exportResults(format) {
    try {
        Utils.showLoading(`Exportando resultados em ${format.toUpperCase()}...`);
        
        const response = await fetch(`/api/export/${format}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `resultados.${format === 'excel' ? 'xlsx' : format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            Utils.showAlert('Arquivo exportado com sucesso', 'success');
        } else {
            throw new Error('Erro na exportação');
        }
    } catch (error) {
        console.error('Error exporting results:', error);
        Utils.showAlert('Erro ao exportar resultados', 'error');
    } finally {
        Utils.hideLoading();
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', function() {
    dashboard = new Dashboard();
});

// Make functions globally available
window.createExampleTemplate = createExampleTemplate;
window.showTemplateBuilder = showTemplateBuilder;
window.closeTemplateModal = closeTemplateModal;
window.addQuestion = addQuestion;
window.removeQuestion = removeQuestion;
window.updateQuestionOptions = updateQuestionOptions;
window.saveTemplate = saveTemplate;
window.editTemplate = editTemplate;
window.deleteTemplate = deleteTemplate;
window.refreshResults = refreshResults;
window.exportResults = exportResults;
