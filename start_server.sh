#!/bin/bash
echo "==================================================="
echo "  AI-Netram Local Backend Starter (Mac/Linux)"
echo "==================================================="
echo ""

# Check for Python
if ! command -v python3 &> /dev/null
then
    echo "[ERROR] Python 3 is not installed on this system!"
    echo "Please install Python 3.8+ using Homebrew or from https://www.python.org/"
    exit 1
fi

echo "[1/2] Installing required dependencies..."
pip3 install -r requirements.txt

echo ""
echo "[2/2] Launching local AI server..."
echo "Server will be running at http://127.0.0.1:5010"
echo ""
echo "Leave this terminal open while using the app. Press Ctrl+C to stop."
echo "==================================================="
echo ""

python3 app.py
