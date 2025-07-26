/**
 * Template Builder functionality - Advanced Version
 */

class TemplateBuilder {
    constructor() {
        this.currentTemplate = {
            name: '',
            version: '1.0',
            author: '',
            instructions: '',
            grading_scale: '0-10',
            passing_grade: 60,
            questions: [],
            multiple_versions: false,
            version_count: 1
        };
        this.currentQuestionIndex = -1;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateQuestionCount();
        this.updatePreview();
    }
    
    setupEventListeners() {
        // Template settings
        document.getElementById('template-name').addEventListener('input', (e) => {
            this.currentTemplate.name = e.target.value;
            this.updatePreview();
        });
        
        document.getElementById('template-version').addEventListener('input', (e) => {
            this.currentTemplate.version = e.target.value;
        });
        
        document.getElementById('template-author').addEventListener('input', (e) => {
            this.currentTemplate.author = e.target.value;
        });
        
        document.getElementById('template-instructions').addEventListener('input', (e) => {
            this.currentTemplate.instructions = e.target.value;
            this.updatePreview();
        });
        
        document.getElementById('grading-scale').addEventListener('change', (e) => {
            this.currentTemplate.grading_scale = e.target.value;
        });
        
        document.getElementById('passing-grade').addEventListener('input', (e) => {
            this.currentTemplate.passing_grade = parseInt(e.target.value);
        });
    }
    
    addQuestion(type) {
        const questionNumber = this.currentTemplate.questions.length + 1;
        
        const newQuestion = {
            id: `q_${Date.now()}`,
            number: questionNumber,
            type: type,
            weight: 1.0,
            correct_answers: [],
            options: this.getDefaultOptions(type),
            error_margin: type === 'numeric' ? 0.1 : null,
            partial_credit: false
        };
        
        this.currentTemplate.questions.push(newQuestion);
        this.renderQuestion(newQuestion);
        this.updateQuestionCount();
        this.updatePreview();
        
        // Hide empty state
        document.getElementById('empty-state').style.display = 'none';
    }
    
    getDefaultOptions(type) {
        const defaults = {
            'multiple_choice': ['A', 'B', 'C', 'D', 'E'],
            'true_false': ['V', 'F'],
            'numeric': [],
            'short_text': [],
            'custom_symbols': ['■', '●', '▲', '♦'],
            'greek_alphabet': ['α', 'β', 'γ', 'δ', 'ε'],
            'combinations': ['A1', 'A2', 'B1', 'B2', 'C1'],
            'associative': ['1-A', '2-B', '3-C', '4-D', '5-E']
        };
        return defaults[type] || [];
    }
    
