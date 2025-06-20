#!/usr/bin/env pwsh

# VeloFlux Final Verification Script (PowerShell)
# Script para verificação final de todos os endpoints

param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$Username = "admin", 
    [string]$Password = "admin123"
)

# Configurações
$ApiUrl = "$BaseUrl/api"
$Global:TestResults = @()

function Write-ColorOutput($Text, $Color = 'White') {
    Write-Host $Text -ForegroundColor $Color
}

function Write-Success($Text) {
    Write-ColorOutput "✅ $Text" 'Green'
}

function Write-Warning($Text) {
    Write-ColorOutput "⚠️  $Text" 'Yellow'
}

function Write-Error($Text) {
    Write-ColorOutput "❌ $Text" 'Red'
}

function Write-Info($Text) {
    Write-ColorOutput "ℹ️  $Text" 'Cyan'
}

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [int]$ExpectedStatus = 200,
        [string]$Body = $null,
        [bool]$RequireAuth = $true
    )

    $Uri = "$ApiUrl$Endpoint"
    $Headers = @{
        'Content-Type' = 'application/json'
    }
    
    if ($RequireAuth) {
        $EncodedCredentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$Username`:$Password"))
        $Headers['Authorization'] = "Basic $EncodedCredentials"
    }

    $TestResult = @{
        Method = $Method
        Endpoint = $Endpoint
        Expected = $ExpectedStatus
        Actual = 0
        Success = $false
        Error = $null
        Timestamp = Get-Date
    }

    try {
        Write-Info "Testing $Method $Endpoint"
        
        $SplatParams = @{
            Uri = $Uri
            Method = $Method
            Headers = $Headers
            TimeoutSec = 10
        }
        
        if ($Body) {
            $SplatParams['Body'] = $Body
        }

        $Response = Invoke-WebRequest @SplatParams -ErrorAction Stop
        $TestResult.Actual = $Response.StatusCode
        $TestResult.Success = ($Response.StatusCode -eq $ExpectedStatus)
        
        if ($TestResult.Success) {
            Write-Success "$Method $Endpoint - Status: $($Response.StatusCode)"
        } else {
            Write-Warning "$Method $Endpoint - Expected: $ExpectedStatus, Got: $($Response.StatusCode)"
        }
        
    } catch {
        $TestResult.Error = $_.Exception.Message
        $TestResult.Actual = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { 0 }
        Write-Error "$Method $Endpoint - Error: $($_.Exception.Message)"
    }

    $Global:TestResults += $TestResult
    return $TestResult.Success
}

# Função principal de testes
function Start-VeloFluxTests {
    Write-ColorOutput "`n🚀 VeloFlux API Final Verification Starting..." 'Magenta'
    Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 'Magenta'
    
    # Teste básico de conectividade
    Write-ColorOutput "`n📡 Testing Basic Connectivity..." 'Yellow'
    Test-Endpoint 'GET' '/status' 200 $null $false
    Test-Endpoint 'GET' '/health' 200 $null $false
    Test-Endpoint 'GET' '/metrics' 200
    
    # Teste core APIs
    Write-ColorOutput "`n🔧 Testing Core APIs..." 'Yellow'
    Test-Endpoint 'GET' '/pools' 200
    Test-Endpoint 'GET' '/backends' 200
    Test-Endpoint 'GET' '/routes' 200
    Test-Endpoint 'GET' '/config' 200
    Test-Endpoint 'GET' '/cluster' 200
    
    # Teste WebSocket endpoints (como HTTP primeiramente)
    Write-ColorOutput "`n🌐 Testing WebSocket Endpoints..." 'Yellow'
    Test-Endpoint 'GET' '/ws/backends' 400 $null $false  # WebSocket upgrade expected
    Test-Endpoint 'GET' '/ws/metrics' 400 $null $false
    Test-Endpoint 'GET' '/ws/status' 400 $null $false
    Test-Endpoint 'GET' '/ws/billing' 400 $null $false
    Test-Endpoint 'GET' '/ws/health' 400 $null $false
    
    # Teste AI/ML endpoints
    Write-ColorOutput "`n🤖 Testing AI/ML APIs..." 'Yellow'
    Test-Endpoint 'GET' '/ai/models' 200
    Test-Endpoint 'GET' '/ai/config' 200
    Test-Endpoint 'GET' '/ai/metrics' 200
    Test-Endpoint 'GET' '/ai/health' 200
    Test-Endpoint 'GET' '/ai/history' 200
    Test-Endpoint 'GET' '/ai/predictions' 200
    Test-Endpoint 'GET' '/ai/training' 200
    Test-Endpoint 'GET' '/ai/pipelines' 200
    
    # Teste Billing endpoints
    Write-ColorOutput "`n💳 Testing Billing APIs..." 'Yellow'
    Test-Endpoint 'GET' '/billing/subscriptions' 200
    Test-Endpoint 'GET' '/billing/invoices' 200
    Test-Endpoint 'GET' '/billing/transactions' 200
    Test-Endpoint 'GET' '/billing/usage-alerts' 200
    Test-Endpoint 'GET' '/billing/notifications' 200
    Test-Endpoint 'GET' '/billing/export' 200
    Test-Endpoint 'GET' '/billing/webhooks' 200
    
    # Teste Multi-tenant endpoints
    Write-ColorOutput "`n🏢 Testing Multi-Tenant APIs..." 'Yellow'
    Test-Endpoint 'GET' '/tenants' 200
    Test-Endpoint 'GET' '/tenants/usage' 200
    Test-Endpoint 'GET' '/tenants/billing' 200
    Test-Endpoint 'GET' '/tenants/analytics' 200
    
    # Teste Debug endpoints
    Write-ColorOutput "`n🔍 Testing Debug APIs..." 'Yellow'
    Test-Endpoint 'GET' '/debug/pools' 200
    Test-Endpoint 'GET' '/debug/backends' 200
    Test-Endpoint 'GET' '/debug/routes' 200
    Test-Endpoint 'GET' '/debug/performance' 200
    
    # Teste System endpoints
    Write-ColorOutput "`n⚙️  Testing System APIs..." 'Yellow'
    Test-Endpoint 'GET' '/status/health' 200
    Test-Endpoint 'GET' '/analytics' 200
    Test-Endpoint 'GET' '/config/export' 200
    Test-Endpoint 'GET' '/backup/create' 200
    Test-Endpoint 'POST' '/config/validate' 200 '{"test":"config"}'
    
    # Teste Bulk operations
    Write-ColorOutput "`n📦 Testing Bulk Operations..." 'Yellow'
    Test-Endpoint 'POST' '/bulk/backends' 200 '{"operations":[{"action":"test"}]}'
    Test-Endpoint 'POST' '/bulk/routes' 200 '{"operations":[{"action":"test"}]}'
    Test-Endpoint 'POST' '/bulk/pools' 200 '{"operations":[{"action":"test"}]}'
}

