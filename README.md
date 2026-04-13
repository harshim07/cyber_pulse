# CyberPulse - Real-Time Network Security Monitoring System

A comprehensive network traffic monitoring system that detects various types of cyber attacks in real-time using Scapy for packet capture and machine learning for threat classification.

## Features

### 🔍 Real-Time Packet Monitoring
- Live packet capture using Scapy
- Real-time attack detection and classification
- Automatic threat severity assessment

### 📊 Advanced Analytics Dashboard
- Attack timeline visualization (24-hour trends)
- Attack type distribution (pie charts)
- Top attacker IP addresses
- Protocol threat analysis
- Real-time statistics

### 🚨 Attack Detection
- **DDoS Attacks**: High-volume traffic patterns
- **Port Scanning**: Sequential port probing
- **Brute Force**: Repeated login attempts
- **Malware Communication**: Suspicious network patterns
- **Phishing Attempts**: HTTP-based detection
- **Normal Traffic**: Baseline classification

### 📡 Live Traffic Stream
- Real-time packet visualization
- Color-coded threat levels
- Filtering by attack type and severity
- Critical alert highlighting

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Python 3.8+
- Administrator privileges (for packet capture)

### Installation

1. **Install Backend Dependencies**
```bash
cd server
npm install
```

2. **Install Frontend Dependencies**
```bash
cd client
npm install
```

3. **Install Python Dependencies**
```bash
cd ..
pip install -r requirements.txt
```

4. **Start MongoDB**
```bash
# Make sure MongoDB is running on default port 27017
mongod
```

5. **Start the Backend Server**
```bash
cd server
npm start
```

6. **Start the Frontend**
```bash
cd client
npm start
```

7. **Start Network Monitoring**
```bash
# Run from the project root directory
python sniffer.py
```

## Usage

### Starting Network Monitoring
1. Run the network sniffer: `python network_sniffer.py`
2. Select your network interface when prompted
3. The system will begin capturing and analyzing packets in real-time

### Viewing the Dashboard
- Open your browser to `http://localhost:3000`
- Navigate to the **Dashboard** tab for analytics
- View **Live Traffic** for real-time packet analysis

### Understanding the Interface

#### Dashboard
- **Total Packets Monitored**: Overall packet count
- **Anomalies Detected**: Number of suspicious packets
- **Attack Timeline**: Hour-by-hour attack distribution
- **Attack Type Distribution**: Breakdown by attack category
- **Top Attacker IPs**: Most active threat sources
- **Protocol Threat Analysis**: Attacks by protocol type

#### Live Traffic
- **Real-time Statistics**: Total, Threats, Critical counts
- **Filters**: Filter by attack type and severity
- **Packet Stream**: Live feed with color-coded threats
- **Critical Alerts**: Highlighted high-severity threats

### Attack Classification Colors
- **🟢 Normal**: Legitimate traffic
- **🟠 Medium**: Moderate threats (Port Scan, Brute Force)
- **🔴 High**: Serious threats (DDoS, Phishing)
- **🔴 Critical**: Severe threats (Malware)

### Protocol Colors
- **🔵 TCP**: Blue
- **🟢 UDP**: Green  
- **🟠 ICMP**: Orange
- **🔴 ARP**: Red

## Security Features

### Attack Detection Algorithms
- **Pattern Recognition**: Identifies suspicious traffic patterns
- **Flow Analysis**: Monitors connection behavior
- **Protocol Anomalies**: Detects unusual protocol usage
- **Volume Analysis**: Identifies traffic spikes

### Real-Time Alerts
- **Socket.io Integration**: Instant threat notifications
- **Critical Alert System**: Immediate high-severity warnings
- **Dashboard Updates**: Real-time statistics refresh

## Data Storage

### MongoDB Schema
```javascript
{
  sourceIp: String,
  destinationIp: String,
  protocol: String,
  packetSize: Number,
  flowDuration: Number,
  classification: String, // Normal, DDoS, Brute Force, Port Scan, Phishing, Malware
  severity: String,      // Low, Medium, High, Critical
  modelSource: String,
  timestamp: Date
}
```

## API Endpoints

### Traffic Analysis
- `GET /api/traffic/stats` - Overall statistics
- `GET /api/traffic/alerts` - Recent threats
- `GET /api/traffic/trends` - Time-based trends
- `POST /api/traffic/ingest` - Ingest packet data

### Real-time Events
- `new_packet` - New packet detected
- `critical_alert` - High-severity threat

## Troubleshooting

### Common Issues

1. **Permission Denied (Packet Capture)**
   - Run with administrator privileges
   - On Linux/Mac: Use `sudo python network_sniffer.py`
   - On Windows: Run as Administrator

2. **Port 5000 Already in Use**
   - Stop conflicting services
   - Or change port in `server/index.js`

3. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in `.env` file

4. **No Packets Detected**
   - Verify network interface selection
   - Check firewall settings
   - Ensure network activity is present

### Performance Optimization
- Limit packet history to prevent memory issues
- Use database indexes for faster queries
- Monitor system resources during high traffic

## Development

### Project Structure
```
min/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Dashboard, LiveTraffic, Settings
│   │   └── components/    # Reusable components
├── server/                 # Node.js backend
│   ├── controllers/       # API logic
│   ├── models/           # MongoDB schemas
│   └── routes/           # API endpoints
├── network_sniffer.py     # Python packet capture
└── requirements.txt       # Python dependencies
```

### Customization
- Modify attack detection logic in `network_sniffer.py`
- Add new chart types in `Dashboard.jsx`
- Customize threat classification rules
- Extend API endpoints for additional features

## License

This project is for educational and research purposes. Use responsibly and in compliance with applicable laws and regulations.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Verify all dependencies are installed
3. Ensure proper network permissions
4. Review system logs for error details
