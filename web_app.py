from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename

from models import QuestionType
from template_builder import TemplateBuilder, TemplateExamples
from test_corrector import TestCorrectionEngine

app = Flask(__name__)
CORS(app)

# Configuration
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['TEMPLATES_FOLDER'] = 'templates'
app.config['EXPORTS_FOLDER'] = 'exports'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure directories exist
for folder in [app.config['UPLOAD_FOLDER'], app.config['TEMPLATES_FOLDER'], app.config['EXPORTS_FOLDER']]:
    os.makedirs(folder, exist_ok=True)

# Global correction engine
corrector = TestCorrectionEngine()

@app.route('/')
def index():
    """Main dashboard"""
    return render_template('index.html')

@app.route('/api/templates', methods=['GET'])
def get_templates():
    """Get all available templates"""
    templates = []
    templates_dir = app.config['TEMPLATES_FOLDER']
    
    for filename in os.listdir(templates_dir):
        if filename.endswith('.json'):
            try:
                template = corrector.load_template(os.path.join(templates_dir, filename))
                templates.append({
                    'id': template.id,
                    'name': template.name,
                    'version': template.version,
                    'questions': len(template.questions),
                    'created_by': template.created_by,
                    'created_at': template.created_at.isoformat()
                })
            except Exception as e:
                print(f"Error loading template {filename}: {e}")
    
    return jsonify(templates)

