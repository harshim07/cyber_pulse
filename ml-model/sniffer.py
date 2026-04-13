import time
import datetime
import pymongo
import joblib
import numpy as np
import warnings
import requests
from scapy.all import sniff, IP, TCP, UDP, ICMP
import logging
import os

warnings.filterwarnings('ignore', category=UserWarning)

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# MongoDB Connection
MONGO_URI = "mongodb://localhost:27017/"
client = pymongo.MongoClient(MONGO_URI)
db = client["cybersecurity"]
collection = db["trafficpatterns"]

# Load ML Models
try:
    model = joblib.load('models/ids_rf_model.pkl')
    scaler = joblib.load('models/ids_scaler.pkl')
    le = joblib.load('models/ids_label_encoder.pkl')
    expected_features = joblib.load('models/ids_features.pkl')
    logging.info("IDS ML Model loaded successfully.")
except FileNotFoundError:
    logging.error("Model files not found! Please run train.py first.")
    exit(1)

# Flow tracking
flow_tracking = {}

def process_packet(packet):
    try:
        if IP in packet:
            src_ip = packet[IP].src
            dst_ip = packet[IP].dst
            proto = packet[IP].proto
            packet_len = len(packet)
            
            src_port = 0
            dst_port = 0
            
            is_fwd = True # We assume first packet direction is FWD
            
            if TCP in packet:
                src_port = packet[TCP].sport
                dst_port = packet[TCP].dport
            elif UDP in packet:
                src_port = packet[UDP].sport
                dst_port = packet[UDP].dport

            # Create a bidirectional flow key
            # To properly track bidirectional, we need a sorted tuple
            endpoints = sorted([f"{src_ip}:{src_port}", f"{dst_ip}:{dst_port}"])
            flow_key = f"{endpoints[0]}-{endpoints[1]}-{proto}"
            
            current_time = time.time()
            
            if flow_key not in flow_tracking:
                flow_tracking[flow_key] = {
                    "start_time": current_time, 
                    "fwd_ip": src_ip, # The initiator is FWD
                    "tot_fwd_pkts": 0,
                    "tot_bwd_pkts": 0,
                    "totlen_fwd_pkts": 0,
                    "totlen_bwd_pkts": 0,
                    "fwd_pkt_lens": [],
                    "bwd_pkt_lens": []
                }
            
            flow = flow_tracking[flow_key]
            
            # Determine direction
            if src_ip == flow["fwd_ip"]:
                flow["tot_fwd_pkts"] += 1
                flow["totlen_fwd_pkts"] += packet_len
                flow["fwd_pkt_lens"].append(packet_len)
            else:
                flow["tot_bwd_pkts"] += 1
                flow["totlen_bwd_pkts"] += packet_len
                flow["bwd_pkt_lens"].append(packet_len)

            flow_duration_us = int((current_time - flow["start_time"]) * 1000000) # Microseconds expected typically in IDS
            if flow_duration_us == 0:
                flow_duration_us = 100
                
            fwd_pkt_len_mean = np.mean(flow["fwd_pkt_lens"]) if flow["fwd_pkt_lens"] else 0
            bwd_pkt_len_mean = np.mean(flow["bwd_pkt_lens"]) if flow["bwd_pkt_lens"] else 0

            # Features: 'Protocol', 'Flow Duration', 'Tot Fwd Pkts', 'Tot Bwd Pkts',
            # 'TotLen Fwd Pkts', 'TotLen Bwd Pkts', 'Fwd Pkt Len Mean', 'Bwd Pkt Len Mean'
            feature_vector = np.array([[
                proto, 
                flow_duration_us, 
                flow["tot_fwd_pkts"], 
                flow["tot_bwd_pkts"],
                flow["totlen_fwd_pkts"], 
                flow["totlen_bwd_pkts"], 
                fwd_pkt_len_mean, 
                bwd_pkt_len_mean
            ]])
            
            # Scale features
            features_scaled = scaler.transform(feature_vector)
            
            # Predict every N packets to save CPU
            if (flow["tot_fwd_pkts"] + flow["tot_bwd_pkts"]) % 5 == 0 or (flow["tot_fwd_pkts"] + flow["tot_bwd_pkts"]) == 1:
                pred_encoded = model.predict(features_scaled)
                pred_class = le.inverse_transform(pred_encoded)[0]
                
                # Check if it's an anomaly/attack
                severity = 'Low'
                is_attack = "Normal" not in str(pred_class) and "Benign" not in str(pred_class)
                
                if is_attack:
                    severity = 'High'
                    logging.warning(f"ALERT: {pred_class} detected from {src_ip} -> {dst_ip}")
                
                # We send doc to DB via API
                doc = {
                    "sourceIp": src_ip,
                    "destinationIp": dst_ip,
                    "protocol": "TCP" if proto==6 else "UDP" if proto==17 else "ICMP" if proto==1 else "OTHER",
                    "packetSize": packet_len,
                    "flowDuration": flow_duration_us / 1000.0, # pass ms to UI
                    "classification": str(pred_class),
                    "severity": severity,
                    "modelSource": 'Random Forest (IDS)',
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }
                
                # Send to Node.js Backend API periodically
                try:
                    requests.post('http://localhost:5000/api/traffic/ingest', json=doc, timeout=1)
                except requests.exceptions.RequestException:
                    pass
            
    except Exception as e:
        # Ignore errors from malformed packets
        pass

def start_sniffing():
    logging.info("Starting packet sniffer... (Press Ctrl+C to stop)")
    sniff(prn=process_packet, store=0)

if __name__ == "__main__":
    start_sniffing()
