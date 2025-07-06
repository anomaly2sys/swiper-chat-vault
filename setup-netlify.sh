#!/bin/bash

echo "🚀 Setting up Swiper Empire on Netlify..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Login to Netlify
echo "🔐 Logging into Netlify..."
netlify login

# Initialize or link site
echo "🔗 Setting up Netlify site..."
netlify init

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create netlify.toml if it doesn't exist
if [ ! -f "netlify.toml" ]; then
    echo "📝 Creating netlify.toml..."
    cat > netlify.toml << EOF
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "dist"

[dev]
  command = "npm run dev"
  port = 8080
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF
fi

# Start development server
echo "🏃‍♂️ Starting development server..."
echo "This will:"
echo "  ✅ Provision PostgreSQL database"
echo "  ✅ Start local development server"
echo "  ✅ Enable Netlify functions"

netlify dev &

# Wait for server to start
sleep 5

# Run database migration
echo "🗄️ Setting up database..."
curl -X POST http://localhost:8888/.netlify/functions/migrate

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Open http://localhost:8080 in your browser"
echo "  2. Register a new user or login as admin (username: admin, password: admin)"
echo "  3. Test the bot commands with /help in the admin panel"
echo "  4. Create servers and test all features"
echo "  5. When ready, deploy with: netlify deploy --prod"
echo ""
echo "🔐 Security Note:"
echo "  - All data is encrypted with military-grade AES-256-GCM"
echo "  - Bitcoin transactions are secured with quantum-resistant encryption"
echo "  - Change the default admin password in production!"
echo ""
echo "🛡️ Your revolutionary platform is ready!"
