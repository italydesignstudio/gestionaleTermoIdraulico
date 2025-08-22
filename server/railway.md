# Railway Deployment Instructions

## Prerequisites
1. Create a Railway account at [railway.app](https://railway.app)
2. Install Railway CLI: `npm install -g @railway/cli`
3. Login: `railway login`

## Deploy Backend

### 1. Create New Project
```bash
# In the server directory
cd server
railway login
railway create gestionale-termoidraulico-api
```

### 2. Set Environment Variables
```bash
# Set required environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="your-super-secret-jwt-key-here"
railway variables set CORS_ORIGINS="https://your-vercel-app.vercel.app"

# If using PostgreSQL (recommended for production)
railway add postgresql
# Railway will automatically set DATABASE_URL
```

### 3. Deploy
```bash
# Deploy from server directory
railway up
```

### 4. Get Railway URL
```bash
railway status
# Note the URL - you'll need it for the frontend
```

## Database Migration
If you need to migrate from SQLite to PostgreSQL:

1. Install pg on Railway:
```bash
railway add postgresql
```

2. Update your database connection in `database-pg.js` to use `DATABASE_URL`

3. Run migrations:
```bash
railway run node scripts/init-admin.js
```

## Health Check Endpoint
The Railway config expects a health check at `/api/health`. Make sure your server has this endpoint.

## Logs and Monitoring
```bash
# View logs
railway logs

# Check status
railway status
```

## Domain Setup (Optional)
1. Go to Railway dashboard
2. Select your project
3. Go to Settings > Domains
4. Add custom domain if needed

## Environment Variables Required
- DATABASE_URL (auto-set by Railway PostgreSQL)
- JWT_SECRET (set manually)
- ENCRYPTION_KEY (set manually) 
- NODE_ENV=production (auto-set)
- CORS_ORIGINS (set to your Vercel frontend URL)
