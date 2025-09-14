#!/bin/bash

echo "🚀 Setting up ERP Budget and Expense Tracker"
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
if [[ $(echo "$NODE_VERSION 16.0.0" | tr " " "\n" | sort -V | head -n1) != "16.0.0" ]]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 16 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating environment file..."
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your configuration."
else
    echo "✅ Environment file already exists."
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update the .env file with your MongoDB connection string and other configurations"
echo "2. Start MongoDB (or use Docker: docker-compose up mongodb)"
echo "3. Seed the database: npm run seed"
echo "4. Start the development server: npm run dev"
echo ""
echo "🔗 Useful commands:"
echo "   npm run dev        - Start both backend and frontend"
echo "   npm run server     - Start backend only"
echo "   npm run client     - Start frontend only"
echo "   npm run seed       - Seed database with sample data"
echo "   npm test           - Run tests"
echo ""
echo "📖 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000/api"
echo "   API Health: http://localhost:5000/api/health"
echo ""
echo "👤 Demo accounts (after seeding):"
echo "   Admin: admin@erpbudget.com (password123)"
echo "   Manager: manager@erpbudget.com (password123)"
echo "   User: user@erpbudget.com (password123)"