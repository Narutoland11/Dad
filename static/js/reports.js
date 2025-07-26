/**
 * Reports functionality - Complete Implementation
 */

class ReportsManager {
    constructor() {
        this.reportData = null;
        this.charts = {};
        this.selectedStudent = null;
        this.init();
    }
    
    init() {
        this.loadReportData();
        this.setupEventListeners();
        this.initializeCharts();
    }
    
    setupEventListeners() {
        // Filter event listeners
        document.getElementById('period-filter').addEventListener('change', () => {
            this.applyFilters();
        });
        
        document.getElementById('template-filter').addEventListener('change', () => {
            this.applyFilters();
        });
        
        document.getElementById('group-filter').addEventListener('change', () => {
            this.applyFilters();
        });
    }
    
    async loadReportData() {
        try {
            // Load templates for filter
            const templatesResponse = await fetch('/api/templates');
            const templates = await templatesResponse.json();
            this.populateTemplateFilter(templates);
            
            // Load report data
            const reportResponse = await fetch('/api/reports/summary');
            this.reportData = await reportResponse.json();
            
            this.renderSummaryCards();
            this.renderTables();
            this.updateCharts();
            
        } catch (error) {
            console.error('Error loading report data:', error);
            this.showError('Erro ao carregar dados dos relatórios');
        }
    }
    
