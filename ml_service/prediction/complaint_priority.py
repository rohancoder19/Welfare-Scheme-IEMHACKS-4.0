import os
import joblib
from preprocessing.preprocess import clean_text

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "complaint_classifier.pkl")

# Domain keyword maps for NLP heuristic & ML classification fallback
CATEGORY_KEYWORDS = {
    "Road": ["road", "pothole", "asphalt", "traffic", "street", "bridge", "highway", "pavement", "footpath"],
    "Water": ["water", "pipe", "leak", "sewerage", "drain", "waterlogging", "drinking water", "tap", "pipeline", "contamination"],
    "Electricity": ["electricity", "power", "transformer", "wire", "blackout", "voltage", "outage", "meter", "current", "pole"],
    "Crime": ["crime", "theft", "robbery", "assault", "harassment", "burglary", "stalking", "vandalism", "police", "threat"],
    "Women Safety": ["women safety", "eve teasing", "harassment", "molestation", "girls", "safety", "helpline", "women"],
    "Corruption": ["bribe", "corruption", "extortion", "scam", "illegal money", "fraud", "officer bribe", "graft"],
    "Healthcare": ["hospital", "doctor", "medicine", "ambulance", "phc", "epidemic", "dengue", "sanitation", "garbage", "trash", "waste"],
    "Education": ["school", "teacher", "mid-day meal", "college", "scholarship", "classroom", "education", "books"]
}

HIGH_PRIORITY_KEYWORDS = [
    "urgent", "danger", "hazard", "fatal", "emergency", "electric wire open", "sewage overflow", "child",
    "death", "broken bridge", "accident", "threat", "severe", "life threatening", "collapsed", "bribe", "harassment", "women safety"
]

MEDIUM_PRIORITY_KEYWORDS = [
    "leak", "delay", "broken", "pothole", "blackout", "garbage accumulated", "street light off", "water supply"
]

class ComplaintNLPClassifier:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.load_model()

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                loaded = joblib.load(MODEL_PATH)
                self.model = loaded.get('model')
                self.vectorizer = loaded.get('vectorizer')
            except Exception as e:
                print(f"Error loading complaint classifier model: {e}")

    def classify_and_predict_priority(self, text: str, user_category: str = None) -> dict:
        """Classify category and predict complaint priority (High, Medium, Low)."""
        cleaned = clean_text(text)
        
        # 1. NLP Category Detection
        predicted_category = "General Public Service"
        highest_matches = 0
        for category, keywords in CATEGORY_KEYWORDS.items():
            matches = sum(1 for kw in keywords if kw in cleaned)
            if matches > highest_matches:
                highest_matches = matches
                predicted_category = category

        if user_category and user_category != "Other":
            final_category = user_category
        else:
            final_category = predicted_category

        # 2. Priority Prediction (High, Medium, Low)
        priority = "Low"
        priority_score = 40
        matched_triggers = []

        # Check high priority keywords
        for kw in HIGH_PRIORITY_KEYWORDS:
            if kw in cleaned:
                priority = "High"
                priority_score = 90
                matched_triggers.append(f"High risk keyword detected: '{kw}'")

        if priority != "High":
            for kw in MEDIUM_PRIORITY_KEYWORDS:
                if kw in cleaned:
                    priority = "Medium"
                    priority_score = 65
                    matched_triggers.append(f"Medium risk keyword detected: '{kw}'")

        # Category based baseline boost
        if final_category in ["Women Safety", "Crime"]:
            priority = "High"
            priority_score = max(priority_score, 88)
            matched_triggers.append(f"Category '{final_category}' automatically tagged high urgency")
        elif final_category in ["Electricity", "Water"] and priority != "High":
            priority = "Medium"
            priority_score = max(priority_score, 60)

        # ML Model Inference if trained pipeline exists
        if self.model and self.vectorizer:
            try:
                vec = self.vectorizer.transform([cleaned])
                ml_pred = self.model.predict(vec)[0]
                if ml_pred in ["High", "Medium", "Low"]:
                    priority = ml_pred
            except Exception:
                pass

        return {
            "predictedCategory": final_category,
            "priority": priority,
            "priorityScore": priority_score,
            "nlpSummary": f"Analyzed {len(cleaned.split())} words. " + ("; ".join(matched_triggers) if matched_triggers else "Standard priority review queue.")
        }

complaint_classifier = ComplaintNLPClassifier()
