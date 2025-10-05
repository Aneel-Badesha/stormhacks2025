#!/bin/bash
# Quick setup script

echo "🏢 Admin Dashboard Setup"
echo "========================"
echo ""

# Check if database exists
if [ -f "rewards.db" ]; then
    echo "⚠️  Database already exists. Delete it? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        rm rewards.db
        echo "✅ Deleted old database"
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip3 install -r requirements.txt

# Create database and add test company
echo ""
echo "🗄️  Creating database and test company..."
python3 manage_data.py

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the server:"
echo "   python3 server.py"
echo ""
echo "🌐 Then open: http://localhost:5000"
echo "🔐 Login with: test@email.com / password"
