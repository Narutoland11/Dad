#!/usr/bin/env python3
"""
Demonstração Simplificada do Sistema de Correção Automática de Provas
====================================================================

Esta demonstração mostra as funcionalidades principais do sistema sem
dependências externas pesadas, focando na lógica de correção e templates.

Autor: Sistema de Correção Automática
Data: 2025
"""

import json
import os
from datetime import datetime
from models import (
    TestTemplate, Question, AnswerOption, QuestionType, 
    GradingMode, AnswerTemplates, StudentResponse, TestResult
)
from template_builder import TemplateBuilder, TemplateExamples

def print_header(title: str):
    """Print a formatted header"""
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def print_section(title: str):
    """Print a formatted section"""
    print(f"\n[*] {title}")
    print("-" * 50)

def demo_answer_templates():
    """Demonstrate predefined answer templates"""
    print_header("TEMPLATES DE RESPOSTAS PREDEFINIDOS")
    
    print_section("Multipla Escolha A-E")
    mc_options = AnswerTemplates.multiple_choice_abcde()
    for opt in mc_options:
        print(f"   {opt.value}: {opt.acceptable_variations}")
    
    print_section("Verdadeiro/Falso")
    tf_options = AnswerTemplates.true_false()
    for opt in tf_options:
        print(f"   {opt.value}: {opt.acceptable_variations}")
    
    print_section("Alfabeto Grego")
    greek_options = AnswerTemplates.greek_alphabet()
    for opt in greek_options:
        print(f"   {opt.value}: {opt.acceptable_variations}")
    
    print_section("Símbolos Customizados")
    symbol_options = AnswerTemplates.custom_symbols()
    for opt in symbol_options:
        print(f"   {opt.value}: {opt.acceptable_variations}")

def demo_template_creation():
    """Demonstrate interactive template creation"""
    print_header("CRIAÇÃO DE TEMPLATE PERSONALIZADO")
    
    builder = TemplateBuilder()
    
    print_section("Criando Template Base")
    template = builder.create_new_template(
        name="Prova de Matemática - 1º Bimestre",
        version="A",
        created_by="Prof. Maria Silva",
        instructions="Leia atentamente e marque/escreva suas respostas claramente"
    )
    
    print_section("Adicionando Questões Múltipla Escolha")
    builder.add_multiple_choice_question(1, ["A"], weight=1.0)
    builder.add_multiple_choice_question(2, ["C"], weight=1.0)
    builder.add_multiple_choice_question(3, ["B"], weight=1.5)  # Peso maior
    
    print_section("Adicionando Questões Verdadeiro/Falso")
    builder.add_true_false_question(4, "V", weight=1.0)
    builder.add_true_false_question(5, "F", weight=1.0)
    
    print_section("Adicionando Questões Numéricas")
    builder.add_numeric_question(6, 42.0, error_margin=1.0, weight=2.0)
    builder.add_numeric_question(7, 3.14, error_margin=0.05, weight=2.0)
    
    print_section("Adicionando Questões de Texto")
    builder.add_short_text_question(8, ["Pitágoras", "pitagoras"], weight=1.5)
    
    print_section("Configurando Escala de Notas")
    builder.set_grading_scale(
        passing_score=60.0,
        letter_grades={
            "A": 90.0,
            "B": 80.0,
            "C": 70.0,
            "D": 60.0,
            "F": 0.0
        }
    )
    
    print_section("Preview do Template")
    preview = builder.preview_template()
    print(json.dumps(preview, indent=2, ensure_ascii=False))
    
    return template

def demo_template_examples():
    """Demonstrate predefined templates"""
    print_header("TEMPLATES PREDEFINIDOS")
    
    print_section("Template Básico - Múltipla Escolha")
    basic = TemplateExamples.create_basic_multiple_choice()
    print(f"✅ {basic.name}")
    print(f"   📊 {len(basic.questions)} questões, {basic.total_points} pontos")
    
    print_section("Template Misto - Diversos Tipos")
    mixed = TemplateExamples.create_mixed_question_types()
    print(f"✅ {mixed.name}")
    print(f"   📊 {len(mixed.questions)} questões, {mixed.total_points} pontos")
    
    print_section("Template Avançado - Todos os Recursos")
    advanced = TemplateExamples.create_advanced_template()
    print(f"✅ {advanced.name}")
    print(f"   📊 {len(advanced.questions)} questões, {advanced.total_points} pontos")
    
    return [basic, mixed, advanced]

