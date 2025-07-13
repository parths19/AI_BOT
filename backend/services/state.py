from typing import Optional
from langchain_community.vectorstores.faiss import FAISS

class DocumentState:
    _instance = None
    vector_store: Optional[FAISS] = None
    current_document: Optional[str] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DocumentState, cls).__new__(cls)
        return cls._instance

    @classmethod
    def set_vector_store(cls, store: FAISS):
        cls.vector_store = store

    @classmethod
    def set_current_document(cls, document: str):
        cls.current_document = document

    @classmethod
    def get_vector_store(cls) -> Optional[FAISS]:
        return cls.vector_store

    @classmethod
    def get_current_document(cls) -> Optional[str]:
        return cls.current_document 