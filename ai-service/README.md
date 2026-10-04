# ExamForge AI Service Architecture

Python FastAPI microservice powering RAG-assisted document processing, Gemini-driven question generation, semantic duplicate detection, and rubric-assisted subjective grading suggestions.

## Technology Stack
- **FastAPI**: Asynchronous web framework for low-latency AI endpoints
- **LangChain**: RAG orchestration, document chunking, and context retrieval
- **Gemini API**: Generative LLM for draft question creation and reasoning tasks
- **Hugging Face**: Sentence Transformers for embedding generation and semantic similarity

## Directory Structure
- `app/api/`: FastAPI route handlers (`/generate-questions`, `/analyze-similarity`, `/suggest-grade`)
- `app/services/`: Core AI business logic (Gemini API clients, prompt templates, validation)
- `app/rag/`: RAG pipelines, text extractors, chunkers, and vector store connectors
- `app/models/`: Internal domain models and data transformations
- `app/schemas/`: Pydantic input/output validation schemas
- `app/core/`: Application settings, environment configuration, and logging setup
- `app/main.py`: FastAPI application entry point
