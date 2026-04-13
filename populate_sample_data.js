const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/traffic';

// Sample attack data for testing
const sampleAttacks = [
  {
    sourceIp: '192.168.1.100',
    destinationIp: '192.168.1.1',
    protocol: 'TCP',
    packetSize: 1500,
    flowDuration: 0.1,
    classification: 'DDoS',
    severity: 'High'
  },
  {
    sourceIp: '10.0.0.50',
    destinationIp: '10.0.0.1',
    protocol: 'TCP',
    packetSize: 64,
    flowDuration: 2.5,
    classification: 'Port Scan',
    severity: 'Medium'
  },
  {
    sourceIp: '172.16.0.25',
    destinationIp: '172.16.0.10',
    protocol: 'TCP',
    packetSize: 512,
    flowDuration: 5.0,
    classification: 'Brute Force',
    severity: 'Medium'
  },
  {
    sourceIp: '203.0.113.45',
    destinationIp: '192.168.1.100',
    protocol: 'UDP',
    packetSize: 800,
    flowDuration: 0.3,
    classification: 'Malware',
    severity: 'Critical'
  },
  {
    sourceIp: '198.51.100.22',
    destinationIp: '192.168.1.50',
    protocol: 'TCP',
    packetSize: 1200,
    flowDuration: 1.2,
    classification: 'Phishing',
    severity: 'High'
  },
  {
    sourceIp: '192.168.1.200',
    destinationIp: '8.8.8.8',
    protocol: 'UDP',
    packetSize: 256,
    flowDuration: 0.05,
    classification: 'Normal',
    severity: 'Low'
  },
  {
    sourceIp: '10.1.1.100',
    destinationIp: '10.1.1.1',
    protocol: 'ICMP',
    packetSize: 128,
    flowDuration: 0.02,
    classification: 'Normal',
    severity: 'Low'
  },
  {
    sourceIp: '192.168.2.50',
    destinationIp: '192.168.1.1',
    protocol: 'TCP',
    packetSize: 2000,
    flowDuration: 0.08,
    classification: 'DDoS',
    severity: 'High'
  },
  {
    sourceIp: '172.20.0.30',
    destinationIp: '172.20.0.5',
    protocol: 'TCP',
    packetSize: 96,
    flowDuration: 3.2,
    classification: 'Port Scan',
    severity: 'Medium'
  },
  {
    sourceIp: '203.0.113.67',
    destinationIp: '192.168.1.200',
    protocol: 'TCP',
    packetSize: 768,
    flowDuration: 4.1,
    classification: 'Brute Force',
    severity: 'Medium'
  }
];

async function populateSampleData() {
  console.log('🌍 Populating database with sample attack data...');
  
  try {
    for (let i = 0; i < sampleAttacks.length; i++) {
      const attack = sampleAttacks[i];
      
      // Add timestamp with some variation
      const timestamp = new Date(Date.now() - (i * 3600000)); // Each attack 1 hour apart
      attack.timestamp = timestamp.toISOString();
      
      const response = await axios.post(`${API_BASE}/ingest`, attack);
      
      if (response.status === 201) {
        console.log(`✅ Added: ${attack.classification} from ${attack.sourceIp}`);
      } else {
        console.log(`❌ Failed to add: ${attack.classification}`);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('🎉 Sample data population complete!');
    
    // Verify the data was added
    const statsResponse = await axios.get(`${API_BASE}/stats`);
    const alertsResponse = await axios.get(`${API_BASE}/alerts`);
    
    console.log('\n📊 Current Database Stats:');
    console.log(`Total Packets: ${statsResponse.data.totalPackets}`);
    console.log(`Anomalies: ${statsResponse.data.anomalies}`);
    console.log(`Classification Counts:`, statsResponse.data.classificationCounts);
    console.log(`Suspicious IPs:`, statsResponse.data.suspiciousIps.length);
    
    console.log('\n🚨 Recent Alerts:');
    alertsResponse.data.slice(0, 5).forEach((alert, index) => {
      console.log(`${index + 1}. ${alert.classification} (${alert.severity}) - ${alert.sourceIp} -> ${alert.destinationIp}`);
    });
    
  } catch (error) {
    console.error('❌ Error populating data:', error.message);
  }
}

// Run the population script
populateSampleData();