    renderQuestion(question) {
        const container = document.getElementById('questions-container');
        
        const questionHtml = `
            <div class="question-item border rounded p-4" data-question-id="${question.id}">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="question-number bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                            ${question.number}
                        </div>
                        <div>
                            <h4 class="font-semibold">${this.getQuestionTypeName(question.type)}</h4>
                            <p class="text-sm text-secondary">Peso: ${question.weight}</p>
                        </div>
                    </div>
                    <div class="flex gap-1">
                        <button class="btn btn-sm btn-secondary" 
                                onclick="templateBuilder.editQuestion('${question.id}')"
                                aria-label="Editar questão ${question.number}">
                            <i class="fas fa-edit" aria-hidden="true"></i>
                        </button>
                        <button class="btn btn-sm btn-error" 
                                onclick="templateBuilder.deleteQuestion('${question.id}')"
                                aria-label="Excluir questão ${question.number}">
                            <i class="fas fa-trash" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
                
                <div class="question-content">
                    ${this.renderQuestionOptions(question)}
                </div>
                
                <div class="mt-3 text-sm text-secondary">
                    <strong>Respostas corretas:</strong> 
                    ${question.correct_answers.length > 0 ? question.correct_answers.join(', ') : 'Não definidas'}
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', questionHtml);
    }
    
    renderQuestionOptions(question) {
        switch (question.type) {
            case 'multiple_choice':
                return `
                    <div class="grid grid-cols-5 gap-2">
                        ${question.options.map(option => `
                            <div class="option-item p-2 border rounded text-center ${question.correct_answers.includes(option) ? 'bg-success text-white' : ''}">
                                ${option}
                            </div>
                        `).join('')}
                    </div>
                `;
            
            case 'true_false':
                return `
                    <div class="flex gap-4">
                        ${question.options.map(option => `
                            <div class="option-item p-3 border rounded text-center min-w-16 ${question.correct_answers.includes(option) ? 'bg-success text-white' : ''}">
                                ${option}
                            </div>
                        `).join('')}
                    </div>
                `;
            
            case 'numeric':
                return `
                    <div class="flex items-center gap-4">
                        <div class="p-3 border rounded bg-gray-50">
                            <i class="fas fa-calculator text-primary" aria-hidden="true"></i>
                            Resposta numérica
                        </div>
                        ${question.error_margin ? `
                            <div class="text-sm text-secondary">
                                Margem de erro: ±${question.error_margin}
                            </div>
                        ` : ''}
                    </div>
                `;
            
            case 'short_text':
                return `
                    <div class="p-3 border rounded bg-gray-50">
                        <i class="fas fa-font text-primary" aria-hidden="true"></i>
                        Resposta em texto curto
                    </div>
                `;
            
            case 'custom_symbols':
                return `
                    <div class="grid grid-cols-4 gap-2">
                        ${question.options.map(option => `
                            <div class="option-item p-3 border rounded text-center ${question.correct_answers.includes(option) ? 'bg-success text-white' : ''}">
                                ${option}
                            </div>
                        `).join('')}
                    </div>
                `;
            
            case 'greek_alphabet':
                return `
                    <div class="grid grid-cols-5 gap-2">
                        ${question.options.map(option => `
                            <div class="option-item p-2 border rounded text-center ${question.correct_answers.includes(option) ? 'bg-success text-white' : ''}">
                                <span class="text-lg">${option}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            
            case 'combinations':
                return `
                    <div class="grid grid-cols-5 gap-2">
                        ${question.options.map(option => `
                            <div class="option-item p-2 border rounded text-center ${question.correct_answers.includes(option) ? 'bg-success text-white' : ''}">
                                <span class="font-mono">${option}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            
            case 'associative':
                return `
                    <div class="space-y-2">
                        <div class="text-sm font-semibold text-secondary mb-2">Associe os itens:</div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <div class="text-xs font-semibold text-secondary">Coluna A</div>
                                ${question.options.slice(0, Math.ceil(question.options.length/2)).map(option => `
                                    <div class="p-2 border rounded text-sm">
                                        ${option.split('-')[0]}
                                    </div>
                                `).join('')}
                            </div>
                            <div class="space-y-1">
                                <div class="text-xs font-semibold text-secondary">Coluna B</div>
                                ${question.options.slice(0, Math.ceil(question.options.length/2)).map(option => `
                                    <div class="p-2 border rounded text-sm">
                                        ${option.split('-')[1]}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="text-xs text-secondary mt-2">
                            Respostas corretas: ${question.correct_answers.join(', ')}
                        </div>
                    </div>
                `;
            
            default:
                return '<div class="text-secondary">Tipo de questão não reconhecido</div>';
        }
    }
    
    getQuestionTypeName(type) {
        const names = {
            'multiple_choice': 'Múltipla Escolha',
            'true_false': 'Verdadeiro/Falso',
            'numeric': 'Numérica',
            'short_text': 'Texto Curto',
            'custom_symbols': 'Símbolos Customizados',
            'greek_alphabet': 'Alfabeto Grego',
            'combinations': 'Combinações',
            'associative': 'Questões Associativas'
        };
        return names[type] || type;
    }
    
        
        getDefaultOptions(type) {
            const defaults = {
                'multiple_choice': ['A', 'B', 'C', 'D', 'E'],
                'true_false': ['V', 'F'],
                'numeric': [],
                'short_text': [],
                'custom_symbols': ['■', '●', '▲', '♦'],
                'greek_alphabet': ['α', 'β', 'γ', 'δ', 'ε'],
                'combinations': ['A1', 'A2', 'B1', 'B2', 'C1'],
                'associative': ['1-A', '2-B', '3-C', '4-D', '5-E']
            };
            return defaults[type] || [];
        }
        
        renderQuestion(question) {
            const container = document.getElementById('questions-container');
                    <label class="form-label">
                        <input type="checkbox" id="partial-credit" ${question.partial_credit ? 'checked' : ''}>
                        Permitir crédito parcial
                    </label>
                </div>
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
                return `
                    <div class="form-group">
                        <label class="form-label">Opções Disponíveis</label>
                        <div class="grid grid-cols-3 gap-2 mb-3">
                            ${question.options.map((option, index) => `
                                <div class="flex items-center gap-2">
                                    <input type="text" class="form-input form-input-sm" 
                                           value="${option}" onchange="updateOption(${index}, this.value)">
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
                                           ${question.correct_answers.includes(option) ? 'checked' : ''}
                                           onchange="updateCorrectAnswers()">
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
                        <label for="correct-number" class="form-label">Resposta Correta</label>
                        <input type="number" id="correct-number" class="form-input" 
                               value="${question.correct_answers[0] || ''}" step="any">
                    </div>
                    
                    <div class="form-group">
                        <label for="error-margin" class="form-label">Margem de Erro</label>
                        <input type="number" id="error-margin" class="form-input" 
                               value="${question.error_margin || 0}" min="0" step="0.01">
                    </div>
                `;
            
            case 'short_text':
                return `
                    <div class="form-group">
                        <label for="correct-text" class="form-label">Respostas Aceitas</label>
                        <textarea id="correct-text" class="form-input" rows="3" 
                                  placeholder="Digite uma resposta por linha">${question.correct_answers.join('\n')}</textarea>
                        <div class="form-help">
                            Digite cada variação de resposta aceita em uma linha separada
                        </div>
                    </div>
                `;
            
            case 'greek_alphabet':
            case 'combinations':
                return `
                    <div class="form-group">
                        <label class="form-label">Opções Disponíveis</label>
                        <div class="grid grid-cols-3 gap-2 mb-3">
                            ${question.options.map((option, index) => `
                                <div class="flex items-center gap-2">
                                    <input type="text" class="form-input form-input-sm" 
                                           value="${option}" onchange="updateOption(${index}, this.value)">
                                </div>
                            `).join('')}
                        </div>
                        <button type="button" class="btn btn-sm btn-secondary" onclick="addNewOption()">
                            <i class="fas fa-plus" aria-hidden="true"></i>
                            Adicionar Opção
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Respostas Corretas</label>
                        <div class="grid grid-cols-3 gap-2">
                            ${question.options.map(option => `
                                <label class="flex items-center gap-2">
                                    <input type="checkbox" value="${option}" 
                                           ${question.correct_answers.includes(option) ? 'checked' : ''}
                                           onchange="updateCorrectAnswers()">
                                    <span>${option}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
            
            case 'associative':
                return `
                    <div class="form-group">
                        <label class="form-label">Pares de Associação</label>
                        <div class="space-y-2 mb-3">
                            ${question.options.map((option, index) => {
                                const [left, right] = option.split('-');
                                return `
                                    <div class="grid grid-cols-2 gap-2">
                                        <input type="text" class="form-input form-input-sm" 
                                               value="${left}" placeholder="Item A" 
                                               onchange="updateAssociativePair(${index}, 'left', this.value)">
                                        <input type="text" class="form-input form-input-sm" 
                                               value="${right}" placeholder="Item B" 
                                               onchange="updateAssociativePair(${index}, 'right', this.value)">
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <button type="button" class="btn btn-sm btn-secondary" onclick="addAssociativePair()">
                            <i class="fas fa-plus" aria-hidden="true"></i>
                            Adicionar Par
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Associações Corretas</label>
                        <div class="space-y-1">
                            ${question.options.map(option => `
                                <label class="flex items-center gap-2">
                                    <input type="checkbox" value="${option}" 
                                           ${question.correct_answers.includes(option) ? 'checked' : ''}
                                           onchange="updateCorrectAnswers()">
                                    <span class="text-sm">${option}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
            
            default:
                return '<div class="text-secondary">Editor não disponível para este tipo</div>';
        }
    }
    
    deleteQuestion(questionId) {
        const question = this.currentTemplate.questions.find(q => q.id === questionId);
        if (!question) return;
        
        const confirmed = confirm(`Tem certeza que deseja excluir a Questão ${question.number}?`);
        if (!confirmed) return;
        
        // Remove question
        this.currentTemplate.questions = this.currentTemplate.questions.filter(q => q.id !== questionId);
        
        // Renumber questions
        this.currentTemplate.questions.forEach((q, index) => {
            q.number = index + 1;
        });
        
        // Re-render all questions
        this.renderAllQuestions();
        this.updateQuestionCount();
        this.updatePreview();
    }
    
    renderAllQuestions() {
        const container = document.getElementById('questions-container');
        container.innerHTML = '';
        
        if (this.currentTemplate.questions.length === 0) {
            document.getElementById('empty-state').style.display = 'block';
        } else {
            document.getElementById('empty-state').style.display = 'none';
            this.currentTemplate.questions.forEach(question => {
                this.renderQuestion(question);
            });
        }
    }
    
    updateQuestionCount() {
        document.getElementById('question-count').textContent = this.currentTemplate.questions.length;
    }
    
    updatePreview() {
        const preview = document.getElementById('template-preview');
        
        if (this.currentTemplate.questions.length === 0) {
            preview.innerHTML = `
                <div class="text-center text-secondary py-8">
                    <i class="fas fa-file-alt fa-2x mb-2" aria-hidden="true"></i>
                    <p>A visualização aparecerá aqui conforme você adiciona questões</p>
                </div>
            `;
            return;
        }
        
        const previewHtml = `
            <div class="template-preview-content">
                <div class="text-center mb-6">
                    <h2 class="text-xl font-bold">${this.currentTemplate.name || 'Template sem nome'}</h2>
                    <p class="text-secondary">${this.currentTemplate.instructions || 'Sem instruções'}</p>
                </div>
                
                <div class="space-y-4">
                    ${this.currentTemplate.questions.map(question => `
                        <div class="preview-question border rounded p-3">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="font-semibold">${question.number}.</span>
                                <span class="text-sm text-secondary">(${this.getQuestionTypeName(question.type)} - Peso: ${question.weight})</span>
                            </div>
                            ${this.renderQuestionOptions(question)}
                        </div>
                    `).join('')}
                </div>
                
                <div class="mt-6 text-center text-sm text-secondary">
                    Total de questões: ${this.currentTemplate.questions.length} | 
                    Peso total: ${this.currentTemplate.questions.reduce((sum, q) => sum + q.weight, 0)}
                </div>
            </div>
        `;
        
        preview.innerHTML = previewHtml;
    }
    
    async saveTemplate() {
        try {
            // Validate template
            if (!this.currentTemplate.name.trim()) {
                Utils.showAlert('Nome do template é obrigatório', 'error');
                return;
            }
            
            if (this.currentTemplate.questions.length === 0) {
                Utils.showAlert('Adicione pelo menos uma questão', 'error');
                return;
            }
            
            // Check if all questions have correct answers
            const questionsWithoutAnswers = this.currentTemplate.questions.filter(q => q.correct_answers.length === 0);
            if (questionsWithoutAnswers.length > 0) {
                Utils.showAlert(`Defina respostas corretas para todas as questões (faltam: ${questionsWithoutAnswers.map(q => q.number).join(', ')})`, 'error');
                return;
            }
            
            Utils.showLoading('Salvando template...');
            
            const response = await API.post('/templates', this.currentTemplate);
            
            if (response.success) {
                Utils.showAlert('Template salvo com sucesso!', 'success');
                // Optionally redirect to templates list
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                throw new Error(response.error || 'Erro ao salvar template');
            }
            
        } catch (error) {
            console.error('Error saving template:', error);
            Utils.showAlert('Erro ao salvar template', 'error');
        } finally {
            Utils.hideLoading();
        }
    }
    
    async loadTemplate() {
        try {
            const modal = document.getElementById('load-template-modal');
            const templatesContainer = document.getElementById('available-templates');
            
            Utils.showLoading('Carregando templates...');
            
            const templates = await API.get('/templates');
            
            const templatesHtml = templates.map(template => `
                <div class="template-load-item border rounded p-3 cursor-pointer hover:bg-gray-50" 
                     onclick="templateBuilder.selectTemplate('${template.id}')">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-semibold">${template.name}</h4>
                            <p class="text-sm text-secondary">
                                ${template.questions} questões • v${template.version} • ${template.created_by}
                            </p>
                        </div>
                        <i class="fas fa-chevron-right text-secondary" aria-hidden="true"></i>
                    </div>
                </div>
            `).join('');
            
            templatesContainer.innerHTML = templatesHtml;
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');
            
        } catch (error) {
            console.error('Error loading templates:', error);
            Utils.showAlert('Erro ao carregar templates', 'error');
        } finally {
            Utils.hideLoading();
        }
    }
    
    selectTemplate(templateId) {
        // In a real implementation, this would load the full template data
        Utils.showAlert('Funcionalidade de carregamento em desenvolvimento', 'info');
        this.closeLoadModal();
    }
    
    closeQuestionModal() {
        const modal = document.getElementById('question-modal');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
    
    closeLoadModal() {
        const modal = document.getElementById('load-template-modal');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
    
    testTemplate() {
        if (this.currentTemplate.questions.length === 0) {
            Utils.showAlert('Adicione questões antes de testar', 'error');
            return;
        }
        
        Utils.showAlert('Funcionalidade de teste em desenvolvimento', 'info');
    }
    
    togglePreview() {
        const preview = document.getElementById('template-preview');
        preview.classList.toggle('expanded');
    }
}

// Global functions for modal interactions
function updateOption(index, value) {
    if (templateBuilder.currentQuestionIndex >= 0) {
        const question = templateBuilder.currentTemplate.questions[templateBuilder.currentQuestionIndex];
        if (question && question.options[index] !== undefined) {
            question.options[index] = value;
            // Update the editor display
            const modal = document.getElementById('question-modal');
            const editorContent = modal.querySelector('.question-editor-content');
            editorContent.innerHTML = templateBuilder.renderQuestionEditor(question);
        }
    }
}

function updateCorrectAnswers() {
    if (templateBuilder.currentQuestionIndex >= 0) {
        const question = templateBuilder.currentTemplate.questions[templateBuilder.currentQuestionIndex];
        if (question) {
            const checkboxes = document.querySelectorAll('#question-modal input[type="checkbox"]:checked');
            const radioButtons = document.querySelectorAll('#question-modal input[type="radio"]:checked');
            
            question.correct_answers = [];
            
            // Handle checkboxes (multiple selection)
            checkboxes.forEach(cb => {
                question.correct_answers.push(cb.value);
            });
            
            // Handle radio buttons (single selection)
            radioButtons.forEach(rb => {
                question.correct_answers.push(rb.value);
            });
            
            // Handle numeric input
            const numericInput = document.getElementById('correct-number');
            if (numericInput && numericInput.value) {
                question.correct_answers = [numericInput.value];
            }
            
            // Handle text area
            const textArea = document.getElementById('correct-text');
            if (textArea && textArea.value) {
                question.correct_answers = textArea.value.split('\n').filter(line => line.trim());
            }
            
            // Handle error margin for numeric questions
            const errorMarginInput = document.getElementById('error-margin');
            if (errorMarginInput && errorMarginInput.value) {
                question.error_margin = parseFloat(errorMarginInput.value);
            }
        }
    }
}

function addNewOption() {
    if (templateBuilder.currentQuestionIndex >= 0) {
        const question = templateBuilder.currentTemplate.questions[templateBuilder.currentQuestionIndex];
        if (question) {
            // Add new option based on question type
            let newOption = '';
            switch (question.type) {
                case 'multiple_choice':
                    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    newOption = letters[question.options.length] || 'Z';
                    break;
                case 'greek_alphabet':
                    const greek = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ'];
                    newOption = greek[question.options.length] || 'ω';
                    break;
                case 'combinations':
                    const letter = String.fromCharCode(65 + Math.floor(question.options.length / 3));
                    const number = (question.options.length % 3) + 1;
                    newOption = `${letter}${number}`;
                    break;
                case 'custom_symbols':
                    const symbols = ['■', '●', '▲', '♦', '★', '◆', '▼', '◀'];
                    newOption = symbols[question.options.length] || '●';
                    break;
                default:
                    newOption = `Opção ${question.options.length + 1}`;
            }
            
            question.options.push(newOption);
            
            // Refresh the editor
            const modal = document.getElementById('question-modal');
            const editorContent = modal.querySelector('.question-editor-content');
            editorContent.innerHTML = templateBuilder.renderQuestionEditor(question);
        }
    }
}

function updateAssociativePair(index, side, value) {
    if (templateBuilder.currentQuestionIndex >= 0) {
        const question = templateBuilder.currentTemplate.questions[templateBuilder.currentQuestionIndex];
        if (question && question.options[index]) {
            const [left, right] = question.options[index].split('-');
            if (side === 'left') {
                question.options[index] = `${value}-${right}`;
            } else {
                question.options[index] = `${left}-${value}`;
            }
        }
    }
}

function addAssociativePair() {
    if (templateBuilder.currentQuestionIndex >= 0) {
        const question = templateBuilder.currentTemplate.questions[templateBuilder.currentQuestionIndex];
        if (question) {
            const pairNumber = question.options.length + 1;
            const letter = String.fromCharCode(64 + pairNumber); // A, B, C...
            question.options.push(`${pairNumber}-${letter}`);
            
            // Refresh the editor
            const modal = document.getElementById('question-modal');
            const editorContent = modal.querySelector('.question-editor-content');
            editorContent.innerHTML = templateBuilder.renderQuestionEditor(question);
        }
    }
}

function saveQuestion() {
    if (templateBuilder.currentQuestionIndex >= 0) {
        // Update question weight
        const weightInput = document.getElementById('question-weight');
        if (weightInput) {
            const question = templateBuilder.currentTemplate.questions[templateBuilder.currentQuestionIndex];
            question.weight = parseFloat(weightInput.value) || 1.0;
        }
        
        // Update partial credit setting
        const partialCreditCheckbox = document.getElementById('partial-credit');
        if (partialCreditCheckbox) {
            const question = templateBuilder.currentTemplate.questions[templateBuilder.currentQuestionIndex];
            question.partial_credit = partialCreditCheckbox.checked;
        }
        
        // Final update of correct answers
        updateCorrectAnswers();
        
        // Save and refresh
        templateBuilder.closeQuestionModal();
        templateBuilder.renderAllQuestions();
        templateBuilder.updatePreview();
        Utils.showAlert('Questão salva com sucesso', 'success');
    }
}

function loadTemplate() {
    templateBuilder.loadTemplate();
}

function saveTemplate() {
    templateBuilder.saveTemplate();
}

function testTemplate() {
    templateBuilder.testTemplate();
}

function togglePreview() {
    templateBuilder.togglePreview();
}

function closeQuestionModal() {
    templateBuilder.closeQuestionModal();
}

function closeLoadModal() {
    templateBuilder.closeLoadModal();
}

function addQuestion(type) {
    templateBuilder.addQuestion(type);
}

// Initialize when DOM is loaded
let templateBuilder;
document.addEventListener('DOMContentLoaded', function() {
    templateBuilder = new TemplateBuilder();
});

// Export for global access
window.templateBuilder = templateBuilder;
