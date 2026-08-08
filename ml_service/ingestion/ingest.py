import os
import sys
import json
import glob
from typing import List, Dict, Any

# Ensure site-packages and local modules are visible
import site
sys.path.insert(0, site.getusersitepackages())
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import chromadb
from dotenv import load_dotenv

# Load env variables from ml_service/.env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

# Import PyPDF if available
try:
    import pypdf
except ImportError:
    pypdf = None

# Import Gemini API if available
import urllib.request
import urllib.parse

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
CHROMA_DB_DIR = os.getenv("CHROMA_DB_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db"))
DOCUMENTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "documents")

def generate_embedding(text: str) -> List[float]:
    """
    Generate vector embeddings using Gemini API (text-embedding-004)
    with a deterministic mathematical fallback vectorizer.
    """
    if GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={GEMINI_API_KEY}"
            headers = {"Content-Type": "application/json"}
            payload = json.dumps({
                "model": "models/text-embedding-004",
                "content": {"parts": [{"text": text[:2000]}]}
            }).encode('utf-8')

            req = urllib.request.Request(url, data=payload, headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=5) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                if "embedding" in res_data and "values" in res_data["embedding"]:
                    return res_data["embedding"]["values"]
        except Exception as e:
            # Fallback to local embedding
            pass

    # Deterministic Local Embedding Fallback (dimension = 384)
    import hashlib
    import math
    dim = 384
    vec = [0.0] * dim
    words = text.lower().split()
    if not words:
        return vec
    
    for word in words:
        h = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
        idx = h % dim
        val = ((h >> 8) % 1000) / 500.0 - 1.0
        vec[idx] += val
        
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec

def extract_pdf_text(filepath: str) -> str:
    """Extract text from PDF file."""
    if not pypdf:
        return ""
    try:
        reader = pypdf.PdfReader(filepath)
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
        return text
    except Exception as e:
        print(f"Error reading PDF {filepath}: {e}")
        return ""

def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
    """Splits text into overlapping semantic chunks."""
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk.strip())
        start += (chunk_size - overlap)
    return chunks

