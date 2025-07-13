from transformers import AutoModelForQuestionAnswering, AutoTokenizer
from typing import List
from models.document import Answer, QuestionResponse
from services.document_processor import DocumentProcessor
from .state import DocumentState

class QAService:
    def __init__(self):
        try:
            model_name = "deepset/roberta-base-squad2"
            self.model = AutoModelForQuestionAnswering.from_pretrained(model_name)
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.document_processor = DocumentProcessor()
            self.state = DocumentState()
        except Exception as e:
            print(f"Error initializing QA model: {str(e)}")
            raise

    def get_answer(self, question: str) -> Answer:
        """Get answer for a question using the document context"""
        if not question.strip():
            raise ValueError("Question cannot be empty")

        # Get the current document state
        vector_store = self.state.get_vector_store()
        if not vector_store:
            raise ValueError("No document has been uploaded yet. Please upload a document first.")

        try:
            context = self.document_processor.get_relevant_context(question)
            if not context.strip():
                raise ValueError("Could not find relevant context for the question")

            # Tokenize input
            tokenizer_outputs = self.tokenizer(
                question,
                context,
                return_tensors="pt",
                max_length=384,
                truncation=True,
                stride=128,
                return_overflowing_tokens=True,
                return_offsets_mapping=True,
                padding=True
            )
            
            # Separate model inputs from post-processing data
            model_inputs = {
                'input_ids': tokenizer_outputs['input_ids'],
                'attention_mask': tokenizer_outputs['attention_mask']
            }

            # Get model outputs
            outputs = self.model(**model_inputs)
            start_logits = outputs.start_logits[0]
            end_logits = outputs.end_logits[0]
            
            # Get the most likely answer span
            start_idx = start_logits.argmax()
            end_idx = end_logits.argmax()
            
            # Convert token indices to character indices
            offset_mapping = tokenizer_outputs.offset_mapping[0]
            start_char = offset_mapping[start_idx][0]
            end_char = offset_mapping[end_idx][1]
            
            # Extract answer text
            answer_text = context[start_char:end_char]
                
            return Answer(
                answer=str(answer_text),
                context=context
            )
        except Exception as e:
            print(f"Error in get_answer: {str(e)}")
            raise

    def generate_questions(self, num_questions: int = 3) -> List[QuestionResponse]:
        """Generate challenge questions based on the document content"""
        # Check if document is uploaded
        vector_store = self.state.get_vector_store()
        if not vector_store:
            raise ValueError("No document has been uploaded yet. Please upload a document first.")

        try:
            questions = []
            contexts = self._get_diverse_contexts(num_questions)
            
            for context in contexts:
                if not context.strip():
                    continue

                # Generate a question based on the context
                question = self._generate_question_from_context(context)
                
                # Get answer using the same QA process
                answer = self.get_answer(question)
                
                questions.append(QuestionResponse(
                    question=question,
                    answer=answer.answer,
                    context=context
                ))
            
            if not questions:
                raise ValueError("Failed to generate any valid questions")
            
            return questions
        except Exception as e:
            print(f"Error in generate_questions: {str(e)}")
            raise

    def evaluate_answer(self, question: str, user_answer: str) -> dict:
        """Evaluate user's answer to a challenge question"""
        if not question.strip() or not user_answer.strip():
            raise ValueError("Question and answer cannot be empty")

        try:
            # Get the correct answer and context
            result = self.get_answer(question)
            
            # Compare user's answer with the correct answer
            similarity_score = self._calculate_similarity(user_answer, result.answer)
            
            is_correct = similarity_score > 0.8
            feedback = self._generate_feedback(is_correct, result.answer)
            
            return {
                "is_correct": is_correct,
                "feedback": feedback,
                "reference": result.context
            }
        except Exception as e:
            print(f"Error in evaluate_answer: {str(e)}")
            raise

    def _get_diverse_contexts(self, num_contexts: int) -> List[str]:
        """Get diverse contexts from the document for question generation"""
        vector_store = self.state.get_vector_store()
        if not vector_store:
            raise ValueError("No document has been processed yet")
        
        try:
            # Use diverse queries to get different parts of the document
            diverse_queries = [
                "definition explanation describe concept",
                "example case study demonstration",
                "comparison difference between",
                "process steps method how",
                "reason cause effect why",
                "feature characteristic property",
                "problem challenge solution",
                "benefit advantage importance",
                "limitation drawback concern"
            ]
            
            contexts = []
            used_contexts = set()  # Track used contexts to avoid duplicates
            
            # Try queries until we have enough unique contexts
            for query in diverse_queries:
                if len(contexts) >= num_contexts:
                    break
                    
                context = self.document_processor.get_relevant_context(query, k=1)
                # Only add if the context is unique (not too similar to existing ones)
                if context.strip() and not self._is_context_similar(context, used_contexts):
                    contexts.append(context)
                    used_contexts.add(context)
            
            # If we still need more contexts, get them from different parts of the document
            if len(contexts) < num_contexts:
                full_doc = self.state.get_current_document() or ""
                paragraphs = [p.strip() for p in full_doc.split('\n\n') if p.strip()]
                
                # Try to get contexts from different parts of the document
                step = max(1, len(paragraphs) // (num_contexts - len(contexts)))
                for i in range(0, len(paragraphs), step):
                    if len(contexts) >= num_contexts:
                        break
                    context = paragraphs[i]
                    if context and not self._is_context_similar(context, used_contexts):
                        contexts.append(context)
                        used_contexts.add(context)
            
            return contexts or [self.state.get_current_document() or ""]
        except Exception as e:
            print(f"Error in _get_diverse_contexts: {str(e)}")
            raise

    def _is_context_similar(self, new_context: str, existing_contexts: set) -> bool:
        """Check if a context is too similar to existing ones"""
        for existing in existing_contexts:
            similarity = self._calculate_similarity(new_context, existing)
            if similarity > 0.7:  # Adjust threshold as needed
                return True
        return False

    def _generate_question_from_context(self, context: str) -> str:
        """Generate a question from a given context"""
        try:
            words = context.split()
            if len(words) < 5:
                return "What is the main point of this text?"

            # Extract potential keywords (nouns and important terms)
            keywords = []
            skip_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
            
            for i, word in enumerate(words):
                if (
                    word.strip() and
                    word.lower() not in skip_words and
                    len(word) > 3 and  # Skip very short words
                    word[0].isupper() or  # Proper nouns
                    any(char.isdigit() for char in word)  # Numbers
                ):
                    keywords.append(word)

            # Different question templates based on context content
            templates = [
                # Definition/concept questions
                lambda w: f"What is {w} and why is it important?",
                lambda w: f"How would you define or explain {w}?",
                
                # Process/method questions
                lambda w: f"What is the process or method involving {w}?",
                lambda w: f"How does {w} work or function?",
                
                # Relationship questions
                lambda w: f"What is the relationship between {w} and other concepts mentioned?",
                lambda w: f"How does {w} relate to the overall topic?",
                
                # Analysis questions
                lambda w: f"What are the key characteristics or features of {w}?",
                lambda w: f"What factors influence or affect {w}?",
                
                # Application questions
                lambda w: f"How is {w} applied or used in practice?",
                lambda w: f"What are the implications or consequences of {w}?"
            ]
            
            import random
            
            if keywords:
                # Select a random keyword and template
                keyword = random.choice(keywords)
                template = random.choice(templates)
                return template(keyword)
            
            # Fallback templates if no good keywords found
            fallback_templates = [
                "What is the main concept discussed in this passage?",
                "What are the key points presented in this text?",
                "How would you summarize the main ideas in this passage?",
                "What is the significance of the information presented here?",
                "What conclusions can be drawn from this passage?"
            ]
            
            return random.choice(fallback_templates)
            
        except Exception as e:
            print(f"Error in _generate_question_from_context: {str(e)}")
            return "What is the main point of this text?"

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts"""
        try:
            # Simple word overlap similarity
            words1 = set(text1.lower().strip().split())
            words2 = set(text2.lower().strip().split())
            
            if not words1 or not words2:
                return 0.0
                
            intersection = words1.intersection(words2)
            union = words1.union(words2)
            
            return len(intersection) / len(union)
        except Exception as e:
            print(f"Error in _calculate_similarity: {str(e)}")
            return 0.0

    def _generate_feedback(self, is_correct: bool, correct_answer: str) -> str:
        """Generate feedback based on the evaluation"""
        if is_correct:
            return "Excellent! Your answer is correct."
        return f"Not quite. A better answer would be: {correct_answer}" 