"""
Simplified web application for the test correction system
This version runs without heavy dependencies for interface testing
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import uuid
from datetime import datetime
import time

app = Flask(__name__)
CORS(app)

# Mock data for demonstration
mock_templates = [
    {
        'id': 'template_001',
        'name': 'Prova de Matemática - Básico',
        'version': '1.0',
        'questions': 10,
        'created_by': 'Prof. Silva',
        'created_at': '2024-01-15T10:00:00Z',
        'instructions': 'Marque apenas uma alternativa por questão. Use caneta azul ou preta.'
    },
    {
        'id': 'template_002',
        'name': 'Avaliação de História',
        'version': '2.1',
        'questions': 15,
        'created_by': 'Prof. Santos',
        'created_at': '2024-01-20T14:30:00Z',
        'instructions': 'Questões mistas: múltipla escolha e verdadeiro/falso.'
    },
    {
        'id': 'template_003',
        'name': 'Teste de Ciências',
        'version': '1.5',
        'questions': 20,
        'created_by': 'Prof. Costa',
        'created_at': '2024-01-25T09:15:00Z',
        'instructions': 'Inclui questões numéricas. Atenção às margens de erro.'
    }
]

mock_stats = {
    'templates_created': len(mock_templates),
    'tests_corrected': 47,
    'average_score': 7.8,
    'success_rate': 0.73
}

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('index.html')

@app.route('/templates/builder')
def template_builder():
    """Template builder page"""
    return render_template('template_builder.html')

@app.route('/analytics')
def analytics():
    """Analytics and reports page"""
    return render_template('analytics.html')

@app.route('/settings')
def settings():
    """Settings and configuration page"""
    return render_template('settings.html')

@app.route('/help')
def help_page():
    """Help and documentation page"""
    return render_template('help.html')

@app.route('/correction')
def correction_page():
    """Correction page for uploading and correcting tests"""
    return render_template('correction.html')

@app.route('/templates')
def templates_list():
    """Templates management page"""
    return render_template('templates_list.html')

@app.route('/reports')
def reports_page():
    """Reports and analytics page"""
    return render_template('reports.html')

@app.route('/api/stats')
def get_stats():
    """Get dashboard statistics"""
    return jsonify(mock_stats)

@app.route('/api/templates')
def get_templates():
    """Get all available templates"""
    return jsonify(mock_templates)

@app.route('/api/templates/<template_id>')
def get_template(template_id):
    """Get a specific template by ID"""
    template = next((t for t in mock_templates if t['id'] == template_id), None)
    if template:
        return jsonify(template)
    return jsonify({'error': 'Template not found'}), 404

@app.route('/api/templates/<template_id>', methods=['DELETE'])
def delete_template(template_id):
    """Delete a template"""
    global mock_templates
    template = next((t for t in mock_templates if t['id'] == template_id), None)
    if template:
        mock_templates = [t for t in mock_templates if t['id'] != template_id]
        return jsonify({'success': True, 'message': 'Template deleted successfully'})
    return jsonify({'success': False, 'error': 'Template not found'}), 404

@app.route('/api/templates', methods=['POST'])
def save_template():
    """Save a new template with multiple versions support"""
    template_data = request.json
    
    # Generate template ID
    template_data['id'] = f"tpl_{int(time.time())}"
    template_data['created_at'] = datetime.now().isoformat()
    
    # Handle multiple versions
    if template_data.get('multiple_versions', False):
        version_count = template_data.get('version_count', 2)
        versions = []
        
        for i in range(version_count):
            version_letter = chr(65 + i)  # A, B, C, D...
            version_data = template_data.copy()
            version_data['version_letter'] = version_letter
            version_data['id'] = f"{template_data['id']}_{version_letter}"
            
            # Shuffle questions for each version
            if len(template_data['questions']) > 1:
                import random
                shuffled_questions = template_data['questions'].copy()
                random.shuffle(shuffled_questions)
                
                # Renumber questions
                for idx, question in enumerate(shuffled_questions):
                    question['number'] = idx + 1
                
                version_data['questions'] = shuffled_questions
            
            versions.append(version_data)
        
        template_data['versions'] = versions
    
    # In a real implementation, save to database
    return jsonify({
        'success': True, 
        'template_id': template_data['id'],
        'versions_created': len(template_data.get('versions', [1]))
    })

@app.route('/api/templates/example/<template_type>')
def create_example_template(template_type):
    """Create an example template"""
    examples = {
        'basic': {
            'name': 'Template Básico - Múltipla Escolha',
            'questions': 10,
            'instructions': 'Questões de múltipla escolha simples (A, B, C, D, E)'
        },
        'mixed': {
            'name': 'Template Misto - Variado',
            'questions': 15,
            'instructions': 'Questões mistas: múltipla escolha, verdadeiro/falso e numéricas'
        },
        'advanced': {
            'name': 'Template Avançado - Personalizado',
            'questions': 20,
            'instructions': 'Questões com pesos diferentes e símbolos customizados'
        }
    }
    
    if template_type not in examples:
        return jsonify({'success': False, 'error': 'Tipo de template inválido'}), 400
    
    example = examples[template_type]
    new_template = {
        'id': f'template_{uuid.uuid4().hex[:8]}',
        'name': example['name'],
        'version': '1.0',
        'questions': example['questions'],
        'created_by': 'Sistema (Exemplo)',
        'created_at': datetime.now().isoformat() + 'Z',
        'instructions': example['instructions']
    }
    
    mock_templates.append(new_template)
    mock_stats['templates_created'] = len(mock_templates)
    
    return jsonify({
        'success': True,
        'template': new_template
    })

@app.route('/api/correct', methods=['POST'])
def correct_single_test():
    """Simulate single test correction"""
    try:
        # Simulate processing time
        time.sleep(2)
        
        # Mock result
        student_id = f"ALUNO_{uuid.uuid4().hex[:6].upper()}"
        correct_answers = 7
        total_questions = 10
        score = (correct_answers / total_questions) * 10
        percentage = correct_answers / total_questions
        
        # Determine letter grade
        if percentage >= 0.9:
            letter_grade = 'A'
        elif percentage >= 0.8:
            letter_grade = 'B'
        elif percentage >= 0.7:
            letter_grade = 'C'
        elif percentage >= 0.6:
            letter_grade = 'D'
        else:
            letter_grade = 'F'
        
        result = {
            'student_id': student_id,
            'correct_answers': correct_answers,
            'total_questions': total_questions,
            'score': score,
            'percentage': percentage,
            'letter_grade': letter_grade,
            'processing_time': 2.1
        }
        
        # Mock detailed report
        detailed_report = {
            'student_info': {
                'id': student_id,
                'test_date': datetime.now().isoformat(),
                'processing_time': '2.1s'
            },
            'results': {
                'letter_grade': letter_grade,
                'percentage': percentage,
                'passed': percentage >= 0.6
            },
            'question_details': [
                {
                    'question_number': i + 1,
                    'detected_answer': ['A', 'B', 'C', 'D', 'E'][i % 5],
                    'correct_answers': [['A', 'C', 'B', 'D', 'A'][i % 5]],
                    'is_correct': i < correct_answers,
                    'confidence': 0.85 + (i * 0.02)
                }
                for i in range(total_questions)
            ],
            'recommendations': [
                'Revisar questões de álgebra',
                'Praticar mais exercícios de geometria'
            ] if percentage < 0.8 else ['Excelente desempenho!']
        }
        
        # Update stats
        mock_stats['tests_corrected'] += 1
        
        return jsonify({
            'success': True,
            'result': result,
            'detailed_report': detailed_report
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/correct/batch', methods=['POST'])
def correct_batch_tests():
    """Simulate batch test correction"""
    try:
        # Simulate processing multiple files
        files = request.files.getlist('images')
        num_files = len(files) if files and files[0].filename else 3  # Default to 3 for demo
        
        time.sleep(1)  # Simulate processing time
        
        results = []
        for i in range(num_files):
            student_id = f"ALUNO_{uuid.uuid4().hex[:6].upper()}"
            correct_answers = 5 + (i * 2) % 8  # Vary results
            total_questions = 10
            percentage = correct_answers / total_questions
            
            if percentage >= 0.9:
                letter_grade = 'A'
            elif percentage >= 0.8:
                letter_grade = 'B'
            elif percentage >= 0.7:
                letter_grade = 'C'
            elif percentage >= 0.6:
                letter_grade = 'D'
            else:
                letter_grade = 'F'
            
            results.append({
                'student_id': student_id,
                'correct_answers': correct_answers,
                'total_questions': total_questions,
                'score': (correct_answers / total_questions) * 10,
                'percentage': percentage,
                'letter_grade': letter_grade,
                'processing_time': 1.5 + (i * 0.2)
            })
        
        # Update stats
        mock_stats['tests_corrected'] += len(results)
        
        return jsonify({
            'success': True,
            'results': results,
            'total_processed': len(results)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/question-types')
def get_question_types():
    """Get available question types"""
    return jsonify([
        {
            'id': 'multiple_choice',
            'name': 'Múltipla Escolha',
            'description': 'Questões com alternativas A, B, C, D, E'
        },
        {
            'id': 'true_false',
            'name': 'Verdadeiro/Falso',
            'description': 'Questões de verdadeiro ou falso'
        },
        {
            'id': 'numeric',
            'name': 'Numérica',
            'description': 'Questões com respostas numéricas'
        },
        {
            'id': 'short_text',
            'name': 'Texto Curto',
            'description': 'Questões com respostas em texto'
        }
    ])

@app.route('/api/reports/summary')
def get_reports_summary():
    """Get summary data for reports dashboard"""
    mock_report_data = {
        'total_tests': mock_stats['tests_corrected'],
        'average_score': mock_stats['average_score'],
        'pass_rate': mock_stats['success_rate'] * 100,
        'total_students': 45,
        'performance_trend': [6.5, 7.2, 7.8, 7.1, 8.0, 7.8],
        'grade_distribution': {
            'A': 15, 'B': 25, 'C': 30, 'D': 20, 'F': 10
        },
        'question_performance': [92, 85, 78, 65, 48, 72, 81, 69],
        'template_usage': {
            'Matemática': 35,
            'História': 25,
            'Ciências': 25,
            'Português': 15
        }
    }
    return jsonify(mock_report_data)

@app.route('/api/reports/<report_id>')
def get_report(report_id):
    """Get a specific report by ID"""
    # Mock report data
    mock_report = {
        'id': report_id,
        'name': f'Relatório {report_id}',
        'created_at': datetime.now().isoformat(),
        'type': 'detailed',
        'data': {
            'students': 45,
            'tests': 156,
            'average': 7.8
        }
    }
    return jsonify(mock_report)

@app.route('/api/export/<format>')
def export_results(format):
    """Export results in specified format"""
    if format not in ['json', 'excel', 'pdf', 'word']:
        return jsonify({'success': False, 'error': 'Formato inválido'}), 400
    
    # Mock export data
    export_data = {
        'export_date': datetime.now().isoformat(),
        'total_tests': mock_stats['tests_corrected'],
        'average_score': mock_stats['average_score'],
        'success_rate': mock_stats['success_rate']
    }
    
    return jsonify({
        'success': True,
        'download_url': f'/downloads/results.{format}',
        'data': export_data
    })

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('exports', exist_ok=True)
    
    print("Sistema de Correcao Automatica iniciando...")
    print("Interface acessivel em: http://localhost:5000")
    print("Versao simplificada para teste da interface")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
