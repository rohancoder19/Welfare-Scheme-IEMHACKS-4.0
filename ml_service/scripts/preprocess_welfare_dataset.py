import os
import sys
import csv
import json
import re

# List of all Indian States and Union Territories for state extraction
INDIAN_STATES_UTS = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh",
    "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"
]

STATE_SYNONYMS = {
    "wb": "West Bengal",
    "mp": "Madhya Pradesh",
    "up": "Uttar Pradesh",
    "mh": "Maharashtra",
    "tn": "Tamil Nadu",
    "ap": "Andhra Pradesh",
    "ts": "Telangana",
    "kl": "Kerala",
    "ka": "Karnataka",
    "gj": "Gujarat",
    "rj": "Rajasthan",
    "pb": "Punjab",
    "hr": "Haryana",
    "orissa": "Odisha",
    "pondicherry": "Puducherry",
    "daman": "Dadra and Nagar Haveli and Daman and Diu",
    "diu": "Dadra and Nagar Haveli and Daman and Diu"
}

def extract_state(name: str, level: str, details: str, eligibility: str, tags: str) -> tuple:
    """
    Extract state and government level using priority order:
    1. Explicit state in scheme name
    2. Explicit state in level
    3. Explicit state in details / eligibility / tags
    """
    combined_text = f"{name} {level} {details} {eligibility} {tags}".strip()
    combined_lower = combined_text.lower()

    # Determine Government Level
    if "central" in level.lower() or "national" in level.lower() or "pm " in name.lower() or "pradhan mantri" in name.lower():
        gov_level = "Central"
    elif any(s.lower() in combined_lower for s in INDIAN_STATES_UTS):
        gov_level = "State"
    else:
        gov_level = "State" if ("state" in level.lower() or "dept" in level.lower()) else "Central"

    # Search for matching state
    for state in INDIAN_STATES_UTS:
        pattern = r'\b' + re.escape(state.lower()) + r'\b'
        if re.search(pattern, combined_lower):
            if gov_level == "Central" and "central" in level.lower() and state.lower() not in name.lower():
                return "All India", "Central", 0.95
            return state, "State", 0.95

    # Check synonyms
    for syn, full_state in STATE_SYNONYMS.items():
        pattern = r'\b' + re.escape(syn) + r'\b'
        if re.search(pattern, combined_lower):
            return full_state, "State", 0.90

    if gov_level == "Central":
        return "All India", "Central", 0.90
    return "Unknown", gov_level, 0.50

