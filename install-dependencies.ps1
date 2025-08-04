# Football League Hub - Dependency Installation Script
# Run this script from the root directory

Write-Host "🚀 Installing Football League Hub Dependencies..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js v16 or higher." -ForegroundColor Red
    exit 1
}

# Install Backend Dependencies
Write-Host "`n📦 Installing Backend Dependencies..." -ForegroundColor Yellow
Set-Location backend

if (Test-Path "package.json") {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend dependencies installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Backend package.json not found" -ForegroundColor Red
    exit 1
}

# Copy environment file if it doesn't exist
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "📄 Created .env file from .env.example" -ForegroundColor Blue
        Write-Host "⚠️  Please update the .env file with your configuration" -ForegroundColor Yellow
    }
}

# Go back to root and install Frontend Dependencies
Set-Location ..
Write-Host "`n📦 Installing Frontend Dependencies..." -ForegroundColor Yellow
Set-Location frontend

if (Test-Path "package.json") {
    # Install existing dependencies
    npm install
    
    # Install additional dependencies for Firebase and API integration
    Write-Host "📦 Installing additional dependencies..." -ForegroundColor Yellow
    npm install firebase axios react-query react-hook-form react-hot-toast @types/react @types/react-dom
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend dependencies installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Frontend package.json not found" -ForegroundColor Red
    exit 1
}

# Copy environment file if it doesn't exist
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "📄 Created .env file from .env.example" -ForegroundColor Blue
        Write-Host "⚠️  Please update the .env file with your Firebase configuration" -ForegroundColor Yellow
    }
}

# Go back to root
Set-Location ..

Write-Host "`n🎉 Installation Complete!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Configure your environment files:" -ForegroundColor White
Write-Host "   - backend/.env (MongoDB and Firebase Admin SDK)" -ForegroundColor Gray
Write-Host "   - frontend/.env (Firebase client configuration)" -ForegroundColor Gray
Write-Host "`n2. Start the applications:" -ForegroundColor White
Write-Host "   Backend:  cd backend && npm run dev" -ForegroundColor Gray
Write-Host "   Frontend: cd frontend && npm run dev" -ForegroundColor Gray
Write-Host "`n3. Visit http://localhost:3000/auth to test the enhanced authentication" -ForegroundColor White
Write-Host "`n📖 See setup.md for detailed configuration instructions" -ForegroundColor Blue