class SchemeIngestionPipeline:
    def __init__(self, db_dir: str = CHROMA_DB_DIR):
        self.db_dir = db_dir
        os.makedirs(self.db_dir, exist_ok=True)
        self.chroma_client = chromadb.PersistentClient(path=self.db_dir)
        self.collection = self.chroma_client.get_or_create_collection(
            name="government_schemes",
            metadata={"hnsw:space": "cosine"}
        )

    def ingest_structured_json(self, json_filepath: str):
        """Ingest schemes from structured JSON file into ChromaDB."""
        if not os.path.exists(json_filepath):
            print(f"File not found: {json_filepath}")
            return

        with open(json_filepath, 'r', encoding='utf-8') as f:
            schemes = json.load(f)

        print(f"Ingesting {len(schemes)} schemes from {os.path.basename(json_filepath)} into ChromaDB...")

        for scheme in schemes:
            scheme_id = str(scheme.get('id', scheme.get('_id', '')))
            scheme_name = scheme.get('schemeName', '')
            category = scheme.get('category', 'General Welfare')
            description = scheme.get('description', '')
            benefits = scheme.get('benefits', '')
            state = scheme.get('state', 'All India')
            deadline = scheme.get('deadline', 'Active Year-round')
            application_url = scheme.get('applicationUrl', '')
            
            crit = scheme.get('eligibilityCriteria', {})
            max_income = float(crit.get('maxIncome', 1000000))
            min_age = float(crit.get('minAge', 0))
            max_age = float(crit.get('maxAge', 100))
            gender = str(crit.get('gender', 'All'))
            occupation = str(crit.get('occupation', 'All'))
            social_cat = str(crit.get('category', 'All'))

            full_text = f"Scheme Name: {scheme_name}\nCategory: {category}\nState: {state}\nDescription: {description}\nBenefits: {benefits}\nIncome Ceiling: ₹{max_income:,.0f}\nTarget Age: {min_age}-{max_age} years\nTarget Gender: {gender}\nTarget Occupation: {occupation}\nTarget Category: {social_cat}\nDeadline: {deadline}"

            chunks = chunk_text(full_text, chunk_size=500, overlap=50)
            if not chunks:
                chunks = [full_text]

            for idx, chunk in enumerate(chunks):
                doc_id = f"{scheme_id}_chunk_{idx}"
                embedding = generate_embedding(chunk)
                
                metadata = {
                    "scheme_id": scheme_id,
                    "scheme_name": scheme_name,
                    "category": category,
                    "description": description,
                    "benefits": benefits,
                    "state": state,
                    "deadline": deadline,
                    "application_url": application_url,
                    "max_income": max_income,
                    "min_age": min_age,
                    "max_age": max_age,
                    "gender": gender,
                    "occupation": occupation,
                    "social_category": social_cat
                }

                self.collection.upsert(
                    ids=[doc_id],
                    embeddings=[embedding],
                    documents=[chunk],
                    metadatas=[metadata]
                )

        print(f"Successfully ingested {self.collection.count()} chunks into ChromaDB.")

    def ingest_pdf_documents(self, docs_dir: str = DOCUMENTS_DIR):
        """Scan directory for PDFs, extract text, chunk, embed and store in ChromaDB."""
        if not os.path.exists(docs_dir):
            return

        pdf_files = glob.glob(os.path.join(docs_dir, "*.pdf"))
        print(f"Found {len(pdf_files)} PDF document(s) in {docs_dir}")

        for pdf_path in pdf_files:
            filename = os.path.basename(pdf_path)
            scheme_id = f"pdf_{os.path.splitext(filename)[0]}"
            print(f"Processing PDF: {filename}...")
            
            raw_text = extract_pdf_text(pdf_path)
            if not raw_text:
                continue

            chunks = chunk_text(raw_text, chunk_size=800, overlap=100)
            for idx, chunk in enumerate(chunks):
                doc_id = f"{scheme_id}_chunk_{idx}"
                embedding = generate_embedding(chunk)

                metadata = {
                    "scheme_id": scheme_id,
                    "scheme_name": os.path.splitext(filename)[0].replace("_", " ").title(),
                    "category": "PDF Document Scheme",
                    "description": chunk[:200] + "...",
                    "benefits": "Extracted from official PDF policy guidelines",
                    "state": "All India",
                    "deadline": "Active Year-round",
                    "application_url": "",
                    "max_income": 800000,
                    "min_age": 18,
                    "max_age": 70,
                    "gender": "All",
                    "occupation": "All",
                    "social_category": "All"
                }

                self.collection.upsert(
                    ids=[doc_id],
                    embeddings=[embedding],
                    documents=[chunk],
                    metadatas=[metadata]
                )

        print(f"ChromaDB collection count after PDF ingestion: {self.collection.count()}")

    def ingest_csv_documents(self, csv_filepath: str):
        """Scan and ingest CSV files containing government scheme details into ChromaDB."""
        import csv
        if not os.path.exists(csv_filepath):
            print(f"CSV file not found: {csv_filepath}")
            return

        print(f"Ingesting CSV file: {os.path.basename(csv_filepath)} into ChromaDB...")
        with open(csv_filepath, mode='r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            count = 0
            ids_batch, embeddings_batch, docs_batch, metas_batch = [], [], [], []

            for row in reader:
                # Normalize key names (lowercase stripped)
                r = {k.strip().lower(): (v.strip() if v else '') for k, v in row.items() if k}
                scheme_id = r.get('slug') or r.get('id') or r.get('_id') or f"csv_{count + 1}"
                scheme_name = r.get('scheme_name') or r.get('schemename') or r.get('name') or r.get('title') or f"Scheme {count + 1}"
                category = r.get('schemecategory') or r.get('category') or r.get('sector') or 'General Welfare'
                description = r.get('details') or r.get('description') or r.get('overview') or ''
                benefits = r.get('benefits') or r.get('financial_aid') or r.get('benefit') or ''
                eligibility_txt = r.get('eligibility') or ''
                documents_txt = r.get('documents') or ''
                state = r.get('level') or r.get('state') or r.get('region') or 'All India'
                deadline = r.get('deadline') or r.get('last_date') or 'Active Year-round'
                app_url = r.get('application') or r.get('application_url') or r.get('url') or r.get('link') or ''
                tags_txt = r.get('tags') or ''
                
                try:
                    max_income = float(r.get('max_income') or r.get('maxincome') or r.get('income_limit') or 1000000)
                except ValueError:
                    max_income = 1000000.0

                try:
                    min_age = float(r.get('min_age') or r.get('minage') or 0)
                except ValueError:
                    min_age = 0.0

                try:
                    max_age = float(r.get('max_age') or r.get('maxage') or 100)
                except ValueError:
                    max_age = 100.0

                gender = r.get('gender') or r.get('target_gender') or 'All'
                occupation = r.get('occupation') or r.get('trade') or 'All'
                social_cat = r.get('social_category') or r.get('category_quota') or r.get('caste') or 'All'

                full_text = (
                    f"Scheme Name: {scheme_name}\n"
                    f"Category: {category}\n"
                    f"Level / State: {state}\n"
                    f"Description: {description}\n"
                    f"Benefits: {benefits}\n"
                    f"Eligibility: {eligibility_txt}\n"
                    f"Documents Required: {documents_txt}\n"
                    f"Income Limit: ₹{max_income:,.0f}\n"
                    f"Target Age: {min_age}-{max_age} years\n"
                    f"Gender: {gender} | Occupation: {occupation} | Category: {social_cat}\n"
                    f"Tags: {tags_txt}"
                )

                chunks = chunk_text(full_text, chunk_size=600, overlap=50)
                if not chunks:
                    chunks = [full_text]

                for idx, chunk in enumerate(chunks[:2]):
                    doc_id = f"{scheme_id}_chunk_{idx}"
                    embedding = generate_embedding(chunk)

                    metadata = {
                        "scheme_id": str(scheme_id),
                        "scheme_name": scheme_name[:150],
                        "category": category[:100],
                        "description": description[:300],
                        "benefits": benefits[:300],
                        "state": state[:100],
                        "deadline": deadline[:50],
                        "application_url": app_url[:200],
                        "max_income": max_income,
                        "min_age": min_age,
                        "max_age": max_age,
                        "gender": gender,
                        "occupation": occupation,
                        "social_category": social_cat
                    }

                    ids_batch.append(doc_id)
                    embeddings_batch.append(embedding)
                    docs_batch.append(chunk)
                    metas_batch.append(metadata)

                    if len(ids_batch) >= 100:
                        self.collection.upsert(
                            ids=ids_batch,
                            embeddings=embeddings_batch,
                            documents=docs_batch,
                            metadatas=metas_batch
                        )
                        ids_batch, embeddings_batch, docs_batch, metas_batch = [], [], [], []

                count += 1
                if count % 500 == 0:
                    print(f"Processed {count} schemes from CSV...")

            if ids_batch:
                self.collection.upsert(
                    ids=ids_batch,
                    embeddings=embeddings_batch,
                    documents=docs_batch,
                    metadatas=metas_batch
                )

        print(f"Successfully ingested {count} schemes from {os.path.basename(csv_filepath)}. Total ChromaDB count: {self.collection.count()}")

def run_ingestion():
    pipeline = SchemeIngestionPipeline()
    # 1. Ingest structured schemes JSON
    json_path = os.path.join(DOCUMENTS_DIR, "sample_schemes.json")
    if os.path.exists(json_path):
        pipeline.ingest_structured_json(json_path)

    # 2. Ingest CSV scheme documents in DOCUMENTS_DIR and ml_service root
    csv_files = glob.glob(os.path.join(DOCUMENTS_DIR, "*.csv")) + glob.glob(os.path.join(os.path.dirname(DOCUMENTS_DIR), "*.csv"))
    for csv_file in csv_files:
        pipeline.ingest_csv_documents(csv_file)

    # 3. Ingest any PDF scheme documents
    pipeline.ingest_pdf_documents(DOCUMENTS_DIR)

if __name__ == "__main__":
    run_ingestion()
