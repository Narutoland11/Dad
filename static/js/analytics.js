/**
 * Analytics Dashboard functionality
 */

class AnalyticsDashboard {
    constructor() {
        this.currentPeriod = 30;
        this.charts = {};
        this.init();
    }
    
    init() {
        this.loadAnalyticsData();
        this.setupEventListeners();
        this.initializeCharts();
        this.startRealTimeUpdates();
    }
    
    setupEventListeners() {
        // Period selection
        document.getElementById('period-select').addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                document.getElementById('custom-period').style.display = 'flex';
            } else {
                document.getElementById('custom-period').style.display = 'none';
                this.currentPeriod = parseInt(e.target.value);
                this.updatePeriod();
            }
        });
    }
    
    async loadAnalyticsData() {
        try {
            Utils.showLoading('Carregando dados analíticos...');
            
            // Simulate API calls for different data sets
            const [metrics, chartData, templatePerformance, systemHealth] = await Promise.all([
                this.fetchKeyMetrics(),
                this.fetchChartData(),
                this.fetchTemplatePerformance(),
                this.fetchSystemHealth()
            ]);
            
            this.updateKeyMetrics(metrics);
            this.updateCharts(chartData);
            this.updateTemplatePerformance(templatePerformance);
            this.updateSystemHealth(systemHealth);
            this.loadRecentActivity();
            this.loadDifficultQuestions();
            this.loadErrorPatterns();
            
        } catch (error) {
            console.error('Error loading analytics data:', error);
            Utils.showAlert('Erro ao carregar dados analíticos', 'error');
        } finally {
            Utils.hideLoading();
        }
    }
    
    async fetchKeyMetrics() {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            totalCorrections: 1247,
            averageScore: 7.8,
            successRate: 73.2,
            processingTime: 2.1,
            changes: {
                corrections: 12.5,
                score: 3.2,
                success: -1.8,
                time: -8.4
            }
        };
    }
    
    async fetchChartData() {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const days = [];
        const corrections = [];
        const scores = [];
        
        for (let i = this.currentPeriod - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }));
            corrections.push(Math.floor(Math.random() * 50) + 10);
            scores.push((Math.random() * 3 + 6).toFixed(1));
        }
        
        return {
            timeline: {
                labels: days,
                corrections: corrections,
                scores: scores
            },
            scoreDistribution: {
                labels: ['A (9-10)', 'B (8-9)', 'C (7-8)', 'D (6-7)', 'F (0-6)'],
                data: [18, 25, 32, 15, 10]
            }
        };
    }
    
    async fetchTemplatePerformance() {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 400));
        
        return [
            {
                name: 'Prova de Matemática - Básico',
                corrections: 342,
                averageScore: 8.2,
                successRate: 78.5,
                avgTime: 1.8,
                lastUsed: '2024-01-27'
            },
            {
                name: 'Avaliação de História',
                corrections: 256,
                averageScore: 7.6,
                successRate: 71.2,
                avgTime: 2.3,
                lastUsed: '2024-01-26'
            },
            {
                name: 'Teste de Ciências',
                corrections: 189,
                averageScore: 7.9,
                successRate: 74.8,
                avgTime: 2.1,
                lastUsed: '2024-01-25'
            }
        ];
    }
    
    async fetchSystemHealth() {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 200));
        
        return {
            api: 'online',
            ocr: 'online',
            database: 'online',
            cpu: 45,
            memory: 62,
            activeTemplates: 12,
            activeUsers: 8,
            todayCorrections: 47,
            uptime: '99.9%'
        };
    }
    
    updateKeyMetrics(metrics) {
        document.getElementById('total-corrections').textContent = metrics.totalCorrections.toLocaleString();
        document.getElementById('average-score').textContent = metrics.averageScore.toFixed(1);
        document.getElementById('success-rate').textContent = `${metrics.successRate.toFixed(1)}%`;
        document.getElementById('processing-time').textContent = `${metrics.processingTime}s`;
        
        // Update change indicators
        this.updateChangeIndicator('corrections-change', metrics.changes.corrections);
        this.updateChangeIndicator('score-change', metrics.changes.score);
        this.updateChangeIndicator('success-change', metrics.changes.success);
        this.updateChangeIndicator('time-change', metrics.changes.time, true); // Inverted for time (lower is better)
    }
    
    updateChangeIndicator(elementId, change, inverted = false) {
        const element = document.getElementById(elementId);
        const isPositive = inverted ? change < 0 : change > 0;
        const sign = change > 0 ? '+' : '';
        const className = isPositive ? 'text-success' : 'text-error';
        
        element.textContent = `${sign}${change.toFixed(1)}% vs período anterior`;
        element.className = `text-xs ${className} mt-1`;
    }
    
    initializeCharts() {
        // Initialize chart containers (using simple HTML/CSS charts for demo)
        this.createSimpleChart('corrections-canvas', 'line');
        this.createSimpleChart('score-canvas', 'pie');
    }
    
    createSimpleChart(canvasId, type) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        
        // Simple placeholder chart
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#6366f1';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Gráfico ${type} será renderizado aqui`, canvas.width / 2, canvas.height / 2);
    }
    
    updateCharts(chartData) {
        // In a real implementation, this would update actual charts
        // For now, we'll update the canvas with mock data visualization
        this.updateCorrectionsChart(chartData.timeline);
        this.updateScoreDistributionChart(chartData.scoreDistribution);
    }
    
    updateCorrectionsChart(data) {
        const canvas = document.getElementById('corrections-canvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw simple line chart
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const stepX = canvas.width / (data.corrections.length - 1);
        const maxY = Math.max(...data.corrections);
        
        data.corrections.forEach((value, index) => {
            const x = index * stepX;
            const y = canvas.height - (value / maxY) * canvas.height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Add title
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Correções por dia', canvas.width / 2, 20);
    }
    
    updateScoreDistributionChart(data) {
        const canvas = document.getElementById('score-canvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw simple pie chart
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];
        const total = data.data.reduce((sum, value) => sum + value, 0);
        
        let currentAngle = 0;
        
        data.data.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            ctx.fillStyle = colors[index];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            currentAngle += sliceAngle;
        });
        
        // Add title
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Distribuição de notas', centerX, 20);
    }
    
    updateTemplatePerformance(templates) {
        const tbody = document.getElementById('template-performance-table');
        
        const rows = templates.map(template => `
            <tr>
                <td>
                    <div class="font-medium">${template.name}</div>
                </td>
                <td>${template.corrections}</td>
                <td>
                    <span class="font-semibold ${this.getScoreColor(template.averageScore)}">
                        ${template.averageScore.toFixed(1)}
                    </span>
                </td>
                <td>
                    <span class="font-semibold ${this.getSuccessColor(template.successRate)}">
                        ${template.successRate.toFixed(1)}%
                    </span>
                </td>
                <td>${template.avgTime}s</td>
                <td>${Utils.formatDate(template.lastUsed)}</td>
            </tr>
        `).join('');
        
        tbody.innerHTML = rows;
    }
    
    getScoreColor(score) {
        if (score >= 8.5) return 'text-success';
        if (score >= 7.0) return 'text-info';
        if (score >= 6.0) return 'text-warning';
        return 'text-error';
    }
    
    getSuccessColor(rate) {
        if (rate >= 80) return 'text-success';
        if (rate >= 70) return 'text-info';
        if (rate >= 60) return 'text-warning';
        return 'text-error';
    }
    
    updateSystemHealth(health) {
        // Update status indicators
        document.getElementById('api-status').textContent = health.api === 'online' ? 'Online' : 'Offline';
        document.getElementById('api-status').className = `status-indicator ${health.api === 'online' ? 'status-online' : 'status-offline'}`;
        
        document.getElementById('ocr-status').textContent = health.ocr === 'online' ? 'Online' : 'Offline';
        document.getElementById('ocr-status').className = `status-indicator ${health.ocr === 'online' ? 'status-online' : 'status-offline'}`;
        
        document.getElementById('db-status').textContent = health.database === 'online' ? 'Online' : 'Offline';
        document.getElementById('db-status').className = `status-indicator ${health.database === 'online' ? 'status-online' : 'status-offline'}`;
        
        // Update performance bars
        document.getElementById('cpu-usage').textContent = `${health.cpu}%`;
        document.getElementById('cpu-bar').style.width = `${health.cpu}%`;
        
        document.getElementById('memory-usage').textContent = `${health.memory}%`;
        document.getElementById('memory-bar').style.width = `${health.memory}%`;
        
        // Update quick stats
        document.getElementById('active-templates').textContent = health.activeTemplates;
        document.getElementById('active-users').textContent = health.activeUsers;
        document.getElementById('today-corrections').textContent = health.todayCorrections;
        document.getElementById('system-uptime').textContent = health.uptime;
    }
    
    loadRecentActivity() {
        const container = document.getElementById('recent-activity');
        
        const activities = [
            {
                type: 'correction',
                message: 'Prova corrigida para ALUNO_A1B2C3',
                template: 'Matemática Básico',
                time: '2 minutos atrás',
                icon: 'fas fa-check-circle',
                color: 'text-success'
            },
            {
                type: 'template',
                message: 'Template "História Medieval" foi criado',
                user: 'Prof. Santos',
                time: '15 minutos atrás',
                icon: 'fas fa-plus-circle',
                color: 'text-info'
            },
            {
                type: 'batch',
                message: 'Correção em lote finalizada (25 provas)',
                template: 'Ciências Naturais',
                time: '1 hora atrás',
                icon: 'fas fa-layer-group',
                color: 'text-primary'
            },
            {
                type: 'error',
                message: 'Erro de OCR detectado em imagem',
                details: 'Qualidade de imagem baixa',
                time: '2 horas atrás',
                icon: 'fas fa-exclamation-triangle',
                color: 'text-warning'
            }
        ];
        
        const activityHtml = activities.map(activity => `
            <div class="flex items-start gap-3 p-3 border rounded hover:bg-gray-50">
                <div class="flex-shrink-0">
                    <i class="${activity.icon} ${activity.color}" aria-hidden="true"></i>
                </div>
                <div class="flex-1">
                    <div class="font-medium">${activity.message}</div>
                    ${activity.template ? `<div class="text-sm text-secondary">Template: ${activity.template}</div>` : ''}
                    ${activity.user ? `<div class="text-sm text-secondary">Por: ${activity.user}</div>` : ''}
                    ${activity.details ? `<div class="text-sm text-secondary">${activity.details}</div>` : ''}
                    <div class="text-xs text-secondary mt-1">${activity.time}</div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = activityHtml;
    }
    
    loadDifficultQuestions() {
        const container = document.getElementById('difficult-questions');
        
        const questions = [
            {
                number: 7,
                template: 'Matemática Avançada',
                errorRate: 68,
                topic: 'Equações Quadráticas'
            },
            {
                number: 12,
                template: 'História Medieval',
                errorRate: 62,
                topic: 'Cronologia de Eventos'
            },
            {
                number: 3,
                template: 'Ciências Biológicas',
                errorRate: 58,
                topic: 'Fotossíntese'
            }
        ];
        
        const questionsHtml = questions.map(q => `
            <div class="flex items-center justify-between p-3 border rounded">
                <div>
                    <div class="font-medium">Questão ${q.number} - ${q.template}</div>
                    <div class="text-sm text-secondary">${q.topic}</div>
                </div>
                <div class="text-right">
                    <div class="font-semibold text-error">${q.errorRate}%</div>
                    <div class="text-xs text-secondary">erro</div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = questionsHtml;
    }
    
    loadErrorPatterns() {
        const container = document.getElementById('error-patterns');
        
        const patterns = [
            {
                pattern: 'Marcação dupla',
                frequency: 23,
                description: 'Alunos marcando duas alternativas'
            },
            {
                pattern: 'Marcação fora da área',
                frequency: 18,
                description: 'Marcas fora dos campos designados'
            },
            {
                pattern: 'Rasura excessiva',
                frequency: 15,
                description: 'Muitas correções na mesma questão'
            }
        ];
        
        const patternsHtml = patterns.map(p => `
            <div class="flex items-center justify-between p-3 border rounded">
                <div>
                    <div class="font-medium">${p.pattern}</div>
                    <div class="text-sm text-secondary">${p.description}</div>
                </div>
                <div class="text-right">
                    <div class="font-semibold text-warning">${p.frequency}</div>
                    <div class="text-xs text-secondary">ocorrências</div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = patternsHtml;
    }
    
    startRealTimeUpdates() {
        // Update system health every 30 seconds
        setInterval(() => {
            this.updateRealTimeData();
        }, 30000);
    }
    
    async updateRealTimeData() {
        try {
            const health = await this.fetchSystemHealth();
            this.updateSystemHealth(health);
        } catch (error) {
            console.error('Error updating real-time data:', error);
        }
    }
    
    updatePeriod() {
        this.loadAnalyticsData();
    }
    
    applyCustomPeriod() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        if (!startDate || !endDate) {
            Utils.showAlert('Selecione as datas de início e fim', 'error');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            Utils.showAlert('Data de início deve ser anterior à data de fim', 'error');
            return;
        }
        
        // Calculate period in days
        const diffTime = Math.abs(new Date(endDate) - new Date(startDate));
        this.currentPeriod = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        this.loadAnalyticsData();
    }
    
    refreshData() {
        this.loadAnalyticsData();
    }
    
    exportReport() {
        const modal = document.getElementById('export-modal');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    }
    
    closeExportModal() {
        const modal = document.getElementById('export-modal');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
    
    generateExport() {
        const format = document.querySelector('input[name="export-format"]:checked').value;
        
        Utils.showLoading('Gerando relatório...');
        
        // Simulate export generation
        setTimeout(() => {
            Utils.hideLoading();
            Utils.showAlert(`Relatório ${format.toUpperCase()} gerado com sucesso!`, 'success');
            this.closeExportModal();
            
            // Simulate download
            const blob = new Blob(['Dados do relatório...'], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio_analytics.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 2000);
    }
    
    loadMoreActivity() {
        Utils.showAlert('Carregando mais atividades...', 'info');
        // In a real implementation, this would load more activity items
    }
}

// Global functions
function refreshData() {
    analyticsDashboard.refreshData();
}

function updatePeriod() {
    analyticsDashboard.updatePeriod();
}

function applyCustomPeriod() {
    analyticsDashboard.applyCustomPeriod();
}

function exportReport() {
    analyticsDashboard.exportReport();
}

function closeExportModal() {
    analyticsDashboard.closeExportModal();
}

function generateExport() {
    analyticsDashboard.generateExport();
}

function loadMoreActivity() {
    analyticsDashboard.loadMoreActivity();
}

// Initialize when DOM is loaded
let analyticsDashboard;
document.addEventListener('DOMContentLoaded', function() {
    analyticsDashboard = new AnalyticsDashboard();
});

// Export for global access
window.analyticsDashboard = analyticsDashboard;
