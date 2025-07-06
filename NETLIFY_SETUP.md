# 🚀 Swiper Empire - Real Netlify Deployment Guide

## 📋 Prerequisites

1. **Netlify Account** - Sign up at [netlify.com](https://netlify.com)
2. **Git Repository** - Your code should be in a Git repository
3. **Netlify CLI** - Install globally: `npm install -g netlify-cli`

## 🛠️ Step-by-Step Setup

### 1. **Initial Netlify Setup**

```bash
# Login to Netlify
netlify login

# Initialize your site (run from your project root)
netlify init

# Link to existing site or create new one
netlify link
```

### 2. **Database Setup**

```bash
# Install Netlify Neon (already in package.json)
npm install @netlify/neon

# This will automatically provision a PostgreSQL database
netlify dev
```

### 3. **Environment Variables**

Create a `.env` file in your project root:

```bash
# Netlify will automatically provide this
NETLIFY_DATABASE_URL=your_database_url_here

# Optional: Custom environment variables
ENCRYPTION_KEY=your_encryption_key_here
ADMIN_EMAIL=your_admin_email_here
```

### 4. **Run Database Migration**

```bash
# Start dev server first
netlify dev

# Then in another terminal, run migration
curl -X POST http://localhost:8888/.netlify/functions/migrate
```

### 5. **Deploy to Production**

```bash
# Build and deploy
netlify deploy --prod

# Or set up continuous deployment from Git
netlify open:admin
```

## 🔧 Function Configuration

Ensure your `netlify.toml` file exists in project root:

```toml
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
```

## 🗄️ Database Schema Setup

After migration runs, you'll have these tables:

- **users** - User accounts with encrypted data
- **messages** - All messages with quantum encryption
- **servers** - Server information and settings
- **channels** - All channel types (text, voice, announcements, shop)
- **products** - Bitcoin shop products
- **tickets** - Purchase tickets for Bitcoin transactions
- **audit_logs** - Security and admin action logs
- **reports** - User report system

## 🔐 Security Configuration

The system automatically includes:

- **AES-256-GCM encryption** for all data
- **bcrypt password hashing** (12 rounds)
- **Rate limiting** to prevent abuse
- **Input sanitization** against XSS/injection
- **Quantum-resistant encryption** algorithms

## 🎯 Testing Your Deployment

1. **Register a new user** - Test the registration system
2. **Login as admin** - Use username: `admin`, password: `admin`
3. **Create a server** - Test server creation functionality
4. **Test bot commands** - Use `/help`, `/stats`, `/users` in admin panel
5. **Test shop system** - Create products in shop channels
6. **Test reporting** - Right-click users to report them

## 🚨 Production Checklist

### ✅ **Security**

- [ ] Change default admin password
- [ ] Enable 2FA for admin accounts
- [ ] Set up SSL certificates (Netlify auto-provides)
- [ ] Configure rate limiting
- [ ] Set up monitoring alerts

### ✅ **Database**

- [ ] Migration completed successfully
- [ ] Backup strategy configured
- [ ] Connection pooling enabled
- [ ] Indexes created for performance

### ✅ **Features**

- [ ] User registration/login working
- [ ] Real-time messaging operational
- [ ] Shop system with Bitcoin integration
- [ ] Admin bot responding to commands
- [ ] Reporting system functional
- [ ] Voice channels configured

### ✅ **Performance**

- [ ] CDN enabled for static assets
- [ ] Database queries optimized
- [ ] Rate limiting configured
- [ ] Caching strategy implemented

## 🔧 Troubleshooting

### **Functions Not Working**

```bash
# Check function logs
netlify functions:list
netlify functions:invoke migrate --no-identity

# Debug locally
netlify dev --live
```

### **Database Connection Issues**

```bash
# Check database URL
netlify env:get NETLIFY_DATABASE_URL

# Test connection
node -e "
const { neon } = require('@netlify/neon');
const sql = neon();
sql('SELECT NOW()').then(console.log);
"
```

### **Build Failures**

```bash
# Clear cache and rebuild
netlify build --clear-cache

# Check build logs
netlify open:admin
```

## 📊 Monitoring & Analytics

Set up monitoring for:

- **User registrations** and login attempts
- **Message volume** and server activity
- **Bitcoin transactions** in shop channels
- **Security incidents** and failed login attempts
- **System performance** and response times

## ��� Go Live!

Once everything is tested:

1. **Set custom domain** in Netlify admin
2. **Configure DNS** to point to Netlify
3. **Enable branch deploys** for staging
4. **Set up notifications** for deployments
5. **Monitor system health** regularly

Your revolutionary Discord-like platform with Bitcoin integration and military-grade security is now live! 🚀

---

## 🆘 Need Help?

- Check Netlify docs: [docs.netlify.com](https://docs.netlify.com)
- Database docs: [neon.tech/docs](https://neon.tech/docs)
- Monitor functions: `netlify functions:list`
- View logs: `netlify dev --live`
