from typing import List, Dict, Optional
import uuid
from datetime import datetime

from models import (
    TestTemplate, Question, AnswerOption, QuestionType, 
    GradingMode, AnswerTemplates
)

class TemplateBuilder:
    """Interactive template builder for teachers"""
    
    def __init__(self):
        self.current_template: Optional[TestTemplate] = None
    
    def create_new_template(self, name: str, version: str = "A", 
                          created_by: str = "", instructions: str = "") -> TestTemplate:
        """Create a new test template"""
        template_id = f"{name.replace(' ', '_').lower()}_{version}_{uuid.uuid4().hex[:8]}"
        
        self.current_template = TestTemplate(
            id=template_id,
            name=name,
            version=version,
            created_by=created_by,
            instructions=instructions
        )
        
        print(f"✅ Novo template criado: {name} (ID: {template_id})")
        return self.current_template
    
    def add_multiple_choice_question(self, question_number: int, 
                                   correct_answers: List[str],
                                   weight: float = 1.0,
                                   allow_multiple: bool = False,
                                   custom_options: Optional[List[str]] = None) -> Question:
        """Add a multiple choice question"""
        if not self.current_template:
            raise ValueError("Crie um template primeiro usando create_new_template()")
        
        # Use custom options or default A-E
        if custom_options:
            all_options = [AnswerOption(opt, [opt.lower(), opt.upper()]) for opt in custom_options]
        else:
            all_options = AnswerTemplates.multiple_choice_abcde()
        
        # Set correct answers
        correct_options = []
        for correct_ans in correct_answers:
            for option in all_options:
                if option.value.upper() == correct_ans.upper():
                    correct_options.append(option)
                    break
        
        if not correct_options:
            raise ValueError(f"Respostas corretas {correct_answers} não encontradas nas opções disponíveis")
        
        question = Question(
            number=question_number,
            type=QuestionType.MULTIPLE_CHOICE,
            correct_answers=correct_options,
            weight=weight,
            allow_multiple_answers=allow_multiple
        )
        
        self.current_template.add_question(question)
        print(f"✅ Questão {question_number} (Múltipla Escolha) adicionada - Resposta(s): {correct_answers}")
        
        return question
    
    def add_true_false_question(self, question_number: int, 
                              correct_answer: str,
                              weight: float = 1.0,
                              custom_symbols: Optional[List[str]] = None) -> Question:
        """Add a true/false question"""
        if not self.current_template:
            raise ValueError("Crie um template primeiro usando create_new_template()")
        
        # Use custom symbols or default V/F
        if custom_symbols:
            options = [AnswerOption(sym, [sym.lower(), sym.upper()]) for sym in custom_symbols]
        else:
            options = AnswerTemplates.true_false()
        
        # Find correct answer
        correct_option = None
        for option in options:
            if correct_answer.upper() in [var.upper() for var in option.acceptable_variations]:
                correct_option = option
                break
        
        if not correct_option:
            raise ValueError(f"Resposta correta '{correct_answer}' não reconhecida")
        
        question = Question(
            number=question_number,
            type=QuestionType.TRUE_FALSE,
            correct_answers=[correct_option],
            weight=weight
        )
        
        self.current_template.add_question(question)
        print(f"✅ Questão {question_number} (V/F) adicionada - Resposta: {correct_answer}")
        
        return question
    
    def add_numeric_question(self, question_number: int, 
                           correct_answer: float,
                           error_margin: float = 0.1,
                           weight: float = 1.0) -> Question:
        """Add a numeric question with error margin"""
        if not self.current_template:
            raise ValueError("Crie um template primeiro usando create_new_template()")
        
        correct_option = AnswerOption(
            value=str(correct_answer),
            acceptable_variations=[str(correct_answer), str(int(correct_answer)) if correct_answer.is_integer() else str(correct_answer)]
        )
        
        question = Question(
            number=question_number,
            type=QuestionType.NUMERIC,
            correct_answers=[correct_option],
            weight=weight,
            error_margin=error_margin
        )
        
        self.current_template.add_question(question)
        print(f"✅ Questão {question_number} (Numérica) adicionada - Resposta: {correct_answer} (±{error_margin})")
        
        return question
    
    def add_short_text_question(self, question_number: int, 
                              correct_answers: List[str],
                              weight: float = 1.0,
                              partial_credit: bool = True) -> Question:
        """Add a short text question"""
        if not self.current_template:
            raise ValueError("Crie um template primeiro usando create_new_template()")
        
        options = []
        for answer in correct_answers:
            # Add variations for text matching
            variations = [
                answer.lower(),
                answer.upper(),
                answer.capitalize(),
                answer.strip()
            ]
            
            credit_percentage = 100.0 if not partial_credit else 100.0 / len(correct_answers)
            options.append(AnswerOption(answer, variations, credit_percentage))
        
        question = Question(
            number=question_number,
            type=QuestionType.SHORT_TEXT,
            correct_answers=options,
            weight=weight,
            allow_multiple_answers=len(correct_answers) > 1,
            grading_mode=GradingMode.PARTIAL_CREDIT if partial_credit else GradingMode.ALL_OR_NOTHING
        )
        
        self.current_template.add_question(question)
        print(f"✅ Questão {question_number} (Texto Curto) adicionada - Respostas: {correct_answers}")
        
        return question
    
    def add_custom_symbols_question(self, question_number: int, 
                                  correct_symbols: List[str],
                                  symbol_variations: Optional[Dict[str, List[str]]] = None,
                                  weight: float = 1.0) -> Question:
        """Add a custom symbols question"""
        if not self.current_template:
            raise ValueError("Crie um template primeiro usando create_new_template()")
        
        options = []
        for symbol in correct_symbols:
            variations = symbol_variations.get(symbol, [symbol]) if symbol_variations else [symbol]
            options.append(AnswerOption(symbol, variations))
        
        question = Question(
            number=question_number,
            type=QuestionType.CUSTOM_SYMBOLS,
            correct_answers=options,
            weight=weight,
            allow_multiple_answers=len(correct_symbols) > 1
        )
        
        self.current_template.add_question(question)
        print(f"✅ Questão {question_number} (Símbolos Customizados) adicionada - Símbolos: {correct_symbols}")
        
        return question
    
    def set_grading_scale(self, passing_score: float = 70.0, 
                         letter_grades: Optional[Dict[str, float]] = None):
        """Set grading scale for the template"""
        if not self.current_template:
            raise ValueError("Crie um template primeiro usando create_new_template()")
        
        self.current_template.passing_score = passing_score
        
        if letter_grades:
            self.current_template.letter_grades = letter_grades
        
        print(f"✅ Escala de notas configurada - Nota mínima: {passing_score}%")
        print(f"   Distribuição: {self.current_template.letter_grades}")
    
    def preview_template(self) -> Dict:
        """Preview the current template"""
        if not self.current_template:
            raise ValueError("Nenhum template em construção")
        
        preview = {
            "nome": self.current_template.name,
            "versao": self.current_template.version,
            "total_questoes": len(self.current_template.questions),
            "pontuacao_total": self.current_template.total_points,
            "nota_minima": self.current_template.passing_score,
            "questoes": []
        }
        
        for question in self.current_template.questions:
            q_info = {
                "numero": question.number,
                "tipo": question.type.value,
                "peso": question.weight,
                "respostas_corretas": [ans.value for ans in question.correct_answers],
                "multiplas_respostas": question.allow_multiple_answers
            }
            
            if question.error_margin:
                q_info["margem_erro"] = question.error_margin
            
            preview["questoes"].append(q_info)
        
        return preview
    
    def get_template(self) -> TestTemplate:
        """Get the current template"""
        if not self.current_template:
            raise ValueError("Nenhum template em construção")
        
        return self.current_template
    
    def reset(self):
        """Reset the builder"""
        self.current_template = None
        print("✅ Builder resetado")

