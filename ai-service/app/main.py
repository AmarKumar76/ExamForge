"""
ExamForge Python FastAPI AI Service Skeleton

NOTE: Architectural skeleton file for project setup.
RAG pipelines, Gemini API integrations, vector embeddings, and subjective grading algorithms
will be implemented in their respective implementation phases according to the SRS.
"""

from fastapi import FastAPI

app = FastAPI(
    title="ExamForge AI Service",
    description="RAG-based AI Question Generation and Assessment Intelligence Microservice",
    version="1.0.0"
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ExamForge AI Service"}