def extract_eligibility_criteria(elig_text: str, details_text: str) -> dict:
    """
    Extract structured eligibility constraints from natural language text.
    """
    text = f"{elig_text} {details_text}".strip()
    text_lower = text.lower()

    # 1. Age extraction
    min_age, max_age = None, None
    age_match = re.search(r'(?:age|aged)\s*(?:between)?\s*(\d{1,2})\s*(?:to|-|and)\s*(\d{1,2})', text_lower)
    if age_match:
        min_age, max_age = float(age_match.group(1)), float(age_match.group(2))
    else:
        min_match = re.search(r'(?:minimum age|above|at least|from)\s*(\d{1,2})\s*years', text_lower)
        if min_match:
            min_age = float(min_match.group(1))
        max_match = re.search(r'(?:maximum age|below|up to|not exceeding)\s*(\d{1,2})\s*years', text_lower)
        if max_match:
            max_age = float(max_match.group(1))

    # 2. Income extraction
    max_income = None
    income_lakh_match = re.search(r'(?:income|earning)\s*(?:below|up to|less than|not exceed|under)?\s*₹?\s*(\d+(?:\.\d+)?)\s*lakh', text_lower)
    if income_lakh_match:
        max_income = float(income_lakh_match.group(1)) * 100000.0
    else:
        income_num_match = re.search(r'(?:income|earning)\s*(?:below|up to|less than|not exceed|under)?\s*₹?\s*(\d{1,3}(?:,\d{3})+|\d{5,7})', text_lower)
        if income_num_match:
            try:
                max_income = float(income_num_match.group(1).replace(',', ''))
            except ValueError:
                pass

    # 3. Gender extraction
    gender = "Unknown"
    is_female = any(w in text_lower for w in ["girl", "female", "women", "woman", "daughter", "mother", "widow"])
    is_male = any(w in text_lower for w in ["boy", "male", "men", "man", "son", "father"])

    if is_female and not is_male:
        gender = "Female"
    elif is_male and not is_female:
        gender = "Male"
    elif is_female and is_male:
        gender = "All"
    elif "all gender" in text_lower or "both male and female" in text_lower:
        gender = "All"

    # 4. Student extraction
    is_student = None
    student_words = ["student", "students", "school student", "college student", "scholarship", "studying", "class 1", "class 10", "class 12"]
    if any(w in text_lower for w in student_words):
        is_student = True

    # 5. Occupation extraction
    occupation = "All"
    occ_map = {
        "farmer": ["farmer", "agriculture", "cultivator", "kisan"],
        "fisherman": ["fisherman", "fisherwoman", "fisheries"],
        "artisan": ["artisan", "craftsman", "craftsperson", "handicraft", "weaver"],
        "labourer": ["labourer", "construction worker", "unorganized worker"],
        "unemployed": ["unemployed", "youth"],
        "self-employed": ["self-employed", "street vendor", "entrepreneur", "small business"],
        "student": ["student", "scholar"]
    }
    found_occs = []
    for std_occ, keywords in occ_map.items():
        if any(kw in text_lower for kw in keywords):
            found_occs.append(std_occ.capitalize())
    if found_occs:
        occupation = ", ".join(found_occs)

    # 6. Social Category extraction
    categories = []
    if "sc" in text_lower or "scheduled caste" in text_lower:
        categories.append("SC")
    if "st" in text_lower or "scheduled tribe" in text_lower:
        categories.append("ST")
    if "obc" in text_lower or "other backward" in text_lower:
        categories.append("OBC")
    if "ews" in text_lower or "economically weaker" in text_lower:
        categories.append("EWS")
    if "minority" in text_lower:
        categories.append("Minority")
    if "general" in text_lower:
        categories.append("General")

    if not categories:
        categories = ["All"]

    # 7. Additional conditions
    additional_conditions = []
    if "resident of" in text_lower or "domicile" in text_lower:
        additional_conditions.append("State residence / domicile required")
    if "disability" in text_lower or "pwd" in text_lower or "handicapped" in text_lower:
        additional_conditions.append("Disability / PwD certificate required")
    if "bpl" in text_lower or "below poverty line" in text_lower or "ration card" in text_lower:
        additional_conditions.append("BPL / Ration card required")

    return {
        "minAge": min_age,
        "maxAge": max_age,
        "maxIncome": max_income,
        "gender": gender,
        "student": is_student,
        "occupation": occupation,
        "category": categories,
        "additionalConditions": additional_conditions
    }

