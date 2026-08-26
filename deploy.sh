#!/bin/bash
echo "=========================================================="
echo "    AI-Netram Cloud Backend Automatic Deployer"
echo "=========================================================="
echo ""

# 1. Update system and install Docker & Docker Compose
echo "[1/4] Updating system packages..."
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose git curl

# 2. Enable and start Docker
echo "[2/4] Starting Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

# 3. Build & Run AI-Netram in Docker
echo "[3/4] Building and launching AI-Netram Docker Container..."
sudo docker-compose down || true
sudo docker-compose up -d --build

# 4. Show Status
echo "[4/4] Container launched successfully!"
echo "=========================================================="
echo "AI-Netram Backend is LIVE on port 5010!"
echo "Test URL: http://$(curl -s ifconfig.me):5010/"
echo "=========================================================="
