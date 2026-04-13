import React, { useState } from 'react';
import axios from 'axios';

const SCAN_API_BASE = 'http://localhost:5000/api/scan';

export default function Scanner() {
  const [url, setUrl] = useState('');
  const [phishingResult, setPhishingResult] = useState(null);
  const [phishingLoading, setPhishingLoading] = useState(false);

  // We mocked APK scanning here since typing out 40 permissions is annoying.
  // In a real app this would be a file upload.
  const [apkResult, setApkResult] = useState(null);
  const [apkLoading, setApkLoading] = useState(false);

  const scanUrl = async () => {
    if(!url) return;
    setPhishingLoading(true);
    setPhishingResult(null);
    try {
      const res = await axios.post(`${SCAN_API_BASE}/phishing`, { url });
      setPhishingResult(res.data.prediction);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setPhishingResult('Error scanning URL');
    }
    setPhishingLoading(false);
  };

  const scanApk = async () => {
    setApkLoading(true);
    setApkResult(null);
    try {
      // Mock some dangerous permissions data
      const permissions = {
        'android.permission.INTERNET': 1,
        'android.permission.SEND_SMS': 1,
        'android.permission.READ_CONTACTS': 1,
        'android.permission.RECEIVE_BOOT_COMPLETED': 1
      };
      const res = await axios.post(`${SCAN_API_BASE}/malware`, { permissions });
      setApkResult(res.data.prediction);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setApkResult('Error scanning APK');
    }
    setApkLoading(false);
  };

  return (
    <div className="charts-grid" style={{ marginTop: '2rem' }}>
      <div className="card">
        <h3 className="card-title">Phishing URL Scanner</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '14px' }}>
          Evaluate URLs against the trained Phishing intelligence model.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Enter URL (e.g. login.secure-update.com)" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
          />
          <button 
            onClick={scanUrl}
            disabled={phishingLoading}
            style={{ padding: '10px 20px', borderRadius: '4px', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {phishingLoading ? 'Scanning...' : 'Scan URL'}
          </button>
        </div>
        {phishingResult && (
          <div style={{ marginTop: '15px', padding: '15px', borderRadius: '6px', background: 'var(--bg-app)', borderLeft: `4px solid ${phishingResult.toLowerCase().includes('phishing') ? 'var(--status-danger)' : 'var(--status-normal)'}` }}>
            <strong>Result:</strong> {phishingResult}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">Android APK Malware Scanner</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '14px' }}>
          Evaluate App Permissions for malicious patterns (Demo).
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
           <button 
            onClick={scanApk}
            disabled={apkLoading}
            style={{ padding: '10px 20px', borderRadius: '4px', background: 'var(--accent-secondary)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {apkLoading ? 'Analyzing...' : 'Scan Sample Payload'}
          </button>
          <span style={{color: 'var(--text-muted)', fontSize: '13px'}}>Simulates extracting Manifest.xml</span>
        </div>
        {apkResult && (
          <div style={{ marginTop: '15px', padding: '15px', borderRadius: '6px', background: 'var(--bg-app)', borderLeft: `4px solid ${apkResult == 1 || apkResult === 'True' || apkResult.toLowerCase() === 'malware' ? 'var(--status-danger)' : 'var(--status-danger)'}` }}>
            <strong>Result:</strong> {apkResult == 1 ? 'Malware Detected' : 'Suspicious / Malware'}
          </div>
        )}
      </div>
    </div>
  );
}
