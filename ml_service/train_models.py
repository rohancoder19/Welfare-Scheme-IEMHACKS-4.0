import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

def train_and_save_models():
    os.makedirs(MODELS_DIR, exist_ok=True)

    # 1. Initialize ChromaDB RAG Scheme Vector Database
    print("Initializing RAG Vector Database for Government Schemes (ChromaDB)...")
    try:
        from ingestion.ingest import run_ingestion
        run_ingestion()
    except Exception as e:
        print(f"Warning initializing ChromaDB: {e}")

    # 2. Complaint NLP Classifier & Priority Model
    print("Training Complaint NLP Priority Model (TF-IDF + Naive Bayes)...")
    corpus = [
        "severe electric wire broken danger life hazard",
        "open drain sewage overflow disease outbreak emergency",
        "pothole on road minor inconvenience street repair",
        "water tap leaking low pressure supply",
        "women harassment stalking unsafe street night",
        "bribe demanded by government official for sanction",
        "street light lamp broken replacement needed",
        "garbage bin overflowing smells bad in locality"
    ]
    labels = ["High", "High", "Low", "Low", "High", "High", "Low", "Medium"]

    vectorizer = TfidfVectorizer()
    X_vec = vectorizer.fit_transform(corpus)
    nb_model = MultinomialNB()
    nb_model.fit(X_vec, labels)

    classifier_path = os.path.join(MODELS_DIR, "complaint_classifier.pkl")
    joblib.dump({"model": nb_model, "vectorizer": vectorizer}, classifier_path)
    print(f"Saved complaint classifier model to {classifier_path}")

if __name__ == "__main__":
    train_and_save_models()
