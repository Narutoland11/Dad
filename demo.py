#!/usr/bin/env python3
"""
Demonstração do Sistema de Correção Automática de Provas
=========================================================

Este script demonstra todas as funcionalidades do sistema:
- Criação de templates flexíveis
- Processamento de imagens de provas
- Correção automática
- Geração de relatórios detalhados
- Análises de turma

Autor: Sistema de Correção Automática
Data: 2025
"""

import os
import json
from pathlib import Path

from models import QuestionType, AnswerTemplates
from template_builder import TemplateBuilder, TemplateExamples
from test_corrector import TestCorrectionEngine
from image_processor import AdvancedImageProcessor

def print_header(title: str):
    """Print a formatted header"""
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def print_section(title: str):
    """Print a formatted section"""
    print(f"\n📋 {title}")
    print("-" * 50)

def demo_template_creation():
    """Demonstrate template creation with different question types"""
    print_header("DEMONSTRAÇÃO: CRIAÇÃO DE TEMPLATES")
    
    # Create a comprehensive template
    builder = TemplateBuilder()
    
    print_section("Criando Template Avançado")
    
    template = builder.create_new_template(
        name="Prova de Matemática - 1º Bimestre",
        version="A",
        created_by="Prof. João Silva",
        instructions="Leia atentamente cada questão e marque/escreva sua resposta claramente"
    )
    
    print_section("Adicionando Questões Múltipla Escolha")
    # Multiple choice questions with different options
    builder.add_multiple_choice_question(1, ["A"], weight=1.0)
    builder.add_multiple_choice_question(2, ["C"], weight=1.0)
    builder.add_multiple_choice_question(3, ["B"], weight=1.5)  # Higher weight
    
    print_section("Adicionando Questões Verdadeiro/Falso")
    builder.add_true_false_question(4, "V", weight=1.0)
    builder.add_true_false_question(5, "F", weight=1.0)
    
    print_section("Adicionando Questões Numéricas")
    builder.add_numeric_question(6, 42.0, error_margin=1.0, weight=2.0)
    builder.add_numeric_question(7, 3.14, error_margin=0.05, weight=2.0)
    
    print_section("Adicionando Questões de Texto Curto")
    builder.add_short_text_question(8, ["Pitágoras", "pitagoras"], weight=1.5)
    builder.add_short_text_question(9, ["área", "area"], weight=1.5)
    
    print_section("Adicionando Questões com Símbolos Customizados")
    builder.add_custom_symbols_question(10, ["■"], weight=1.0)
    
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
    """Demonstrate predefined template examples"""
    print_header("DEMONSTRAÇÃO: TEMPLATES PREDEFINIDOS")
    
    print_section("Template Básico - Múltipla Escolha")
    basic_template = TemplateExamples.create_basic_multiple_choice()
    print(f"✅ Template criado: {basic_template.name}")
    print(f"   - {len(basic_template.questions)} questões")
    print(f"   - {basic_template.total_points} pontos totais")
    
    print_section("Template Misto - Diversos Tipos")
    mixed_template = TemplateExamples.create_mixed_question_types()
    print(f"✅ Template criado: {mixed_template.name}")
    print(f"   - {len(mixed_template.questions)} questões")
    print(f"   - {mixed_template.total_points} pontos totais")
    
    print_section("Template Avançado - Todos os Recursos")
    advanced_template = TemplateExamples.create_advanced_template()
    print(f"✅ Template criado: {advanced_template.name}")
    print(f"   - {len(advanced_template.questions)} questões")
    print(f"   - {advanced_template.total_points} pontos totais")
    
    return [basic_template, mixed_template, advanced_template]

def demo_correction_engine():
    """Demonstrate the test correction engine"""
    print_header("DEMONSTRAÇÃO: MOTOR DE CORREÇÃO")
    
    # Initialize correction engine
    print_section("Inicializando Motor de Correção")
    corrector = TestCorrectionEngine()
    print("✅ Motor de correção inicializado")
    
    # Create and save a template
    print_section("Criando Template de Exemplo")
    template = TemplateExamples.create_mixed_question_types()
    
    # Save template to file
    template_path = "templates/exemplo_misto.json"
    os.makedirs("templates", exist_ok=True)
    corrector.save_template(template, template_path)
    print(f"✅ Template salvo em: {template_path}")
    
    # Load template
    loaded_template = corrector.load_template(template_path)
    print(f"✅ Template carregado: {loaded_template.name}")
    
    return corrector, template

