import pandas as pd
import json

datasets = {
    'malware': 'datasets/Android_Malware.csv',
    'phishing': 'datasets/Phising_dataset_predict.csv',
    'ids': 'datasets/cleaned_ids2018_sampled.csv'
}

cols = {}
for name, path in datasets.items():
    try:
        # For malware, separator might be different or it might have a lot of cols. Let's just read and dump
        df = pd.read_csv(path, nrows=0)
        cols[name] = list(df.columns)
    except Exception as e:
        cols[name] = str(e)

with open('columns.json', 'w') as f:
    json.dump(cols, f, indent=2)
