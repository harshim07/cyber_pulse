import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

# Define file paths
IDS_PATH = "datasets/cleaned_ids2018_sampled.csv"
PHISHING_PATH = "datasets/Phising_dataset_predict.csv"
MALWARE_PATH = "datasets/Android_Malware.csv"
MODELS_DIR = "models"

os.makedirs(MODELS_DIR, exist_ok=True)

def train_ids_model():
    print(f"\n--- Training Network IDS Model ---")
    if not os.path.exists(IDS_PATH):
        print(f"File {IDS_PATH} not found.")
        return

    print("Loading IDS data (sampling to speed up training if necessary)...")
    # Using sample or just loading 100k for speed
    try:
        df = pd.read_csv(IDS_PATH, low_memory=False, on_bad_lines='skip')
        if len(df) > 100000:
            df = df.sample(n=100000, random_state=42)
    except Exception as e:
        print(f"Error loading IDS data: {e}")
        return

    # Clean data (drop unnamed or irrelevant)
    df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
    
    # We'll use a subset of features that are easy to extract via scapy
    features_to_use = [
        'Protocol', 'Flow Duration', 'Tot Fwd Pkts', 'Tot Bwd Pkts',
        'TotLen Fwd Pkts', 'TotLen Bwd Pkts', 'Fwd Pkt Len Mean', 'Bwd Pkt Len Mean'
    ]
    
    # Ensure they exist
    features_to_use = [f for f in features_to_use if f in df.columns]
    
    # Check if target 'Label' exists
    if 'Label' not in df.columns:
        print("Target column 'Label' not found in IDS dataset.")
        return

    # Filter columns to only what we need + Label
    df = df[features_to_use + ['Label']].dropna()

    X = df[features_to_use]
    y = df['Label']

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_encoded, test_size=0.2, random_state=42)
    
    rf = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    
    preds = rf.predict(X_test)
    print(f"IDS Accuracy: {accuracy_score(y_test, preds):.4f}")
    
    joblib.dump(rf, os.path.join(MODELS_DIR, 'ids_rf_model.pkl'))
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'ids_scaler.pkl'))
    joblib.dump(le, os.path.join(MODELS_DIR, 'ids_label_encoder.pkl'))
    
    # Save the feature names we trained on so the sniffer knows what to extract
    joblib.dump(features_to_use, os.path.join(MODELS_DIR, 'ids_features.pkl'))
    print("Saved IDS Model successfully.")

def train_phishing_model():
    print(f"\n--- Training Phishing Model ---")
    if not os.path.exists(PHISHING_PATH):
        print(f"File {PHISHING_PATH} not found.")
        return

    df = pd.read_csv(PHISHING_PATH)
    df = df.loc[:, ~df.columns.str.contains('^Unnamed')]

    # Assuming 'Phising' or 'Label' is the target column
    target_col = 'Label' if 'Label' in df.columns else 'Phising'
    if target_col not in df.columns:
        print(f"Target column meaning Phishing not found. Columns: {df.columns.tolist()}")
        return

    df = df.dropna()
    X = df.drop(columns=[target_col])
    y = df[target_col]

    le = LabelEncoder()
    # In case the labels are already numeric, let's cast them to string if not
    y_encoded = le.fit_transform(y.astype(str))
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_encoded, test_size=0.2, random_state=42)
    
    rf = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    
    preds = rf.predict(X_test)
    print(f"Phishing Accuracy: {accuracy_score(y_test, preds):.4f}")
    
    joblib.dump(rf, os.path.join(MODELS_DIR, 'phishing_rf_model.pkl'))
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'phishing_scaler.pkl'))
    joblib.dump(le, os.path.join(MODELS_DIR, 'phishing_label_encoder.pkl'))
    joblib.dump(list(X.columns), os.path.join(MODELS_DIR, 'phishing_features.pkl'))
    print("Saved Phishing Model successfully.")

def train_malware_model():
    print(f"\n--- Training Android Malware Model ---")
    if not os.path.exists(MALWARE_PATH):
        print(f"File {MALWARE_PATH} not found.")
        return

    # Malware dataset has permission features. Separator might be comma
    df = pd.read_csv(MALWARE_PATH)
    df = df.loc[:, ~df.columns.str.contains('^Unnamed')]

    target_col = 'Result' if 'Result' in df.columns else 'Label'
    if target_col not in df.columns:
        print(f"Target column not found. Columns: {df.columns.tolist()[:10]}")
        return

    # Sample if necessary
    if len(df) > 50000:
        df = df.sample(n=50000, random_state=42)

    df = df.dropna()
    X = df.drop(columns=[target_col])
    y = df[target_col]

    le = LabelEncoder()
    y_encoded = le.fit_transform(y.astype(str))
    
    # We might not even need a scaler for binary permission data, but won't hurt
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_encoded, test_size=0.2, random_state=42)
    
    rf = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    
    preds = rf.predict(X_test)
    print(f"Malware Accuracy: {accuracy_score(y_test, preds):.4f}")
    
    joblib.dump(rf, os.path.join(MODELS_DIR, 'malware_rf_model.pkl'))
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'malware_scaler.pkl'))
    joblib.dump(le, os.path.join(MODELS_DIR, 'malware_label_encoder.pkl'))
    joblib.dump(list(X.columns), os.path.join(MODELS_DIR, 'malware_features.pkl'))
    print("Saved Malware Model successfully.")

if __name__ == '__main__':
    print("Starting Training Process...")
    train_ids_model()
    train_phishing_model()
    train_malware_model()
    print("\n--- All Done! ---")
