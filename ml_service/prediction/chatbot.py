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

# Import RAG engine and embedding generator for knowledge retrieval
try:
    from rag.rag_engine import rag_engine
    from ingestion.ingest import generate_embedding
except Exception as e:
    rag_engine = None
    generate_embedding = None

DEFAULT_KNOWLEDGE_BASE = [
    {
        "keywords": ["pm awas", "housing", "house", "home", "shelter", "pmay"],
        "answer": "PM Awas Yojana (PMAY) provides financial assistance up to ₹2.67 Lakhs for constructing or purchasing pucca houses. It targets EWS, LIG, and MIG families with annual income up to ₹6 Lakhs. You can apply on pmaymis.gov.in."
    },
    {
        "keywords": ["ayushman", "health", "insurance", "medical", "hospital", "pmjay"],
        "answer": "Ayushman Bharat PM-JAY offers free cashless health insurance coverage up to ₹5,00,000 per family per year for secondary and tertiary care hospitalization in empanelled hospitals across India."
    },
    {
        "keywords": ["pm kisan", "farmer", "agriculture", "kisan credit", "crop", "land"],
        "answer": "PM-KISAN provides direct income support of ₹6,000 per year in 3 equal installments of ₹2,000 directly into the bank accounts of land-holding farmer families."
    },
    {
        "keywords": ["scholarship", "student", "education", "post matric", "fee"],
        "answer": "Post-Matric Scholarship Scheme provides financial aid to eligible SC, ST, and OBC students pursuing post-secondary education, offering full tuition fee coverage plus monthly stipends up to ₹1,200."
    },
    {
        "keywords": ["ladli behna", "mp", "women", "madhya pradesh"],
        "answer": "Chief Minister Ladli Behna Yojana provides monthly financial support of ₹1,250 to eligible women aged 21 to 60 years in Madhya Pradesh with household income under ₹2.5 Lakhs."
    },
    {
        "keywords": ["vishwakarma", "artisan", "craftsman", "tool", "loan"],
        "answer": "PM Vishwakarma Scheme provides traditional artisans and craftsmen with ₹15,000 modern toolkit incentives plus collateral-free loans up to ₹3 Lakhs at 5% concessional interest."
    },
    {
        "keywords": ["grievance", "complaint", "file", "track", "status", "report"],
        "answer": "To file a civic grievance (water leak, road pothole, electricity hazard, corruption), click 'File Grievance' in the top navbar. Enter title, category, description, and location. Our AI system will assign an officer and priority rating. You can track resolution live under 'Track Status'."
    }
]

def query_gemini_llm(prompt: str) -> str:
    """Send prompt to Gemini Generative AI API."""
    if not GEMINI_API_KEY:
        return ""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        headers = {"Content-Type": "application/json"}
        payload = json.dumps({
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 500
            }
        }).encode('utf-8')

        req = urllib.request.Request(url, data=payload, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=6) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            candidates = res_data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
    except Exception as e:
        print(f"[Gemini AI Chatbot Warning]: {e}")
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

    # 1. Semantic Vector Search in ChromaDB using user's query
    if rag_engine and generate_embedding and rag_engine.collection.count() > 0:
        try:
            query_vec = generate_embedding(query_lower)
            results = rag_engine.collection.query(
                query_embeddings=[query_vec],
                n_results=3,
                include=["metadatas", "documents"]
            )
            if results and results.get("metadatas") and results["metadatas"][0]:
                chunks = []
                for meta, doc in zip(results["metadatas"][0], results["documents"][0]):
                    name = meta.get("scheme_name", "Government Scheme")
                    benefits = meta.get("benefits", "")
                    desc = meta.get("description", doc[:250])
                    chunks.append(f"• {name}:\n  Description: {desc}\n  Benefits: {benefits}")
                    retrieved_schemes.append(name)
                retrieved_context = "\n\n".join(chunks)
        except Exception as e:
            print(f"[Chatbot Vector Search Error]: {e}")

    # 2. Query Gemini LLM with RAG Knowledge Context
    if GEMINI_API_KEY:
        system_prompt = (
            "You are the official AI Welfare Assistant for Central and State Government Schemes in India.\n"
            "Answer the user's question clearly, accurately, and politely in 3-5 sentences based on official government guidelines.\n"
            f"User Question: '{user_query}'\n\n"
            f"Relevant Scheme Knowledge Context:\n{retrieved_context if retrieved_context else 'General Government Welfare Schemes'}\n\n"
            "Provide a complete, informative, and actionable response."
        )
        ai_reply = query_gemini_llm(system_prompt)
        if ai_reply:
            return {
                "reply": ai_reply,
                "source": "Gemini AI RAG Engine",
                "suggestedActions": ["Find Schemes", "Check Eligibility", "File Grievance"]
            }

    # 3. Smart Semantic Match Fallback
    for item in DEFAULT_KNOWLEDGE_BASE:
        if any(kw in query_lower for kw in item["keywords"]):
            return {
                "reply": item["answer"],
                "source": "Civic AI Knowledge Base",
                "suggestedActions": ["View Schemes", "Check Eligibility", "File Grievance"]
            }

    # 4. Synthesized Context Fallback from Vector Search
    if retrieved_context:
        first_scheme = retrieved_schemes[0] if retrieved_schemes else "Government Scheme"
        return {
            "reply": f"Based on government guidelines for '{user_query}':\n\n{retrieved_context}\n\nYou can use our 'Scheme Recommender' tool to calculate your exact personalized eligibility match!",
            "source": "ChromaDB RAG Knowledge Store",
            "suggestedActions": ["Find Schemes", "File Complaint", "Track Status"]
        }

    # Default assistance
    return {
        "reply": f"Regarding '{user_query}': You can explore Central & State schemes (PM Awas, Ayushman Bharat, PM-KISAN, Scholarships) under the 'Scheme Recommender' tab, or submit civic grievance complaints under 'File Grievance'.",
        "source": "Civic AI Assistant",
        "suggestedActions": ["Find Schemes", "File Complaint", "Track Status"]
    }
