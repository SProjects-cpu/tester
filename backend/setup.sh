#!/bin/bash

# MAGIC Backend Setup Script
# This script automates the backend setup process

echo "🚀 MAGIC Backend Setup"
echo "======================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if MongoDB is running
if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
    echo "⚠️  MongoDB CLI not found. Make sure MongoDB is installed and running."
    echo "   You can also use MongoDB Atlas (cloud) instead."
fi

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    
    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Update .env with generated secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
    else
        # Linux
        sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
    fi
    
    echo "✅ .env file created with random JWT secret"
    echo ""
    echo "⚠️  Please update the following in .env:"
    echo "   - MONGODB_URI (if not using localhost)"
    echo "   - SMTP settings (if using email notifications)"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Create uploads directory
mkdir -p uploads
echo "✅ Created uploads directory"

# Create logs directory
mkdir -p logs
echo "✅ Created logs directory"

echo ""
echo "🌱 Seeding database..."
npm run seed

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    echo "   Make sure MongoDB is running and MONGODB_URI is correct in .env"
    exit 1
fi

echo ""
echo "✅ Database seeded successfully!"
echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 Default credentials:"
echo "   Admin - username: admin, password: magic2024"
echo "   Guest - username: guest, password: guest123"
echo ""
echo "🚀 To start the server:"
echo "   Development: npm run dev"
echo "   Production:  npm start"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Quick start guide"
echo "   - API_REFERENCE.md - Complete API documentation"
echo ""
echo "🌐 Server will run on: http://localhost:5000"
echo "🏥 Health check: http://localhost:5000/health"
echo ""
