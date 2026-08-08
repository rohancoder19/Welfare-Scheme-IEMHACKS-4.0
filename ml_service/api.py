import os
import sys
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# Ensure local imports work
sys.path.append(os.path.dirname(__file__))

from prediction.eligibility import eligibility_predictor
from prediction.complaint_priority import complaint_classifier
from prediction.chatbot import generate_chatbot_response
from ingestion.ingest import SchemeIngestionPipeline, DOCUMENTS_DIR
pipeline = SchemeIngestionPipeline()
from train_models import train_and_save_models

# Auto-train models on startup if missing
models_dir = os.path.join(os.path.dirname(__file__), "models")
if not os.path.exists(models_dir) or len(os.listdir(models_dir)) == 0:
    train_and_save_models()

app = FastAPI(
    title="Civic Welfare & Grievance ML Microservice",
    version="1.0.0",
    description="FastAPI service for Scheme Recommendation, Grievance NLP Classification, Priority Prediction & AI Chatbot"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class UserProfileSchema(BaseModel):
    income: float = 0
    age: float = 25
    gender: str = "all"
    occupation: str = "other"
    category: str = "general"
    education: str = "other"
    state: str = "All India"

class SchemeRecommendationRequest(BaseModel):
    userProfile: UserProfileSchema
    schemes: Optional[List[Dict[str, Any]]] = []

class ComplaintAnalysisRequest(BaseModel):
    title: Optional[str] = ""
    description: Optional[str] = ""
    complaintText: Optional[str] = None
    category: Optional[str] = "Other"
    existingCategory: Optional[str] = None
    location: Optional[str] = None

class ChatRequest(BaseModel):
    message: str

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Civic ML Service",
        "modelsLoaded": {
            "eligibility": eligibility_predictor.model is not None,
            "complaintClassifier": complaint_classifier.model is not None
        }
    }

@app.post("/predict-eligibility")
def predict_eligibility(req: SchemeRecommendationRequest):
    try:
        results = eligibility_predictor.predict_recommendations(
            user_profile=req.userProfile.model_dump(),
            schemes=req.schemes
        )
        return {
            "success": True,
            "recommendations": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-complaint")
@app.post("/api/ai/analyze-complaint")
@app.post("/classify-complaint")
@app.post("/predict-priority")
def analyze_complaint(req: ComplaintAnalysisRequest):
    try:
        raw_text = req.complaintText or f"{req.title} {req.description}".strip()
        cat = req.existingCategory or req.category or "Other"
        analysis = complaint_classifier.classify_and_predict_priority(
            text=raw_text,
            user_category=cat,
            location=req.location
        )
        return {
            "success": True,
            "analysis": analysis,
            "category": analysis.get("category"),
            "subcategory": analysis.get("subcategory"),
            "priority": analysis.get("priority"),
            "urgencyScore": analysis.get("urgencyScore"),
            "department": analysis.get("department"),
            "departmentReason": analysis.get("departmentReason"),
            "confidence": analysis.get("confidence"),
            "recommendedSLAHours": analysis.get("recommendedSLAHours"),
            "recommendedAction": analysis.get("recommendedAction"),
            "reason": analysis.get("reason")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
def chat_with_bot(req: ChatRequest):
    try:
        res = generate_chatbot_response(req.message)
        return {
            "success": True,
            "reply": res["reply"],
            "source": res["source"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest-csv")
async def upload_and_ingest_csv(file: UploadFile = File(...)):
    try:
        filename = file.filename
        if not filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported")

        save_path = os.path.join(DOCUMENTS_DIR, filename)
        with open(save_path, "wb") as f:
            f.write(await file.read())

        pipeline.ingest_csv_documents(save_path)
        return {
            "success": True,
            "message": f"Successfully uploaded and ingested {filename} into ChromaDB vector store.",
            "chroma_count": pipeline.collection.count()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
