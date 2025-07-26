import time
import logging
from typing import List, Dict, Optional
from pathlib import Path
import json

from models import TestTemplate, TestResult, StudentResponse, Question, QuestionType
from image_processor import AdvancedImageProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestCorrectionEngine:
    """Main engine for automatic test correction"""
    
    def __init__(self, tesseract_path: str = None):
        """Initialize the test correction engine"""
        self.image_processor = AdvancedImageProcessor(tesseract_path)
        self.templates: Dict[str, TestTemplate] = {}
        self.results: List[TestResult] = []
    
    def load_template(self, template_path: str) -> TestTemplate:
        """Load a test template from JSON file"""
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template_json = f.read()
            
            template = TestTemplate.from_json(template_json)
            self.templates[template.id] = template
            
            logger.info(f"Loaded template: {template.name} (ID: {template.id})")
            return template
            
        except Exception as e:
            logger.error(f"Error loading template from {template_path}: {e}")
            raise
    
    def save_template(self, template: TestTemplate, output_path: str):
        """Save a test template to JSON file"""
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(template.to_json())
            
            logger.info(f"Saved template to: {output_path}")
            
        except Exception as e:
            logger.error(f"Error saving template to {output_path}: {e}")
            raise
    
    def correct_test(self, image_path: str, template_id: str, 
                    student_id: str = "unknown") -> TestResult:
        """Correct a single test image using the specified template"""
        try:
            start_time = time.time()
            
            # Get template
            if template_id not in self.templates:
                raise ValueError(f"Template {template_id} not found. Load it first.")
            
            template = self.templates[template_id]
            
            logger.info(f"Correcting test for student {student_id} using template {template_id}")
            
            # Process the image to detect responses
            responses = self.image_processor.process_test_image(image_path, template.questions)
            
            # Create test result
            result = TestResult(
                student_id=student_id,
                test_template_id=template_id,
                responses=responses,
                image_path=image_path,
                processing_time=time.time() - start_time
            )
            
            # Calculate score
            result.calculate_score(template)
            
            # Store result
            self.results.append(result)
            
            logger.info(f"Test corrected: {result.correct_answers}/{result.total_questions} "
                       f"correct ({result.percentage:.1f}%) - Grade: {result.letter_grade}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error correcting test: {e}")
            raise
    
    def correct_batch(self, image_folder: str, template_id: str, 
                     student_ids: Optional[List[str]] = None) -> List[TestResult]:
        """Correct multiple test images in batch"""
        results = []
        
        try:
            image_folder = Path(image_folder)
            image_files = list(image_folder.glob("*.jpg")) + list(image_folder.glob("*.png"))
            
            if not image_files:
                logger.warning(f"No image files found in {image_folder}")
                return results
            
            logger.info(f"Processing {len(image_files)} test images")
            
            for i, image_file in enumerate(image_files):
                student_id = student_ids[i] if student_ids and i < len(student_ids) else f"student_{i+1}"
                
                try:
                    result = self.correct_test(str(image_file), template_id, student_id)
                    results.append(result)
                    
                except Exception as e:
                    logger.error(f"Error processing {image_file}: {e}")
                    continue
            
            logger.info(f"Batch correction completed: {len(results)} tests processed")
            
        except Exception as e:
            logger.error(f"Error in batch correction: {e}")
        
        return results
    
    def generate_detailed_report(self, result: TestResult) -> Dict:
        """Generate detailed correction report for a single test"""
        template = self.templates[result.test_template_id]
        
        report = {
            "student_info": {
                "id": result.student_id,
                "test_date": result.corrected_at.isoformat(),
                "processing_time": f"{result.processing_time:.2f}s"
            },
            "test_info": {
                "template_name": template.name,
                "template_version": template.version,
                "total_questions": result.total_questions,
                "total_points": template.total_points
            },
            "results": {
                "correct_answers": result.correct_answers,
                "total_score": result.total_score,
                "percentage": result.percentage,
                "letter_grade": result.letter_grade,
                "passed": result.percentage >= template.passing_score
            },
            "question_details": [],
            "recommendations": []
        }
        
        # Add detailed question analysis
        for question in template.questions:
            q_num = question.number
            feedback = result.detailed_feedback.get(q_num, {})
            
            question_detail = {
                "question_number": q_num,
                "type": question.type.value,
                "weight": question.weight,
                "detected_answer": feedback.get("detected_answer", ""),
                "correct_answers": feedback.get("correct_answers", []),
                "is_correct": feedback.get("is_correct", False),
                "score_percentage": feedback.get("score_percentage", 0.0),
                "weighted_score": feedback.get("weighted_score", 0.0),
                "confidence": feedback.get("confidence", 0.0)
            }
            
            report["question_details"].append(question_detail)
        
        # Generate recommendations
        if result.percentage < template.passing_score:
            report["recommendations"].append("Revisar conceitos fundamentais")
            
            # Find weak areas
            wrong_questions = [q for q in report["question_details"] if not q["is_correct"]]
            if len(wrong_questions) > result.total_questions * 0.5:
                report["recommendations"].append("Necessário estudo adicional em todas as áreas")
            else:
                report["recommendations"].append(f"Focar nas questões: {', '.join([str(q['question_number']) for q in wrong_questions])}")
        
        if result.percentage >= 90:
            report["recommendations"].append("Excelente desempenho! Continue assim.")
        elif result.percentage >= 80:
            report["recommendations"].append("Bom desempenho. Pequenos ajustes podem levar à excelência.")
        elif result.percentage >= 70:
            report["recommendations"].append("Desempenho satisfatório. Há espaço para melhorias.")
        
        return report
    
    def generate_class_analytics(self, template_id: str) -> Dict:
        """Generate analytics for all tests using a specific template"""
        template = self.templates[template_id]
        class_results = [r for r in self.results if r.test_template_id == template_id]
        
        if not class_results:
            return {"error": "No results found for this template"}
        
        # Calculate statistics
        scores = [r.percentage for r in class_results]
        
        analytics = {
            "template_info": {
                "name": template.name,
                "version": template.version,
                "total_questions": len(template.questions)
            },
            "class_statistics": {
                "total_students": len(class_results),
                "average_score": sum(scores) / len(scores),
                "highest_score": max(scores),
                "lowest_score": min(scores),
                "passing_rate": len([s for s in scores if s >= template.passing_score]) / len(scores) * 100,
                "grade_distribution": self._calculate_grade_distribution(class_results, template)
            },
            "question_analysis": [],
            "recommendations": []
        }
        
        # Analyze each question
        for question in template.questions:
            q_num = question.number
            correct_count = 0
            total_responses = 0
            confidence_sum = 0
            
            for result in class_results:
                feedback = result.detailed_feedback.get(q_num, {})
                if feedback:
                    total_responses += 1
                    if feedback.get("is_correct", False):
                        correct_count += 1
                    confidence_sum += feedback.get("confidence", 0.0)
            
            if total_responses > 0:
                question_stats = {
                    "question_number": q_num,
                    "type": question.type.value,
                    "correct_percentage": (correct_count / total_responses) * 100,
                    "average_confidence": confidence_sum / total_responses,
                    "difficulty_level": self._assess_difficulty(correct_count / total_responses)
                }
                
                analytics["question_analysis"].append(question_stats)
        
        # Generate class recommendations
        avg_score = analytics["class_statistics"]["average_score"]
        passing_rate = analytics["class_statistics"]["passing_rate"]
        
        if passing_rate < 50:
            analytics["recommendations"].append("Taxa de aprovação baixa. Revisar metodologia de ensino.")
        elif passing_rate < 70:
            analytics["recommendations"].append("Taxa de aprovação moderada. Reforçar conceitos-chave.")
        else:
            analytics["recommendations"].append("Boa taxa de aprovação. Manter a qualidade do ensino.")
        
        # Identify problematic questions
        difficult_questions = [q for q in analytics["question_analysis"] 
                             if q["correct_percentage"] < 50]
        
        if difficult_questions:
            q_numbers = [str(q["question_number"]) for q in difficult_questions]
            analytics["recommendations"].append(
                f"Questões com baixo índice de acerto: {', '.join(q_numbers)}. "
                "Considerar revisão do conteúdo ou reformulação das questões."
            )
        
        return analytics
    
    def _calculate_grade_distribution(self, results: List[TestResult], 
                                    template: TestTemplate) -> Dict[str, int]:
        """Calculate distribution of letter grades"""
        distribution = {grade: 0 for grade in template.letter_grades.keys()}
        
        for result in results:
            distribution[result.letter_grade] += 1
        
        return distribution
    
    def _assess_difficulty(self, correct_ratio: float) -> str:
        """Assess question difficulty based on correct answer ratio"""
        if correct_ratio >= 0.8:
            return "Fácil"
        elif correct_ratio >= 0.6:
            return "Moderada"
        elif correct_ratio >= 0.4:
            return "Difícil"
        else:
            return "Muito Difícil"
    
    def export_results(self, output_path: str, format: str = "json"):
        """Export all results to file"""
        try:
            if format.lower() == "json":
                self._export_json(output_path)
            elif format.lower() == "excel":
                self._export_excel(output_path)
            else:
                raise ValueError(f"Unsupported format: {format}")
            
            logger.info(f"Results exported to: {output_path}")
            
        except Exception as e:
            logger.error(f"Error exporting results: {e}")
            raise
    
    def _export_json(self, output_path: str):
        """Export results to JSON format"""
        export_data = {
            "export_date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_results": len(self.results),
            "templates": {tid: template.name for tid, template in self.templates.items()},
            "results": []
        }
        
        for result in self.results:
            result_data = {
                "student_id": result.student_id,
                "template_id": result.test_template_id,
                "score": result.total_score,
                "percentage": result.percentage,
                "letter_grade": result.letter_grade,
                "correct_answers": result.correct_answers,
                "total_questions": result.total_questions,
                "corrected_at": result.corrected_at.isoformat(),
                "processing_time": result.processing_time,
                "detailed_feedback": result.detailed_feedback
            }
            export_data["results"].append(result_data)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
    
    def _export_excel(self, output_path: str):
        """Export results to Excel format"""
        try:
            import pandas as pd
            
            # Prepare data for Excel
            excel_data = []
            
            for result in self.results:
                template = self.templates[result.test_template_id]
                
                row = {
                    "ID do Aluno": result.student_id,
                    "Template": template.name,
                    "Versão": template.version,
                    "Pontuação Total": result.total_score,
                    "Porcentagem": result.percentage,
                    "Nota": result.letter_grade,
                    "Acertos": result.correct_answers,
                    "Total de Questões": result.total_questions,
                    "Data da Correção": result.corrected_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "Tempo de Processamento (s)": result.processing_time,
                    "Aprovado": "Sim" if result.percentage >= template.passing_score else "Não"
                }
                
                # Add individual question results
                for q_num, feedback in result.detailed_feedback.items():
                    row[f"Q{q_num} - Resposta"] = feedback.get("detected_answer", "")
                    row[f"Q{q_num} - Correto"] = "Sim" if feedback.get("is_correct", False) else "Não"
                    row[f"Q{q_num} - Confiança"] = feedback.get("confidence", 0.0)
                
                excel_data.append(row)
            
            # Create DataFrame and save to Excel
            df = pd.DataFrame(excel_data)
            df.to_excel(output_path, index=False, engine='openpyxl')
            
        except ImportError:
            logger.error("pandas and openpyxl are required for Excel export")
            raise
        except Exception as e:
            logger.error(f"Error exporting to Excel: {e}")
            raise
