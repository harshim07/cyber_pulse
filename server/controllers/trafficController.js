const TrafficPattern = require('../models/TrafficPattern');

// Get overall stats for the dashboard
exports.getStats = async (req, res) => {
  try {
    const totalPackets = await TrafficPattern.countDocuments();
    const anomalies = await TrafficPattern.countDocuments({ classification: { $ne: 'Normal' } });
    
    // Group by classification with enhanced analytics
    const classificationCounts = await TrafficPattern.aggregate([
      { $group: { _id: '$classification', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Format for frontend Recharts
    const formattedCounts = classificationCounts.map(item => ({
      name: item._id,
      value: item.count
    }));

    // Find top suspicious IPs with attack details
    const suspiciousIps = await TrafficPattern.aggregate([
      { $match: { classification: { $ne: 'Normal' } } },
      { 
        $group: {
          _id: '$sourceIp',
          count: { $sum: 1 },
          attacks: { $addToSet: '$classification' },
          severity: { $max: '$severity' },
          lastSeen: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get attack patterns by time
    const attackPatterns = await TrafficPattern.aggregate([
      { $match: { classification: { $ne: 'Normal' } } },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            classification: '$classification'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.hour': 1 } }
    ]);

    res.json({
      totalPackets,
      anomalies,
      classificationCounts: formattedCounts,
      suspiciousIps: suspiciousIps.map(item => ({
        ip: item._id,
        incidents: item.count,
        attacks: item.attacks,
        severity: item.severity,
        lastSeen: item.lastSeen
      })),
      attackPatterns
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

// Get recent alerts with enhanced filtering
exports.getAlerts = async (req, res) => {
  try {
    const { limit = 50, severity, classification } = req.query;
    
    let query = { classification: { $ne: 'Normal' } };
    
    if (severity) {
      query.severity = severity;
    }
    
    if (classification) {
      query.classification = classification;
    }
    
    const alerts = await TrafficPattern.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
      
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alerts', error: error.message });
  }
};

// Get hourly trend for attacks vs normal traffic with enhanced analytics
exports.getTrends = async (req, res) => {
  try {
    const trends = await TrafficPattern.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
            hour: { $hour: '$timestamp' },
            classification: '$classification'
          },
          count: { $sum: 1 },
          avgPacketSize: { $avg: '$packetSize' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
      { $limit: 48 } // last 48 hours
    ]);

    // Reprocess into chart friendly format
    const chartData = {};
    
    // Initialize all 24 hours with zero values
    for (let hour = 0; hour < 24; hour++) {
      const timeKey = `${hour}:00`;
      chartData[timeKey] = { 
        time: timeKey, 
        Normal: 0, 
        Attack: 0,
        DDoS: 0,
        'Port Scan': 0,
        'Brute Force': 0,
        Malware: 0,
        Phishing: 0,
        totalPackets: 0,
        avgPacketSize: 0
      };
    }
    
    // Fill in actual data
    trends.forEach(t => {
      const timeKey = `${t._id.hour}:00`;
      
      const total = t.count;
      chartData[timeKey].totalPackets += total;
      chartData[timeKey].avgPacketSize = Math.max(chartData[timeKey].avgPacketSize, t.avgPacketSize);
      
      if (t._id.classification === 'Normal') {
        chartData[timeKey].Normal += total;
      } else {
        chartData[timeKey].Attack += total;
        chartData[timeKey][t._id.classification] = (chartData[timeKey][t._id.classification] || 0) + total;
      }
    });

    res.json(Object.values(chartData));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trends', error: error.message });
  }
};

// Enhanced ingest with attack validation
exports.ingestData = async (req, res) => {
  try {
    const data = req.body;
    
    // Validate required fields
    const requiredFields = ['sourceIp', 'destinationIp', 'protocol', 'packetSize', 'classification'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
    }
    
    // Validate classification
    const validClassifications = ['Normal', 'DDoS', 'Brute Force', 'Port Scan', 'Phishing', 'Malware'];
    if (!validClassifications.includes(data.classification)) {
      data.classification = 'Normal'; // Default to normal if invalid
    }
    
    // Validate severity
    const validSeverities = ['Low', 'Medium', 'High', 'Critical'];
    if (!validSeverities.includes(data.severity)) {
      // Auto-assign severity based on classification
      const severityMap = {
        'Normal': 'Low',
        'DDoS': 'High',
        'Brute Force': 'Medium',
        'Port Scan': 'Medium',
        'Phishing': 'High',
        'Malware': 'Critical'
      };
      data.severity = severityMap[data.classification] || 'Low';
    }
    
    // Add timestamp if not provided
    if (!data.timestamp) {
      data.timestamp = new Date();
    }
    
    // Check for potential duplicate packets (same source/dest within 1 second)
    const recentDuplicate = await TrafficPattern.findOne({
      sourceIp: data.sourceIp,
      destinationIp: data.destinationIp,
      protocol: data.protocol,
      timestamp: { $gte: new Date(Date.now() - 1000) }
    });
    
    if (recentDuplicate && data.classification === 'Normal') {
      // Skip duplicate normal packets to reduce noise
      return res.status(200).json({ message: 'Duplicate packet ignored', data: recentDuplicate });
    }
    
    const newPacket = new TrafficPattern(data);
    await newPacket.save();
    
    // Emit real-time event
    const io = global.io;
    if (io) {
      io.emit('new_packet', newPacket);
      
      // Emit high-severity alerts immediately
      if (data.severity === 'High' || data.severity === 'Critical') {
        io.emit('critical_alert', newPacket);
      }
    }
    
    res.status(201).json({ message: 'Data ingested successfully', data: newPacket });
  } catch (error) {
    res.status(500).json({ message: 'Error ingesting data', error: error.message });
  }
};
