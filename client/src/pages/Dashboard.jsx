import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area, LabelList, Legend
} from 'recharts';
import Scanner from '../components/Scanner';


const COLORS = ['#ff7b72', '#f85149', '#ffa657', '#ff9400', '#bf8700'];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPackets: 0,
    anomalies: 0,
    classificationCounts: []
  });
  const [alerts, setAlerts] = useState([]);
  const [trends, setTrends] = useState([]);
  const [topAttackers, setTopAttackers] = useState([]);
  const [protocolAnalysis, setProtocolAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, alertsRes, trendsRes] = await Promise.all([
        api.get('/api/traffic/stats'),
        api.get('/api/traffic/alerts'),
        api.get('/api/traffic/trends')
      ]);

      const statsData = await statsRes.json() || {};
      const alertsData = await alertsRes.json() || [];

      setStats({
        totalPackets: statsData.totalPackets || 0,
        anomalies: statsData.anomalies || 0,
        classificationCounts: statsData.classificationCounts || []
      });

      setAlerts(alertsData);
      setTrends(await trendsRes.json() || []);

      processAttackAnalytics(alertsData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Process Analytics
  const processAttackAnalytics = (alertsData) => {
    const timeline = {};
    const attackerStats = {};
    const protocolStats = {};

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    alertsData.forEach(alert => {
      const time = new Date(alert.timestamp);
      const classification = alert.classification || 'Unknown';
      const protocol = alert.protocol || 'Unknown';
      const ip = alert.sourceIp || 'Unknown';

      // Timeline - Track attackers by hour
      if (time >= last24h && classification !== 'Normal') {
        const hour = `${time.getHours()}:00`;
        if (!timeline[hour]) {
          timeline[hour] = {
            time: hour,
            totalAttacks: 0
          };
        }
        
        // Track each attacker's activity
        const attackerKey = `${ip} (${classification})`;
        timeline[hour][attackerKey] = (timeline[hour][attackerKey] || 0) + 1;
        timeline[hour].totalAttacks++;
      }

      // Top attackers
      if (!attackerStats[ip]) {
        attackerStats[ip] = { ip, count: 0, types: {} };
      }
      attackerStats[ip].count++;
      attackerStats[ip].types[classification] = (attackerStats[ip].types[classification] || 0) + 1;

      // Protocol analysis
      if (!protocolStats[protocol]) {
        protocolStats[protocol] = {
          protocol,
          count: 0,
          threats: 0
        };
      }
      protocolStats[protocol].count++;
      if (classification !== 'Normal') {
        protocolStats[protocol].threats++;
      }
    });

    setTopAttackers(
      Object.values(attackerStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    );

    setProtocolAnalysis(Object.values(protocolStats));
  };

  // ✅ Initial Load + Socket
  useEffect(() => {
    fetchData();

    const socket = io('http://localhost:5000');

    socket.on('new_packet', (packet) => {
      const classification = packet.classification || 'Unknown';

      setStats(prev => {
        const newAnomalies = classification !== 'Normal' ? prev.anomalies + 1 : prev.anomalies;
        const newTotal = prev.totalPackets + 1;

        const counts = [...(prev.classificationCounts || [])];
        const index = counts.findIndex(c => c.name === classification);

        if (index !== -1) {
          counts[index].value++;
        } else {
          counts.push({ name: classification, value: 1 });
        }

        return {
          ...prev,
          totalPackets: newTotal,
          anomalies: newAnomalies,
          classificationCounts: counts
        };
      });

      if (classification !== 'Normal') {
        setAlerts(prev => [packet, ...prev].slice(0, 50));
      }
    });

    return () => socket.disconnect();
  }, [fetchData]);

  const safeCounts = stats.classificationCounts || [];

  const threatPercent =
    stats.totalPackets > 0
      ? ((stats.anomalies / stats.totalPackets) * 100).toFixed(1)
      : 0;

  // ✅ Loading / Error UI
  if (loading) return <div className="center">Loading dashboard...</div>;
  if (error) return <div className="center error">{error}</div>;

  return (
    <>
      {/* Stats */}
      <div className="stats-grid">
        <div className="card">
          <h3>Total Packets</h3>
          <div>{stats.totalPackets}</div>
        </div>

        <div className="card">
          <h3>Anomalies</h3>
          <div className="danger">{stats.anomalies}</div>
        </div>

        <div className="card">
          <h3>Threat %</h3>
          <div className="normal">{threatPercent}%</div>
        </div>
      </div>

      {/* Timeline + Pie */}
      <div className="charts-grid">
        <div className="card">
          <h3>Real-Time Attack Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="Normal" stroke="#7ee787" strokeWidth={2} name="Normal Traffic" />
              <Line type="monotone" dataKey="DDoS" stroke="#ff7b72" strokeWidth={2} name="DDoS Attacks" />
              <Line type="monotone" dataKey="Port Scan" stroke="#ffa657" strokeWidth={2} name="Port Scans" />
              <Line type="monotone" dataKey="Brute Force" stroke="#ff9400" strokeWidth={2} name="Brute Force" />
              <Line type="monotone" dataKey="Malware" stroke="#f85149" strokeWidth={2} name="Malware" />
              <Line type="monotone" dataKey="Phishing" stroke="#bf8700" strokeWidth={2} name="Phishing" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Attack Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={safeCounts.filter(c => c.name !== 'Normal')}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {safeCounts.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attackers + Protocol */}
      <div className="charts-grid">
        <div className="card">
          <h3>🚨 Who is Attacking Your Network?</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '15px', fontWeight: 'bold' }}>
            📍 <strong>IP Address</strong> = The computer that attacked<br/>
            📊 <strong>Bar Length</strong> = How many times they attacked<br/>
            🔴 <strong>Longer Bars</strong> = More dangerous attackers
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={topAttackers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ip" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#ff7b72" strokeWidth={2} name="Attack Count" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Protocol Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={protocolAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="protocol" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="count" fill="#58a6ff" />
              <Bar dataKey="threats" fill="#ff7b72" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="card">
        <h3>Recent Alerts</h3>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Type</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length > 0 ? (
              alerts.map((a, i) => (
                <tr key={a._id || i}>
                  <td>{new Date(a.timestamp).toLocaleString()}</td>
                  <td>{a.sourceIp}</td>
                  <td>{a.destinationIp}</td>
                  <td>{a.classification}</td>
                  <td>{a.severity}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No alerts</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Scanner />
    </>
  );
}