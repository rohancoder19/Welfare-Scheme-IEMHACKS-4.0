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
    """Send prompt to Gemini Generative AI API using official SDK, legacy SDK, or direct HTTP REST API."""
    if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("your_"):
        return ""

    # 1. Try official google.genai SDK
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        for m in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]:
            try:
                response = client.models.generate_content(model=m, contents=prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception:
                continue
    except Exception as e:
        print(f"[Gemini GenAI SDK Error]: {e}")

    # 2. Try google.generativeai legacy SDK
    try:
        import google.generativeai as genai_legacy
        genai_legacy.configure(api_key=GEMINI_API_KEY)
        model = genai_legacy.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text.strip()
    except Exception as e:
        print(f"[Gemini Legacy SDK Error]: {e}")

    # 3. Direct HTTP REST API via urllib.request (Zero SDK dependency fallback)
    for model_name in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
            headers = {"Content-Type": "application/json"}
            payload = json.dumps({
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }).encode('utf-8')
            req = urllib.request.Request(url, data=payload, headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=8) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                candidates = res_data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"].strip()
        except Exception:
            continue

    return ""

INDIAN_STATES = [
    "west bengal", "maharashtra", "delhi", "karnataka", "tamil nadu", "kerala",
    "gujarat", "uttar pradesh", "bihar", "madhya pradesh", "rajasthan", "punjab",
    "haryana", "andhra pradesh", "telangana", "odisha", "assam", "jharkhand", "chhattisgarh"
]

def extract_state_from_query(query: str, user_profile: dict = None) -> str:
    q_lower = query.lower()
    for state in INDIAN_STATES:
        if state in q_lower:
            return state.title()
    if user_profile and user_profile.get("state"):
        st = str(user_profile.get("state")).strip()
        if st.lower() not in ["all india", "all", "central"]:
            return st.title()
    return ""

def generate_chatbot_response(user_query: str, conversation_history: list = None, user_profile: dict = None) -> dict:
    """
    State-Aware RAG AI Chatbot Engine for 3,400+ Government Schemes & Civic Grievances.
    Retrieves vector scheme content from ChromaDB, filters by State & Demographics, and generates grounded AI answers using Gemini.
    """
    query_lower = user_query.lower().strip()
    if not query_lower:
        return {
            "reply": "Namaste! How can I assist you today? Ask me about government welfare schemes, eligibility criteria, required documents, or filing civic grievances.",
            "source": "Civic AI Assistant",
            "sources": [],
            "suggestedActions": ["Find Schemes", "Check Eligibility", "File Grievance"]
        }

    detected_state = extract_state_from_query(user_query, user_profile)
    is_male = "male" in query_lower and "female" not in query_lower
    is_female = "female" in query_lower or "woman" in query_lower or "girl" in query_lower

    retrieved_context = ""
    retrieved_scheme_names = []
    context_chunks = []

    # 1. Hybrid RAG Retrieval (Keyword Token Matching + Semantic Vector Search)
    if rag_engine:
        try:
            candidates = rag_engine.search_schemes_hybrid(user_query, top_k=6, detected_state=detected_state)
            for c in candidates:
                name = c.get("scheme_name", "Government Scheme")
                state = c.get("state", "All India")
                gov_level = c.get("government_level", "State")
                gender = str(c.get("gender", "All")).strip()

                if is_male and gender.lower() in ["female", "women", "girls"]:
                    continue

                if name not in retrieved_scheme_names:
                    retrieved_scheme_names.append(name)

                chunk_str = (
                    f"Scheme Name: {name}\n"
                    f"State: {state} (Level: {gov_level})\n"
                    f"Details: {c.get('details', '')}\n"
                    f"Benefits: {c.get('benefits', '')}\n"
                    f"Eligibility: {c.get('eligibility_text', '')}\n"
                    f"Documents Required: {c.get('documents', '')}\n"
                    f"Application Process: {c.get('application_url', '')}"
                )
                context_chunks.append(chunk_str)

            retrieved_context = "\n\n---\n\n".join(context_chunks)
        except Exception as e:
            print(f"[Chatbot Hybrid Search Error]: {e}")

    # Build Grounded System Prompt
    system_prompt = (
        "SYSTEM INSTRUCTIONS:\n"
        "You are the official AI Assistant for Central and State Government Welfare Schemes & Grievance Redressal in India.\n"
        "Answer the user's question clearly, accurately, and politely in 2-4 sentences using ONLY the verified scheme context below.\n"
        "Do NOT invent non-existent schemes, eligibility rules, benefits, or application procedures.\n"
        "If the user asks about a specific scheme (e.g. Kanyashree, SVMCM, PM Awas, PM Kisan), use the exact details, benefits, documents, and application steps from the context.\n"
        "If the user specifies a state (e.g. West Bengal or Maharashtra), prioritize schemes applicable to that state and Central Government schemes. Never recommend another state's exclusive scheme.\n"
        "If the retrieved context does not contain enough information to answer the question, explicitly state: 'The available scheme database does not contain enough information to answer this question.'\n\n"
        f"USER QUESTION:\n{user_query}\n\n"
        f"VERIFIED SCHEME CONTEXT:\n--- DATA START ---\n{retrieved_context if retrieved_context else 'No specific scheme documents retrieved.'}\n--- DATA END ---\n\n"
        "Provide a helpful, grounded response:"
    )

    # 2. Call Gemini Generative AI LLM
    if GEMINI_API_KEY and not GEMINI_API_KEY.startswith("your_"):
        ai_reply = query_gemini_llm(system_prompt)
        if ai_reply:
            return {
                "reply": ai_reply,
                "source": "Gemini AI Engine (Grounded RAG)",
                "sources": retrieved_scheme_names[:3],
                "suggestedActions": ["Find Schemes", "Check Eligibility", "File Grievance"]
            }

    # 3. Direct RAG Grounded Fallback
    if retrieved_context and retrieved_scheme_names:
        first_scheme = retrieved_scheme_names[0]
        reply_msg = f"Based on our official dataset, {first_scheme} matches your query. "
        for item in DEFAULT_KNOWLEDGE_BASE:
            if any(kw in query_lower for kw in item["keywords"]):
                reply_msg += item["answer"]
                break
        else:
            reply_msg += f"Details: {context_chunks[0][:300]}..."

        return {
            "reply": reply_msg,
            "source": "Civic Vector RAG Knowledge Base",
            "sources": retrieved_scheme_names[:3],
            "suggestedActions": ["Find Schemes", "Check Eligibility", "File Grievance"]
        }

    # 4. Standard Keyword Fallback
    for item in DEFAULT_KNOWLEDGE_BASE:
        if any(kw in query_lower for kw in item["keywords"]):
            return {
                "reply": item["answer"],
                "source": "Civic Knowledge Base",
                "sources": [],
                "suggestedActions": ["View Schemes", "Check Eligibility", "File Grievance"]
            }

    return {
        "reply": f"Regarding '{user_query}': You can explore eligible Central and State welfare schemes (PM Awas, PM Kisan, Ayushman Bharat, Scholarships) under 'Scheme Recommender' or report civic issues under 'File Grievance'.",
        "source": "Civic Welfare Assistant",
        "sources": [],
        "suggestedActions": ["Find Schemes", "File Complaint", "Track Status"]
    }
