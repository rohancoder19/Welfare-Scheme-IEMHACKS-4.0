import re
import numpy as np

def clean_text(text: str) -> str:
    """Clean and normalize grievance complaint text."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def encode_demographics(data: dict) -> np.ndarray:
    """
    Encode user demographic dictionary into numerical feature array for ML eligibility model.
    Features: [income, age, is_female, is_farmer, is_student, is_sc_st_obc, is_below_poverty, state_code]
    """
    income = float(data.get('income', 0))
    age = float(data.get('age', 25))
    gender = str(data.get('gender', '')).lower()
    occupation = str(data.get('occupation', '')).lower()
    category = str(data.get('category', '')).lower()
    education = str(data.get('education', '')).lower()

    is_female = 1.0 if gender in ['female', 'woman', 'transgender'] else 0.0
    is_farmer = 1.0 if any(k in occupation for k in ['farmer', 'agriculture', 'kisan', 'cultivator']) else 0.0
    is_student = 1.0 if any(k in occupation for k in ['student', 'learner']) or 'student' in education else 0.0
    is_sc_st_obc = 1.0 if any(k in category for k in ['sc', 'st', 'obc', 'minority']) else 0.0
    is_below_poverty = 1.0 if income <= 300000 else 0.0
    
    # State hashing for simple numerical feature
    state_code = float(hash(data.get('state', 'all')) % 100) / 100.0

    return np.array([[income, age, is_female, is_farmer, is_student, is_sc_st_obc, is_below_poverty, state_code]])
