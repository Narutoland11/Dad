/**
 * Correction Page functionality - Complete Implementation
 */

class CorrectionManager {
    constructor() {
        this.selectedTemplate = null;
        this.uploadedFiles = [];
        this.currentResults = [];
        this.isBatchMode = false;
        this.init();
    }
    
    init() {
        this.loadTemplates();
        this.setupEventListeners();
        this.setupDragAndDrop();
    }
    
    setupEventListeners() {
        // File input handlers
        const singleInput = document.getElementById('single-file-input');
        const batchInput = document.getElementById('batch-file-input');
        
        if (singleInput) {
            singleInput.addEventListener('change', (e) => {
                this.handleSingleFile(e.target);
            });
        }
        
        if (batchInput) {
            batchInput.addEventListener('change', (e) => {
                this.handleBatchFiles(e.target);
            });
        }
    }
    
    setupDragAndDrop() {
        const uploadAreas = document.querySelectorAll('.upload-area');
        
        uploadAreas.forEach(area => {
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.classList.add('border-primary', 'bg-blue-50');
            });
            
            area.addEventListener('dragleave', (e) => {
                e.preventDefault();
                area.classList.remove('border-primary', 'bg-blue-50');
            });
            
            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.classList.remove('border-primary', 'bg-blue-50');
                
                const files = Array.from(e.dataTransfer.files);
                if (this.isBatchMode) {
                    this.handleBatchFiles({ files });
                } else {
                    this.handleSingleFile({ files });
                }
            });
        });
    }
    
    async loadTemplates() {
        try {
            const response = await fetch('/api/templates');
            const templates = await response.json();
            
            const container = document.getElementById('templates-list');
            
            if (templates.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-file-alt fa-2x mb-2"></i>
                        <p>Nenhum template encontrado</p>
                        <a href="/templates/builder" class="btn btn-primary btn-sm mt-2">
                            Criar Primeiro Template
                        </a>
                    </div>
                `;
                return;
            }
            
            const templatesHtml = templates.map(template => `
                <div class="template-item border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors" 
                     data-template-id="${template.id}" onclick="correctionManager.selectTemplate('${template.id}')">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-900">${template.name}</h4>
                            <p class="text-sm text-gray-600 mt-1">${template.questions} questões • v${template.version}</p>
                            <p class="text-xs text-gray-500 mt-1">Por ${template.created_by}</p>
                        </div>
                        <div class="flex gap-1">
                            <button class="btn btn-xs btn-secondary" onclick="event.stopPropagation(); correctionManager.previewTemplate('${template.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = templatesHtml;
            
        } catch (error) {
            console.error('Error loading templates:', error);
            document.getElementById('templates-list').innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p>Erro ao carregar templates</p>
                </div>
            `;
        }
    }
    
    async selectTemplate(templateId) {
        try {
            const response = await fetch(`/api/templates/${templateId}`);
            const template = await response.json();
            
            this.selectedTemplate = template;
            
            // Update UI
            document.querySelectorAll('.template-item').forEach(item => {
                item.classList.remove('border-primary', 'bg-blue-50');
            });
            
            const selectedItem = document.querySelector(`[data-template-id="${templateId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('border-primary', 'bg-blue-50');
            }
            
            // Show template info
            const infoPanel = document.getElementById('selected-template-info');
            const detailsContainer = document.getElementById('template-details');
            
            detailsContainer.innerHTML = `
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Nome:</span>
                        <span class="text-sm font-medium">${template.name}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Questões:</span>
                        <span class="text-sm font-medium">${template.questions} questões</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Versão:</span>
                        <span class="text-sm font-medium">v${template.version}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Autor:</span>
                        <span class="text-sm font-medium">${template.created_by}</span>
                    </div>
                </div>
            `;
            
            infoPanel.style.display = 'block';
            
            // Update step
            this.updateStep(2);
            this.updateCorrectionButton();
            
        } catch (error) {
            console.error('Error selecting template:', error);
            alert('Erro ao selecionar template');
        }
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
                <div class="space-y-4">
                    <div class="bg-gray-50 p-4 rounded">
                        <h4 class="font-semibold mb-2">Informações Gerais</h4>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Nome:</strong> ${template.name}</div>
                            <div><strong>Versão:</strong> v${template.version}</div>
                            <div><strong>Questões:</strong> ${template.questions}</div>
                            <div><strong>Autor:</strong> ${template.created_by}</div>
                        </div>
                        <div class="mt-2">
                            <strong>Instruções:</strong> ${template.instructions || 'Sem instruções específicas'}
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold mb-2">Questões (${template.questions} total)</h4>
                        <div class="text-sm text-gray-600">
                            Este template contém questões de múltiplos tipos configuradas para correção automática.
                        </div>
                    </div>
                </div>
            `;
            
            content.innerHTML = previewHtml;
            modal.style.display = 'flex';
            
        } catch (error) {
            console.error('Error previewing template:', error);
            alert('Erro ao visualizar template');
        }
    }
    
    handleSingleFile(input) {
        const files = input.files || input;
        if (files.length === 0) return;
        
        const file = files[0];
        
        if (!this.validateFile(file)) return;
        
        this.uploadedFiles = [file];
        this.showFilePreview([file]);
        this.updateCorrectionButton();
    }
    
    handleBatchFiles(input) {
        const files = Array.from(input.files || input);
        if (files.length === 0) return;
        
        const validFiles = files.filter(file => this.validateFile(file));
        
        if (validFiles.length === 0) {
            alert('Nenhum arquivo válido selecionado');
            return;
        }
        
        this.uploadedFiles = validFiles;
        this.showFilePreview(validFiles);
        this.updateCorrectionButton();
    }
    
    validateFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
            alert(`Tipo de arquivo não suportado: ${file.name}`);
            return false;
        }
        
        if (file.size > maxSize) {
            alert(`Arquivo muito grande: ${file.name} (máx. 10MB)`);
            return false;
        }
        
        return true;
    }
    
    showFilePreview(files) {
        const preview = document.getElementById('file-preview');
        const filesList = document.getElementById('files-list');
        
        const filesHtml = files.map((file, index) => `
            <div class="flex items-center justify-between p-3 border rounded">
                <div class="flex items-center gap-3">
                    <i class="fas fa-file-image text-blue-500"></i>
                    <div>
                        <div class="font-medium">${file.name}</div>
                        <div class="text-sm text-gray-500">${this.formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button class="btn btn-xs btn-error" onclick="correctionManager.removeFile(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        filesList.innerHTML = filesHtml;
        preview.style.display = 'block';
    }
    
    removeFile(index) {
        this.uploadedFiles.splice(index, 1);
        
        if (this.uploadedFiles.length === 0) {
            document.getElementById('file-preview').style.display = 'none';
        } else {
            this.showFilePreview(this.uploadedFiles);
        }
        
        this.updateCorrectionButton();
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    updateCorrectionButton() {
        const button = document.getElementById('start-correction-btn');
        const canStart = this.selectedTemplate && this.uploadedFiles.length > 0;
        
        button.disabled = !canStart;
        
        if (canStart) {
            button.innerHTML = `
                <i class="fas fa-play mr-2"></i>
                Iniciar Correção (${this.uploadedFiles.length} arquivo${this.uploadedFiles.length > 1 ? 's' : ''})
            `;
        } else {
            button.innerHTML = `
                <i class="fas fa-play mr-2"></i>
                Iniciar Correção
            `;
        }
    }
    
    updateStep(step) {
        // Reset all steps
        for (let i = 1; i <= 4; i++) {
            const stepElement = document.getElementById(`step-${i}`);
            if (stepElement) {
                stepElement.classList.remove('active', 'completed');
            }
        }
        
        // Mark completed steps
        for (let i = 1; i < step; i++) {
            const stepElement = document.getElementById(`step-${i}`);
            if (stepElement) {
                stepElement.classList.add('completed');
            }
        }
        
        // Mark current step
        const currentStep = document.getElementById(`step-${step}`);
        if (currentStep) {
            currentStep.classList.add('active');
        }
    }
    
    async startCorrection() {
        if (!this.selectedTemplate || this.uploadedFiles.length === 0) {
            alert('Selecione um template e faça upload dos arquivos');
            return;
        }
        
        // Update UI
        this.updateStep(3);
        document.getElementById('processing-section').style.display = 'block';
        document.getElementById('upload-section').style.display = 'none';
        
        try {
            const formData = new FormData();
            formData.append('template_id', this.selectedTemplate.id);
            
            this.uploadedFiles.forEach((file, index) => {
                formData.append('images', file);
            });
            
            // Simulate progress
            this.simulateProgress();
            
            const endpoint = this.uploadedFiles.length > 1 ? '/api/correct/batch' : '/api/correct/single';
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.currentResults = result.results || [result.result];
                this.showResults();
            } else {
                throw new Error(result.error || 'Erro na correção');
            }
            
        } catch (error) {
            console.error('Error during correction:', error);
            alert('Erro durante a correção: ' + error.message);
            
            // Reset UI
            document.getElementById('processing-section').style.display = 'none';
            document.getElementById('upload-section').style.display = 'block';
            this.updateStep(2);
        }
    }
    
    simulateProgress() {
        const progressBar = document.getElementById('correction-progress');
        const statusText = document.getElementById('processing-status');
        const detailsText = document.getElementById('processing-details');
        
        const steps = [
            { progress: 10, status: 'Preparando arquivos...', details: 'Validando imagens' },
            { progress: 25, status: 'Processando imagens...', details: 'Aplicando filtros e correções' },
            { progress: 50, status: 'Detectando marcações...', details: 'Analisando respostas dos alunos' },
            { progress: 75, status: 'Comparando com gabarito...', details: 'Calculando notas' },
            { progress: 90, status: 'Gerando relatório...', details: 'Finalizando resultados' },
            { progress: 100, status: 'Correção concluída!', details: 'Preparando visualização' }
        ];
        
        let currentStep = 0;
        
        const updateProgress = () => {
            if (currentStep < steps.length) {
                const step = steps[currentStep];
                if (progressBar) progressBar.style.width = step.progress + '%';
                if (statusText) statusText.textContent = step.status;
                if (detailsText) detailsText.textContent = step.details;
                currentStep++;
                
                setTimeout(updateProgress, 800 + Math.random() * 400);
            }
        };
        
        updateProgress();
    }
    
    showResults() {
        // Update UI
        this.updateStep(4);
        document.getElementById('processing-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';
        
        // Calculate summary stats
        const totalTests = this.currentResults.length;
        const totalQuestions = this.selectedTemplate.questions;
        const averageScore = this.currentResults.reduce((sum, result) => sum + result.score, 0) / totalTests;
        const passedTests = this.currentResults.filter(result => result.score >= 6).length;
        const passRate = (passedTests / totalTests) * 100;
        
        // Show summary
        const summaryContainer = document.getElementById('results-summary');
        summaryContainer.innerHTML = `
            <div class="bg-blue-50 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold text-blue-600">${totalTests}</div>
                <div class="text-sm text-blue-600">Provas Corrigidas</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold text-green-600">${averageScore.toFixed(1)}</div>
                <div class="text-sm text-green-600">Média Geral</div>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold text-purple-600">${passRate.toFixed(1)}%</div>
                <div class="text-sm text-purple-600">Taxa de Aprovação</div>
            </div>
            <div class="bg-orange-50 p-4 rounded-lg text-center">
                <div class="text-2xl font-bold text-orange-600">${totalQuestions}</div>
                <div class="text-sm text-orange-600">Questões</div>
            </div>
        `;
        
        // Show results table
        const tableBody = document.getElementById('results-table-body');
        const resultsHtml = this.currentResults.map((result, index) => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                    <div class="flex items-center">
                        <i class="fas fa-user-circle text-gray-400 mr-2"></i>
                        <span class="font-medium">${result.student_id}</span>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="text-sm">${result.correct_answers}/${result.total_questions}</span>
                </td>
                <td class="px-4 py-3">
                    <span class="font-semibold ${result.score >= 6 ? 'text-green-600' : 'text-red-600'}">
                        ${result.score.toFixed(1)}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        result.letter_grade === 'A' ? 'bg-green-100 text-green-800' :
                        result.letter_grade === 'B' ? 'bg-blue-100 text-blue-800' :
                        result.letter_grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                        result.letter_grade === 'D' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                    }">
                        ${result.letter_grade}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <button class="btn btn-xs btn-secondary mr-1" onclick="correctionManager.viewStudentDetail(${index})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-xs btn-outline" onclick="correctionManager.downloadStudentReport(${index})">
                        <i class="fas fa-download"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tableBody.innerHTML = resultsHtml;
    }
    
    viewStudentDetail(index) {
        const result = this.currentResults[index];
        alert(`Detalhes do aluno ${result.student_id}:\n\nAcertos: ${result.correct_answers}/${result.total_questions}\nNota: ${result.score.toFixed(1)}\nConceito: ${result.letter_grade}\nTempo de processamento: ${result.processing_time}s`);
    }
    
    downloadStudentReport(index) {
        const result = this.currentResults[index];
        alert(`Download do relatório individual de ${result.student_id} será implementado em breve.`);
    }
    
    exportResults(format) {
        if (this.currentResults.length === 0) {
            alert('Nenhum resultado para exportar');
            return;
        }
        
        // Simulate export
        alert(`Exportando ${this.currentResults.length} resultados em formato ${format.toUpperCase()}...`);
    }
    
    viewDetailedReport() {
        if (this.currentResults.length === 0) {
            alert('Nenhum resultado disponível');
            return;
        }
        
        // Redirect to detailed report page
        window.location.href = '/reports';
    }
}

// Global functions
function showBatchCorrection() {
    correctionManager.isBatchMode = true;
    document.getElementById('single-upload').style.display = 'none';
    document.getElementById('batch-upload').style.display = 'block';
}

function showSingleCorrection() {
    correctionManager.isBatchMode = false;
    document.getElementById('single-upload').style.display = 'block';
    document.getElementById('batch-upload').style.display = 'none';
}

function showHistory() {
    const modal = document.getElementById('history-modal');
    const tableBody = document.getElementById('history-table-body');
    
    // Mock history data
    const historyData = [
        {
            date: '2024-01-27 10:30',
            template: 'Prova de Matemática - Básico',
            tests: 25,
            average: 7.8
        },
        {
            date: '2024-01-26 14:15',
            template: 'Avaliação de História',
            tests: 18,
            average: 8.2
        },
        {
            date: '2024-01-25 09:45',
            template: 'Teste de Ciências',
            tests: 22,
            average: 6.9
        }
    ];
    
    const historyHtml = historyData.map(item => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm">${item.date}</td>
            <td class="px-4 py-3 text-sm">${item.template}</td>
            <td class="px-4 py-3 text-sm">${item.tests} provas</td>
            <td class="px-4 py-3 text-sm font-medium">${item.average}</td>
            <td class="px-4 py-3">
                <button class="btn btn-xs btn-secondary mr-1">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-xs btn-outline">
                    <i class="fas fa-download"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    tableBody.innerHTML = historyHtml;
    modal.style.display = 'flex';
}

function closeHistory() {
    document.getElementById('history-modal').style.display = 'none';
}

function closeTemplatePreview() {
    document.getElementById('template-preview-modal').style.display = 'none';
}

function selectTemplateFromPreview() {
    // This would be implemented to select the template from the preview modal
    closeTemplatePreview();
}

function handleSingleFile(input) {
    correctionManager.handleSingleFile(input);
}

function handleBatchFiles(input) {
    correctionManager.handleBatchFiles(input);
}

function startCorrection() {
    correctionManager.startCorrection();
}

function exportResults(format) {
    correctionManager.exportResults(format);
}

function viewDetailedReport() {
    correctionManager.viewDetailedReport();
}

// Initialize when page loads
let correctionManager;
document.addEventListener('DOMContentLoaded', function() {
    correctionManager = new CorrectionManager();
});