def process_csv_dataset(input_csv_path: str, output_json_path: str):
    """
    Parse raw updated_data.csv, normalize schema, extract structured eligibility rules,
    and output clean processed JSON for MongoDB and ML eligibility engine.
    """
    if not os.path.exists(input_csv_path):
        print(f"Input CSV not found at: {input_csv_path}")
        return

    print(f"Starting NLP Preprocessing on {os.path.basename(input_csv_path)}...")
    schemes_output = []
    stats = {
        "total_rows": 0,
        "central_schemes": 0,
        "state_schemes": 0,
        "known_state": 0,
        "unknown_state": 0,
        "states_breakdown": {},
        "age_extracted": 0,
        "income_extracted": 0,
        "gender_extracted": 0,
        "student_extracted": 0,
        "occupation_extracted": 0,
        "category_extracted": 0,
        "needs_review": 0
    }

    with open(input_csv_path, mode='r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader):
            stats["total_rows"] += 1
            # Clean fields, ignore Unnamed: 9
            r = {k.strip(): (v.strip() if v else '') for k, v in row.items() if k and k != "Unnamed: 9"}
            
            scheme_name = r.get("scheme_name", f"Welfare Scheme {idx + 1}")
            slug = r.get("slug") or f"scheme_{idx + 1}"
            details = r.get("details", "")
            benefits = r.get("benefits", "")
            eligibility_text = r.get("eligibility", "")
            application = r.get("application", "")
            documents = r.get("documents", "")
            raw_level = r.get("level", "")
            scheme_category = r.get("schemeCategory", "General Welfare")
            tags_str = r.get("tags", "")
            tags = [t.strip() for t in tags_str.split(",") if t.strip()]

            # Extract State & Government Level
            state, gov_level, state_conf = extract_state(scheme_name, raw_level, details, eligibility_text, tags_str)
            
            if gov_level == "Central":
                stats["central_schemes"] += 1
            else:
                stats["state_schemes"] += 1

            if state != "Unknown":
                stats["known_state"] += 1
                stats["states_breakdown"][state] = stats["states_breakdown"].get(state, 0) + 1
            else:
                stats["unknown_state"] += 1

            # Extract Eligibility Criteria
            crit = extract_eligibility_criteria(eligibility_text, details)

            if crit["minAge"] is not None or crit["maxAge"] is not None:
                stats["age_extracted"] += 1
            if crit["maxIncome"] is not None:
                stats["income_extracted"] += 1
            if crit["gender"] != "Unknown":
                stats["gender_extracted"] += 1
            if crit["student"] is not None:
                stats["student_extracted"] += 1
            if crit["occupation"] != "All":
                stats["occupation_extracted"] += 1
            if crit["category"] != ["All"]:
                stats["category_extracted"] += 1

            needs_review = (state == "Unknown" and gov_level == "State") or (crit["gender"] == "Unknown")

            if needs_review:
                stats["needs_review"] += 1

            doc_record = {
                "schemeName": scheme_name,
                "slug": slug,
                "details": details,
                "benefits": benefits,
                "eligibilityText": eligibility_text,
                "application": application,
                "documents": documents,
                "governmentLevel": gov_level,
                "state": state,
                "schemeCategory": scheme_category,
                "tags": tags,
                "eligibilityCriteria": crit,
                "extractionMetadata": {
                    "stateConfidence": state_conf,
                    "eligibilityConfidence": 0.90 if not needs_review else 0.60,
                    "sourceFields": ["eligibility", "details", "level"],
                    "needsReview": needs_review
                }
            }

            schemes_output.append(doc_record)

    # Save processed dataset to JSON
    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(schemes_output, f, indent=2, ensure_ascii=False)

    print(f"Saved {len(schemes_output)} processed schemes to {output_json_path}\n")

    # Print Dataset Audit Report
    print("=" * 60)
    print("           WELFARE SCHEME DATASET AUDIT REPORT           ")
    print("=" * 60)
    print(f"Total CSV Rows Processed   : {stats['total_rows']}")
    print(f"Central Government Schemes : {stats['central_schemes']}")
    print(f"State Government Schemes   : {stats['state_schemes']}")
    print(f"Known States / UTs         : {stats['known_state']}")
    print(f"Unknown States             : {stats['unknown_state']}")
    print(f"Age Rules Extracted        : {stats['age_extracted']}")
    print(f"Income Rules Extracted     : {stats['income_extracted']}")
    print(f"Gender Rules Extracted     : {stats['gender_extracted']}")
    print(f"Student Rules Extracted    : {stats['student_extracted']}")
    print(f"Occupation Rules Extracted : {stats['occupation_extracted']}")
    print(f"Category Quota Extracted   : {stats['category_extracted']}")
    print(f"Records Marked Needs Review: {stats['needs_review']}")
    print("-" * 60)
    print("Top State Distribution:")
    sorted_states = sorted(stats['states_breakdown'].items(), key=lambda x: x[1], reverse=True)[:10]
    for st_name, count in sorted_states:
        print(f"  - {st_name:<28}: {count} schemes")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    ml_dir = os.path.dirname(os.path.dirname(__file__))
    input_csv = os.path.join(ml_dir, "updated_data.csv")
    output_json = os.path.join(ml_dir, "data", "processed_welfare_schemes.json")
    process_csv_dataset(input_csv, output_json)
