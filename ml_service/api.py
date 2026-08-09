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

default_origins = [
    "https://welfare-scheme-frontend.onrender.com",
    "https://welfare-scheme-api.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5000"
]

cors_origins_env = os.getenv("CORS_ORIGINS") or os.getenv("FRONTEND_URL")
if cors_origins_env:
    raw_origins = default_origins + [o.strip() for o in cors_origins_env.split(",") if o.strip()]
else:
    raw_origins = default_origins

origins = []
for o in raw_origins:
    if o == "*":
        origins.append("*")
    elif o.startswith("http://") or o.startswith("https://"):
        origins.append(o)
    else:
        origins.extend([f"https://{o}", f"http://{o}", o])

origins = list(set(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
    conversationHistory: Optional[List[Dict[str, Any]]] = []
    userProfile: Optional[Dict[str, Any]] = None

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

@app.get("/api/chatbot/health")
def chatbot_health_diagnostic():
    chroma_count = rag_engine.collection.count() if rag_engine else 0
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    has_gemini = bool(gemini_key and not gemini_key.startswith("your_"))
    return {
        "status": "healthy" if chroma_count > 0 else "degraded",
        "geminiKeyConfigured": has_gemini,
        "chromaDbConnected": rag_engine is not None,
        "collectionName": "government_schemes",
        "documentCount": chroma_count,
        "service": "FastAPI ML Chatbot Diagnostic"
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
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message text is required and cannot be empty.")
    
    clean_msg = req.message.strip()
    if len(clean_msg) > 2000:
        raise HTTPException(status_code=400, detail="Message is too long. Please limit your query to 2000 characters.")

    try:
        res = generate_chatbot_response(
            user_query=clean_msg,
            conversation_history=req.conversationHistory,
            user_profile=req.userProfile
        )
        return {
            "success": True,
            "reply": res.get("reply", "No reply generated"),
            "source": res.get("source", "Civic AI Assistant"),
            "sources": res.get("sources", []),
            "suggestedActions": res.get("suggestedActions", [])
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[FastAPI Chatbot Exception]: {e}")
        return {
            "success": False,
            "reply": "AI Assistant is temporarily unavailable. Please try again.",
            "source": "Civic Assistant Service",
            "sources": [],
            "suggestedActions": ["Find Schemes", "File Complaint", "Track Grievances"]
        }

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
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
