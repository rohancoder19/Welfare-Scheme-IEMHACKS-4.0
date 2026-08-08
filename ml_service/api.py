import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# Ensure local imports work
sys.path.append(os.path.dirname(__file__))

from prediction.eligibility import eligibility_predictor
from prediction.complaint_priority import complaint_classifier
from prediction.chatbot import generate_chatbot_response
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
    title: str
    description: str
    category: Optional[str] = "Other"

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

@app.post("/classify-complaint")
@app.post("/predict-priority")
def analyze_complaint(req: ComplaintAnalysisRequest):
    try:
        combined_text = f"{req.title} {req.description}"
        analysis = complaint_classifier.classify_and_predict_priority(
            text=combined_text,
            user_category=req.category
        )
        return {
            "success": True,
            "analysis": analysis
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
            "suggestedActions": res["suggestedActions"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
