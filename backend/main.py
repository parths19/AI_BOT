from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import uvicorn

from models.document import DocumentResponse, QuestionRequest, QuestionResponse
from services.document_processor import DocumentProcessor
from services.qa_service import QAService

app = FastAPI(title="Document AI Assistant API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
document_processor = DocumentProcessor()
qa_service = QAService()

@app.post("/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document (PDF/TXT)"""
    try:
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
            
        # Validate file type
        if not file.filename.lower().endswith(('.pdf', '.txt')):
            raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")
        
        # Process the document
        doc_content = await document_processor.process_document(file)
        summary = document_processor.generate_summary(doc_content)
        
        return DocumentResponse(
            filename=file.filename,
            summary=summary,
            success=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """Answer a question based on the uploaded document"""
    try:
        answer = qa_service.get_answer(request.question)
        return QuestionResponse(
            question=request.question,
            answer=answer.answer,
            context=answer.context
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/challenge", response_model=List[QuestionResponse])
async def generate_questions():
    """Generate challenge questions based on the document"""
    try:
        questions = qa_service.generate_questions()
        if not questions:
            raise HTTPException(status_code=400, detail="Failed to generate questions")
        return questions
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate")
async def evaluate_answer(question: str, user_answer: str):
    """Evaluate a user's answer to a challenge question"""
    try:
        if not question or not user_answer:
            raise HTTPException(status_code=400, detail="Question and answer are required")
            
        evaluation = qa_service.evaluate_answer(question, user_answer)
        return JSONResponse(content=evaluation)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 