# Função para gerar relatório
function Generate-TestReport {
    Write-ColorOutput "`n📊 TEST RESULTS SUMMARY" 'Magenta'
    Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 'Magenta'
    
    $TotalTests = $Global:TestResults.Count
    $SuccessfulTests = ($Global:TestResults | Where-Object { $_.Success }).Count
    $FailedTests = $TotalTests - $SuccessfulTests
    $SuccessRate = [math]::Round(($SuccessfulTests / $TotalTests) * 100, 2)
    
    Write-ColorOutput "`nTOTAL TESTS: $TotalTests" 'White'
    Write-Success "SUCCESSFUL: $SuccessfulTests"
    if ($FailedTests -gt 0) {
        Write-Error "FAILED: $FailedTests"
    } else {
        Write-Success "FAILED: $FailedTests"
    }
    Write-ColorOutput "SUCCESS RATE: $SuccessRate%" 'Cyan'
    
    if ($FailedTests -gt 0) {
        Write-ColorOutput "`n❌ FAILED TESTS:" 'Red'
        $Global:TestResults | Where-Object { -not $_.Success } | ForEach-Object {
            Write-ColorOutput "   $($_.Method) $($_.Endpoint) - Expected: $($_.Expected), Got: $($_.Actual)" 'Red'
            if ($_.Error) {
                Write-ColorOutput "   Error: $($_.Error)" 'Red'
            }
        }
    }
    
    Write-ColorOutput "`n🎯 FINAL STATUS:" 'Magenta'
    if ($SuccessRate -ge 80) {
        Write-Success "SYSTEM READY FOR PRODUCTION! 🚀"
    } elseif ($SuccessRate -ge 60) {
        Write-Warning "SYSTEM MOSTLY FUNCTIONAL - Some issues need attention ⚠️"
    } else {
        Write-Error "SYSTEM NEEDS MAJOR FIXES - Multiple endpoints failing ❌"
    }
}

# Execução principal
try {
    Start-VeloFluxTests
    Generate-TestReport
    
    Write-ColorOutput "`n✨ VeloFlux Final Verification Completed!" 'Magenta'
    Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 'Magenta'
    
} catch {
    Write-Error "Script execution failed: $($_.Exception.Message)"
    exit 1
}
