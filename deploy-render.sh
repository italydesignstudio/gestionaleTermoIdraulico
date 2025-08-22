#!/bin/bash

# 🚀 Deploy Script for Render.com
# Gestionale Termoidraulico - Backend + Frontend

set -e

echo "🚀 Deploying Gestionale Termoidraulico to Render.com"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if git is available
if ! command -v git &> /dev/null; then
    print_error "Git not found. Please install Git first."
    exit 1
fi

print_info "Step 1: Preparing for Render deployment..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Add and commit changes if needed
print_info "Checking git status..."
if [[ $(git status --porcelain) ]]; then
    print_warning "Uncommitted changes found. Committing them..."
    git add .
    git commit -m "Prepare for Render deployment - $(date '+%Y-%m-%d %H:%M:%S')"
    print_status "Changes committed"
else
    print_info "No uncommitted changes found"
fi

# Push to GitHub
print_info "Pushing to GitHub..."
git push origin main
print_status "Code pushed to GitHub"

echo ""
print_status "Repository is ready for Render deployment!"
echo ""

print_info "Next steps:"
echo ""
echo "🔗 1. BACKEND DEPLOYMENT:"
echo "   • Go to https://render.com"
echo "   • Login with GitHub"
echo "   • Click 'New +' → 'Web Service'"
echo "   • Connect this repository: ${PWD##*/}"
echo "   • ROOT DIRECTORY: server"
echo "   • RUNTIME: Node"
echo "   • BUILD COMMAND: npm install"
echo "   • START COMMAND: npm start"
echo ""
echo "   Environment Variables:"
echo "   NODE_ENV=production"
echo "   JWT_SECRET=your-super-secret-jwt-key-32-chars"
echo "   CORS_ORIGINS=https://your-frontend-url.onrender.com"
echo ""
echo "💾 2. DATABASE:"
echo "   • In Render dashboard, click 'New +' → 'PostgreSQL'"
echo "   • Copy the DATABASE_URL and add it to your web service"
echo ""
echo "🌐 3. FRONTEND DEPLOYMENT:"
echo "   • Click 'New +' → 'Static Site'"
echo "   • Connect same repository"
echo "   • ROOT DIRECTORY: client"
echo "   • BUILD COMMAND: npm install && npm run build"
echo "   • PUBLISH DIRECTORY: dist"
echo ""
echo "   Environment Variables:"
echo "   VITE_API_BASE_URL=https://your-backend-url.onrender.com/api"
echo ""
echo "🔄 4. FINAL SETUP:"
echo "   • Update CORS_ORIGINS in backend with frontend URL"
echo "   • Initialize database using the web service console"
echo ""

print_status "Deployment preparation completed!"
print_warning "Remember to update URLs after each service is deployed!"

echo ""
echo "🔗 Useful links:"
echo "   • Render Dashboard: https://dashboard.render.com"
echo "   • This repository: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]//' | sed 's/.git$//')"
echo ""
