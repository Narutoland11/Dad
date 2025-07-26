from dataclasses import dataclass, field
from typing import List, Dict, Optional, Union, Any
from enum import Enum
import json
from datetime import datetime

class QuestionType(Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    NUMERIC = "numeric"
    SHORT_TEXT = "short_text"
    ASSOCIATIVE = "associative"
    CUSTOM_SYMBOLS = "custom_symbols"

class GradingMode(Enum):
    ALL_OR_NOTHING = "all_or_nothing"
    PARTIAL_CREDIT = "partial_credit"
    WEIGHTED = "weighted"

@dataclass
class AnswerOption:
    """Represents a possible answer with acceptable variations"""
    value: str
    acceptable_variations: List[str] = field(default_factory=list)
    partial_credit_percentage: float = 100.0
    
    def __post_init__(self):
        if not self.acceptable_variations:
            self.acceptable_variations = [self.value.lower(), self.value.upper()]

@dataclass
class Question:
    """Represents a single question in the test"""
    number: int
    type: QuestionType
    correct_answers: List[AnswerOption]
    weight: float = 1.0
    allow_multiple_answers: bool = False
    error_margin: Optional[float] = None  # For numeric questions
    region_coordinates: Optional[Dict[str, int]] = None  # x, y, width, height
    grading_mode: GradingMode = GradingMode.ALL_OR_NOTHING
    
    def is_answer_correct(self, student_answer: str, tolerance: float = 0.1) -> tuple[bool, float]:
        """Check if student answer is correct and return score percentage"""
        if not student_answer:
            return False, 0.0
            
        student_answer = student_answer.strip()
        
        # Handle numeric questions with error margin
        if self.type == QuestionType.NUMERIC and self.error_margin:
            try:
                student_num = float(student_answer)
                for correct_option in self.correct_answers:
                    correct_num = float(correct_option.value)
                    if abs(student_num - correct_num) <= self.error_margin:
                        return True, correct_option.partial_credit_percentage / 100.0
            except ValueError:
                pass
        
        # Check against all acceptable variations
        for correct_option in self.correct_answers:
            for variation in correct_option.acceptable_variations:
                if self._matches_variation(student_answer, variation, tolerance):
                    return True, correct_option.partial_credit_percentage / 100.0
        
        return False, 0.0
    
    def _matches_variation(self, student_answer: str, variation: str, tolerance: float) -> bool:
        """Check if student answer matches a variation with fuzzy matching"""
        # Exact match
        if student_answer.lower() == variation.lower():
            return True
        
        # For short text, use simple similarity
        if self.type == QuestionType.SHORT_TEXT:
            return self._text_similarity(student_answer, variation) >= tolerance
        
        return False
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """Simple text similarity calculation"""
        text1, text2 = text1.lower(), text2.lower()
        if text1 == text2:
            return 1.0
        
        # Simple character-based similarity
        common_chars = sum(1 for c in text1 if c in text2)
        total_chars = max(len(text1), len(text2))
        return common_chars / total_chars if total_chars > 0 else 0.0

@dataclass
class TestTemplate:
    """Template for a complete test with all questions and grading rules"""
    id: str
    name: str
    version: str = "A"
    questions: List[Question] = field(default_factory=list)
    total_points: float = 0.0
    passing_score: float = 70.0
    letter_grades: Dict[str, float] = field(default_factory=lambda: {
        "A": 90.0, "B": 80.0, "C": 70.0, "D": 60.0, "F": 0.0
    })
    created_by: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    instructions: str = ""
    
    def __post_init__(self):
        if self.total_points == 0.0:
            self.total_points = sum(q.weight for q in self.questions)
    
    def add_question(self, question: Question):
        """Add a question to the template"""
        self.questions.append(question)
        self.total_points = sum(q.weight for q in self.questions)
    
    def get_letter_grade(self, percentage: float) -> str:
        """Convert percentage to letter grade"""
        for grade, threshold in sorted(self.letter_grades.items(), 
                                     key=lambda x: x[1], reverse=True):
            if percentage >= threshold:
                return grade
        return "F"
    
    def to_json(self) -> str:
        """Export template to JSON"""
        data = {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "questions": [
                {
                    "number": q.number,
                    "type": q.type.value,
                    "correct_answers": [
                        {
                            "value": ans.value,
                            "acceptable_variations": ans.acceptable_variations,
                            "partial_credit_percentage": ans.partial_credit_percentage
                        } for ans in q.correct_answers
                    ],
                    "weight": q.weight,
                    "allow_multiple_answers": q.allow_multiple_answers,
                    "error_margin": q.error_margin,
                    "region_coordinates": q.region_coordinates,
                    "grading_mode": q.grading_mode.value
                } for q in self.questions
            ],
            "total_points": self.total_points,
            "passing_score": self.passing_score,
            "letter_grades": self.letter_grades,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat(),
            "instructions": self.instructions
        }
        return json.dumps(data, indent=2, ensure_ascii=False)
    
    @classmethod
    def from_json(cls, json_str: str) -> 'TestTemplate':
        """Load template from JSON"""
        data = json.loads(json_str)
        
        questions = []
        for q_data in data["questions"]:
            correct_answers = [
                AnswerOption(
                    value=ans["value"],
                    acceptable_variations=ans["acceptable_variations"],
                    partial_credit_percentage=ans["partial_credit_percentage"]
                ) for ans in q_data["correct_answers"]
            ]
            
            question = Question(
                number=q_data["number"],
                type=QuestionType(q_data["type"]),
                correct_answers=correct_answers,
                weight=q_data["weight"],
                allow_multiple_answers=q_data["allow_multiple_answers"],
                error_margin=q_data.get("error_margin"),
                region_coordinates=q_data.get("region_coordinates"),
                grading_mode=GradingMode(q_data["grading_mode"])
            )
            questions.append(question)
        
        return cls(
            id=data["id"],
            name=data["name"],
            version=data["version"],
            questions=questions,
            total_points=data["total_points"],
            passing_score=data["passing_score"],
            letter_grades=data["letter_grades"],
            created_by=data["created_by"],
            created_at=datetime.fromisoformat(data["created_at"]),
            instructions=data["instructions"]
        )

@dataclass
class StudentResponse:
    """Represents a student's response to a question"""
    question_number: int
    detected_answer: str
    confidence: float
    coordinates: Optional[Dict[str, int]] = None
    processing_notes: str = ""

@dataclass
class TestResult:
    """Results of correcting a student's test"""
    student_id: str
    test_template_id: str
    responses: List[StudentResponse]
    total_score: float = 0.0
    percentage: float = 0.0
    letter_grade: str = "F"
    correct_answers: int = 0
    total_questions: int = 0
    processing_time: float = 0.0
    image_path: str = ""
    corrected_at: datetime = field(default_factory=datetime.now)
    detailed_feedback: Dict[int, Dict[str, Any]] = field(default_factory=dict)
    
    def calculate_score(self, template: TestTemplate):
        """Calculate final score based on template"""
        total_weighted_score = 0.0
        
        for response in self.responses:
            question = next((q for q in template.questions 
                           if q.number == response.question_number), None)
            if question:
                is_correct, score_percentage = question.is_answer_correct(response.detected_answer)
                weighted_score = question.weight * score_percentage
                total_weighted_score += weighted_score
                
                if is_correct:
                    self.correct_answers += 1
                
                # Store detailed feedback
                self.detailed_feedback[response.question_number] = {
                    "is_correct": is_correct,
                    "score_percentage": score_percentage,
                    "weighted_score": weighted_score,
                    "detected_answer": response.detected_answer,
                    "correct_answers": [ans.value for ans in question.correct_answers],
                    "confidence": response.confidence
                }
        
        self.total_questions = len(template.questions)
        self.total_score = total_weighted_score
        self.percentage = (total_weighted_score / template.total_points) * 100 if template.total_points > 0 else 0
        self.letter_grade = template.get_letter_grade(self.percentage)

# Predefined answer templates for common use cases
class AnswerTemplates:
    """Common answer templates for quick setup"""
    
    @staticmethod
    def multiple_choice_abcde() -> List[AnswerOption]:
        return [
            AnswerOption("A", ["a", "A", "1"]),
            AnswerOption("B", ["b", "B", "2"]),
            AnswerOption("C", ["c", "C", "3"]),
            AnswerOption("D", ["d", "D", "4"]),
            AnswerOption("E", ["e", "E", "5"])
        ]
    
    @staticmethod
    def true_false() -> List[AnswerOption]:
        return [
            AnswerOption("V", ["v", "V", "T", "t", "✓", "verdadeiro", "true"]),
            AnswerOption("F", ["f", "F", "×", "X", "x", "falso", "false"])
        ]
    
    @staticmethod
    def numeric_range(min_val: float, max_val: float, step: float = 1.0) -> List[AnswerOption]:
        values = []
        current = min_val
        while current <= max_val:
            values.append(AnswerOption(str(current), [str(current), str(int(current)) if current.is_integer() else str(current)]))
            current += step
        return values
    
    @staticmethod
    def greek_alphabet() -> List[AnswerOption]:
        return [
            AnswerOption("α", ["α", "alpha", "a"]),
            AnswerOption("β", ["β", "beta", "b"]),
            AnswerOption("γ", ["γ", "gamma", "g"]),
            AnswerOption("δ", ["δ", "delta", "d"]),
            AnswerOption("ε", ["ε", "epsilon", "e"])
        ]
    
    @staticmethod
    def custom_symbols() -> List[AnswerOption]:
        return [
            AnswerOption("■", ["■", "□", "quadrado", "square"]),
            AnswerOption("●", ["●", "○", "circulo", "circle"]),
            AnswerOption("▲", ["▲", "△", "triangulo", "triangle"]),
            AnswerOption("♦", ["♦", "◊", "diamante", "diamond"])
        ]
