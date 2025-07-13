import PyPDF2
from fastapi import UploadFile
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.embeddings.huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores.faiss import FAISS
from transformers.pipelines import pipeline
from io import BytesIO
from typing import Optional
from .state import DocumentState

class DocumentProcessor:
    def __init__(self):
        self.text_splitter = CharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        self.embeddings = HuggingFaceEmbeddings()
        self.summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        self.state = DocumentState()

    async def process_document(self, file: UploadFile) -> str:
        """Process uploaded document and return its content"""
        if not file or not file.filename:
            raise ValueError("No file provided")
            
        content = await self._read_file(file)
        
        # Split text into chunks and create vector store
        chunks = self.text_splitter.split_text(content)
        vector_store = FAISS.from_texts(chunks, self.embeddings)
        
        # Update shared state
        self.state.set_vector_store(vector_store)
        self.state.set_current_document(content)
        
        return content

    async def _read_file(self, file: UploadFile) -> str:
        """Read content from PDF or TXT file"""
        content = ""
        if file.filename and file.filename.lower().endswith('.pdf'):
            # Read PDF file
            pdf_bytes = await file.read()
            pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))
            for page in pdf_reader.pages:
                content += page.extract_text()
        else:
            # Read TXT file
            content = (await file.read()).decode('utf-8')
        
        return content

    def generate_summary(self, text: str) -> str:
        """Generate a summary of the document"""
        # Truncate text to fit model's max input length (1024 tokens for BART)
        max_length = 1024
        truncated_text = text[:max_length]
        
        # Generate summary
        summary_output = self.summarizer(truncated_text, max_length=150, min_length=50, do_sample=False)
        if not summary_output or not isinstance(summary_output, list) or not summary_output[0]:
            return "Failed to generate summary."
        return summary_output[0]['summary_text']

    def get_relevant_context(self, question: str, k: int = 3) -> str:
        """Retrieve relevant context for a question"""
        vector_store = self.state.get_vector_store()
        if not vector_store:
            raise ValueError("No document has been processed yet")
        
        docs = vector_store.similarity_search(question, k=k)
        return " ".join([doc.page_content for doc in docs]) 