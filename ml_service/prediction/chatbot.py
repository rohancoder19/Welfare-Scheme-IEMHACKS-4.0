import os
import sys
import json
import urllib.request
import urllib.parse
from typing import Dict, Any, List

# Ensure site-packages and local imports work
import site
sys.path.insert(0, site.getusersitepackages())
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Import RAG engine for knowledge retrieval
try:
    from rag.rag_engine import rag_engine
except Exception as e:
    rag_engine = None

DEFAULT_KNOWLEDGE_BASE = [
    {
        "keywords": ["pm awas", "housing", "house", "home", "shelter", "pmay"],
        "answer": "PM Awas Yojana (PMAY) provides financial assistance up to ₹2.67 Lakhs for constructing or purchasing pucca houses. It is applicable for EWS, LIG, and MIG families. You can apply on pmaymis.gov.in."
    },
    {
        "keywords": ["ayushman", "health", "insurance", "medical", "hospital", "pmjay"],
        "answer": "Ayushman Bharat PM-JAY offers free cashless health insurance coverage up to ₹5,00,000 per family per year for secondary and tertiary care hospitalization in empanelled hospitals."
    },
    {
        "keywords": ["pm kisan", "farmer", "agriculture", "kisan credit", "crop", "land"],
        "answer": "PM-KISAN provides direct income support of ₹6,000 per year in 3 equal installments of ₹2,000 directly into the bank accounts of land-holding farmer families across India."
    },
    {
        "keywords": ["scholarship", "student", "education", "post matric", "fee"],
        "answer": "Post-Matric Scholarship Scheme provides financial assistance to eligible SC, ST, and OBC students pursuing post-secondary education, covering tuition fees plus monthly maintenance stipends."
    },
    {
        "keywords": ["ladli behna", "mp", "women", "madhya pradesh"],
        "answer": "Chief Minister Ladli Behna Yojana provides monthly financial support of ₹1,250 to eligible women aged 21 to 60 years in Madhya Pradesh."
    },
    {
        "keywords": ["grievance", "complaint", "file", "track", "status", "report"],
        "answer": "To file a civic grievance (pothole, water leak, electricity hazard, corruption), click 'File Grievance' in the top navigation. Enter the issue title, category, description, and location. Our AI triage system automatically assigns an urgency rating and dispatches it to the municipal officer."
    }
]

def query_gemini_llm(prompt: str) -> str:
    """Send prompt to Gemini Generative AI API using official SDK."""
    if not GEMINI_API_KEY:
        return ""
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        if response and response.text:
            return response.text.strip()
    except Exception as e:
        print(f"[Gemini AI Chatbot Error]: {e}")
    return ""

def generate_chatbot_response(user_query: str) -> dict:
    """
    RAG-Powered AI Chatbot Engine for Government Schemes & Civic Grievances.
    Retrieves vector scheme content from ChromaDB and generates intelligent AI answers using Gemini.
    """
    query_lower = user_query.lower().strip()
    if not query_lower:
        return {
            "reply": "Hello! How can I assist you today? You can ask me about government schemes, eligibility criteria, required documents, or filing civic grievances.",
            "source": "Civic AI Assistant",
            "suggestedActions": ["Find Schemes", "Check Eligibility", "File Grievance"]
        }

    retrieved_context = ""
    retrieved_schemes = []

    # 1. Direct RAG Vector Retrieval from ChromaDB for the user's specific query
    if rag_engine:
        try:
            from ingestion.ingest import generate_embedding
            query_vector = generate_embedding(user_query)
            count = rag_engine.collection.count()
            if count > 0:
                results = rag_engine.collection.query(
                    query_embeddings=[query_vector],
                    n_results=min(4, count),
                    include=["documents", "metadatas"]
                )
                if results and "metadatas" in results and results["metadatas"]:
                    context_chunks = []
                    metas = results["metadatas"][0]
                    docs = results.get("documents", [[]])[0]
                    for meta, doc in zip(metas, docs):
                        name = meta.get("scheme_name", "Government Scheme")
                        benefits = meta.get("benefits", "")
                        context_chunks.append(f"Scheme: {name}\nDetails: {doc}\nBenefits: {benefits}")
                    retrieved_context = "\n\n".join(context_chunks)
        except Exception as e:
            print(f"[Chatbot Vector Search Error]: {e}")

    # 2. Try Gemini AI LLM Generation with RAG Context
    if GEMINI_API_KEY and (retrieved_context or len(query_lower) > 3):
        system_prompt = (
            "You are the official Civic AI Assistant for Central and State Government Welfare Schemes & Grievance Redressal in India.\n"
            "Answer the user's question clearly, concisely, and helpfully in 2-4 sentences.\n"
            f"User Question: '{user_query}'\n\n"
            f"Retrieved Scheme Context:\n{retrieved_context if retrieved_context else 'Central and State Government Welfare Schemes'}\n\n"
            "Provide an accurate and actionable response."
        )
        ai_reply = query_gemini_llm(system_prompt)
        if ai_reply:
            return {
                "reply": ai_reply,
                "source": "Gemini 1.5 Flash AI Engine",
                "suggestedActions": ["Find Schemes", "Check Eligibility", "File Grievance"]
            }

    # 3. Fallback Knowledge Matching
    for item in DEFAULT_KNOWLEDGE_BASE:
        if any(kw in query_lower for kw in item["keywords"]):
            return {
                "reply": item["answer"],
                "source": "Civic Knowledge Base",
                "suggestedActions": ["View Schemes", "Check Eligibility", "File Grievance"]
            }

    # Default friendly assistance
    return {
        "reply": f"Regarding '{user_query}': You can find eligible Central and State welfare schemes (PM Awas, PM-JAY, PM Kisan, Scholarships) under the 'Scheme Recommender' tab, or submit civic complaints under 'File Grievance'.",
        "source": "Civic Welfare Assistant",
        "suggestedActions": ["Find Schemes", "File Complaint", "Track Status"]
    }