# Predefined template examples
class TemplateExamples:
    """Collection of example templates for common use cases"""
    
    @staticmethod
    def create_basic_multiple_choice() -> TestTemplate:
        """Create a basic 10-question multiple choice template"""
        builder = TemplateBuilder()
        
        template = builder.create_new_template(
            name="Prova Básica - Múltipla Escolha",
            version="A",
            created_by="Sistema",
            instructions="Marque apenas uma alternativa por questão"
        )
        
        # Add 10 multiple choice questions
        answers = ["A", "B", "C", "A", "D", "B", "C", "A", "B", "D"]
        
        for i, answer in enumerate(answers, 1):
            builder.add_multiple_choice_question(i, [answer])
        
        builder.set_grading_scale(60.0)  # 60% to pass
        
        return template
    
    @staticmethod
    def create_mixed_question_types() -> TestTemplate:
        """Create a template with mixed question types"""
        builder = TemplateBuilder()
        
        template = builder.create_new_template(
            name="Prova Mista - Diversos Tipos",
            version="A",
            created_by="Sistema",
            instructions="Responda todas as questões conforme o tipo solicitado"
        )
        
        # Multiple choice questions (1-5)
        mc_answers = ["A", "B", "C", "D", "A"]
        for i, answer in enumerate(mc_answers, 1):
            builder.add_multiple_choice_question(i, [answer])
        
        # True/False questions (6-8)
        tf_answers = ["V", "F", "V"]
        for i, answer in enumerate(tf_answers, 6):
            builder.add_true_false_question(i, answer)
        
        # Numeric questions (9-10)
        builder.add_numeric_question(9, 42.5, error_margin=0.5, weight=2.0)
        builder.add_numeric_question(10, 100, error_margin=1.0, weight=2.0)
        
        # Custom grading scale
        builder.set_grading_scale(
            passing_score=65.0,
            letter_grades={
                "A": 90.0,
                "B": 80.0,
                "C": 70.0,
                "D": 65.0,
                "F": 0.0
            }
        )
        
        return template
    
    @staticmethod
    def create_advanced_template() -> TestTemplate:
        """Create an advanced template with all features"""
        builder = TemplateBuilder()
        
        template = builder.create_new_template(
            name="Prova Avançada - Todos os Recursos",
            version="A",
            created_by="Professor Avançado",
            instructions="Prova com diferentes tipos de questões e pesos variados"
        )
        
        # Weighted multiple choice questions
        builder.add_multiple_choice_question(1, ["A"], weight=1.5)
        builder.add_multiple_choice_question(2, ["B", "C"], weight=2.0, allow_multiple=True)
        
        # True/False with custom symbols
        builder.add_true_false_question(3, "V", weight=1.0)
        
        # Numeric with different error margins
        builder.add_numeric_question(4, 3.14159, error_margin=0.01, weight=3.0)
        builder.add_numeric_question(5, 25, error_margin=2.0, weight=1.5)
        
        # Short text questions
        builder.add_short_text_question(6, ["Python", "python"], weight=2.0)
        builder.add_short_text_question(7, ["Machine Learning", "ML", "Aprendizado de Máquina"], 
                                      weight=2.5, partial_credit=True)
        
        # Custom symbols
        builder.add_custom_symbols_question(8, ["■", "●"], weight=1.0)
        
        # Advanced grading scale
        builder.set_grading_scale(
            passing_score=70.0,
            letter_grades={
                "A+": 95.0,
                "A": 90.0,
                "B+": 85.0,
                "B": 80.0,
                "C+": 75.0,
                "C": 70.0,
                "D": 60.0,
                "F": 0.0
            }
        )
        
        return template