def demo_simulated_correction():
    """Demonstrate simulated test correction"""
    print_header("DEMONSTRAÇÃO: CORREÇÃO SIMULADA")
    
    corrector, template = demo_correction_engine()
    
    print_section("Simulando Correções de Alunos")
    
    # Simulate student responses (since we don't have actual images)
    simulated_students = [
        {
            "id": "aluno_001",
            "responses": ["A", "B", "C", "V", "F", "42", "100", "", "", ""]
        },
        {
            "id": "aluno_002", 
            "responses": ["A", "C", "C", "V", "V", "43", "99", "", "", ""]
        },
        {
            "id": "aluno_003",
            "responses": ["B", "B", "C", "F", "F", "41", "101", "", "", ""]
        },
        {
            "id": "aluno_004",
            "responses": ["A", "B", "D", "V", "F", "42", "100", "", "", ""]
        },
        {
            "id": "aluno_005",
            "responses": ["A", "B", "C", "V", "F", "42.5", "100", "", "", ""]
        }
    ]
    
    results = []
    
    for student in simulated_students:
        print(f"\n🎓 Corrigindo prova do {student['id']}")
        
        # Create simulated responses
        from models import StudentResponse
        responses = []
        
        for i, answer in enumerate(student['responses'], 1):
            response = StudentResponse(
                question_number=i,
                detected_answer=answer,
                confidence=0.9 if answer else 0.0,
                processing_notes="Simulado" if answer else "Resposta não detectada"
            )
            responses.append(response)
        
        # Create test result
        from models import TestResult
        result = TestResult(
            student_id=student['id'],
            test_template_id=template.id,
            responses=responses,
            image_path=f"simulado_{student['id']}.jpg"
        )
        
        # Calculate score
        result.calculate_score(template)
        results.append(result)
        corrector.results.append(result)
        
        print(f"   📊 Resultado: {result.correct_answers}/{result.total_questions} corretas")
        print(f"   📈 Pontuação: {result.percentage:.1f}% (Nota: {result.letter_grade})")
    
    return corrector, results

def demo_detailed_reports():
    """Demonstrate detailed reporting"""
    print_header("DEMONSTRAÇÃO: RELATÓRIOS DETALHADOS")
    
    corrector, results = demo_simulated_correction()
    
    print_section("Relatório Individual Detalhado")
    
    # Generate detailed report for first student
    if results:
        detailed_report = corrector.generate_detailed_report(results[0])
        
        print(f"🎓 Aluno: {detailed_report['student_info']['id']}")
        print(f"📊 Resultado: {detailed_report['results']['correct_answers']}/{detailed_report['test_info']['total_questions']}")
        print(f"📈 Pontuação: {detailed_report['results']['percentage']:.1f}%")
        print(f"🎯 Nota: {detailed_report['results']['letter_grade']}")
        print(f"✅ Aprovado: {'Sim' if detailed_report['results']['passed'] else 'Não'}")
        
        print("\n📋 Detalhes por Questão:")
        for q_detail in detailed_report['question_details'][:5]:  # Show first 5
            status = "✅" if q_detail['is_correct'] else "❌"
            print(f"   {status} Q{q_detail['question_number']}: "
                  f"Detectado='{q_detail['detected_answer']}' "
                  f"Correto={q_detail['correct_answers']} "
                  f"(Confiança: {q_detail['confidence']:.1f})")
        
        print(f"\n💡 Recomendações:")
        for rec in detailed_report['recommendations']:
            print(f"   • {rec}")
    
    return corrector

def demo_class_analytics():
    """Demonstrate class analytics"""
    print_header("DEMONSTRAÇÃO: ANÁLISES DE TURMA")
    
    corrector = demo_detailed_reports()
    
    if not corrector.results:
        print("❌ Nenhum resultado disponível para análise")
        return
    
    print_section("Análise Estatística da Turma")
    
    template_id = corrector.results[0].test_template_id
    analytics = corrector.generate_class_analytics(template_id)
    
    if "error" in analytics:
        print(f"❌ Erro: {analytics['error']}")
        return
    
    stats = analytics['class_statistics']
    
    print(f"📚 Prova: {analytics['template_info']['name']}")
    print(f"👥 Total de Alunos: {stats['total_students']}")
    print(f"📊 Média da Turma: {stats['average_score']:.1f}%")
    print(f"🏆 Maior Nota: {stats['highest_score']:.1f}%")
    print(f"📉 Menor Nota: {stats['lowest_score']:.1f}%")
    print(f"✅ Taxa de Aprovação: {stats['passing_rate']:.1f}%")
    
    print(f"\n📈 Distribuição de Notas:")
    for grade, count in stats['grade_distribution'].items():
        print(f"   {grade}: {count} aluno(s)")
    
    print(f"\n🔍 Análise por Questão:")
    for q_analysis in analytics['question_analysis'][:5]:  # Show first 5
        print(f"   Q{q_analysis['question_number']} ({q_analysis['type']}): "
              f"{q_analysis['correct_percentage']:.1f}% acertos - "
              f"Dificuldade: {q_analysis['difficulty_level']}")
    
    print(f"\n💡 Recomendações para a Turma:")
    for rec in analytics['recommendations']:
        print(f"   • {rec}")

