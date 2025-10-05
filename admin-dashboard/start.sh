#!/bin/bash
# Quick start script for SQLite POC

echo "🎯 Loyalty Rewards - SQLite POC"
echo "================================"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Check if Flask is installed
if ! python3 -c "import flask" 2>/dev/null; then
    echo "📦 Installing dependencies..."
    pip3 install -r requirements.txt
    echo ""
fi

echo "🚀 Starting server..."
echo "📊 Dashboard: http://localhost:5000"
echo "🛑 Press Ctrl+C to stop"
echo ""

python3 server.py
