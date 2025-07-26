/**
 * Template Builder - Sistema de Correção Automática
 * Funcionalidade completa para criação e edição de templates de prova
 */

class TemplateBuilder {
    constructor() {
        this.questions = [];
        this.currentQuestion = null;
        this.editingIndex = -1;
        this.currentTemplate = {
            name: '',
            subject: '',
            author: '',
            instructions: '',
            grading_scale: '0-10',
            passing_grade: 60,
            multiple_versions: false,
            version_count: 1
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updatePreview();
    }

    setupEventListeners() {
        // Template settings
        const templateName = document.getElementById('template-name');
        if (templateName) {
            templateName.addEventListener('input', (e) => {
                this.currentTemplate.name = e.target.value;
                this.updatePreview();
            });
        }
        
        const templateSubject = document.getElementById('template-subject');
        if (templateSubject) {
            templateSubject.addEventListener('input', (e) => {
                this.currentTemplate.subject = e.target.value;
            });
        }
        
        const templateAuthor = document.getElementById('template-author');
        if (templateAuthor) {
            templateAuthor.addEventListener('input', (e) => {
                this.currentTemplate.author = e.target.value;
            });
        }
        
        const templateInstructions = document.getElementById('template-instructions');
        if (templateInstructions) {
            templateInstructions.addEventListener('input', (e) => {
                this.currentTemplate.instructions = e.target.value;
                this.updatePreview();
            });
        }
        
        const gradingScale = document.getElementById('grading-scale');
        if (gradingScale) {
            gradingScale.addEventListener('change', (e) => {
                this.currentTemplate.grading_scale = e.target.value;
            });
        }
        
        const passingGrade = document.getElementById('passing-grade');
        if (passingGrade) {
            passingGrade.addEventListener('input', (e) => {
                this.currentTemplate.passing_grade = parseInt(e.target.value);
            });
        }
        
        const multipleVersions = document.getElementById('multiple-versions');
        if (multipleVersions) {
            multipleVersions.addEventListener('change', (e) => {
                this.currentTemplate.multiple_versions = e.target.checked;
                const versionContainer = document.getElementById('version-count-container');
                if (versionContainer) {
                    versionContainer.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        }
        
        const versionCount = document.getElementById('version-count');
        if (versionCount) {
            versionCount.addEventListener('input', (e) => {
                this.currentTemplate.version_count = parseInt(e.target.value);
            });
        }

        // Question type buttons
        document.querySelectorAll('.question-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.closest('.question-type-btn').dataset.type;
                this.addQuestion(type);
            });
        });

        // Save template button
        const saveBtn = document.getElementById('save-template');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveTemplate();
            });
        }

        // Load template button
        const loadBtn = document.getElementById('load-template');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                this.showLoadTemplateModal();
            });
        }

        // Preview template button
        const previewBtn = document.getElementById('preview-template');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.showPreviewModal();
            });
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Question editor form
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'question-form') {
                e.preventDefault();
                this.saveQuestion();
            }
        });
    }

    // Question Management Methods
    addQuestion(type) {
        const question = {
            id: Date.now(),
            number: this.questions.length + 1,
            type: type,
            weight: 1,
            partial_credit: false,
            error_margin: 0,
            options: this.getDefaultOptions(type),
            correct_answers: [],
            acceptable_variations: []
        };

        this.currentQuestion = question;
        this.editingIndex = -1;
        this.showQuestionEditor(question);
    }

    editQuestion(index) {
        if (this.questions[index]) {
            this.currentQuestion = { ...this.questions[index] };
            this.editingIndex = index;
            this.showQuestionEditor(this.currentQuestion);
        }
    }

    deleteQuestion(index) {
        if (confirm('Tem certeza que deseja excluir esta questão?')) {
            this.questions.splice(index, 1);
            this.renumberQuestions();
            this.updatePreview();
        }
    }

    renumberQuestions() {
        this.questions.forEach((question, index) => {
            question.number = index + 1;
        });
    }

    getDefaultOptions(type) {
        const defaults = {
            'multiple_choice': ['A', 'B', 'C', 'D', 'E'],
            'true_false': ['V', 'F'],
            'custom_symbols': ['✓', '✗', '○', '●'],
            'greek_alphabet': ['α', 'β', 'γ', 'δ', 'ε'],
            'combinations': ['A1', 'A2', 'B1', 'B2', 'C1'],
            'associative': ['I-A', 'II-B', 'III-C', 'IV-D'],
            'numeric': [],
            'short_text': []
        };
        return defaults[type] || [];
    }

    getQuestionTypeLabel(type) {
        const labels = {
            'multiple_choice': 'Múltipla Escolha',
            'true_false': 'Verdadeiro/Falso',
            'numeric': 'Numérica',
            'short_text': 'Texto Curto',
            'custom_symbols': 'Símbolos Customizados',
            'greek_alphabet': 'Alfabeto Grego',
            'combinations': 'Combinações',
            'associative': 'Questões Associativas'
        };
        return labels[type] || type;
    }

    // Question Editor Interface Methods
    showQuestionEditor(question) {
        const modal = document.getElementById('question-editor-modal');
        if (!modal) return;
        
        const content = modal.querySelector('.modal-content');
        if (!content) return;
        
        const modalHtml = `
            <div class="modal-header">
                <h3>${this.editingIndex >= 0 ? 'Editar' : 'Adicionar'} Questão</h3>
                <button type="button" class="modal-close" aria-label="Fechar modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="question-form">
                    <div class="form-group">
                        <label class="form-label">Tipo da Questão</label>
                        <select id="question-type" class="form-input" disabled>
                            <option value="${question.type}">${this.getQuestionTypeLabel(question.type)}</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Peso da Questão</label>
                        <input type="number" id="question-weight" class="form-input" 
                               value="${question.weight}" min="0.1" step="0.1" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">
                            <input type="checkbox" id="partial-credit" ${question.partial_credit ? 'checked' : ''}>
                            Permitir crédito parcial
                        </label>
                    </div>
                    
                    ${this.renderQuestionEditor(question)}
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Questão</button>
                    </div>
                </form>
            </div>
        `;
        
        content.innerHTML = modalHtml;
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    }

    renderQuestionEditor(question) {
        switch (question.type) {
            case 'multiple_choice':
            case 'custom_symbols':
            case 'greek_alphabet':
                return `
                    <div class="form-group">
                        <label class="form-label">Opções Disponíveis</label>
                        <div class="grid grid-cols-3 gap-2 mb-3">
                            ${question.options.map((option, index) => `
                                <div class="flex items-center gap-2">
                                    <input type="text" class="form-input form-input-sm" 
                                           value="${option}" data-option-index="${index}">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Respostas Corretas</label>
                        <div class="grid grid-cols-3 gap-2">
                            ${question.options.map(option => `
                                <label class="flex items-center gap-2">
                                    <input type="checkbox" value="${option}" 
                                           ${question.correct_answers.includes(option) ? 'checked' : ''}>
                                    <span>${option}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
            
            case 'true_false':
                return `
                    <div class="form-group">
                        <label class="form-label">Resposta Correta</label>
                        <div class="flex gap-4">
                            <label class="flex items-center gap-2">
                                <input type="radio" name="correct-answer" value="V" 
                                       ${question.correct_answers.includes('V') ? 'checked' : ''}>
                                <span>Verdadeiro</span>
                            </label>
                            <label class="flex items-center gap-2">
                                <input type="radio" name="correct-answer" value="F" 
                                       ${question.correct_answers.includes('F') ? 'checked' : ''}>
                                <span>Falso</span>
                            </label>
                        </div>
                    </div>
                `;
            
            case 'numeric':
                return `
                    <div class="form-group">
                        <label class="form-label">Resposta Correta</label>
                        <input type="number" id="numeric-answer" class="form-input" 
                               value="${question.correct_answers[0] || ''}" step="any">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Margem de Erro</label>
                        <input type="number" id="error-margin" class="form-input" 
                               value="${question.error_margin || 0}" min="0" step="0.01">
                    </div>
                `;
            
            case 'short_text':
                return `
                    <div class="form-group">
                        <label class="form-label">Respostas Aceitas</label>
                        <textarea id="text-answers" class="form-input" rows="3" 
                                  placeholder="Digite as respostas aceitas, uma por linha">${question.correct_answers.join('\n')}</textarea>
                    </div>
                `;
            
            case 'combinations':
                return `
                    <div class="form-group">
                        <label class="form-label">Combinações Corretas</label>
                        <div class="grid grid-cols-2 gap-2">
                            ${question.options.map(option => `
                                <label class="flex items-center gap-2">
                                    <input type="checkbox" value="${option}" 
                                           ${question.correct_answers.includes(option) ? 'checked' : ''}>
                                    <span>${option}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
            
            case 'associative':
                return `
                    <div class="form-group">
                        <label class="form-label">Associações Corretas</label>
                        <div class="grid grid-cols-2 gap-2">
                            ${question.options.map(option => `
                                <label class="flex items-center gap-2">
                                    <input type="checkbox" value="${option}" 
                                           ${question.correct_answers.includes(option) ? 'checked' : ''}>
                                    <span>${option}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
            
            default:
                return '<p>Tipo de questão não suportado.</p>';
        }
    }

    // Question Save and Validation Methods
    saveQuestion() {
        const form = document.getElementById('question-form');
        if (!form) return;
        
        // Get basic question data
        const weightInput = document.getElementById('question-weight');
        const partialCreditInput = document.getElementById('partial-credit');
        
        if (weightInput) {
            this.currentQuestion.weight = parseFloat(weightInput.value) || 1;
        }
        
        if (partialCreditInput) {
            this.currentQuestion.partial_credit = partialCreditInput.checked;
        }
        
        // Get correct answers based on question type
        this.getCorrectAnswers();
        
        // Save or update question
        if (this.editingIndex >= 0) {
            this.questions[this.editingIndex] = { ...this.currentQuestion };
        } else {
            this.questions.push({ ...this.currentQuestion });
        }
        
        this.closeModal(document.getElementById('question-editor-modal'));
        this.updatePreview();
        this.showAlert('Questão salva com sucesso!', 'success');
    }
    
    getCorrectAnswers() {
        const type = this.currentQuestion.type;
        
        switch (type) {
            case 'multiple_choice':
            case 'custom_symbols':
            case 'greek_alphabet':
            case 'combinations':
            case 'associative':
                const checkboxes = document.querySelectorAll('#question-form input[type="checkbox"]:not(#partial-credit)');
                this.currentQuestion.correct_answers = Array.from(checkboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);
                break;
                
            case 'true_false':
                const radio = document.querySelector('#question-form input[name="correct-answer"]:checked');
                this.currentQuestion.correct_answers = radio ? [radio.value] : [];
                break;
                
            case 'numeric':
                const numericAnswer = document.getElementById('numeric-answer');
                const errorMargin = document.getElementById('error-margin');
                if (numericAnswer && numericAnswer.value) {
                    this.currentQuestion.correct_answers = [numericAnswer.value];
                }
                if (errorMargin) {
                    this.currentQuestion.error_margin = parseFloat(errorMargin.value) || 0;
                }
                break;
                
            case 'short_text':
                const textAnswers = document.getElementById('text-answers');
                if (textAnswers && textAnswers.value) {
                    this.currentQuestion.correct_answers = textAnswers.value
                        .split('\n')
                        .map(answer => answer.trim())
                        .filter(answer => answer.length > 0);
                }
                break;
        }
    }

    // Rendering and Preview Methods
    renderQuestion(question) {
        const container = document.getElementById('questions-container');
        if (!container) return;
        
        const questionElement = document.createElement('div');
        questionElement.className = 'question-item border rounded p-4 mb-3';
        questionElement.innerHTML = `
            <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                    <div class="question-number bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        ${question.number}
                    </div>
                    <div>
                        <h4 class="font-semibold">${this.getQuestionTypeLabel(question.type)}</h4>
                        <p class="text-sm text-secondary">Peso: ${question.weight}</p>
                    </div>
                </div>
                <div class="flex gap-1">
                    <button class="btn btn-sm btn-outline" 
                            onclick="templateBuilder.editQuestion(${question.number - 1})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" 
                            onclick="templateBuilder.deleteQuestion(${question.number - 1})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
            <div class="question-content">
                <p><strong>Respostas corretas:</strong> ${question.correct_answers.length > 0 ? question.correct_answers.join(', ') : 'Não definidas'}</p>
                ${question.partial_credit ? '<p class="text-sm text-success">✓ Crédito parcial habilitado</p>' : ''}
            </div>
        `;
        container.appendChild(questionElement);
    }

    updatePreview() {
        // Update question count
        const questionCount = document.getElementById('question-count');
        if (questionCount) {
            questionCount.textContent = this.questions.length;
        }
        
        // Update questions container
        const container = document.getElementById('questions-container');
        if (container) {
            container.innerHTML = '';
            this.questions.forEach(question => this.renderQuestion(question));
            
            // Show/hide empty state
            const emptyState = document.getElementById('empty-state');
            if (emptyState) {
                emptyState.style.display = this.questions.length === 0 ? 'block' : 'none';
            }
        }
        
        // Update preview panel
        const preview = document.getElementById('template-preview');
        if (preview) {
            const totalWeight = this.questions.reduce((sum, q) => sum + q.weight, 0);
            preview.innerHTML = `
                <h4>${this.currentTemplate.name || 'Template sem nome'}</h4>
                <p>${this.currentTemplate.instructions || 'Sem instruções'}</p>
                <p><strong>Questões:</strong> ${this.questions.length}</p>
                <p><strong>Peso total:</strong> ${totalWeight}</p>
            `;
        }
    }

    // Template Management Methods
    saveTemplate() {
        if (!this.validateTemplate()) return;
        
        const templateData = {
            ...this.currentTemplate,
            questions: this.questions,
            created_at: new Date().toISOString(),
            total_weight: this.questions.reduce((sum, q) => sum + q.weight, 0)
        };
        
        fetch('/api/templates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(templateData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showAlert('Template salvo com sucesso!', 'success');
                if (data.versions) {
                    this.showAlert(`Criadas ${data.versions.length} versões: ${data.versions.join(', ')}`, 'info');
                }
            } else {
                this.showAlert('Erro ao salvar template: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.showAlert('Erro ao salvar template', 'error');
        });
    }

    validateTemplate() {
        if (!this.currentTemplate.name.trim()) {
            this.showAlert('Nome do template é obrigatório', 'error');
            return false;
        }
        
        if (this.questions.length === 0) {
            this.showAlert('Adicione pelo menos uma questão', 'error');
            return false;
        }
        
        // Validate that all questions have correct answers
        const invalidQuestions = this.questions.filter(q => q.correct_answers.length === 0);
        if (invalidQuestions.length > 0) {
            this.showAlert(`Questões ${invalidQuestions.map(q => q.number).join(', ')} não têm respostas corretas definidas`, 'error');
            return false;
        }
        
        return true;
    }

    showLoadTemplateModal() {
        const modal = document.getElementById('load-template-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.loadTemplatesList();
        }
    }

    loadTemplatesList() {
        fetch('/api/templates')
        .then(response => response.json())
        .then(templates => {
            const container = document.getElementById('templates-list');
            if (container) {
                container.innerHTML = templates.map(template => `
                    <div class="template-item border rounded p-3 cursor-pointer hover:bg-gray-50" 
                         onclick="templateBuilder.loadTemplate('${template.id}')">
                        <h5 class="font-semibold">${template.name}</h5>
                        <p class="text-sm text-secondary">${template.subject || 'Sem matéria'}</p>
                        <p class="text-xs text-secondary">${template.questions?.length || 0} questões</p>
                    </div>
                `).join('');
            }
        })
        .catch(error => {
            console.error('Error loading templates:', error);
            this.showAlert('Erro ao carregar templates', 'error');
        });
    }

    showPreviewModal() {
        const modal = document.getElementById('preview-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) {
            console.log(`${type.toUpperCase()}: ${message}`);
            return;
        }
        
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type}`;
        alertElement.innerHTML = `
            <span>${message}</span>
            <button class="alert-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        alertContainer.appendChild(alertElement);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertElement.parentElement) {
                alertElement.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
let templateBuilder;
document.addEventListener('DOMContentLoaded', function() {
    templateBuilder = new TemplateBuilder();
});

// Export for global access
window.templateBuilder = templateBuilder;