def demo_correction_logic():
    """Demonstrate the correction logic without image processing"""
    print_header("LÓGICA DE CORREÇÃO AUTOMÁTICA")
    
    # Use the mixed template for demonstration
    template = TemplateExamples.create_mixed_question_types()
    
    print_section("Template Utilizado")
    print(f"📚 {template.name}")
    print(f"📊 {len(template.questions)} questões")
    
    print("\n🔍 Questões do Template:")
    for q in template.questions:
        correct_answers = [ans.value for ans in q.correct_answers]
        print(f"   Q{q.number} ({q.type.value}): {correct_answers} (peso: {q.weight})")
    
    print_section("Simulando Respostas de Alunos")
    
    # Simulate different student responses
    students_data = [
        {
            "id": "João Silva",
            "responses": ["A", "B", "C", "V", "F", "42", "100"]
        },
        {
            "id": "Maria Santos",
            "responses": ["A", "C", "C", "V", "V", "43", "99"]
        },
        {
            "id": "Pedro Costa",
            "responses": ["B", "B", "C", "F", "F", "41", "101"]
        },
        {
            "id": "Ana Oliveira",
            "responses": ["A", "B", "D", "V", "F", "42.5", "100"]
        }
    ]
    
    results = []
    
    for student_data in students_data:
        print(f"\n[ALUNO] Corrigindo: {student_data['id']}")
        
        # Create student responses
        responses = []
        for i, answer in enumerate(student_data['responses'], 1):
            response = StudentResponse(
                question_number=i,
                detected_answer=answer,
                confidence=0.95,
                processing_notes="Simulado"
            )
            responses.append(response)
        
        # Create test result
        result = TestResult(
            student_id=student_data['id'],
            test_template_id=template.id,
            responses=responses,
            image_path=f"simulado_{student_data['id'].replace(' ', '_')}.jpg"
        )
        
        # Calculate score using template logic
        result.calculate_score(template)
        results.append(result)
        
        # Show detailed results
        print(f"   [SCORE] Pontuacao: {result.total_score:.1f}/{template.total_points}")
        print(f"   [PERC] Percentual: {result.percentage:.1f}%")
        print(f"   [GRADE] Nota: {result.letter_grade}")
        print(f"   [CORRECT] Acertos: {result.correct_answers}/{result.total_questions}")
        
        # Show question-by-question breakdown
        print("   [DETAILS] Detalhamento:")
        for q_num, feedback in result.detailed_feedback.items():
            status = "[OK]" if feedback['is_correct'] else "[ERRO]"
            detected = feedback['detected_answer']
            correct = feedback['correct_answers']
            score = feedback['weighted_score']
            print(f"      {status} Q{q_num}: '{detected}' (correto: {correct}) - {score:.1f} pts")
    
    return results, template

def demo_class_analytics(results, template):
    """Demonstrate class analytics"""
    print_header("ANÁLISE DE DESEMPENHO DA TURMA")
    
    if not results:
        print("❌ Nenhum resultado disponível")
        return
    
    print_section("Estatísticas Gerais")
    
    scores = [r.percentage for r in results]
    
    print(f"[TOTAL] Total de Alunos: {len(results)}")
    print(f"[MEDIA] Media da Turma: {sum(scores)/len(scores):.1f}%")
    print(f"[MAX] Maior Nota: {max(scores):.1f}%")
    print(f"[MIN] Menor Nota: {min(scores):.1f}%")
    
    # Calculate passing rate
    passing_count = sum(1 for score in scores if score >= template.passing_score)
    passing_rate = (passing_count / len(scores)) * 100
    print(f"[PASS] Taxa de Aprovacao: {passing_rate:.1f}%")
    
    print_section("Distribuição de Notas")
    grade_dist = {}
    for result in results:
        grade = result.letter_grade
        grade_dist[grade] = grade_dist.get(grade, 0) + 1
    
    for grade, count in sorted(grade_dist.items()):
        print(f"   {grade}: {count} aluno(s)")
    
    print_section("Análise por Questão")
    
    for question in template.questions:
        q_num = question.number
        correct_count = 0
        total_responses = 0
        
        for result in results:
            feedback = result.detailed_feedback.get(q_num, {})
            if feedback:
                total_responses += 1
                if feedback.get('is_correct', False):
                    correct_count += 1
        
        if total_responses > 0:
            success_rate = (correct_count / total_responses) * 100
            difficulty = "Fácil" if success_rate >= 80 else "Moderada" if success_rate >= 60 else "Difícil" if success_rate >= 40 else "Muito Difícil"
            
            print(f"   Q{q_num} ({question.type.value}): {success_rate:.1f}% acertos - {difficulty}")
    
    print_section("Recomendações")
    
    if passing_rate < 50:
        print("   • Taxa de aprovação baixa - revisar metodologia de ensino")
    elif passing_rate < 70:
        print("   • Taxa de aprovação moderada - reforçar conceitos-chave")
    else:
        print("   • Boa taxa de aprovação - manter qualidade do ensino")
    
    # Find difficult questions
    difficult_questions = []
    for question in template.questions:
        q_num = question.number
        correct_count = sum(1 for r in results 
                          if r.detailed_feedback.get(q_num, {}).get('is_correct', False))
        success_rate = (correct_count / len(results)) * 100
        
        if success_rate < 50:
            difficult_questions.append(str(q_num))
    
    if difficult_questions:
        print(f"   • Questões com baixo índice de acerto: {', '.join(difficult_questions)}")
        print("   • Considerar revisão do conteúdo ou reformulação das questões")

