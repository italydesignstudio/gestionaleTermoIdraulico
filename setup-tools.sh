#!/bin/bash

# 🛠️ Setup Script - Install deployment tools
# This script installs Railway CLI and Vercel CLI for deployment

echo "🛠️  Installing deployment tools..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

print_info "Installing Railway CLI..."
npm install -g @railway/cli
print_status "Railway CLI installed"

print_info "Installing Vercel CLI..."
npm install -g vercel
print_status "Vercel CLI installed"

echo ""
print_status "Setup completed!"
print_info "You can now run ./deploy.sh to start deployment"
print_info "Or follow the instructions in DEPLOY_NOW.md for manual deployment"
