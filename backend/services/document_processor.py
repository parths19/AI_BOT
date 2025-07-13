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
        try:
            # Split text into chunks that fit within model's max input length
            chunks = self.text_splitter.split_text(text)
            
            # Generate summary for each chunk
            chunk_summaries = []
            for chunk in chunks:
                summary_output = self.summarizer(chunk, max_length=150, min_length=30, do_sample=False)
                if summary_output and isinstance(summary_output, list) and summary_output[0]:
                    chunk_summaries.append(summary_output[0]['summary_text'])
            
            if not chunk_summaries:
                return "Failed to generate summary."
            
            # If we have multiple chunk summaries, combine them
            if len(chunk_summaries) > 1:
                # Join all summaries and generate a final summary
                combined_summary = " ".join(chunk_summaries)
                final_summary = self.summarizer(
                    combined_summary,
                    max_length=150,
                    min_length=50,
                    do_sample=False
                )
                if final_summary and isinstance(final_summary, list) and final_summary[0]:
                    return final_summary[0]['summary_text']
            
            # If we only have one summary or final summarization failed
            return chunk_summaries[0]
            
        except Exception as e:
            print(f"Error in generate_summary: {str(e)}")
            return "Failed to generate summary."

    def get_relevant_context(self, question: str, k: int = 3) -> str:
        """Retrieve relevant context for a question"""
        vector_store = self.state.get_vector_store()
        if not vector_store:
            raise ValueError("No document has been processed yet")
        
        docs = vector_store.similarity_search(question, k=k)
        return " ".join([doc.page_content for doc in docs]) 