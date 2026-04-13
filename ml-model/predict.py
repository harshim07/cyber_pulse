import sys
import json
import joblib
import pandas as pd
import numpy as np
import os
import warnings

warnings.filterwarnings('ignore', category=UserWarning)

# We will cache models if this script were kept alive, but as a one-off script, we load, predict, and exit.
# In a real heavy-load scenario, an HTTP API (like Flask) would be better.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

def load_phishing_model():
    model = joblib.load(os.path.join(MODELS_DIR, 'phishing_rf_model.pkl'))
    scaler = joblib.load(os.path.join(MODELS_DIR, 'phishing_scaler.pkl'))
    le = joblib.load(os.path.join(MODELS_DIR, 'phishing_label_encoder.pkl'))
    features = joblib.load(os.path.join(MODELS_DIR, 'phishing_features.pkl'))
    return model, scaler, le, features

def load_malware_model():
    model = joblib.load(os.path.join(MODELS_DIR, 'malware_rf_model.pkl'))
    scaler = joblib.load(os.path.join(MODELS_DIR, 'malware_scaler.pkl'))
    le = joblib.load(os.path.join(MODELS_DIR, 'malware_label_encoder.pkl'))
    features = joblib.load(os.path.join(MODELS_DIR, 'malware_features.pkl'))
    return model, scaler, le, features

def main():
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input data provided"}))
            sys.exit(1)
            
        req = json.loads(input_data)
        scan_type = req.get('type')
        data = req.get('data', {})
        
        if scan_type == 'phishing':
            model, scaler, le, features = load_phishing_model()
            # Extract features from URL or use provided dict
            # If front-end just sends URL string, we would extract features here.
            # But assuming we have raw numbers or we parse them:
            
            # Simple mock parsing if just URL is passed
            if 'url' in data:
                url = data['url']
                feats = {
                    'NumDots': url.count('.'),
                    'UrlLength': len(url),
                    'AtSymbol': 1 if '@' in url else 0,
                    'NumDash': url.count('-'),
                    'NumPercent': url.count('%'),
                    'NumQueryComponents': url.count('&') if '?' in url else 0,
                    'IpAddress': 0, # simplified
                    'HttpsInHostname': 1 if 'https' in url.split('/')[0] else 0,
                    'PathLevel': url.count('/'),
                    'PathLength': len(url.split('/', 3)[-1]) if '/' in url else 0,
                    'NumNumericChars': sum(c.isdigit() for c in url)
                }
            else:
                feats = data
                
            input_df = pd.DataFrame([feats])
            # Ensure all features exist
            for col in features:
                if col not in input_df.columns:
                    input_df[col] = 0
            input_df = input_df[features]
            
            X_scaled = scaler.transform(input_df)
            pred = model.predict(X_scaled)
            result = le.inverse_transform(pred)[0]
            
            print(json.dumps({"type": "phishing", "prediction": str(result), "status": "success"}))
            
        elif scan_type == 'malware':
            model, scaler, le, features = load_malware_model()
            # Features are permissions. Form a vector of 1s and 0s
            input_df = pd.DataFrame([data])
            for col in features:
                if col not in input_df.columns:
                    input_df[col] = 0
            input_df = input_df[features]
            
            X_scaled = scaler.transform(input_df)
            pred = model.predict(X_scaled)
            result = le.inverse_transform(pred)[0]
            
            print(json.dumps({"type": "malware", "prediction": str(result), "status": "success"}))
            
        else:
            print(json.dumps({"error": f"Unknown scan type: {scan_type}"}))
            
    except Exception as e:
        print(json.dumps({"error": str(e), "status": "failed"}))

if __name__ == "__main__":
    main()