def demo_json_export(template, results):
    """Demonstrate JSON export functionality"""
    print_header("EXPORTAÇÃO DE DADOS")
    
    print_section("Exportando Template")
    
    # Create directories
    os.makedirs("templates", exist_ok=True)
    os.makedirs("results", exist_ok=True)
    
    # Export template
    template_file = f"templates/{template.id}.json"
    with open(template_file, 'w', encoding='utf-8') as f:
        f.write(template.to_json())
    
    print(f"[OK] Template exportado: {template_file}")
    
    print_section("Exportando Resultados")
    
    # Export results
    export_data = {
        "export_date": datetime.now().isoformat(),
        "template_info": {
            "id": template.id,
            "name": template.name,
            "version": template.version
        },
        "results": []
    }
    
    for result in results:
        result_data = {
            "student_id": result.student_id,
            "score": result.total_score,
            "percentage": result.percentage,
            "letter_grade": result.letter_grade,
            "correct_answers": result.correct_answers,
            "total_questions": result.total_questions,
            "detailed_feedback": result.detailed_feedback
        }
        export_data["results"].append(result_data)
    
    results_file = "results/correction_results.json"
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)
    
    print(f"[OK] Resultados exportados: {results_file}")
    
    print_section("Arquivos Criados")
    print(f"📁 {template_file}")
    print(f"📁 {results_file}")

def main():
    """Run the complete demonstration"""
    print_header("SISTEMA DE CORREÇÃO AUTOMÁTICA DE PROVAS")
    print("Sistema Avancado para Professores")
    print("Desenvolvido com IA e Visao Computacional")
    print("Demonstracao das Funcionalidades Principais")
    
    try:
        # Run demonstrations
        demo_answer_templates()
        template = demo_template_creation()
        demo_template_examples()
        results, template = demo_correction_logic()
        demo_class_analytics(results, template)
        demo_json_export(template, results)
        
        print_header("DEMONSTRACAO CONCLUIDA COM SUCESSO!")
        
        print("\n[SUCCESS] Funcionalidades Demonstradas:")
        print("   [OK] Templates flexiveis de resposta")
        print("   [OK] Criacao interativa de gabaritos")
        print("   [OK] Templates predefinidos")
        print("   [OK] Logica de correcao automatica")
        print("   [OK] Analise de desempenho da turma")
        print("   [OK] Exportacao de dados")
        
        print("\n[USAGE] Para usar o sistema completo:")
        print("1. [STEP] Crie templates usando TemplateBuilder")
        print("2. [STEP] Processe imagens com TestCorrectionEngine")
        print("3. [STEP] Analise resultados e gere relatorios")
        print("4. [STEP] Exporte dados para planilhas")
        
        print("\n[NEXT] Proximos passos:")
        print("• Instale Tesseract OCR para processamento de imagens")
        print("• Execute 'pip install -r requirements.txt'")
        print("• Teste com imagens reais de provas")
        print("• Execute 'python web_app.py' para interface web")
        
        print("\n[FEATURES] Recursos Avancados:")
        print("• Suporte a múltiplos tipos de questão")
        print("• Correção com pesos e crédito parcial")
        print("• Processamento de imagem com IA")
        print("• Análises estatísticas detalhadas")
        print("• Interface web para professores")
        
    except Exception as e:
        print(f"\n[ERROR] Erro durante a demonstracao: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