@app.route('/api/templates', methods=['POST'])
def create_template():
    """Create a new template"""
    try:
        data = request.json
        builder = TemplateBuilder()
        
        # Create basic template
        template = builder.create_new_template(
            name=data['name'],
            version=data.get('version', 'A'),
            created_by=data.get('created_by', ''),
            instructions=data.get('instructions', '')
        )
        
        # Add questions
        for q_data in data['questions']:
            q_type = QuestionType(q_data['type'])
            
            if q_type == QuestionType.MULTIPLE_CHOICE:
                builder.add_multiple_choice_question(
                    question_number=q_data['number'],
                    correct_answers=q_data['correct_answers'],
                    weight=q_data.get('weight', 1.0),
                    allow_multiple=q_data.get('allow_multiple', False)
                )
            elif q_type == QuestionType.TRUE_FALSE:
                builder.add_true_false_question(
                    question_number=q_data['number'],
                    correct_answer=q_data['correct_answers'][0],
                    weight=q_data.get('weight', 1.0)
                )
            elif q_type == QuestionType.NUMERIC:
                builder.add_numeric_question(
                    question_number=q_data['number'],
                    correct_answer=float(q_data['correct_answers'][0]),
                    error_margin=q_data.get('error_margin', 0.1),
                    weight=q_data.get('weight', 1.0)
                )
            elif q_type == QuestionType.SHORT_TEXT:
                builder.add_short_text_question(
                    question_number=q_data['number'],
                    correct_answers=q_data['correct_answers'],
                    weight=q_data.get('weight', 1.0)
                )
        
        # Set grading scale
        if 'grading' in data:
            builder.set_grading_scale(
                passing_score=data['grading'].get('passing_score', 70.0),
                letter_grades=data['grading'].get('letter_grades')
            )
        
        # Save template
        filename = f"{template.id}.json"
        filepath = os.path.join(app.config['TEMPLATES_FOLDER'], filename)
        corrector.save_template(template, filepath)
        
        return jsonify({
            'success': True,
            'template_id': template.id,
            'message': 'Template criado com sucesso!'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/templates/examples', methods=['POST'])
def create_example_template():
    """Create an example template"""
    try:
        template_type = request.json.get('type', 'basic')
        
        if template_type == 'basic':
            template = TemplateExamples.create_basic_multiple_choice()
        elif template_type == 'mixed':
            template = TemplateExamples.create_mixed_question_types()
        elif template_type == 'advanced':
            template = TemplateExamples.create_advanced_template()
        else:
            return jsonify({'success': False, 'error': 'Tipo de template inválido'}), 400
        
        # Save template
        filename = f"{template.id}.json"
        filepath = os.path.join(app.config['TEMPLATES_FOLDER'], filename)
        corrector.save_template(template, filepath)
        
        return jsonify({
            'success': True,
            'template_id': template.id,
            'message': f'Template de exemplo "{template.name}" criado!'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/correct', methods=['POST'])
def correct_test():
    """Correct a single test"""
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'Nenhuma imagem enviada'}), 400
        
        file = request.files['image']
        template_id = request.form.get('template_id')
        student_id = request.form.get('student_id', f'student_{uuid.uuid4().hex[:8]}')
        
        if not template_id:
            return jsonify({'success': False, 'error': 'ID do template não fornecido'}), 400
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'}), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Correct the test
        result = corrector.correct_test(filepath, template_id, student_id)
        
        # Generate detailed report
        detailed_report = corrector.generate_detailed_report(result)
        
        return jsonify({
            'success': True,
            'result': {
                'student_id': result.student_id,
                'score': result.total_score,
                'percentage': result.percentage,
                'letter_grade': result.letter_grade,
                'correct_answers': result.correct_answers,
                'total_questions': result.total_questions,
                'processing_time': result.processing_time
            },
            'detailed_report': detailed_report
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/correct/batch', methods=['POST'])
def correct_batch():
    """Correct multiple tests"""
    try:
        template_id = request.form.get('template_id')
        
        if not template_id:
            return jsonify({'success': False, 'error': 'ID do template não fornecido'}), 400
        
        if 'images' not in request.files:
            return jsonify({'success': False, 'error': 'Nenhuma imagem enviada'}), 400
        
        files = request.files.getlist('images')
        results = []
        
        for i, file in enumerate(files):
            if file.filename != '':
                # Save file
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                
                # Generate student ID
                student_id = f'student_{i+1:03d}'
                
                try:
                    # Correct test
                    result = corrector.correct_test(filepath, template_id, student_id)
                    results.append({
                        'student_id': result.student_id,
                        'score': result.total_score,
                        'percentage': result.percentage,
                        'letter_grade': result.letter_grade,
                        'correct_answers': result.correct_answers,
                        'total_questions': result.total_questions
                    })
                except Exception as e:
                    results.append({
                        'student_id': student_id,
                        'error': str(e)
                    })
        
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

@app.route('/api/analytics/<template_id>')
def get_analytics(template_id):
    """Get class analytics for a template"""
    try:
        analytics = corrector.generate_class_analytics(template_id)
        return jsonify({
            'success': True,
            'analytics': analytics
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/export/<format>')
def export_results(format):
    """Export results in specified format"""
    try:
        if format not in ['json', 'excel']:
            return jsonify({'success': False, 'error': 'Formato inválido'}), 400
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'resultados_{timestamp}.{format if format != "excel" else "xlsx"}'
        filepath = os.path.join(app.config['EXPORTS_FOLDER'], filename)
        
        corrector.export_results(filepath, format)
        
        return send_file(filepath, as_attachment=True, download_name=filename)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/question-types')
def get_question_types():
    """Get available question types"""
    return jsonify([
        {'value': 'multiple_choice', 'label': 'Múltipla Escolha'},
        {'value': 'true_false', 'label': 'Verdadeiro/Falso'},
        {'value': 'numeric', 'label': 'Numérica'},
        {'value': 'short_text', 'label': 'Texto Curto'},
        {'value': 'custom_symbols', 'label': 'Símbolos Customizados'}
    ])

if __name__ == '__main__':
    print("🚀 Iniciando Sistema de Correção Automática de Provas")
    print("📱 Interface Web disponível em: http://localhost:5000")
    print("📚 API endpoints:")
    print("   GET  /api/templates - Listar templates")
    print("   POST /api/templates - Criar template")
    print("   POST /api/correct - Corrigir prova individual")
    print("   POST /api/correct/batch - Correção em lote")
    print("   GET  /api/analytics/<id> - Análises de turma")
    print("   GET  /api/export/<format> - Exportar resultados")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
