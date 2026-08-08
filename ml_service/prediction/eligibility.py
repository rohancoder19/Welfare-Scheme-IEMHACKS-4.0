import os
import sys

# Ensure RAG imports work
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from rag.rag_engine import rag_engine

class EligibilityPredictor:
    """
    RAG-based AI Welfare Scheme Eligibility & Recommendation Engine.
    Replaces legacy Random Forest model with ChromaDB semantic search,
    profile eligibility verification, and benefit-based ranking.
    """
    def __init__(self):
        self.model = True  # Flag to indicate active AI model readiness

    def predict_recommendations(self, user_profile: dict, schemes: list = None) -> list:
        """
        Execute RAG recommendation pipeline using ChromaDB semantic search,
        content-based eligibility classification, and benefit magnitude ranking.
        """
        return rag_engine.recommend(user_profile=user_profile, fallback_schemes=schemes)

eligibility_predictor = EligibilityPredictor()

