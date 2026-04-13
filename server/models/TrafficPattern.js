const mongoose = require('mongoose');

const trafficPatternSchema = new mongoose.Schema({
  sourceIp: { type: String, required: true },
  destinationIp: { type: String, required: true },
  protocol: { type: String, required: true },
  packetSize: { type: Number, required: true },
  flowDuration: { type: Number, required: true },
  classification: { 
    type: String, 
    enum: ['Normal', 'DDoS', 'Brute Force', 'Port Scan', 'Phishing', 'Malware'], 
    default: 'Normal' 
  },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
  modelSource: { type: String, default: 'Ensemble' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TrafficPattern', trafficPatternSchema);
