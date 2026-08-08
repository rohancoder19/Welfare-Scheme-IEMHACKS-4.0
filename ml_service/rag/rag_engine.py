import os
import sys
import json
import re
from typing import List, Dict, Any

# Ensure site-packages and local modules are visible
import site
sys.path.insert(0, site.getusersitepackages())
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import chromadb
from dotenv import load_dotenv
from ingestion.ingest import generate_embedding, CHROMA_DB_DIR, SchemeIngestionPipeline, DOCUMENTS_DIR

# Load environment
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

class RAGEngine:
    def __init__(self, db_dir: str = CHROMA_DB_DIR):
        self.db_dir = db_dir
        self.chroma_client = chromadb.PersistentClient(path=self.db_dir)
        self.collection = self.chroma_client.get_or_create_collection(
            name="government_schemes",
            metadata={"hnsw:space": "cosine"}
        )
        
        # Ensure database is populated if empty
        if self.collection.count() == 0:
            print("ChromaDB collection empty. Running automatic ingestion pipeline...")
            pipeline = SchemeIngestionPipeline(db_dir=self.db_dir)
            json_path = os.path.join(DOCUMENTS_DIR, "sample_schemes.json")
            if os.path.exists(json_path):
                pipeline.ingest_structured_json(json_path)

    def retrieve_candidates(self, user_profile: dict, top_k: int = 15) -> List[Dict[str, Any]]:
        """Retrieve candidate government schemes using semantic vector search in ChromaDB."""
        income = user_profile.get('income', 240000)
        age = user_profile.get('age', 25)
        gender = user_profile.get('gender', 'Female')
        occupation = user_profile.get('occupation', 'Farmer')
        category = user_profile.get('category', 'OBC')
        state = user_profile.get('state', 'Maharashtra')
        education = user_profile.get('education', 'Graduate')

        search_query = (
            f"Government welfare scheme for a {age} year old {gender} applicant working as {occupation} "
            f"residing in {state} with annual income ₹{income:,.0f}, social category {category}, education {education}. "
            f"Financial aid subsidy health housing agricultural scholarship loans."
        )

        query_vector = generate_embedding(search_query)

        # Query ChromaDB collection
        count = self.collection.count()
        if count == 0:
            return []

        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=min(top_k, count),
            include=["documents", "metadatas", "distances"]
        )

        candidates = []
        if results and "metadatas" in results and results["metadatas"]:
            seen_ids = set()
            metas = results["metadatas"][0]
            distances = results.get("distances", [[]])[0]
            docs = results.get("documents", [[]])[0]

            for meta, dist, doc in zip(metas, distances, docs):
                scheme_id = meta.get("scheme_id")
                if scheme_id not in seen_ids:
                    seen_ids.add(scheme_id)
                    # Convert distance to similarity score (cosine distance ranges 0..2)
                    sim_score = max(0.0, min(1.0, 1.0 - (dist / 2.0)))
                    candidates.append({
                        "meta": meta,
                        "document": doc,
                        "similarity": sim_score
                    })

        return candidates

    def evaluate_eligibility(self, user_profile: dict, meta: dict, doc_text: str) -> dict:
        """
        Compare user's profile against scheme requirements.
        Classify into: "Eligible", "Probably Eligible", or "Not Eligible"
        based on scheme content.
        """
        income = float(user_profile.get('income', 0))
        age = float(user_profile.get('age', 25))
        gender = str(user_profile.get('gender', 'All')).lower()
        occupation = str(user_profile.get('occupation', 'All')).lower()
        social_cat = str(user_profile.get('category', 'General')).lower()
        user_state = str(user_profile.get('state', 'All India')).lower()

        max_income = float(meta.get('max_income', 1000000))
        min_age = float(meta.get('min_age', 0))
        max_age = float(meta.get('max_age', 100))
        target_gender = str(meta.get('gender', 'All')).lower()
        target_occ = str(meta.get('occupation', 'All')).lower()
        target_cat = str(meta.get('social_category', 'All')).lower()
        scheme_state = str(meta.get('state', 'All India')).lower()

        matched_reasons = []
        unmatched_reasons = []
        base_score = 75

        # 1. Income Evaluation
        if max_income > 0:
            if income <= max_income:
                matched_reasons.append(f"Annual household income (₹{income:,.0f}) is within limit (≤ ₹{max_income:,.0f})")
                base_score += 10
            else:
                unmatched_reasons.append(f"Income (₹{income:,.0f}) exceeds threshold limit (₹{max_income:,.0f})")
                base_score -= 35

        # 2. Age Evaluation
        if min_age <= age <= max_age:
            matched_reasons.append(f"Applicant age ({int(age)}) satisfies target age window ({int(min_age)}-{int(max_age)} yrs)")
            base_score += 5
        else:
            unmatched_reasons.append(f"Age ({int(age)}) is outside scheme age range ({int(min_age)}-{int(max_age)} yrs)")
            base_score -= 25

        # 3. Gender Evaluation
        if target_gender != 'all' and target_gender != 'both':
            if target_gender in gender or gender in target_gender:
                matched_reasons.append(f"Gender ({gender.capitalize()}) matches designated beneficiary group")
                base_score += 15
            else:
                unmatched_reasons.append(f"Scheme specifically targets {target_gender.capitalize()} applicants")
                base_score -= 40

        # 4. Occupation & Demographics
        if target_occ != 'all':
            occ_terms = [t.strip() for t in target_occ.split(',')]
            if any(term in occupation for term in occ_terms):
                matched_reasons.append(f"Occupation ({occupation.capitalize()}) matches prioritized trade/field")
                base_score += 10
            else:
                unmatched_reasons.append(f"Scheme prioritizes {target_occ.capitalize()} sector")
                base_score -= 10

        # 5. Social Category
        scheme_full_text = f"{meta.get('scheme_name', '')} {meta.get('description', '')} {doc_text}".lower()
        if target_cat == 'all' and any(kw in scheme_full_text for kw in ['sc/st/obc', 'sc/st', 'for sc', 'for st', 'for obc', 'caste certificate']):
            target_cat = 'sc, st, obc'

        if target_cat != 'all':
            cat_terms = [t.strip().lower() for t in target_cat.split(',')]
            if any(term in social_cat for term in cat_terms):
                matched_reasons.append(f"Social category ({social_cat.upper()}) qualifies for targeted quota ({target_cat.upper()})")
                base_score += 15
            else:
                unmatched_reasons.append(f"Scheme exclusively targets {target_cat.upper()} categories (Applicant is {social_cat.upper()})")
                base_score -= 45

        # 6. Regional / State Applicability
        if scheme_state not in ['all india', 'central', 'all']:
            if user_state in scheme_state or scheme_state in user_state:
                matched_reasons.append(f"State residency ({user_state.title()}) matches scheme region ({scheme_state.title()})")
                base_score += 15
            else:
                unmatched_reasons.append(f"Scheme is valid only for residents of {scheme_state.title()}")
                base_score -= 45

        # Determine Eligibility Categorization
        has_hard_disqualifier = any(
            "exclusively targets" in r or 
            "valid only for residents" in r or 
            "exceeds threshold" in r or 
            "specifically targets" in r 
            for r in unmatched_reasons
        )

        if has_hard_disqualifier or len(unmatched_reasons) >= 2:
            status = "Not Eligible"
            is_eligible = False
            final_match = max(12, min(48, base_score))
        elif len(unmatched_reasons) == 0:
            status = "Eligible"
            is_eligible = True
            final_match = max(80, min(98, base_score))
        else:
            status = "Probably Eligible"
            is_eligible = True
            final_match = max(52, min(75, base_score))

        return {
            "eligibilityStatus": status,
            "isEligible": is_eligible,
            "matchPercentage": final_match,
            "matchedReasons": matched_reasons if matched_reasons else ["General applicant match"],
            "unmatchedReasons": unmatched_reasons
        }

    def recommend(self, user_profile: dict, fallback_schemes: list = None) -> List[Dict[str, Any]]:
        """
        Execute full RAG pipeline:
        1. Retrieve candidates from ChromaDB
        2. Evaluate eligibility against retrieved scheme content
        3. Rank schemes based on eligibility status, benefit magnitude, and match score
        4. Return backward-compatible JSON array expected by frontend
        """
        candidates = self.retrieve_candidates(user_profile, top_k=20)
        recommendations = []

        if candidates:
            for item in candidates:
                meta = item["meta"]
                doc_text = item["document"]
                sim = item["similarity"]

                eval_res = self.evaluate_eligibility(user_profile, meta, doc_text)

                # Factor similarity distance into match score
                combined_match = int(0.75 * eval_res["matchPercentage"] + 0.25 * (sim * 100))
                combined_match = max(10, min(98, combined_match))

                recommendations.append({
                    "schemeId": meta.get("scheme_id", "sch_0"),
                    "schemeName": meta.get("scheme_name", "Unknown Scheme"),
                    "category": meta.get("category", "General Welfare"),
                    "description": meta.get("description", doc_text[:250]),
                    "benefits": meta.get("benefits", "Government welfare benefits"),
                    "state": meta.get("state", "All India"),
                    "deadline": meta.get("deadline", "Active Year-round"),
                    "applicationUrl": meta.get("application_url", ""),
                    "matchPercentage": combined_match,
                    "isEligible": eval_res["isEligible"],
                    "eligibilityStatus": eval_res["eligibilityStatus"],
                    "matchedReasons": eval_res["matchedReasons"],
                    "unmatchedReasons": eval_res["unmatchedReasons"]
                })
        
        # Fallback if candidates list from vector DB is small
        if len(recommendations) < 3 and fallback_schemes:
            seen_names = {r["schemeName"] for r in recommendations}
            for scheme in fallback_schemes:
                name = scheme.get("schemeName")
                if name not in seen_names:
                    crit = scheme.get("eligibilityCriteria", {})
                    meta = {
                        "scheme_id": scheme.get("_id", scheme.get("id")),
                        "scheme_name": name,
                        "category": scheme.get("category", "Welfare"),
                        "description": scheme.get("description", ""),
                        "benefits": scheme.get("benefits", ""),
                        "state": scheme.get("state", "All India"),
                        "deadline": scheme.get("deadline", "Active Year-round"),
                        "application_url": scheme.get("applicationUrl", ""),
                        "max_income": crit.get("maxIncome", 1000000),
                        "min_age": crit.get("minAge", 0),
                        "max_age": crit.get("maxAge", 100),
                        "gender": crit.get("gender", "All"),
                        "occupation": crit.get("occupation", "All"),
                        "social_category": crit.get("category", "All")
                    }
                    eval_res = self.evaluate_eligibility(user_profile, meta, scheme.get("description", ""))
                    recommendations.append({
                        "schemeId": str(meta["scheme_id"]),
                        "schemeName": name,
                        "category": meta["category"],
                        "description": meta["description"],
                        "benefits": meta["benefits"],
                        "state": meta["state"],
                        "deadline": meta["deadline"],
                        "applicationUrl": meta["application_url"],
                        "matchPercentage": eval_res["matchPercentage"],
                        "isEligible": eval_res["isEligible"],
                        "eligibilityStatus": eval_res["eligibilityStatus"],
                        "matchedReasons": eval_res["matchedReasons"],
                        "unmatchedReasons": eval_res["unmatchedReasons"]
                    })

        # Rank Eligible schemes first, followed by Probably Eligible, then Not Eligible, sorted by match percentage descending
        def ranking_key(item):
            status_weight = 0
            if item["eligibilityStatus"] == "Eligible":
                status_weight = 200
            elif item["eligibilityStatus"] == "Probably Eligible":
                status_weight = 100

            # Extract numeric benefit bonus (e.g. ₹5,00,000 -> bonus)
            benefit_text = item["benefits"]
            nums = re.findall(r'₹?\s*(\d[\d,.]*)', benefit_text)
            benefit_val = 0
            if nums:
                try:
                    val_str = nums[0].replace(',', '')
                    benefit_val = min(50, float(val_str) / 10000.0)
                except Exception:
                    benefit_val = 0

            return status_weight + item["matchPercentage"] + benefit_val

        recommendations.sort(key=ranking_key, reverse=True)
        return recommendations

rag_engine = RAGEngine()
