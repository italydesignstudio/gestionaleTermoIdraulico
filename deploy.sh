#!/bin/bash

# 🚀 Auto-Deploy Script for Gestionale Termoidraulico
# This script automates deployment to Railway (backend) and Vercel (frontend)

set -e  # Exit on any error

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Funzione per controllare se un comando esiste
command_exists() {
    command -v "$1" >/dev/null 2>&1
}
# Check if required tools are installed
check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command_exists git; then
        print_error "git is not installed"
        exit 1
    fi
    
    print_status "Dependencies check passed"
}

# Deploy backend to Railway
deploy_backend() {
    print_info "Deploying backend to Railway..."
    
    cd server
    
    # Install dependencies
    print_info "Installing backend dependencies..."
    npm install
    
    # Install Railway CLI if not present
    if ! command_exists railway; then
        print_warning "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Check if user is logged in
    if ! railway status &> /dev/null; then
        print_warning "Please login to Railway..."
        railway login
    fi
    
    # Deploy
    print_info "Deploying to Railway..."
    railway up
    
    # Get the deployment URL
    RAILWAY_URL=$(railway status --json 2>/dev/null | grep -o '"url":"[^"]*' | cut -d'"' -f4 || true)
    if [ -n "$RAILWAY_URL" ]; then
        print_status "Backend deployed to: $RAILWAY_URL"
        echo "$RAILWAY_URL" > ../railway_url.txt
    else
        print_warning "Could not retrieve Railway URL automatically"
        print_info "Please check Railway dashboard for your app URL"
    fi
    
    cd ..
}

# Deploy frontend to Vercel
deploy_frontend() {
    print_info "Deploying frontend to Vercel..."
    
    cd client
    
    # Install dependencies and build
    print_info "Installing frontend dependencies..."
    npm install
    
    print_info "Building frontend..."
    npm run build
    
    # Install Vercel CLI if not present
    if ! command_exists vercel; then
        print_warning "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Check if user is logged in
    if ! vercel whoami &> /dev/null; then
        print_warning "Please login to Vercel..."
        vercel login
    fi
    
    # Set environment variable if Railway URL is available
    if [ -f "../railway_url.txt" ]; then
        RAILWAY_URL=$(cat ../railway_url.txt)
        print_info "Setting VITE_API_BASE_URL to ${RAILWAY_URL}/api"
        vercel env add VITE_API_BASE_URL production "${RAILWAY_URL}/api" --force 2>/dev/null || true
    fi
    
    # Deploy
    print_info "Deploying to Vercel..."
    VERCEL_URL=$(vercel --prod --confirm 2>/dev/null | grep -o 'https://[^[:space:]]*' | head -1 || true)
    
    if [ -n "$VERCEL_URL" ]; then
        print_status "Frontend deployed to: $VERCEL_URL"
        echo "$VERCEL_URL" > ../vercel_url.txt
    fi
    
    cd ..
}

# Update CORS origins
update_cors() {
    if [ -f "vercel_url.txt" ] && [ -f "railway_url.txt" ]; then
        VERCEL_URL=$(cat vercel_url.txt)
        print_info "Updating CORS origins..."
        cd server
        railway variables set CORS_ORIGINS="$VERCEL_URL"
        railway up
        cd ..
        print_status "CORS origins updated"
    else
        print_warning "Please manually update CORS_ORIGINS in Railway with your Vercel URL"
    fi
}

# Initialize database
init_database() {
    print_info "Initializing database..."
    cd server
    railway run node scripts/init-admin.js 2>/dev/null || print_warning "Database initialization failed - may already be initialized"
    cd ..
    print_status "Database initialization completed"
}

# Main deployment process
main() {
    echo "🚀 Gestionale Termoidraulico - Auto Deploy Script"
    echo "=================================================="
    
    check_dependencies
    
    # Ask user what to deploy
    echo ""
    print_info "What would you like to deploy?"
    echo "1) Backend only (Railway)"
    echo "2) Frontend only (Vercel)"
    echo "3) Both Backend and Frontend"
    echo "4) Full deployment (Backend + Frontend + Setup)"
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            deploy_backend
            ;;
        2)
            deploy_frontend
            ;;
        3)
            deploy_backend
            deploy_frontend
            ;;
        4)
            deploy_backend
            deploy_frontend
            update_cors
            init_database
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
    print_status "Deployment completed!"
    
    if [ -f "railway_url.txt" ]; then
        RAILWAY_URL=$(cat railway_url.txt)
        echo "🔗 Backend URL: $RAILWAY_URL"
        echo "🔗 API Health Check: ${RAILWAY_URL}/api/health"
    fi
    
    if [ -f "vercel_url.txt" ]; then
        VERCEL_URL=$(cat vercel_url.txt)
        echo "🔗 Frontend URL: $VERCEL_URL"
    fi
    
    echo ""
    print_info "Next steps:"
    echo "1. Visit your Railway dashboard to check backend status"
    echo "2. Visit your Vercel dashboard to check frontend status"  
    echo "3. Test the application with default credentials: admin/admin123"
    echo "4. Remember to change the default password!"
    
    # Cleanup
    rm -f railway_url.txt vercel_url.txt 2>/dev/null || true
}

# Show help if requested
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "🚀 Gestionale Termoidraulico - Deploy Script"
    echo ""
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo "  --manual      Show manual deployment instructions"
    echo ""
    echo "Interactive mode will be started if no options provided."
    exit 0
fi

if [ "$1" = "--manual" ]; then
    echo "📋 Manual Deployment Instructions:"
    echo ""
    echo "1. Backend (Railway):"
    echo "   - Go to https://railway.app"
    echo "   - Create new project from GitHub"
    echo "   - Set root directory to 'server'"
    echo "   - Add PostgreSQL service"
    echo "   - Set environment variables"
    echo ""
    echo "2. Frontend (Vercel):"
    echo "   - Go to https://vercel.com"  
    echo "   - Import GitHub project"
    echo "   - Set root directory to 'client'"
    echo "   - Set VITE_API_BASE_URL environment variable"
    echo ""
    echo "For detailed instructions, see DEPLOY_NOW.md"
    exit 0
fi

# Run main function
main "$@"
echo "   • Railway: https://railway.app"
echo "   • Vercel: https://vercel.com"
echo "   • Documentazione: ./DEPLOYMENT.md"
echo ""
echo "💡 Tip: Tutte le configurazioni sono già pronte!"
echo "    Segui semplicemente i passaggi sopra."