def demo_export_functionality():
    """Demonstrate export functionality"""
    print_header("DEMONSTRAÇÃO: EXPORTAÇÃO DE RESULTADOS")
    
    corrector = demo_detailed_reports()
    
    if not corrector.results:
        print("❌ Nenhum resultado disponível para exportação")
        return
    
    print_section("Exportando Resultados")
    
    # Create exports directory
    os.makedirs("exports", exist_ok=True)
    
    # Export to JSON
    json_path = "exports/resultados.json"
    corrector.export_results(json_path, format="json")
    print(f"✅ Resultados exportados para JSON: {json_path}")
    
    # Try to export to Excel (if pandas is available)
    try:
        excel_path = "exports/resultados.xlsx"
        corrector.export_results(excel_path, format="excel")
        print(f"✅ Resultados exportados para Excel: {excel_path}")
    except ImportError:
        print("⚠️  Pandas não disponível - exportação Excel pulada")
    except Exception as e:
        print(f"⚠️  Erro na exportação Excel: {e}")

def demo_answer_templates():
    """Demonstrate predefined answer templates"""
    print_header("DEMONSTRAÇÃO: TEMPLATES DE RESPOSTAS")
    
    print_section("Templates Predefinidos Disponíveis")
    
    print("🔤 Múltipla Escolha A-E:")
    mc_options = AnswerTemplates.multiple_choice_abcde()
    for opt in mc_options:
        print(f"   {opt.value}: {opt.acceptable_variations}")
    
    print("\n✅❌ Verdadeiro/Falso:")
    tf_options = AnswerTemplates.true_false()
    for opt in tf_options:
        print(f"   {opt.value}: {opt.acceptable_variations}")
    
    print("\n🔢 Números (1-5):")
    num_options = AnswerTemplates.numeric_range(1, 5)
    for opt in num_options[:3]:  # Show first 3
        print(f"   {opt.value}: {opt.acceptable_variations}")
    
    print("\n🇬🇷 Alfabeto Grego:")
    greek_options = AnswerTemplates.greek_alphabet()
    for opt in greek_options:
        print(f"   {opt.value}: {opt.acceptable_variations}")
    
    print("\n🔶 Símbolos Customizados:")
    symbol_options = AnswerTemplates.custom_symbols()
    for opt in symbol_options:
        print(f"   {opt.value}: {opt.acceptable_variations}")

def main():
    """Run the complete demonstration"""
    print_header("SISTEMA DE CORREÇÃO AUTOMÁTICA DE PROVAS")
    print("Sistema Avançado para Professores")
    print("Desenvolvido com IA e Visão Computacional")
    
    try:
        # Run all demonstrations
        demo_answer_templates()
        demo_template_creation()
        demo_template_examples()
        demo_simulated_correction()
        demo_detailed_reports()
        demo_class_analytics()
        demo_export_functionality()
        
        print_header("DEMONSTRAÇÃO CONCLUÍDA")
        print("✅ Todas as funcionalidades foram demonstradas com sucesso!")
        print("\n📚 Para usar o sistema:")
        print("1. Crie templates usando TemplateBuilder")
        print("2. Processe imagens com TestCorrectionEngine")
        print("3. Analise resultados e gere relatórios")
        print("4. Exporte dados para planilhas")
        
        print("\n🔧 Próximos passos:")
        print("• Instale as dependências: pip install -r requirements.txt")
        print("• Configure o Tesseract OCR no seu sistema")
        print("• Teste com imagens reais de provas")
        print("• Personalize templates conforme suas necessidades")
        
    except Exception as e:
        print(f"\n❌ Erro durante a demonstração: {e}")
        print("Verifique se todas as dependências estão instaladas")

if __name__ == "__main__":
    main()
