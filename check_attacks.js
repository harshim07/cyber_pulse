const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/traffic';

async function showCurrentAttacks() {
  try {
    console.log('🔍 Fetching current attack data from database...\n');
    
    // Get all alerts
    const alertsResponse = await axios.get(`${API_BASE}/alerts`);
    const statsResponse = await axios.get(`${API_BASE}/stats`);
    
    const alerts = alertsResponse.data;
    const stats = statsResponse.data;
    
    console.log('📊 DATABASE OVERVIEW');
    console.log('==================');
    console.log(`Total Packets: ${stats.totalPackets}`);
    console.log(`Total Attacks: ${stats.anomalies}`);
    console.log(`Suspicious IPs: ${stats.suspiciousIps.length}\n`);
    
    console.log('🎯 ATTACK BREAKDOWN BY TYPE');
    console.log('==========================');
    stats.classificationCounts.forEach(item => {
      const icon = item.name === 'Normal' ? '🟢' : '🔴';
      console.log(`${icon} ${item.name}: ${item.value} incidents`);
    });
    
    console.log('\n🚨 RECENT ATTACKS (All in Database)');
    console.log('====================================');
    
    if (alerts.length === 0) {
      console.log('No attacks detected yet. Run the network sniffer to detect real attacks!');
      return;
    }
    
    alerts.forEach((alert, index) => {
      const severityIcon = {
        'Critical': '🔴🔴',
        'High': '🔴',
        'Medium': '🟠',
        'Low': '🟡'
      }[alert.severity] || '⚪';
      
      const attackIcon = {
        'DDoS': '💥',
        'Port Scan': '🔍',
        'Brute Force': '🔓',
        'Malware': '🦠',
        'Phishing': '🎣',
        'Normal': '✅'
      }[alert.classification] || '❓';
      
      console.log(`${index + 1}. ${attackIcon} ${alert.classification} ${severityIcon}`);
      console.log(`   Severity: ${alert.severity}`);
      console.log(`   Source: ${alert.sourceIp} → Destination: ${alert.destinationIp}`);
      console.log(`   Protocol: ${alert.protocol} | Size: ${alert.packetSize}B | Duration: ${alert.flowDuration}s`);
      console.log(`   Time: ${new Date(alert.timestamp).toLocaleString()}`);
      console.log('');
    });
    
    console.log('🎯 TOP ATTACKER IPs');
    console.log('==================');
    stats.suspiciousIps.forEach((ip, index) => {
      console.log(`${index + 1}. ${ip.ip} - ${ip.incidents} incidents`);
      if (ip.attacks && ip.attacks.length > 0) {
        console.log(`   Attack types: ${ip.attacks.join(', ')}`);
      }
      console.log(`   Last seen: ${new Date(ip.lastSeen).toLocaleString()}`);
      console.log('');
    });
    
    console.log('💡 NEXT STEPS');
    console.log('=============');
    console.log('1. Open your browser to http://localhost:3000');
    console.log('2. Go to Dashboard tab to see visual analytics');
    console.log('3. Go to Live Traffic tab to see real-time stream');
    console.log('4. Run "python network_sniffer.py" to capture real attacks');
    console.log('5. All attacks are automatically stored in MongoDB!');
    
  } catch (error) {
    console.error('❌ Error fetching attack data:', error.message);
  }
}

showCurrentAttacks();
