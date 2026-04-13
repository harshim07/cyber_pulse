import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

export default function LiveTraffic() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ classification: 'all', severity: 'all' });
  const [stats, setStats] = useState({ total: 0, threats: 0, critical: 0 });
  const logsEndRef = useRef(null);

  // Test function to simulate attack packets
  const simulateAttack = () => {
    const testPackets = [
      {
        sourceIp: '192.168.1.100',
        destinationIp: '10.0.0.1',
        protocol: 'TCP',
        packetSize: 1024,
        flowDuration: 1500,
        classification: 'DDoS',
        severity: 'High',
        timestamp: new Date(),
        modelSource: 'Test'
      },
      {
        sourceIp: '10.0.0.50',
        destinationIp: '192.168.1.1',
        protocol: 'UDP',
        packetSize: 512,
        flowDuration: 800,
        classification: 'Port Scan',
        severity: 'Medium',
        timestamp: new Date(),
        modelSource: 'Test'
      },
      {
        sourceIp: '172.16.0.1',
        destinationIp: '10.0.0.2',
        protocol: 'TCP',
        packetSize: 2048,
        flowDuration: 2000,
        classification: 'Brute Force',
        severity: 'High',
        timestamp: new Date(),
        modelSource: 'Test'
      }
    ];
    
    testPackets.forEach((packet, index) => {
      setTimeout(() => {
        socket.emit('new_packet', packet);
      }, index * 1000); // Send each packet 1 second apart
    });
  };

  useEffect(() => {
    socket.on('new_packet', (packet) => {
      setLogs((prev) => {
        const newLogs = [packet, ...prev];
        // Keep last 1000 logs to prevent memory leaks in browser
        return newLogs.slice(0, 1000);
      });
      
      // Update stats
      setLogs(prevLogs => {
        const total = prevLogs.length + 1;
        const threats = prevLogs.filter(log => log.classification !== 'Normal').length + (packet.classification !== 'Normal' ? 1 : 0);
        const critical = prevLogs.filter(log => log.severity === 'Critical').length + (packet.severity === 'Critical' ? 1 : 0);
        setStats({ total, threats, critical });
        return prevLogs;
      });
    });

    socket.on('critical_alert', (packet) => {
      // Handle critical alerts with special notification
      console.warn('🚨 CRITICAL ALERT:', packet);
    });

    return () => {
      socket.off('new_packet');
      socket.off('critical_alert');
    };
  }, [filters]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return '#ff7b72';
      case 'High': return '#f85149';
      case 'Medium': return '#ffa657';
      case 'Low': return '#7ee787';
      default: return '#8b949e';
    }
  };

  const getClassificationColor = (classification) => {
    switch (classification) {
      case 'DDoS': return '#ff7b72';
      case 'Port Scan': return '#ffa657';
      case 'Brute Force': return '#ff9400';
      case 'Malware': return '#f85149';
      case 'Phishing': return '#bf8700';
      case 'Normal': return '#7ee787';
      default: return '#8b949e';
    }
  };

  const getProtocolColor = (protocol) => {
    switch (protocol) {
      case 'TCP': return '#58a6ff';
      case 'UDP': return '#7ee787';
      case 'ICMP': return '#ffa657';
      case 'ARP': return '#f85149';
      default: return '#8b949e';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filters.classification !== 'all' && log.classification !== filters.classification) return false;
    if (filters.severity !== 'all' && log.severity !== filters.severity) return false;
    return true;
  });

  return (
    <div className="card" style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 className="card-title" style={{ margin: 0 }}>Real-Time Packet Stream</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0.25rem 0' }}>
            Live interception data categorized by the IDS machine learning model.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#58a6ff' }}>{stats.total}</div>
            <div style={{ fontSize: '12px', color: '#8b949e' }}>Total</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffa657' }}>{stats.threats}</div>
            <div style={{ fontSize: '12px', color: '#8b949e' }}>Threats</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff7b72' }}>{stats.critical}</div>
            <div style={{ fontSize: '12px', color: '#8b949e' }}>Critical</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#0d1117', borderRadius: '6px' }}>
        <select 
          value={filters.classification} 
          onChange={(e) => setFilters(prev => ({ ...prev, classification: e.target.value }))}
          style={{ padding: '0.25rem 0.5rem', backgroundColor: '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '4px' }}
        >
          <option value="all">All Types</option>
          <option value="Normal">Normal</option>
          <option value="DDoS">DDoS</option>
          <option value="Port Scan">Port Scan</option>
          <option value="Brute Force">Brute Force</option>
          <option value="Malware">Malware</option>
          <option value="Phishing">Phishing</option>
        </select>
        <select 
          value={filters.severity} 
          onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
          style={{ padding: '0.25rem 0.5rem', backgroundColor: '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '4px' }}
        >
          <option value="all">All Severities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
        <button 
          onClick={() => setFilters({ classification: 'all', severity: 'all' })}
          style={{ padding: '0.25rem 0.5rem', backgroundColor: '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' }}
        >
          Clear Filters
        </button>
        <button 
          onClick={() => simulateAttack()}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#ff7b72', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          🚨 Simulate Attack Data
        </button>
      </div>

      <div style={{ flex: 1, backgroundColor: '#0d1117', borderRadius: '6px', padding: '1rem', overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            {logs.length === 0 ? 'Waiting for packets... Ensure sniffer.py is running.' : 'No packets match current filters.'}
          </div>
        ) : (
          filteredLogs.map((log, i) => {
            const isAlert = log.classification !== 'Normal' && log.classification !== 'Benign';
            const isCritical = log.severity === 'Critical';
            
            return (
              <div 
                key={i} 
                style={{ 
                  borderBottom: '1px solid #30363d', 
                  padding: '6px 0', 
                  display: 'flex', 
                  gap: '12px',
                  alignItems: 'center',
                  backgroundColor: isCritical ? 'rgba(248, 81, 73, 0.1)' : 'transparent',
                  borderLeft: isCritical ? '3px solid #f85149' : 'none',
                  paddingLeft: isCritical ? '6px' : '0'
                }}
              >
                <span style={{ color: '#8b949e', whiteSpace: 'nowrap', fontSize: '11px' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span style={{ color: getProtocolColor(log.protocol), minWidth: '50px', fontSize: '11px', fontWeight: 'bold' }}>
                  {log.protocol}
                </span>
                <span style={{ color: '#58a6ff', minWidth: '120px', fontSize: '11px' }}>{log.sourceIp}</span>
                <span style={{ color: '#8b949e' }}>{'->'}</span>
                <span style={{ color: '#7ee787', minWidth: '120px', fontSize: '11px' }}>{log.destinationIp}</span>
                <span style={{ color: '#d2a8ff', minWidth: '60px', fontSize: '11px' }}>{log.packetSize}B</span>
                <span 
                  style={{ 
                    color: getClassificationColor(log.classification), 
                    fontWeight: isAlert ? 'bold' : 'normal', 
                    minWidth: '90px',
                    fontSize: '11px',
                    textAlign: 'center',
                    padding: '2px 6px',
                    backgroundColor: isAlert ? `${getClassificationColor(log.classification)}20` : 'transparent',
                    borderRadius: '3px'
                  }}
                >
                  {log.classification}
                </span>
                <span 
                  style={{ 
                    color: getSeverityColor(log.severity), 
                    fontWeight: 'bold',
                    fontSize: '10px',
                    padding: '2px 6px',
                    backgroundColor: `${getSeverityColor(log.severity)}20`,
                    borderRadius: '3px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}
                >
                  {log.severity}
                </span>
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
