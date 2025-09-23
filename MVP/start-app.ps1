# Patient Management MVP Startup Script
Write-Host "Starting Patient Management MVP..." -ForegroundColor Green

# Check if MongoDB is running
Write-Host "Checking MongoDB connection..." -ForegroundColor Yellow
try {
    $mongoStatus = mongosh --eval "db.runCommand('ping')" --quiet 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "MongoDB is running ✓" -ForegroundColor Green
    } else {
        Write-Host "MongoDB may not be running. Please start MongoDB first." -ForegroundColor Red
        Write-Host "Local: Start MongoDB service or run 'mongod'" -ForegroundColor Yellow
        Write-Host "Atlas: Update MONGODB_URI in backend/.env" -ForegroundColor Yellow
    }
} catch {
    Write-Host "MongoDB connection check failed. Please ensure MongoDB is installed and running." -ForegroundColor Red
}

Write-Host "`nStarting backend server..." -ForegroundColor Yellow
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$PWD\backend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "Starting frontend (Expo)..." -ForegroundColor Yellow  
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$PWD\frontend'; npm start" -WindowStyle Normal

Write-Host "`nBoth services are starting in separate windows..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: Follow Expo CLI instructions" -ForegroundColor Cyan
Write-Host "`nDemo Credentials:" -ForegroundColor Yellow
Write-Host "Username: asha_worker" -ForegroundColor White
Write-Host "Password: password123" -ForegroundColor White
