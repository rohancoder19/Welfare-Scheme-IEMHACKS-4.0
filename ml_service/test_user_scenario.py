import urllib.request
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

url = 'http://localhost:5000/api/schemes/recommend'
payload = {
    'userProfile': {
        'income': 240000,
        'age': 15,
        'gender': 'Female',
        'occupation': 'Student',
        'category': 'General',
        'education': 'High School',
        'state': 'West Bengal'
    }
}

req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode('utf-8'))
    print(f"\nUser Profile Tested: General Category Female Student in West Bengal (Income ₹2.4L, Age 15)")
    print(f"Total Recommendations Returned: {len(data.get('recommendations', []))}\n")
    
    for idx, s in enumerate(data.get('recommendations', []), 1):
        name = s['schemeName']
        status = s['eligibilityStatus']
        is_eligible = s['isEligible']
        match = s['matchPercentage']
        unmatched = s.get('unmatchedReasons', [])
        matched = s.get('matchedReasons', [])
        
        print(f"Rank {idx}: {name}")
        print(f"   - Status: {status} (isEligible: {is_eligible}) | Match: {match}%")
        if matched:
            print(f"   - Matched Reasons: {matched}")
        if unmatched:
            print(f"   - Unmatched Reasons: {unmatched}")
        print()
