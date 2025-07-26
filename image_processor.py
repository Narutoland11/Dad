import cv2
import numpy as np
import pytesseract
from typing import List, Dict, Tuple, Optional
from PIL import Image, ImageEnhance
import logging
from dataclasses import dataclass
from models import QuestionType, StudentResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DetectedRegion:
    """Represents a detected answer region in the image"""
    x: int
    y: int
    width: int
    height: int
    confidence: float
    text: str = ""
    question_number: Optional[int] = None

class AdvancedImageProcessor:
    """Advanced image processing for test correction with multiple detection methods"""
    
    def __init__(self, tesseract_path: str = None):
        """Initialize the image processor"""
        if tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
        
        # OCR configurations for different types of content
        self.ocr_configs = {
            'default': '--psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            'single_char': '--psm 10 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            'true_false': '--psm 10 -c tessedit_char_whitelist=VFTFvftf✓×XxTrueFalseVerdadeiroFalso',
            'numeric': '--psm 8 -c tessedit_char_whitelist=0123456789.,+-',
            'symbols': '--psm 10 -c tessedit_char_whitelist=■●▲♦□○△◊αβγδε',
            'handwriting': '--psm 8'
        }
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """Advanced image preprocessing with multiple enhancement techniques"""
        try:
            # Load image
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"Could not load image from {image_path}")
            
            logger.info(f"Processing image: {image_path}")
            
            # Convert to PIL for advanced enhancements
            pil_img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
            
            # Enhance contrast and brightness
            enhancer = ImageEnhance.Contrast(pil_img)
            pil_img = enhancer.enhance(1.2)
            
            enhancer = ImageEnhance.Brightness(pil_img)
            pil_img = enhancer.enhance(1.1)
            
            # Convert back to OpenCV
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            
            # Perspective correction
            img = self._correct_perspective(img)
            
            # Remove shadows and uneven lighting
            img = self._remove_shadows(img)
            
            # Noise reduction
            img = cv2.bilateralFilter(img, 9, 75, 75)
            
            return img
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            raise
    
    def _correct_perspective(self, img: np.ndarray) -> np.ndarray:
        """Automatically correct perspective distortion"""
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Find the largest rectangular contour (likely the test paper)
            contours, _ = cv2.findContours(gray, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if not contours:
                return img
            
            # Find the largest contour
            largest_contour = max(contours, key=cv2.contourArea)
            
            # Approximate the contour to a rectangle
            epsilon = 0.02 * cv2.arcLength(largest_contour, True)
            approx = cv2.approxPolyDP(largest_contour, epsilon, True)
            
            # If we found a quadrilateral, apply perspective correction
            if len(approx) == 4:
                # Order points: top-left, top-right, bottom-right, bottom-left
                pts = approx.reshape(4, 2)
                rect = self._order_points(pts)
                
                # Calculate dimensions for the corrected image
                (tl, tr, br, bl) = rect
                widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
                widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
                maxWidth = max(int(widthA), int(widthB))
                
                heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
                heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
                maxHeight = max(int(heightA), int(heightB))
                
                # Define destination points
                dst = np.array([
                    [0, 0],
                    [maxWidth - 1, 0],
                    [maxWidth - 1, maxHeight - 1],
                    [0, maxHeight - 1]], dtype="float32")
                
                # Apply perspective transform
                M = cv2.getPerspectiveTransform(rect, dst)
                warped = cv2.warpPerspective(img, M, (maxWidth, maxHeight))
                
                return warped
            
            return img
            
        except Exception as e:
            logger.warning(f"Could not correct perspective: {e}")
            return img
    
    def _order_points(self, pts: np.ndarray) -> np.ndarray:
        """Order points in clockwise order starting from top-left"""
        rect = np.zeros((4, 2), dtype="float32")
        
        # Sum and difference to find corners
        s = pts.sum(axis=1)
        diff = np.diff(pts, axis=1)
        
        rect[0] = pts[np.argmin(s)]      # top-left
        rect[2] = pts[np.argmax(s)]      # bottom-right
        rect[1] = pts[np.argmin(diff)]   # top-right
        rect[3] = pts[np.argmax(diff)]   # bottom-left
        
        return rect
    
    def _remove_shadows(self, img: np.ndarray) -> np.ndarray:
        """Remove shadows and uneven lighting"""
        try:
            # Convert to LAB color space
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to L channel
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            l = clahe.apply(l)
            
            # Merge channels and convert back to BGR
            enhanced = cv2.merge([l, a, b])
            result = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
            
            return result
            
        except Exception as e:
            logger.warning(f"Could not remove shadows: {e}")
            return img
    
    def detect_answer_regions(self, img: np.ndarray, question_type: QuestionType) -> List[DetectedRegion]:
        """Detect answer regions based on question type"""
        regions = []
        
        try:
            if question_type == QuestionType.MULTIPLE_CHOICE:
                regions = self._detect_bubble_regions(img)
            elif question_type == QuestionType.TRUE_FALSE:
                regions = self._detect_text_regions(img)
            elif question_type == QuestionType.NUMERIC:
                regions = self._detect_numeric_regions(img)
            elif question_type == QuestionType.SHORT_TEXT:
                regions = self._detect_text_regions(img)
            elif question_type == QuestionType.CUSTOM_SYMBOLS:
                regions = self._detect_symbol_regions(img)
            else:
                regions = self._detect_general_regions(img)
                
        except Exception as e:
            logger.error(f"Error detecting regions: {e}")
        
        return regions
    
    def _detect_bubble_regions(self, img: np.ndarray) -> List[DetectedRegion]:
        """Detect filled bubbles for multiple choice questions"""
        regions = []
        
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply threshold to get binary image
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            
            # Find circles using HoughCircles
            circles = cv2.HoughCircles(
                gray, cv2.HOUGH_GRADIENT, dp=1, minDist=30,
                param1=50, param2=30, minRadius=10, maxRadius=50
            )
            
            if circles is not None:
                circles = np.round(circles[0, :]).astype("int")
                
                for (x, y, r) in circles:
                    # Extract the circle region
                    mask = np.zeros(gray.shape, dtype=np.uint8)
                    cv2.circle(mask, (x, y), r, 255, -1)
                    
                    # Check if circle is filled (dark pixels inside)
                    circle_roi = cv2.bitwise_and(binary, mask)
                    filled_pixels = cv2.countNonZero(circle_roi)
                    total_pixels = np.pi * r * r
                    fill_ratio = filled_pixels / total_pixels
                    
                    if fill_ratio > 0.3:  # Threshold for "filled" bubble
                        regions.append(DetectedRegion(
                            x=x-r, y=y-r, width=2*r, height=2*r,
                            confidence=min(fill_ratio, 1.0)
                        ))
            
            # Also detect rectangular regions (checkboxes)
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                area = cv2.contourArea(contour)
                
                # Filter by size and aspect ratio
                if 100 < area < 2000 and 0.5 < w/h < 2.0:
                    # Check if region is filled
                    roi = binary[y:y+h, x:x+w]
                    filled_pixels = cv2.countNonZero(roi)
                    fill_ratio = filled_pixels / (w * h)
                    
                    if fill_ratio > 0.2:
                        regions.append(DetectedRegion(
                            x=x, y=y, width=w, height=h,
                            confidence=min(fill_ratio, 1.0)
                        ))
            
        except Exception as e:
            logger.error(f"Error detecting bubble regions: {e}")
        
        return regions
    
    def _detect_text_regions(self, img: np.ndarray) -> List[DetectedRegion]:
        """Detect text regions for true/false and short text questions"""
        regions = []
        
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Use MSER (Maximally Stable Extremal Regions) for text detection
            mser = cv2.MSER_create()
            regions_mser, _ = mser.detectRegions(gray)
            
            for region in regions_mser:
                x, y, w, h = cv2.boundingRect(region.reshape(-1, 1, 2))
                
                # Filter by size
                if w > 10 and h > 10 and w < 200 and h < 100:
                    regions.append(DetectedRegion(
                        x=x, y=y, width=w, height=h,
                        confidence=0.8
                    ))
            
            # Also use contour-based detection
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                area = cv2.contourArea(contour)
                
                # Filter text-like regions
                if 50 < area < 5000 and h > 10 and w > 10:
                    aspect_ratio = w / h
                    if 0.2 < aspect_ratio < 10:  # Text-like aspect ratio
                        regions.append(DetectedRegion(
                            x=x, y=y, width=w, height=h,
                            confidence=0.7
                        ))
            
        except Exception as e:
            logger.error(f"Error detecting text regions: {e}")
        
        return regions
    
    def _detect_numeric_regions(self, img: np.ndarray) -> List[DetectedRegion]:
        """Detect numeric answer regions"""
        return self._detect_text_regions(img)  # Similar to text detection
    
    def _detect_symbol_regions(self, img: np.ndarray) -> List[DetectedRegion]:
        """Detect custom symbol regions"""
        regions = []
        
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            
            # Find contours for symbols
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                area = cv2.contourArea(contour)
                
                # Filter symbol-like regions
                if 100 < area < 3000:
                    aspect_ratio = w / h
                    if 0.5 < aspect_ratio < 2.0:  # Square-ish symbols
                        regions.append(DetectedRegion(
                            x=x, y=y, width=w, height=h,
                            confidence=0.8
                        ))
            
        except Exception as e:
            logger.error(f"Error detecting symbol regions: {e}")
        
        return regions
    
    def _detect_general_regions(self, img: np.ndarray) -> List[DetectedRegion]:
        """General region detection for unknown question types"""
        return self._detect_text_regions(img)
    
    def recognize_text_in_region(self, img: np.ndarray, region: DetectedRegion, 
                                question_type: QuestionType) -> str:
        """Recognize text in a specific region using appropriate OCR configuration"""
        try:
            # Extract region of interest
            roi = img[region.y:region.y+region.height, region.x:region.x+region.width]
            
            if roi.size == 0:
                return ""
            
            # Enhance ROI for better OCR
            roi = self._enhance_roi_for_ocr(roi)
            
            # Select appropriate OCR configuration
            config = self._get_ocr_config(question_type)
            
            # Perform OCR
            text = pytesseract.image_to_string(roi, config=config).strip()
            
            # Post-process text based on question type
            text = self._post_process_text(text, question_type)
            
            return text
            
        except Exception as e:
            logger.error(f"Error recognizing text in region: {e}")
            return ""
    
    def _enhance_roi_for_ocr(self, roi: np.ndarray) -> np.ndarray:
        """Enhance region of interest for better OCR accuracy"""
        try:
            # Convert to grayscale if needed
            if len(roi.shape) == 3:
                roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            
            # Resize if too small
            if roi.shape[0] < 30 or roi.shape[1] < 30:
                scale_factor = max(30 / roi.shape[0], 30 / roi.shape[1])
                new_height = int(roi.shape[0] * scale_factor)
                new_width = int(roi.shape[1] * scale_factor)
                roi = cv2.resize(roi, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
            
            # Apply morphological operations to clean up
            kernel = np.ones((2, 2), np.uint8)
            roi = cv2.morphologyEx(roi, cv2.MORPH_CLOSE, kernel)
            
            # Enhance contrast
            roi = cv2.equalizeHist(roi)
            
            return roi
            
        except Exception as e:
            logger.error(f"Error enhancing ROI: {e}")
            return roi
    
    def _get_ocr_config(self, question_type: QuestionType) -> str:
        """Get appropriate OCR configuration for question type"""
        config_map = {
            QuestionType.MULTIPLE_CHOICE: 'single_char',
            QuestionType.TRUE_FALSE: 'true_false',
            QuestionType.NUMERIC: 'numeric',
            QuestionType.SHORT_TEXT: 'handwriting',
            QuestionType.CUSTOM_SYMBOLS: 'symbols'
        }
        
        return self.ocr_configs.get(config_map.get(question_type, 'default'), 
                                  self.ocr_configs['default'])
    
    def _post_process_text(self, text: str, question_type: QuestionType) -> str:
        """Post-process recognized text based on question type"""
        if not text:
            return ""
        
        text = text.strip()
        
        if question_type == QuestionType.MULTIPLE_CHOICE:
            # Extract single character
            for char in text:
                if char.upper() in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
                    return char.upper()
        
        elif question_type == QuestionType.TRUE_FALSE:
            # Normalize true/false responses
            text_lower = text.lower()
            if any(word in text_lower for word in ['v', 'verdadeiro', 'true', '✓']):
                return 'V'
            elif any(word in text_lower for word in ['f', 'falso', 'false', '×', 'x']):
                return 'F'
        
        elif question_type == QuestionType.NUMERIC:
            # Extract numeric value
            import re
            numbers = re.findall(r'-?\d+\.?\d*', text)
            if numbers:
                return numbers[0]
        
        return text
    
    def process_test_image(self, image_path: str, template_questions: List) -> List[StudentResponse]:
        """Process complete test image and return detected responses"""
        responses = []
        
        try:
            # Preprocess image
            processed_img = self.preprocess_image(image_path)
            
            # Process each question
            for i, question in enumerate(template_questions, 1):
                # Detect regions for this question type
                regions = self.detect_answer_regions(processed_img, question.type)
                
                if not regions:
                    # If no regions detected, try general detection
                    regions = self._detect_general_regions(processed_img)
                
                # Sort regions by position (top to bottom, left to right)
                regions.sort(key=lambda r: (r.y, r.x))
                
                # Take the most confident region for this question
                if regions:
                    best_region = max(regions, key=lambda r: r.confidence)
                    
                    # Recognize text in the region
                    detected_text = self.recognize_text_in_region(
                        processed_img, best_region, question.type
                    )
                    
                    response = StudentResponse(
                        question_number=i,
                        detected_answer=detected_text,
                        confidence=best_region.confidence,
                        coordinates={
                            'x': best_region.x,
                            'y': best_region.y,
                            'width': best_region.width,
                            'height': best_region.height
                        }
                    )
                    
                    responses.append(response)
                else:
                    # No region detected for this question
                    response = StudentResponse(
                        question_number=i,
                        detected_answer="",
                        confidence=0.0,
                        processing_notes="No answer region detected"
                    )
                    responses.append(response)
            
        except Exception as e:
            logger.error(f"Error processing test image: {e}")
        
        return responses
