# ============================================================================
# Constructora Del Valle S.A. - Lanzador de Entorno de Desarrollo (PowerShell)
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Red
Write-Host "  Constructora Del Valle S.A. - Sistema de Inventarios & Auditoría" -ForegroundColor White
Write-Host "============================================================================" -ForegroundColor Red
Write-Host ""

$workspaceRoot = $PSScriptRoot

Write-Host "[1/2] Iniciando Backend en puerto 4000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$workspaceRoot\backend'; npm run dev"

Write-Host "[2/2] Iniciando Frontend en puerto 5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$workspaceRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "Servicios iniciados en ventanas separadas:" -ForegroundColor Green
Write-Host "  -> Backend API: http://localhost:4000/api" -ForegroundColor Yellow
Write-Host "  -> Frontend UI: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""

