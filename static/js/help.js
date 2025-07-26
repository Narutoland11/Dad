/**
 * Help and Documentation functionality
 */

class HelpSystem {
    constructor() {
        this.searchIndex = [];
        this.init();
    }
    
    init() {
        this.buildSearchIndex();
        this.showHelpSection('getting-started');
    }
    
    buildSearchIndex() {
        // Build search index from all help content
        const sections = document.querySelectorAll('.help-section');
        
        sections.forEach(section => {
            const sectionId = section.id.replace('help-', '');
            const title = section.querySelector('.card-title').textContent.trim();
            const content = section.querySelector('.card-body').textContent.trim();
            
            this.searchIndex.push({
                id: sectionId,
                title: title,
                content: content.toLowerCase(),
                element: section
            });
        });
    }
    
    showHelpSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.help-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Remove active class from all nav items
        document.querySelectorAll('.help-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show selected section
        const section = document.getElementById(`help-${sectionId}`);
        if (section) {
            section.style.display = 'block';
        }
        
        // Add active class to nav item
        const navItem = document.getElementById(`nav-${sectionId}`);
        if (navItem) {
            navItem.classList.add('active');
        }
        
        // Update URL hash
        window.location.hash = sectionId;
    }
    
    searchHelp(query) {
        if (!query || query.trim().length < 2) {
            this.clearSearchResults();
            return;
        }
        
        const searchTerm = query.toLowerCase().trim();
        const results = this.searchIndex.filter(item => 
            item.title.toLowerCase().includes(searchTerm) ||
            item.content.includes(searchTerm)
        );
        
        this.displaySearchResults(results, searchTerm);
    }
    
    displaySearchResults(results, searchTerm) {
        if (results.length === 0) {
            this.showNoResults(searchTerm);
            return;
        }
        
        // Hide all sections first
        document.querySelectorAll('.help-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show matching sections
        results.forEach(result => {
            result.element.style.display = 'block';
            this.highlightSearchTerms(result.element, searchTerm);
        });
        
        // Update navigation
        document.querySelectorAll('.help-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Show search results indicator
        this.showSearchResultsIndicator(results.length, searchTerm);
    }
    
    highlightSearchTerms(element, searchTerm) {
        // Simple highlighting - in a real implementation, you'd use a more sophisticated approach
        const textNodes = this.getTextNodes(element);
        
        textNodes.forEach(node => {
            if (node.textContent.toLowerCase().includes(searchTerm)) {
                const parent = node.parentNode;
                const text = node.textContent;
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                const highlightedText = text.replace(regex, '<mark>$1</mark>');
                
                if (highlightedText !== text) {
                    const wrapper = document.createElement('span');
                    wrapper.innerHTML = highlightedText;
                    parent.replaceChild(wrapper, node);
                }
            }
        });
    }
    
    getTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim()) {
                textNodes.push(node);
            }
        }
        
