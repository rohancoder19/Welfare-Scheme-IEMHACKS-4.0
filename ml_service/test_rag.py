import os
import sys

import site
sys.path.insert(0, site.getusersitepackages())
sys.path.append(os.path.dirname(__file__))

from rag.rag_engine import rag_engine

def test_rag_recommendations():
    test_profiles = [
        {
            "name": "Low Income Female Farmer in MP",
            "profile": {
                "income": 120000,
                "age": 35,
                "gender": "Female",
                "occupation": "Farmer",
                "category": "OBC",
                "education": "High School",
                "state": "Madhya Pradesh"
            }
        },
        {
            "name": "Student applying for Scholarship",
            "profile": {
                "income": 180000,
                "age": 20,
                "gender": "Male",
                "occupation": "Student",
                "category": "SC",
                "education": "Undergraduate",
                "state": "Maharashtra"
            }
        },
        {
            "name": "General Female Student in West Bengal (User Screenshot Scenario)",
            "profile": {
                "income": 240000,
                "age": 15,
                "gender": "Female",
                "occupation": "Student",
                "category": "General",
                "education": "High School",
                "state": "West Bengal"
            }
        },
        {
            "name": "High Income Corporate Employee",
            "profile": {
                "income": 2500000,
                "age": 40,
                "gender": "Male",
                "occupation": "General",
                "category": "General",
                "education": "Post-Graduate",
                "state": "Delhi"
            }
        }
    ]

    for test in test_profiles:
        print(f"\n==========================================")
        print(f"Testing Profile: {test['name']}")
        print(f"Profile Data: {test['profile']}")
        print(f"==========================================")
        
        results = rag_engine.recommend(test['profile'])
        print(f"Retrieved & Ranked Schemes Count: {len(results)}\n")
        
        for idx, scheme in enumerate(results[:4], 1):
            print(f"Rank {idx}: {scheme['schemeName']} ({scheme['category']})")
            print(f"   - Match Percentage: {scheme['matchPercentage']}%")
            print(f"   - Status: {scheme['eligibilityStatus']} (IsEligible: {scheme['isEligible']})")
            print(f"   - Benefits: {scheme['benefits']}")
            print(f"   - Matched Reasons: {scheme['matchedReasons']}")
            print(f"   - Unmatched Reasons: {scheme['unmatchedReasons']}\n")

if __name__ == "__main__":
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    test_rag_recommendations()
