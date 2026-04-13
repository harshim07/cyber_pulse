import React from 'react';

export default function SettingsView() {
  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Platform Settings</h3>
      
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Machine Learning Models</h4>
        
        <div style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: '6px', marginBottom: '1rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong>Network Intrusion Detection (IDS)</strong>
            <span className="badge" style={{ background: 'var(--status-normal)', color: '#000' }}>Active</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Random Forest Model (Trained on cleaned_ids2018_sampled)</p>
        </div>

        <div style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: '6px', marginBottom: '1rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong>Phishing URL Detection</strong>
            <span className="badge" style={{ background: 'var(--status-normal)', color: '#000' }}>Active</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Random Forest Model (Trained on Phishing_dataset_predict.csv)</p>
        </div>

        <div style={{ padding: '1rem', background: 'var(--bg-app)', borderRadius: '6px', marginBottom: '1rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong>Android Malware Analysis</strong>
            <span className="badge" style={{ background: 'var(--status-normal)', color: '#000' }}>Active</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Random Forest Model (Trained on Android_Malware.csv)</p>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>Backend Connection</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Node API Endpoint:</span>
            <span style={{ fontFamily: 'monospace' }}>http://localhost:5000/api</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Socket Server:</span>
            <span style={{ color: 'var(--status-normal)' }}>Connected</span>
          </div>
        </div>
      </div>

      <button style={{ padding: '10px 20px', borderRadius: '4px', background: 'var(--status-danger)', color: 'white', border: 'none', cursor: 'pointer', width: '100%' }}>
        Restart Models / Clear Cache
      </button>
    </div>
  );
}
