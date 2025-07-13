from pydantic import BaseModel
from typing import Optional, List

class DocumentResponse(BaseModel):
    filename: str
    summary: str
    success: bool

class Answer(BaseModel):
    answer: str
    context: str

class QuestionRequest(BaseModel):
    question: str

class QuestionResponse(BaseModel):
    question: str
    answer: str
    context: Optional[str] = None

class EvaluationResponse(BaseModel):
    is_correct: bool
    feedback: str
    reference: str 