        return textNodes;
    }
    
    clearSearchResults() {
        // Remove all highlights
        document.querySelectorAll('mark').forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
        
        // Hide search results indicator
        this.hideSearchResultsIndicator();
        
        // Show default section
        this.showHelpSection('getting-started');
    }
    
    showNoResults(searchTerm) {
        document.querySelectorAll('.help-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Create and show no results message
        const noResultsHtml = `
            <div class="card">
                <div class="card-body text-center py-8">
                    <i class="fas fa-search fa-3x text-secondary mb-4" aria-hidden="true"></i>
                    <h3 class="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
                    <p class="text-secondary mb-4">
                        Não encontramos resultados para "<strong>${searchTerm}</strong>"
                    </p>
                    <div class="space-y-2">
                        <p class="text-sm text-secondary">Sugestões:</p>
                        <ul class="text-sm text-secondary text-left inline-block">
                            <li>• Verifique a ortografia</li>
                            <li>• Use termos mais gerais</li>
                            <li>• Tente sinônimos</li>
                        </ul>
                    </div>
                    <button class="btn btn-primary mt-4" onclick="clearSearchResults()">
                        <i class="fas fa-arrow-left" aria-hidden="true"></i>
                        Voltar à Documentação
                    </button>
                </div>
            </div>
        `;
        
        const container = document.querySelector('.lg\\:col-span-3');
        container.innerHTML = noResultsHtml;
    }
    
    showSearchResultsIndicator(count, searchTerm) {
        const indicator = document.createElement('div');
        indicator.id = 'search-results-indicator';
        indicator.className = 'bg-info-light border border-info rounded p-3 mb-4';
        indicator.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <i class="fas fa-search text-info" aria-hidden="true"></i>
                    <strong>Resultados da busca:</strong> ${count} seção(ões) encontrada(s) para "${searchTerm}"
                </div>
                <button class="btn btn-sm btn-secondary" onclick="clearSearchResults()">
                    <i class="fas fa-times" aria-hidden="true"></i>
                    Limpar
                </button>
            </div>
        `;
        
        const container = document.querySelector('.lg\\:col-span-3');
        container.insertBefore(indicator, container.firstChild);
    }
    
    hideSearchResultsIndicator() {
        const indicator = document.getElementById('search-results-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    toggleFAQ(button) {
        const answer = button.nextElementSibling;
        const icon = button.querySelector('i');
        
        if (answer.style.display === 'none' || !answer.style.display) {
            answer.style.display = 'block';
            button.classList.add('active');
            icon.style.transform = 'rotate(180deg)';
        } else {
            answer.style.display = 'none';
            button.classList.remove('active');
            icon.style.transform = 'rotate(0deg)';
        }
    }
    
    printHelp() {
        // Create print-friendly version
        const printWindow = window.open('', '_blank');
        const currentSection = document.querySelector('.help-section[style*="block"]');
        
        if (currentSection) {
            const title = currentSection.querySelector('.card-title').textContent;
            const content = currentSection.querySelector('.card-body').innerHTML;
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title} - Sistema de Correção</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; }
                        h1, h2, h3, h4 { color: #333; }
                        .bg-info-light, .bg-warning-light { 
                            padding: 15px; 
                            border-radius: 5px; 
                            margin: 15px 0; 
                        }
                        .bg-info-light { background-color: #e3f2fd; }
                        .bg-warning-light { background-color: #fff3e0; }
                        code { 
                            background-color: #f5f5f5; 
                            padding: 2px 4px; 
                            border-radius: 3px; 
                        }
                        pre { 
                            background-color: #f5f5f5; 
                            padding: 15px; 
                            border-radius: 5px; 
                            overflow-x: auto; 
                        }
                        @media print {
                            body { margin: 20px; }
                        }
                    </style>
                </head>
                <body>
                    <h1>${title}</h1>
                    ${content}
                </body>
                </html>
            `);
        }
        
        printWindow.document.close();
        printWindow.print();
    }
    
    downloadPDF() {
        Utils.showAlert('Funcionalidade de download PDF em desenvolvimento', 'info');
        // In a real implementation, this would generate and download a PDF
    }
}

// Global functions
function showHelpSection(sectionId) {
    helpSystem.showHelpSection(sectionId);
}

function searchHelp(query) {
    if (typeof query === 'string') {
        helpSystem.searchHelp(query);
    } else {
        const searchInput = document.getElementById('help-search');
        helpSystem.searchHelp(searchInput.value);
    }
}

function clearSearchResults() {
    helpSystem.clearSearchResults();
    document.getElementById('help-search').value = '';
}

function toggleFAQ(button) {
    helpSystem.toggleFAQ(button);
}

function printHelp() {
    helpSystem.printHelp();
}

function downloadPDF() {
    helpSystem.downloadPDF();
}

// Initialize when DOM is loaded
let helpSystem;
document.addEventListener('DOMContentLoaded', function() {
    helpSystem = new HelpSystem();
    
    // Handle hash navigation
    if (window.location.hash) {
        const sectionId = window.location.hash.substring(1);
        helpSystem.showHelpSection(sectionId);
    }
    
    // Handle browser back/forward
    window.addEventListener('hashchange', function() {
        if (window.location.hash) {
            const sectionId = window.location.hash.substring(1);
            helpSystem.showHelpSection(sectionId);
        }
    });
});

// Export for global access
window.helpSystem = helpSystem;