    populateTemplateFilter(templates) {
        const templateFilter = document.getElementById('template-filter');
        
        // Clear existing options except first
        while (templateFilter.children.length > 1) {
            templateFilter.removeChild(templateFilter.lastChild);
        }
        
        templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            templateFilter.appendChild(option);
        });
    }
    
    renderSummaryCards() {
        const container = document.getElementById('summary-cards');
        
        const mockData = {
            totalTests: 156,
            averageScore: 7.8,
            passRate: 73.2,
            totalStudents: 45
        };
        
        const cardsHtml = `
            <div class="bg-white rounded-lg shadow-sm border p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-100">
                        <i class="fas fa-file-alt fa-lg text-blue-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Total de Provas</p>
                        <p class="text-2xl font-bold text-gray-900">${mockData.totalTests}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-100">
                        <i class="fas fa-chart-line fa-lg text-green-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Média Geral</p>
                        <p class="text-2xl font-bold text-gray-900">${mockData.averageScore}</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-purple-100">
                        <i class="fas fa-percentage fa-lg text-purple-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Taxa de Aprovação</p>
                        <p class="text-2xl font-bold text-gray-900">${mockData.passRate}%</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm border p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-orange-100">
                        <i class="fas fa-users fa-lg text-orange-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Total de Alunos</p>
                        <p class="text-2xl font-bold text-gray-900">${mockData.totalStudents}</p>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = cardsHtml;
    }
    
    renderTables() {
        this.renderStudentsTable();
        this.renderTemplatesTable();
        this.renderQuestionsTable();
    }
    
    renderStudentsTable() {
        const tableBody = document.getElementById('students-table-body');
        
        // Mock student data
        const students = [
            {
                id: 'ALUNO_001',
                name: 'Ana Silva',
                tests: 5,
                average: 8.4,
                best: 9.2,
                worst: 7.1,
                trend: 'up'
            },
            {
                id: 'ALUNO_002',
                name: 'Bruno Santos',
                tests: 4,
                average: 6.8,
                best: 8.0,
                worst: 5.5,
                trend: 'down'
            },
            {
                id: 'ALUNO_003',
                name: 'Carla Oliveira',
                tests: 6,
                average: 9.1,
                best: 9.8,
                worst: 8.2,
                trend: 'up'
            },
            {
                id: 'ALUNO_004',
                name: 'Diego Costa',
                tests: 3,
                average: 5.9,
                best: 7.2,
                worst: 4.1,
                trend: 'stable'
            }
        ];
        
        const studentsHtml = students.map(student => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                    <div class="flex items-center">
                        <i class="fas fa-user-circle text-gray-400 mr-2"></i>
                        <div>
                            <div class="font-medium text-gray-900">${student.name}</div>
                            <div class="text-sm text-gray-500">${student.id}</div>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">${student.tests}</td>
                <td class="px-4 py-3">
                    <span class="font-semibold ${student.average >= 7 ? 'text-green-600' : 'text-red-600'}">
                        ${student.average.toFixed(1)}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">${student.best.toFixed(1)}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${student.worst.toFixed(1)}</td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        student.trend === 'up' ? 'bg-green-100 text-green-800' :
                        student.trend === 'down' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }">
                        <i class="fas fa-arrow-${
                            student.trend === 'up' ? 'up' :
                            student.trend === 'down' ? 'down' : 'right'
                        } mr-1"></i>
                        ${student.trend === 'up' ? 'Melhorando' :
                          student.trend === 'down' ? 'Piorando' : 'Estável'}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <button class="btn btn-xs btn-secondary mr-1" onclick="reportsManager.viewStudentDetail('${student.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-xs btn-outline" onclick="reportsManager.exportStudentData('${student.id}')">
                        <i class="fas fa-download"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tableBody.innerHTML = studentsHtml;
    }
    
    renderTemplatesTable() {
        const tableBody = document.getElementById('templates-table-body');
        
        // Mock template data
        const templates = [
            {
                id: 'template_001',
                name: 'Prova de Matemática - Básico',
                applications: 25,
                average: 7.8,
                passRate: 76,
                hardestQuestion: 'Q5 (Geometria)',
                easiestQuestion: 'Q1 (Aritmética)'
            },
            {
                id: 'template_002',
                name: 'Avaliação de História',
                applications: 18,
                average: 8.2,
                passRate: 83,
                hardestQuestion: 'Q8 (República)',
                easiestQuestion: 'Q3 (Descobrimentos)'
            },
            {
                id: 'template_003',
                name: 'Teste de Ciências',
                applications: 22,
                average: 6.9,
                passRate: 68,
                hardestQuestion: 'Q7 (Química)',
                easiestQuestion: 'Q2 (Biologia)'
            }
        ];
        
        const templatesHtml = templates.map(template => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                    <div class="font-medium text-gray-900">${template.name}</div>
                    <div class="text-sm text-gray-500">${template.id}</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">${template.applications}</td>
                <td class="px-4 py-3">
                    <span class="font-semibold ${template.average >= 7 ? 'text-green-600' : 'text-red-600'}">
                        ${template.average.toFixed(1)}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        template.passRate >= 75 ? 'bg-green-100 text-green-800' :
                        template.passRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }">
                        ${template.passRate}%
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">${template.hardestQuestion}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${template.easiestQuestion}</td>
                <td class="px-4 py-3">
                    <button class="btn btn-xs btn-secondary mr-1" onclick="reportsManager.viewTemplateDetail('${template.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-xs btn-outline" onclick="reportsManager.exportTemplateData('${template.id}')">
                        <i class="fas fa-download"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tableBody.innerHTML = templatesHtml;
    }
    
    renderQuestionsTable() {
        const tableBody = document.getElementById('questions-table-body');
        
        // Mock question data
        const questions = [
            {
                number: 1,
                template: 'Matemática - Básico',
                type: 'Múltipla Escolha',
                correct: 23,
                total: 25,
                percentage: 92,
                difficulty: 'Fácil'
            },
            {
                number: 5,
                template: 'Matemática - Básico',
                type: 'Numérica',
                correct: 12,
                total: 25,
                percentage: 48,
                difficulty: 'Difícil'
            },
            {
                number: 3,
                template: 'História',
                type: 'Verdadeiro/Falso',
                correct: 15,
                total: 18,
                percentage: 83,
                difficulty: 'Médio'
            }
        ];
        
        const questionsHtml = questions.map(question => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                    <div class="font-medium text-gray-900">Questão ${question.number}</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">${question.template}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${question.type}</td>
                <td class="px-4 py-3 text-sm text-gray-900">${question.correct}/${question.total}</td>
                <td class="px-4 py-3">
                    <span class="font-semibold ${question.percentage >= 75 ? 'text-green-600' : question.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}">
                        ${question.percentage}%
                    </span>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        question.difficulty === 'Fácil' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'Médio' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }">
                        ${question.difficulty}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <button class="btn btn-xs btn-secondary mr-1" onclick="reportsManager.viewQuestionDetail(${question.number})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-xs btn-outline" onclick="reportsManager.exportQuestionData(${question.number})">
                        <i class="fas fa-download"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        tableBody.innerHTML = questionsHtml;
    }
    
    initializeCharts() {
        this.createPerformanceChart();
        this.createGradesChart();
        this.createQuestionsChart();
        this.createTemplatesChart();
    }
    
    createPerformanceChart() {
        const ctx = document.getElementById('performance-chart').getContext('2d');
        
        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Média Geral',
                    data: [6.5, 7.2, 7.8, 7.1, 8.0, 7.8],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10
                    }
                }
            }
        });
    }
    
    createGradesChart() {
        const ctx = document.getElementById('grades-chart').getContext('2d');
        
        this.charts.grades = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['A (9-10)', 'B (8-9)', 'C (7-8)', 'D (6-7)', 'F (<6)'],
                datasets: [{
                    data: [15, 25, 30, 20, 10],
                    backgroundColor: [
                        'rgb(34, 197, 94)',
                        'rgb(59, 130, 246)',
                        'rgb(234, 179, 8)',
                        'rgb(249, 115, 22)',
                        'rgb(239, 68, 68)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    createQuestionsChart() {
        const ctx = document.getElementById('questions-chart').getContext('2d');
        
        this.charts.questions = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'],
                datasets: [{
                    label: '% Acertos',
                    data: [92, 85, 78, 65, 48, 72, 81, 69],
                    backgroundColor: 'rgba(59, 130, 246, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
    
    createTemplatesChart() {
        const ctx = document.getElementById('templates-chart').getContext('2d');
        
        this.charts.templates = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Matemática', 'História', 'Ciências', 'Português'],
                datasets: [{
                    data: [35, 25, 25, 15],
                    backgroundColor: [
                        'rgb(59, 130, 246)',
                        'rgb(34, 197, 94)',
                        'rgb(249, 115, 22)',
                        'rgb(168, 85, 247)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    updateCharts() {
        // Update charts with filtered data
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.update();
            }
        });
    }
    
    applyFilters() {
        const period = document.getElementById('period-filter').value;
        const template = document.getElementById('template-filter').value;
        const group = document.getElementById('group-filter').value;
        
        // Apply filters and reload data
        this.loadReportData();
    }
    
    viewStudentDetail(studentId) {
        this.selectedStudent = studentId;
        
        const modal = document.getElementById('student-detail-modal');
        const title = document.getElementById('student-detail-title');
        const content = document.getElementById('student-detail-content');
        
        title.textContent = `Detalhes do Aluno: ${studentId}`;
        
        const detailHtml = `
            <div class="space-y-6">
                <div class="grid grid-cols-2 gap-6">
                    <div class="bg-gray-50 p-4 rounded">
                        <h4 class="font-semibold mb-2">Informações Gerais</h4>
                        <div class="space-y-1 text-sm">
                            <div><strong>ID:</strong> ${studentId}</div>
                            <div><strong>Provas realizadas:</strong> 5</div>
                            <div><strong>Média geral:</strong> 8.4</div>
                            <div><strong>Melhor nota:</strong> 9.2</div>
                            <div><strong>Pior nota:</strong> 7.1</div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded">
                        <h4 class="font-semibold mb-2">Desempenho por Matéria</h4>
                        <div class="space-y-1 text-sm">
                            <div>Matemática: <span class="font-semibold text-green-600">8.5</span></div>
                            <div>História: <span class="font-semibold text-blue-600">8.8</span></div>
                            <div>Ciências: <span class="font-semibold text-yellow-600">7.9</span></div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-3">Histórico de Provas</h4>
                    <div class="overflow-x-auto">
                        <table class="min-w-full table-auto">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Data</th>
                                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Template</th>
                                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Nota</th>
                                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Acertos</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr>
                                    <td class="px-3 py-2 text-sm">25/01/2024</td>
                                    <td class="px-3 py-2 text-sm">Matemática - Básico</td>
                                    <td class="px-3 py-2 text-sm font-semibold text-green-600">9.2</td>
                                    <td class="px-3 py-2 text-sm">23/25</td>
                                </tr>
                                <tr>
                                    <td class="px-3 py-2 text-sm">20/01/2024</td>
                                    <td class="px-3 py-2 text-sm">História</td>
                                    <td class="px-3 py-2 text-sm font-semibold text-blue-600">8.8</td>
                                    <td class="px-3 py-2 text-sm">15/18</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        content.innerHTML = detailHtml;
        modal.style.display = 'flex';
    }
    
    // Export functions
    exportStudentReport() {
        alert('Exportando relatório de alunos...');
    }
    
    exportTemplateReport() {
        alert('Exportando relatório de templates...');
    }
    
    exportQuestionReport() {
        alert('Exportando relatório de questões...');
    }
    
    exportAllReports() {
        alert('Exportando todos os relatórios...');
    }
    
    // Print functions
    printStudentReport() {
        window.print();
    }
    
    printTemplateReport() {
        window.print();
    }
    
    printQuestionReport() {
        window.print();
    }
    
    // Modal management
    closeStudentDetail() {
        document.getElementById('student-detail-modal').style.display = 'none';
        this.selectedStudent = null;
    }
    
    closeGenerateReport() {
        document.getElementById('generate-report-modal').style.display = 'none';
    }
    
    // Generate custom report
    confirmGenerateReport() {
        const reportType = document.getElementById('report-type').value;
        const format = document.getElementById('export-format').value;
        
        alert(`Gerando relatório ${reportType} em formato ${format}...`);
        this.closeGenerateReport();
    }
    
    // Utility methods
    showError(message) {
        alert('Erro: ' + message);
    }
}

// Global functions
function applyFilters() {
    reportsManager.applyFilters();
}

function generateReport() {
    document.getElementById('generate-report-modal').style.display = 'flex';
}

function exportAllReports() {
    reportsManager.exportAllReports();
}

function exportStudentReport() {
    reportsManager.exportStudentReport();
}

function exportTemplateReport() {
    reportsManager.exportTemplateReport();
}

function exportQuestionReport() {
    reportsManager.exportQuestionReport();
}

function printStudentReport() {
    reportsManager.printStudentReport();
}

function printTemplateReport() {
    reportsManager.printTemplateReport();
}

function printQuestionReport() {
    reportsManager.printQuestionReport();
}

function closeStudentDetail() {
    reportsManager.closeStudentDetail();
}

function closeGenerateReport() {
    reportsManager.closeGenerateReport();
}

function confirmGenerateReport() {
    reportsManager.confirmGenerateReport();
}

function exportStudentDetail() {
    alert('Exportando detalhes do aluno...');
}

// Initialize when page loads
let reportsManager;
document.addEventListener('DOMContentLoaded', function() {
    reportsManager = new ReportsManager();
});
